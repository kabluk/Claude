#!/usr/bin/env node
// Шаблон doctor-скрипта (PROJECT-PLAYBOOK, правило 6).
//
// Смысл не в конкретных проверках, а в том, что среда и состояние
// подтверждаются за секунды в начале сессии, а не выясняются через час
// отладки. Реальная цена отсутствия: треть сессии на доступы + инцидент,
// где расхождение схемы с документацией нашлось только упавшим деплоем.
//
// Копировать в scripts/doctor.mjs проекта, добавить в package.json:
//   "doctor": "node scripts/doctor.mjs"
// и вызывать ПЕРВЫМ ДЕЛОМ каждой сессии (прописано в HANDOFF).

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

/** Проверка: { name, run } — run возвращает строку-деталь или бросает исключение. */
const checks = [
  {
    name: 'git: доступ на запись',
    run: () => {
      const branch = sh('git rev-parse --abbrev-ref HEAD');
      sh(`git push --dry-run origin ${branch}`); // не пишет, но требует прав
      return `ветка ${branch}, push разрешён`;
    },
  },
  {
    name: 'git: рабочее дерево',
    run: () => {
      const dirty = sh('git status --porcelain');
      if (dirty) throw new Error(`незакоммиченные изменения:\n${dirty.split('\n').slice(0, 5).join('\n')}`);
      return 'чисто';
    },
  },
  {
    name: 'CI: какие секреты нужны воркфлоу',
    run: () => {
      const dir = '.github/workflows';
      if (!existsSync(dir)) return 'воркфлоу нет';
      const names = new Set();
      for (const f of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
        for (const m of readFileSync(`${dir}/${f}`, 'utf8').matchAll(/secrets\.([A-Z0-9_]+)/g)) {
          names.add(m[1]);
        }
      }
      // Наличие значений проверить нельзя (секреты не читаются обратно) —
      // но список того, что ДОЛЖНО быть заведено, экономит час догадок.
      return names.size ? `нужны: ${[...names].join(', ')}` : 'секреты не используются';
    },
  },

  // ── Слоты под конкретный проект ─────────────────────────────────────────
  // Раскомментировать и настроить. Именно эти проверки ловят расхождение
  // документации с реальностью (правило 2) — самое дорогое из наблюдавшегося.
  //
  // {
  //   name: 'БД: схема совпадает с последней миграцией',
  //   run: () => {
  //     const latest = readdirSync('migrations')
  //       .filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort().pop().slice(0, 4);
  //     const live = /* прочитать schema_version из прод-БД */ '';
  //     if (live !== latest) throw new Error(`прод на ${live}, в репозитории ${latest}`);
  //     return `обе на ${latest}`;
  //   },
  // },
  // {
  //   name: 'прод отвечает',
  //   run: () => {
  //     const code = sh(`curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 ${ORIGIN}`);
  //     if (code !== '200') throw new Error(`главная отдала ${code}`);
  //     return '200';
  //   },
  // },
];

let failed = 0;
for (const { name, run } of checks) {
  try {
    console.log(`  ✓  ${name.padEnd(38)} ${run()}`);
  } catch (err) {
    failed++;
    console.log(`  ✗  ${name.padEnd(38)} ${String(err.message).split('\n')[0]}`);
  }
}
console.log(failed ? `\n${failed} проверк(и) не прошли.` : '\nСреда в порядке.');
process.exit(failed ? 1 : 0);
