#!/bin/bash
# ШАБЛОН SessionStart-хука. Копировать в проект как
# .claude/hooks/session-start.sh (chmod +x) и зарегистрировать в
# .claude/settings.json:
#
# { "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
#   "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh" } ] } ] } }
#
# ЗАЧЕМ (правило 9 плейбука). Всё, что «надо не забыть в начале сессии»,
# должно быть артефактом под git, который среда загружает сама. Правило в
# CLAUDE.md — напоминание, которое можно не заметить; хук — гарантия.
# Проверено на CarrierTruth 22.08.2026: команда в .claude/commands/ на вебе
# не подхватывалась вовсе, и сессии месяцами шли мимо протокола.
#
# ДВЕ ЗАДАЧИ: поставить зависимости и положить в контекст точку входа.
# Вывод — ОДИН JSON на stdout. Весь шум установки уходит в stderr: любая
# посторонняя строка на stdout сломает разбор.
#
# ПОДГОНКА ПОД ПРОЕКТ — три места, помеченные [ПРАВИТЬ].
set -euo pipefail

DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$DIR"

# [ПРАВИТЬ 1/3] Установка зависимостей. Только в удалённой среде: локально
# они уже стоят. npm install, а не ci — состояние контейнера кэшируется
# после хука, и install переиспользует распакованные пакеты.
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && [ -f package.json ]; then
  npm install --no-audit --no-fund >&2 2>&1 \
    || echo "npm install не прошёл — проверки могут не работать" >&2
fi

ctx() { printf '%s\n' "$*"; }

# Каждый кусок ограничен по объёму: текст попадает в контекст КАЖДОЙ сессии,
# и раздутый хук съедает то самое окно, ради которого написан. Ориентир —
# не больше ~8 КБ.
BODY="$(
# [ПРАВИТЬ 2/3] Имя проекта и имя скилла-оркестратора.
ctx "# ПРОЕКТ — автоматический вход в сессию (.claude/hooks/session-start.sh)"
ctx ""
ctx "ПЕРВОЕ ДЕЙСТВИЕ: вызови скилл project-orchestrator (Skill tool)."
ctx "Не начинай задачу мимо него."
ctx ""
ctx "Источник правды — репозиторий и docs/project/, НЕ история чата."
ctx "Порядок чтения: HANDOFF.md -> STATUS.md -> DECISIONS.md -> BACKLOG.md."
ctx ""
ctx "## Ветка и последние коммиты"
git rev-parse --abbrev-ref HEAD 2>/dev/null || true
git log --oneline -5 2>/dev/null || true
ctx ""
# [ПРАВИТЬ 3/3] Если в проекте есть scripts/doctor.mjs — раскомментировать:
# ctx "## Проверка среды (doctor)"
# node scripts/doctor.mjs 2>&1 | head -20 || true
# ctx ""
if [ -f docs/project/HANDOFF.md ]; then
  ctx "## docs/project/HANDOFF.md (первые 80 строк)"
  head -80 docs/project/HANDOFF.md
  ctx ""
fi
if [ -f docs/project/BACKLOG.md ]; then
  ctx "## Открытые пункты BACKLOG (незакрытые чекбоксы)"
  grep -n '^- \[ \]' docs/project/BACKLOG.md | head -15 || ctx "(нет открытых пунктов)"
fi
)"

# JSON-экранирование через node — он есть в любом проекте с package.json.
# Если node в проекте нет, замените на python3 или jq -Rs.
printf '%s' "$BODY" | node -e '
  let s = "";
  process.stdin.on("data", (d) => { s += d; }).on("end", () => {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: s,
      },
    }));
  });
'
