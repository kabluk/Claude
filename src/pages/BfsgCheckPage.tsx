// Немецкий входной путь (D-041). Страница НЕ производит нового контента — она
// связывает уже существующие активы в одну цепочку, которая до сих пор
// существовала по частям:
//
//   скан → «Erklärung zur Barrierefreiheit fehlt» → Anlage 3 zu §14 BFSG
//        → прюферы, реально названные в опубликованных немецких декларациях.
//
// Почему именно так: DE — единственная юрисдикция с verified:true правовой
// ссылкой (worker/lib/jurisdiction.js, D-034/D-035), а наличие декларации —
// единственная часть требований, видимая снаружи без ручного теста. Всё
// остальное на странице — данные из agencies.json и посчитанное покрытие
// EN 301 549, ничего вписанного руками.
//
// Язык: контент немецкий, оболочка (шапка/футер) пока английская — полная
// локализация интерфейса это отдельная задача G-I18N, сознательно вне scope.
// Тот же компромисс, что у немецких гайдов (GuidePage выставляет html lang по
// локали статьи) — здесь он повторён осознанно, а не по недосмотру.

import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { Layout } from '@/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { coverageSummary } from '@/lib/coverage'
import { guides } from '@/lib/guides'
import {
  agenciesIn,
  countryByCode,
  namedInStatements,
  paths,
  serviceLabel,
  statementEvidence,
} from '@/lib/data'

const BFSG_URL = 'https://www.gesetze-im-internet.de/bfsg/'
const MLBF_URL = 'https://mlbf-barrierefrei.de/'
const BIK_PRICES_URL = 'https://bitvtest.de/tests-und-beratung/bik-bitv-test-web'

// Домен декларации — читателю важнее, ЧЬЯ это декларация, чем полный URL.
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function BfsgCheckPage() {
  const germany = countryByCode('DE')
  // DE есть в каталоге всегда (40 HQ + 2 обслуживающих), но страница целиком
  // построена вокруг страны — без неё рисовать нечего.
  if (!germany) return null
  const all = agenciesIn('DE')
  const named = namedInStatements('DE')
  const deGuides = guides.filter((g) => g.countryCode === 'DE')

  const title = 'BFSG-Check: Fehlt Ihrer Website die Erklärung zur Barrierefreiheit?'
  const description = `Kostenloser Scan auf die Erklärung zur Barrierefreiheit nach Anlage 3 zu § 14 BFSG — und ${named.length} Prüfer, die in veröffentlichten deutschen Erklärungen namentlich genannt sind.`

  return (
    <Layout
      title={title}
      description={description}
      path={paths.bfsgCheck()}
      crumbs={[{ name: 'Germany', path: paths.country(germany) }]}
    >
      {/* Язык контента страницы — немецкий (как у немецких гайдов). */}
      <Head>
        <html lang="de" />
      </Head>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description,
          inLanguage: 'de',
          url: `${ORIGIN}${paths.bfsgCheck()}`,
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <div lang="de">
        <h1 className="h1 max-w-3xl">{title}</h1>
        <p className="lede max-w-3xl">
          Seit dem 28. Juni 2025 gilt das Barrierefreiheitsstärkungsgesetz (BFSG) auch für private
          Anbieter. Der Teil, der sich von außen ohne Test überprüfen lässt, ist die{' '}
          <strong>Erklärung zur Barrierefreiheit</strong> — sie ist entweder da oder nicht. Unser
          kostenloser Scan prüft genau das zuerst und benennt anschließend die Rechtsgrundlage.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Land vorbelegt: der Scanner leitet die Rechtsordnung sonst aus der
              Domain ab, was bei .com/.shop nicht funktioniert (D-032). */}
          <Link className="btn" to={`${paths.scan()}?country=DE`}>
            Website kostenlos prüfen
          </Link>
          <Link className="text-sm underline underline-offset-2" to={paths.country(germany)}>
            Direkt zu den {all.length} Agenturen für Deutschland →
          </Link>
        </div>

        <section className="mt-12 max-w-3xl">
          <h2 className="h2 mt-0">Warum zuerst die Erklärung zur Barrierefreiheit?</h2>
          <ul className="mt-3 space-y-3 text-slate-700">
            <li>
              <strong>Sie ist gesetzlich verlangt.</strong> Die Anforderungen an die Erklärung stehen
              in <strong>Anlage 3 zu § 14 BFSG</strong> (
              <a className="underline underline-offset-2" href={BFSG_URL} rel="noopener noreferrer">
                Gesetzestext
              </a>
              ). Das ist die einzige Rechtsgrundlage in unserem Katalog, die wir gegen die
              Primärquelle geprüft haben — für alle anderen Länder weisen wir sie ausdrücklich als
              ungeprüft aus.
            </li>
            <li>
              <strong>Sie ist binär prüfbar.</strong> Ob eine Seite WCAG erfüllt, kann kein Scanner
              abschließend sagen. Ob eine Erklärung verlinkt ist und die geforderten Angaben enthält,
              schon — ohne Fehlalarme.
            </li>
            <li>
              <strong>Sie ist der sichtbarste Teil.</strong> Die Marktüberwachung der Länder (
              <a className="underline underline-offset-2" href={MLBF_URL} rel="noopener noreferrer">
                MLBF, Magdeburg
              </a>
              ) prüft bundesweit und wird auch stichprobenartig tätig. Eine fehlende Erklärung ist von
              außen ohne jeden Test erkennbar — für uns wie für alle anderen.
            </li>
          </ul>

          {/* Гарантия против fear-marketing (R1, D-035): границы названы на самой
              странице, а не только в наших документах. */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <strong>Was wir bewusst nicht tun:</strong> Wir nennen keine Bußgeldhöhen. Sie hängen von
              Umständen ab, die aus einem Scan nicht erkennbar sind — und{' '}
              <strong>Kleinstunternehmen</strong> (weniger als 10 Beschäftigte und höchstens 2 Mio. €
              Jahresumsatz oder Bilanzsumme) sind nach § 3 Abs. 3 BFSG von den Pflichten für
              Dienstleistungen ausgenommen. Diese Seite ist Orientierung, keine Rechtsberatung.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="h2">In drei Schritten</h2>
          <ol className="mt-3 space-y-4">
            <li>
              <h3 className="font-semibold">1. Scannen</h3>
              <p className="mt-1 text-slate-700">
                Bis zu sechs Seiten, automatisch geprüft. Wählen Sie „Germany“ als Rechtsordnung — über
                den Button oben ist sie bereits vorbelegt, sonst rät der Scanner anhand der Domain und
                liegt bei <code>.com</code>-Adressen zwangsläufig daneben.{' '}
                <Link className="underline underline-offset-2" to={`${paths.scan()}?country=DE`}>
                  Zum Scan
                </Link>
                .
              </p>
            </li>
            <li>
              <h3 className="font-semibold">2. Befund einordnen</h3>
              <p className="mt-1 text-slate-700">
                Fehlt die Erklärung, weist der Bericht die Rechtsgrundlage direkt am Befund aus. Was der
                Scan abdeckt und was nicht, steht offen auf{' '}
                <Link className="underline underline-offset-2" to={paths.methodology()}>
                  unserer Methodenseite
                </Link>
                .
              </p>
            </li>
            <li>
              <h3 className="font-semibold">3. Prüfstelle beauftragen</h3>
              <p className="mt-1 text-slate-700">
                Für den belastbaren Nachweis braucht es einen Menschen. Unten stehen {named.length}{' '}
                Prüfer, die in veröffentlichten deutschen Erklärungen zur Barrierefreiheit namentlich
                als externe Prüfstelle genannt werden — jeweils mit Link auf das Dokument.
              </p>
            </li>
          </ol>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="h2">Was ein automatischer Scan nicht leisten kann</h2>
          {/* Цифры из coverageSummary (посчитано scripts/en301549-coverage.mjs),
              не вписаны руками — иначе страница начала бы врать при следующем
              росте покрытия (тот же приём, что на главной, D-038). */}
          <p className="mt-2 text-slate-700">
            Von den {coverageSummary.total} Web-Anforderungen der EN 301 549 — der Norm, auf die die
            Konformitätsvermutung des § 4 BFSG hinausläuft — prüfen wir {coverageSummary.covered}{' '}
            automatisch. Die übrigen {coverageSummary.total - coverageSummary.covered} hängen an Sinn
            und Urteilsvermögen: Reihenfolge, Verständlichkeit, Fehlermeldungen. Kein Scanner schließt
            diese Lücke, unserer auch nicht.{' '}
            <Link className="underline underline-offset-2" to={paths.methodology()}>
              Vollständige Abdeckungskarte
            </Link>
            .
          </p>
        </section>

        <section className="mt-12">
          <h2 className="h2">
            In deutschen Erklärungen zur Barrierefreiheit genannte Prüfer ({named.length})
          </h2>
          <p className="mt-2 max-w-3xl text-slate-700">
            Diese Agenturen haben wir nicht selbst ausgewählt: Sie werden in veröffentlichten
            Erklärungen zur Barrierefreiheit als externe Prüfstelle benannt. Die Quelle steht bei jedem
            Eintrag — prüfen Sie sie nach.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {named.map((a) => (
              <li key={a.slug} className="card">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">
                    <Link className="underline-offset-2 hover:underline" to={paths.agency(a.slug)}>
                      {a.name}
                    </Link>
                  </h3>
                  <span className="shrink-0 text-xs text-slate-500">{a.hq.city}</span>
                </div>
                {a.description.de && (
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{a.description.de}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.certs.some((c) => c.kind === 'bitv-pruefstelle') && (
                    <span className="chip chip-accent">✓ BIK BITV-Test Prüfstelle</span>
                  )}
                  {a.services.slice(0, 3).map((s) => (
                    <span key={s} className="chip">
                      {serviceLabel(s)}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Genannt in:{' '}
                  {statementEvidence(a, 'DE').map((e, i) => (
                    <span key={e.url}>
                      {i > 0 && ', '}
                      <a className="underline underline-offset-2" href={e.url} rel="noopener noreferrer">
                        {hostOf(e.url)}
                      </a>
                      {/* D-042: чья это Erklärung — видно сразу. Часть немецких
                          деклараций публикуют частные компании (Mazda, ADAC
                          Stiftung), и выдавать их за «Behörde» нельзя. */}
                      {e.declarant === 'public-body' && ' (öffentliche Stelle)'}
                      {e.declarant === 'private' && ' (privates Unternehmen)'}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Link className="underline underline-offset-2" to={paths.country(germany)}>
              Alle {all.length} Agenturen für Deutschland →
            </Link>
            {/* Пути строятся из paths.*, а не пишутся строкой — иначе ссылка тихо
                разъедется при переименовании сегмента услуги. */}
            <Link className="underline underline-offset-2" to={paths.combo(germany, 'audit')}>
              Nur Audit-Anbieter →
            </Link>
            <Link className="underline underline-offset-2" to={paths.standard('bitv')}>
              Nach BITV-Bezug filtern →
            </Link>
          </p>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="h2">Was kostet eine Prüfung?</h2>
          {/* G-PRICE: у 40/40 немецких агентств поле priceBand пусто, и мы его НЕ
              придумываем (D-006/R1). Вместо пустоты — единственная реально
              опубликованная величина с ссылкой на первоисточник.
              Подтверждено сплошной проверкой 2026-08-06 (D-045): ни одно из 40
              немецких агентств цену аудита не публикует — у ifdb опубликован
              SaaS за страницу, у telekom-mms прайс на Business GPT, это не аудит.
              Текст ниже верен ровно до тех пор, пока это так. */}
          <p className="mt-2 text-slate-700">
            Wir zeigen keine Preise je Agentur: die meisten veröffentlichen keine, und geraten wird bei
            uns nichts. Eine belastbare Größenordnung veröffentlicht der BIK-Prüfverbund selbst —{' '}
            <a className="underline underline-offset-2" href={BIK_PRICES_URL} rel="noopener noreferrer">
              indikative Seitenpreise nach Komplexitätsstufe
            </a>
            . Wie sich der Aufwand zusammensetzt, steht im Leitfaden zum BITV-Test unten. Verbindlich
            ist immer das individuelle Angebot.
          </p>
        </section>

        {deGuides.length > 0 && (
          <section className="mt-12 max-w-3xl">
            <h2 className="h2">Zum Weiterlesen</h2>
            <ul className="mt-3 space-y-3">
              {deGuides.map((g) => (
                <li key={g.slug}>
                  <Link className="font-medium underline underline-offset-2" to={`/guides/${g.slug}/`}>
                    {g.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-slate-600">{g.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Layout>
  )
}
