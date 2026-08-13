#!/usr/bin/env python3
"""Тест хука context_monitor: проверка обязана уметь провалиться.

Правило проекта (D-050, LEARNING_LOG «verifier strength»): гейт, который ни разу
не краснел, не доказан. Здесь каждый порог проверяется синтетическим
транскриптом с ЗАДАННЫМ расходом токенов — тихо/предупреждение/передача, — плюс
случаи, где хук обязан молчать (нет транскрипта, битый JSON, нет usage).

Запуск: python3 .claude/scripts/context_monitor.test.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
HOOK = os.path.join(HERE, "context_monitor.py")

failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"{'PASS' if ok else 'FAIL'} {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        failures.append(name)


def transcript(cache_read: int, *, valid: bool = True, with_usage: bool = True) -> str:
    """Синтетический транскрипт: несколько строк, последняя несёт usage."""
    fd, path = tempfile.mkstemp(suffix=".jsonl")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        # Шум перед целевой записью — в реальном транскрипте между записями
        # usage лежат крупные результаты инструментов.
        for i in range(5):
            f.write(json.dumps({"type": "user", "message": {"content": "x" * 500, "n": i}}) + "\n")
        if not valid:
            f.write('{"message": {"usage": {BROKEN\n')
        elif with_usage:
            f.write(
                json.dumps(
                    {
                        "type": "assistant",
                        "message": {
                            "usage": {
                                "input_tokens": 10,
                                "cache_read_input_tokens": cache_read,
                                "cache_creation_input_tokens": 0,
                                "output_tokens": 100,
                            }
                        },
                    }
                )
                + "\n"
            )
        else:
            f.write(json.dumps({"type": "assistant", "message": {"content": "no usage here"}}) + "\n")
    return path


def run(transcript_path: str, limit: str = "1000000") -> tuple[str, dict | None]:
    env = {**os.environ, "CONTEXT_LIMIT_TOKENS": limit}
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=json.dumps({"prompt": "продолжай", "transcript_path": transcript_path}),
        capture_output=True,
        text=True,
        timeout=10,
        env=env,
    )
    out = proc.stdout.strip()
    if not out:
        return "", None
    try:
        return out, json.loads(out)
    except Exception:
        return out, None


# --- Пороги ----------------------------------------------------------------
p = transcript(400_000)  # 40% — тихо
raw, _ = run(p)
check("40% контекста: хук молчит (нет шума на каждом ходу)", raw == "", f"stdout={raw[:60]!r}")
os.unlink(p)

p = transcript(750_000)  # 75% — предупреждение
raw, obj = run(p)
ctx = (obj or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
check("75% контекста: предупреждение WRAP_UP", "CONTEXT_MONITOR: WRAP_UP" in ctx)
check("75%: показан процент владельцу", "75%" in (obj or {}).get("systemMessage", ""))
check("75%: НЕ выдаёт промпт передачи раньше времени", "ПРОМПТ ДЛЯ НОВОЙ СЕССИИ" not in ctx)
os.unlink(p)

p = transcript(900_000)  # 90% — передача
raw, obj = run(p)
ctx = (obj or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
check("90% контекста: HANDOFF_NOW", "CONTEXT_MONITOR: HANDOFF_NOW" in ctx)
check("90%: промпт для новой сессии выдан", "ПРОМПТ ДЛЯ НОВОЙ СЕССИИ" in ctx)
check("90%: промпт ссылается на HANDOFF.md, а не пересказывает его", "HANDOFF.md" in ctx)
check("90%: промпт содержит проверку среды", "build-a11y.mjs" in ctx)
# Владелец (2026-08-13): каждая новая сессия обязана НАЧИНАТЬСЯ с оркестратора,
# не с ручного чтения файлов. Проверяем это буквально — первая строка промпта
# ПОСЛЕ маркера, не просто "упоминание где-то в тексте" (слабая проверка не
# ловит регресс, где вызов сполз вниз или пропал).
marker = "--- ПРОМПТ ДЛЯ НОВОЙ СЕССИИ ---\n"
prompt_body = ctx.split(marker, 1)[1] if marker in ctx else ""
check(
    "90%: промпт СРАЗУ открывается вызовом /project-orchestrator (владелец, 2026-08-13)",
    prompt_body.startswith("/project-orchestrator"),
    f"got={prompt_body[:60]!r}",
)
os.unlink(p)

# --- Граница порога --------------------------------------------------------
# ВНИМАНИЕ на арифметику: transcript() кладёт ещё input_tokens=10, и хук считает
# сумму трёх полей — 699_989 + 10 = 699_999, то есть на единицу НЕ дотягивает.
# Первая версия теста передавала 699_999 и краснела: сумма выходила 700_009,
# порог был законно перейдён. Ошибка была в тесте, не в хуке — оставлено здесь
# явно, потому что «проверка сама себя обманула» ловится только таким счётом.
p = transcript(699_989)  # сумма ровно 699_999
raw, _ = run(p)
check("порог 70%: 699_999 токенов ещё молчит", raw == "", f"stdout={raw[:60]!r}")
os.unlink(p)

p = transcript(699_990)  # сумма ровно 700_000
raw, obj = run(p)
check("порог 70%: ровно 700_000 уже говорит", raw != "")
os.unlink(p)

# --- Отказоустойчивость: хук не имеет права ломать ход ----------------------
raw, _ = run("/nonexistent/transcript.jsonl")
check("нет файла транскрипта: хук молчит, не падает", raw == "")

p = transcript(900_000, valid=False)
raw, _ = run(p)
check("битый JSON в транскрипте: хук молчит, не падает", raw == "")
os.unlink(p)

p = transcript(900_000, with_usage=False)
raw, _ = run(p)
check("нет записи usage: хук молчит", raw == "")
os.unlink(p)

p = transcript(900_000)
raw, _ = run(p, limit="0")
check("CONTEXT_LIMIT_TOKENS=0: хук молчит, не делит на ноль", raw == "")
raw, obj = run(p, limit="не-число")
check("CONTEXT_LIMIT_TOKENS мусор: откат на дефолт, не падение", (obj or {}) != {})
os.unlink(p)

# --- Настраиваемый лимит ---------------------------------------------------
p = transcript(180_000)
raw, _ = run(p, limit="1000000")
check("180k при лимите 1M: молчит", raw == "")
raw, obj = run(p, limit="200000")
ctx = (obj or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
check("180k при лимите 200k: HANDOFF_NOW (лимит реально настраиваемый)", "HANDOFF_NOW" in ctx)
os.unlink(p)

print()
if failures:
    print(f"{len(failures)} FAILED: " + ", ".join(failures))
    sys.exit(1)
print("ALL PASS")
