// A3-CRON-RESCAN-DELTA (D-135): еженедельный ре-скан подписанных URL.
//
// Вызывается из worker/index.js::scheduled — из ТОГО ЖЕ Cron Trigger
// `0 3 * * *`, что и retention (deleteExpiredScans). Второй элемент
// triggers.crons НЕ добавлен, и это осознанный выбор узла (D-135 оставил его
// исполнителю):
//   * тик нужен ЕЖЕДНЕВНЫЙ, а cadence — недельная. Подписка становится «due»
//     через 7 дней после СВОЕГО последнего ре-скана, а подписываются люди в
//     произвольные дни. Один недельный cron (`0 3 * * 1`) сканировал бы всех
//     разом по понедельникам: и задержка до 6 дней у только что подписавшегося,
//     и залп из всех подписок в одну ночь при max_concurrency=2 у Browser
//     Rendering. Ежедневный тик + фильтр «прошло ли 7 дней» на КАЖДОЙ строке
//     даёт ровно недельную периодичность на подписчика и размазывает нагрузку.
//   * второе расписание пришлось бы разводить по event.cron, то есть добавить
//     ветвление ради двух вызовов, которые и так дешёвы и независимы.
//
// Сам скан здесь НЕ выполняется: в очередь `SCAN_QUEUE` кладётся ровно такое же
// сообщение, что кладёт POST /api/scan (buildScanJobMessage), и его разбирает
// тот же консьюмер (worker/lib/scanJob.js). Никакого второго браузерного пути
// (D-135: «новый браузерный путь не создаётся»).

import { insertScanPending, failScan } from './db.js'
import { buildScanJobMessage } from './scanJob.js'

// Единственная cadence на MVP. Колонка `cadence` в таблице есть
// (0010_subscriptions.sql), но пишется в неё только 'weekly'
// (worker/routes/subscribe.js::insertSubscription), поэтому cutoff считается
// ОДИН на всю выборку, а не по строке.
// Если появится вторая cadence (daily/monthly) — выборку придётся переделать:
// один cutoff на всех начнёт врать. Чтобы это не уехало молча, есть гейт-тест
// (subscriptionCron.test.mjs), который парсит миграцию и subscribe.js и падает,
// как только в них появляется значение, отличное от 'weekly'. Тот же приём, что
// у MAX_DELIVERIES vs wrangler.jsonc в scanJob.test.mjs.
export const SUPPORTED_CADENCES = { weekly: 7 }
export const DEFAULT_CADENCE = 'weekly'

// Потолок ре-сканов на один тик. Каждый ре-скан — оплаченный запуск Browser
// Rendering, и «100 подписок = 100 сканов в 3 часа ночи» это счёт, а не
// функция. Остаток не теряется: тик ежедневный, ORDER BY отдаёт самые давние
// первыми, и завтра они окажутся в начале очереди.
export const MAX_RESCANS_PER_TICK = 25

const DAY_MS = 24 * 60 * 60 * 1000

export function cadenceCutoffIso(now = new Date(), cadence = DEFAULT_CADENCE) {
  const days = SUPPORTED_CADENCES[cadence] ?? SUPPORTED_CADENCES[DEFAULT_CADENCE]
  return new Date(now.getTime() - days * DAY_MS).toISOString()
}

// ЧТО СЧИТАЕТСЯ «когда был последний ре-скан».
//
// В `subscriptions` нет колонки вроде `last_rescan_at` — есть только
// `last_scan_id` (0010_subscriptions.sql). Добавлять миграцию ради метки
// времени не нужно: метка уже есть в связанном скане. Берём `scans.created_at`
// — момент, когда ре-скан был ПОСТАВЛЕН (эту же строку вставляет
// insertScanPending ниже), а НЕ `completed_at`:
//   * `completed_at` у ещё выполняющегося скана NULL, и строка с NULL
//     неотличима от «никогда не сканировали» → подписка попадала бы в выборку
//     снова следующей же ночью, пока прошлый скан ещё идёт;
//   * вопрос, на который отвечает фильтр, — «тратили ли мы Browser Rendering
//     на этот URL в текущем окне», а не «получили ли мы результат». Ответ на
//     него даёт момент ПОСТАНОВКИ, и он одинаков для успешного, упавшего и
//     зависшего скана.
// LEFT JOIN, а не INNER: скан старше RETENTION_DAYS удаляется retention'ом
// (D-019) и `last_scan_id` повисает на несуществующей строке — это по смыслу
// «данных о прошлом скане нет», то есть подписку надо сканировать (90 дней
// retention заведомо больше 7 дней cadence, так что лишних сканов это не даёт).
//
// NULL сортируется первым через COALESCE(..., '') — любая ISO-строка больше
// пустой, значит «никогда не сканированные» встают в начало и не вытесняются
// лимитом.
const DUE_SUBSCRIPTIONS_SQL = `
  SELECT s.id AS id, s.email AS email, s.url AS url, s.cadence AS cadence,
         s.last_scan_id AS last_scan_id, sc.created_at AS last_scan_at
    FROM subscriptions s
    LEFT JOIN scans sc ON sc.id = s.last_scan_id
   WHERE s.verified = 1
     AND s.status = 'active'
     AND (sc.created_at IS NULL OR sc.created_at < ?)
   ORDER BY COALESCE(sc.created_at, '') ASC
   LIMIT ?`

// Возвращает [{id, email, url, cadence, lastScanId, lastScanAt}] — подписки,
// которым ре-скан положен ИМЕННО СЕЙЧАС. Отдельная экспортируемая функция,
// чтобы этот SQL можно было прогнать по настоящему SQLite на настоящей схеме
// (subscriptionCron.sql.test.mjs) — фейковый D1 на регулярках согласован с
// автором SQL по построению и такой гейт не ловит.
export async function selectDueSubscriptions(db, now = new Date(), limit = MAX_RESCANS_PER_TICK) {
  const { results } = await db
    .prepare(DUE_SUBSCRIPTIONS_SQL)
    .bind(cadenceCutoffIso(now), limit)
    .all()
  return (results ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    url: row.url,
    cadence: row.cadence ?? DEFAULT_CADENCE,
    lastScanId: row.last_scan_id ?? null,
    lastScanAt: row.last_scan_at ?? null,
  }))
}

// КОГДА обновляется last_scan_id: сразу после успешной постановки в очередь,
// а НЕ после завершения скана. Обоснование:
//   * скан асинхронный и завершится в консьюмере через минуты — до тех пор
//     подписка оставалась бы «никогда не сканированной» и попадала бы в
//     выборку каждую ночь, пока скан не завершится (а если он упал — навсегда,
//     то есть ежедневный залп Browser Rendering по сломанному сайту);
//   * консьюмер (worker/lib/scanJob.js) ничего не знает про подписки и знать не
//     должен: он обрабатывает джобы всех источников одинаково. Обновлять
//     подписку оттуда — значит завести обратную связь очередь → подписки ради
//     метки времени, которая уже есть в scans.created_at.
// Цена решения названа честно: если ре-скан упадёт (сайт лёг, Browser Rendering
// занят), эта неделя пройдёт без свежих данных, и следующая попытка будет через
// 7 дней. Для недельного мониторинга это приемлемо; ежедневные повторы по
// падающему сайту — нет.
async function setLastScanId(db, { subscriptionId, scanId }) {
  await db
    .prepare(`UPDATE subscriptions SET last_scan_id = ? WHERE id = ? AND status = 'active'`)
    .bind(scanId, subscriptionId)
    .run()
}

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return 'unparseable'
  }
}

// Один ре-скан = ровно тот же путь, что POST /api/scan:
//   insertScanPending (строка 'running', created_at = сейчас — от неё считает
//   протухание реап D-109) → SCAN_QUEUE.send(buildScanJobMessage(...)).
// Отличия от роута ровно два и оба намеренные:
//   * email в строку scans НЕ пишется. Адрес подписчика уже лежит в
//     subscriptions, и дублировать его в каждую еженедельную строку scans —
//     это размножение персональных данных без единого потребителя
//     (минимизация, RISKS R6 / D-019).
//   * countryCode нет: у подписки нет страны (в схеме такой колонки нет),
//     юрисдикция определится по TLD, как и для скана без override (D-032).
async function enqueueRescan(env, sub, now) {
  const scanId = crypto.randomUUID()

  await insertScanPending(env.DB, {
    id: scanId,
    url: sub.url,
    email: null,
    createdAt: now.toISOString(),
  })

  try {
    await env.SCAN_QUEUE.send(buildScanJobMessage({ id: scanId, url: sub.url, countryCode: null }))
  } catch (err) {
    // Строка уже вставлена, а джоба не будет — закрываем её сами, ровно как
    // роут POST /api/scan, иначе она провисит `running` до реапа D-109, который
    // на cron-скан никто не позовёт (реап срабатывает на GET, а этот скан
    // никто не читает).
    const message = err?.message ?? String(err)
    await failScan(env.DB, { id: scanId, error: `re-scan enqueue failed: ${message}`, errorCode: 'internal' })
    throw err
  }

  await setLastScanId(env.DB, { subscriptionId: sub.id, scanId })
  return scanId
}

// Точка входа для worker/index.js::scheduled.
//
// НИКОГДА не бросает: этот вызов живёт в одном тике с retention (D-019), и
// падение ре-скана не имеет права утащить за собой зачистку. Все ошибки
// логируются и попадают в возвращаемую сводку (её же читают тесты).
//
// Возвращает {due, enqueued, failed, pairs, error?}, где
//   pairs = [{subscriptionId, email, url, previousScanId, scanId}]
export async function runSubscriptionRescans(env, now = new Date()) {
  const summary = { due: 0, enqueued: 0, failed: 0, pairs: [] }

  if (!env?.DB) {
    console.error('A3-CRON-RESCAN: no DB binding, skipping re-scans')
    return { ...summary, error: 'db_unavailable' }
  }

  // Тот же громкий отказ, что в POST /api/scan (D-110): без producer-биндинга
  // мы НЕ откатываемся ни на какой обходной путь. Молчаливый обход вернул бы
  // ровно тот класс поломки, ради которого сделана очередь.
  if (!env.SCAN_QUEUE?.send) {
    console.error('A3-CRON-RESCAN: SCAN_QUEUE binding is missing, no re-scans enqueued')
    return { ...summary, error: 'queue_unavailable' }
  }

  let due
  try {
    due = await selectDueSubscriptions(env.DB, now)
  } catch (err) {
    console.error(`A3-CRON-RESCAN: due-subscription query failed: ${err?.message ?? err}`)
    return { ...summary, error: 'query_failed' }
  }

  summary.due = due.length
  if (due.length === 0) {
    console.log('A3-CRON-RESCAN: no subscriptions due for a re-scan')
    return summary
  }

  for (const sub of due) {
    // Незнакомая cadence не выкидывается из выборки (иначе такая подписка
    // молча перестала бы сканироваться навсегда) — она обрабатывается как
    // weekly, то есть в сторону РЕЖЕ, а не чаще, и о ней громко пишется в лог.
    if (!Object.hasOwn(SUPPORTED_CADENCES, sub.cadence)) {
      console.warn(
        `A3-CRON-RESCAN: subscription ${sub.id} has unsupported cadence "${sub.cadence}", treated as ${DEFAULT_CADENCE}`,
      )
    }

    try {
      const scanId = await enqueueRescan(env, sub, now)
      summary.enqueued += 1
      summary.pairs.push({
        subscriptionId: sub.id,
        email: sub.email,
        url: sub.url,
        previousScanId: sub.lastScanId,
        scanId,
      })
      // В лог — публичный id подписки и хост, без email и без token (тот же
      // рубеж, что logNewSubscription в worker/routes/subscribe.js).
      console.log(
        `A3-CRON-RESCAN: subscription ${sub.id} re-scan queued (${hostOf(sub.url)}), scan ${scanId}, previous ${sub.lastScanId ?? 'none'}`,
      )
    } catch (err) {
      // Одна упавшая подписка не отменяет остальные: их сканы независимы.
      summary.failed += 1
      console.error(`A3-CRON-RESCAN: subscription ${sub.id} re-scan failed: ${err?.message ?? err}`)
    }
  }

  // TODO(A3-CRON-DIGEST-EMAIL): письмо подписчику отсюда НЕ уходит — это
  // отдельный узел графа. Что ему нужно и откуда это брать, точно:
  //   1. Дельта считается ТОЛЬКО функцией
  //      `computeScanDelta(previousFindings, currentFindings)` из
  //      worker/lib/scanDelta.js -> {new, resolved, scoreChange, scoreBefore,
  //      scoreAfter}; «письмо не шлём на нулевой дельте» — предикат
  //      `isEmptyDelta(delta)` оттуда же, не переписанный заново.
  //   2. Пара сканов для неё — `pairs[i].previousScanId` (старый скан) и
  //      `pairs[i].scanId` (только что поставленный), findings берутся
  //      `getScan(env.DB, id).findings` (worker/lib/db.js). Туда же ОБЯЗАТЕЛЬНО
  //      передать третий аргумент `{previousPages, currentPages}` из
  //      `getScan(...).pages` обоих сканов: набор обойдённых страниц между
  //      сканами плавает (pickPriorityLinks выбирает ≤6 ссылок по живой
  //      главной), и без page-scope письмо будет отчитываться о «десятках
  //      изменений» там, где просто поменялась шапка сайта.
  //   3. Слать письмо ЗДЕСЬ нельзя: `scanId` в этот момент ещё `running` —
  //      скан выполнится в консьюмере через минуты. Дайджест обязан
  //      запускаться ПОСЛЕ завершения скана (отдельный проход, читающий
  //      завершённые сканы подписок), и это решение принимает тот узел.
  //   4. `previousScanId === null` — первый ре-скан подписки: сравнивать не с
  //      чем, письмо не отправляется, этот тик только заводит базовую линию.
  //   5. Внимание на след, который оставляет этот модуль: `last_scan_id` уже
  //      ПЕРЕЗАПИСАН на новый скан (см. setLastScanId выше), поэтому старый id
  //      после возврата из этой функции в БД больше не хранится нигде. Если
  //      дайджесту нужна пара после перезапуска воркера — восстанавливать её
  //      придётся либо запросом по `scans` того же url
  //      (`WHERE url = ? AND status = 'done' ORDER BY created_at DESC LIMIT 2`),
  //      либо новой колонкой (миграция 0011, напр. `prev_scan_id`). Выбор — за
  //      тем узлом; здесь он назван, а не умолчан.
  console.log(
    `A3-CRON-RESCAN: due=${summary.due} enqueued=${summary.enqueued} failed=${summary.failed}` +
      (summary.due >= MAX_RESCANS_PER_TICK ? ` (hit MAX_RESCANS_PER_TICK=${MAX_RESCANS_PER_TICK}, rest continues tomorrow)` : ''),
  )

  return summary
}
