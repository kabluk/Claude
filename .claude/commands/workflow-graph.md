---
description: Строит и поддерживает граф зависимостей проекта в docs/project/GRAPH.yaml. Используй для нескольких задач, ролей, зависимостей и параллельной разработки.
argument-hint: "[цель или фаза]"
context: fork
---

# Workflow Graph

Запрос: $ARGUMENTS

Представляй проект как DAG: вершина — ограниченная проверяемая задача, ребро — реальная зависимость.

Прочитай точечно VISION.md, STATUS.md, ROADMAP.md, BACKLOG.md, DECISIONS.md, INTERFACES.md и существующий GRAPH.yaml. Не читай весь репозиторий.

Создай или обнови `docs/project/GRAPH.yaml`:

```yaml
version: 1
updated_at: YYYY-MM-DD
limits:
  max_parallel: 3
  max_nodes_per_iteration: 8
  default_max_attempts: 4
nodes:
  - id: BE-001
    title: Короткий проверяемый результат
    owner: backend-engineer
    status: planned
    depends_on: []
    inputs: []
    scope: []
    outputs: []
    verify: []
    max_attempts: 4
    attempts: 0
    risk: low
    approval_required: false
    notes: ""
```

Статусы: planned, blocked, ready, running, review, done, failed, escalated.

Правила:
1. Узел завершается за один автономный рабочий заход.
2. Один узел — один главный владелец.
3. Параллельные узлы не должны менять одни файлы.
4. `ready` допустим только после завершения всех зависимостей.
5. Не создавай циклов и больше восьми новых узлов за итерацию.
6. Production, destructive migration, breaking API, security-critical и платные ресурсы требуют `approval_required: true`.
7. Для параллельной работы предлагай worktrees.
8. Если узел выполнен, но проверен не полностью (например, критичная часть требует
   доступа/аккаунта, которого нет у исполнителя) — ставь `status: review`, не `done`.
   `done` означает «проверено», а не «код написан».

Выбери режим:
- direct — одна локальная задача;
- verification-loop — одна проверяемая задача;
- graph — несколько зависимых;
- graph-parallel — несколько независимых;
- scheduled-loop — ожидание CI, PR, deploy или внешнего события.

Покажи ready-узлы, блокировки, безопасные параллельные группы, критический путь и лучший следующий узел.

Заверши 2–3 вариантами следующего действия и одним связанным «Термином дня».
