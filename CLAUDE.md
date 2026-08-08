# AccessAtlas — Project Operating Rules

Это ветка проекта **AccessAtlas** (каталог → платформа аудита цифровой доступности).
В `main` этого репозитория живёт другой, несвязанный проект (detnav) — не смешивать.

Точки входа: `docs/project/HANDOFF.md` (управление) → `docs/project/STATUS.md` →
`research/STATE.md` (подробный legacy-статус каталога).

## Source of truth

The repository, tests, and `docs/project/` are the durable project memory. Chat history
is temporary and must not be treated as the sole source of truth. Catalog data truth
lives in `data/a11y/agencies.json`; никогда не выдумывать значения полей.

## Large-task protocol

For any task that spans multiple domains, requires broad repository exploration, or is
likely to consume a large context:

1. Invoke `/project-orchestrator`.
2. Read `docs/project/HANDOFF.md` and `STATUS.md`.
3. Split work into bounded tasks with owners and acceptance criteria.
4. Delegate focused work to fresh subagent contexts.
5. Return only compact results to the main conversation.
6. Update project memory before ending the iteration.

## Context protection

- Do not read the entire repository when targeted search is enough.
- Keep large logs, research, and file listings out of the main conversation.
- Use subagents for broad exploration and implementation details.
- After a completed phase, update `HANDOFF.md`.
- Start a fresh session when the main thread becomes dominated by historical details.
- Never hide interface changes or architectural decisions.

## Completion standard

A task is complete only when:
- acceptance criteria are satisfied;
- relevant checks pass (`node scripts/build-a11y.mjs`, `npm run typecheck`, `npm run build`);
- cross-domain contracts remain consistent (`docs/project/INTERFACES.md`);
- `STATUS.md`, `BACKLOG.md`, and `HANDOFF.md` reflect the new state.

## Model economy

**Перед существенной работой — остановись и дай владельцу выбрать модель**
(указание владельца 2026-08-08, отменяет прежнее «не приостанавливай задачу ради
вопроса о модели»). Не «отметить, что совет не подходит, и пойти дальше» — именно
приостановиться и предложить выбор через `AskUserQuestion`: варианты `haiku` /
`sonnet` / `opus`, у каждого одной строкой цена ошибки и объём задачи. Рекомендацию
хука Model Advisor показывай как один из входов, а не как вердикт: она считается по
длине и форме промпта и на этом проекте регулярно занижала оценку (например `haiku`
на реверс дизайн-системы). Свою оценку давай рядом и обосновывай.

Приостановка нужна перед существенной работой: новый узел графа, дизайн-итерация,
правка данных каталога, всё, что потребует прогона проверок и коммита. НЕ нужна
на разговорных ответах, уточнениях, показе файла, продолжении уже выбранного
владельцем пункта меню. Никогда не утверждай, что знаешь активную модель сессии.

## Execution modes

Use direct for one local task, verification-loop for one testable task, graph for
dependencies, graph-parallel for independent work, and scheduled-loop for external
waiting. Store dependencies in `docs/project/GRAPH.yaml`. Every loop requires
verification, retry limits, terminal states, and escalation.

## Project-specific guardrails

- Индексацию профилей не открывать, пока описания < 90% (риск thin-content, R1).
- Деплой, платные ресурсы (Browser Rendering, D1, API-ключи), рассылки — только
  с явного разрешения владельца (`approval_required` в GRAPH.yaml).
- Схему `data/a11y/types.ts` и контракты `INTERFACES.md` менять только с записью
  в `DECISIONS.md`.

## Response ending

After every completed task, provide exactly 2–3 concrete next-step options and one
relevant web-development learning term. Record the term in
`docs/project/LEARNING_LOG.md` and avoid recent repetition.
