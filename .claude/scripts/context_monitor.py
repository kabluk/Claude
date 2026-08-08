#!/usr/bin/env python3
"""Claude Code UserPromptSubmit hook: следит за заполнением контекстного окна.

Зачем: длинная сессия деградирует незаметно — модель начинает терять ранние
договорённости раньше, чем кто-либо это замечает, и «продолжаем» превращается в
«переделываем». Владелец просил предупреждать заранее и сразу давать промпт для
новой сессии (D-076).

Как измеряется — фактом, а не эвристикой. Claude Code пишет транскрипт сессии в
JSONL, и КАЖДЫЙ ответ модели несёт реальный usage от API:

    usage.input_tokens + usage.cache_read_input_tokens
      + usage.cache_creation_input_tokens

Это ровно то, сколько контекста ушло в последний запрос. Мы читаем последнюю
такую запись — не считаем символы, не гадаем по размеру файла (размер файла
врёт: он копит ВСЮ историю, включая то, что харнесс уже свернул авто-компактом,
и то, что было усечено в выводе инструментов).

Стоимость: транскрипт растёт до десятков МБ, поэтому файл читается С КОНЦА
блоками, пока не найдётся первая (то есть последняя по времени) запись usage.
Полный парс 9-МБ файла на каждый ход был бы дороже пользы.

Порог по умолчанию — 1 000 000 токенов, потому что в этом проекте наблюдался
живой ход на ~740k (значит окно как минимум такое). Переопределяется переменной
окружения CONTEXT_LIMIT_TOKENS без правки кода — если модель/тариф сменится,
менять надо одно значение снаружи, а не логику здесь.

Хук молчит, пока не станет действительно тесно: лишнее предупреждение на каждом
ходу быстро научит его игнорировать, и тогда оно не сработает там, где нужно.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

# Доля окна, после которой стоит начать сворачиваться / передавать эстафету.
NOTICE_AT = 0.70
HANDOFF_AT = 0.85
DEFAULT_LIMIT = 1_000_000

# Сколько байт с конца транскрипта прочитать за одну попытку. Записи с usage
# крупные (в них полный ответ модели), но между ними могут лежать длинные
# результаты инструментов — поэтому окно расширяется, если не нашли с первого.
TAIL_CHUNKS = (256_000, 1_024_000, 4_096_000)


def last_usage(path: str) -> dict | None:
    """Последняя запись usage в транскрипте — читаем файл с конца."""
    try:
        size = os.path.getsize(path)
    except OSError:
        return None

    for chunk in TAIL_CHUNKS:
        try:
            with open(path, "rb") as f:
                start = max(0, size - chunk)
                f.seek(start)
                data = f.read()
        except OSError:
            return None

        # Первая строка почти наверняка обрезана серединой — отбрасываем её,
        # кроме случая, когда читаем файл целиком с самого начала.
        lines = data.split(b"\n")
        if start > 0:
            lines = lines[1:]

        for raw in reversed(lines):
            if b'"usage"' not in raw:
                continue
            try:
                rec = json.loads(raw.decode("utf-8", "replace"))
            except Exception:
                continue
            usage = (rec.get("message") or {}).get("usage")
            if isinstance(usage, dict) and (
                "input_tokens" in usage or "cache_read_input_tokens" in usage
            ):
                return usage

        if start == 0:  # прочитали весь файл, дальше расширять некуда
            break
    return None


def context_tokens(usage: dict) -> int:
    return (
        int(usage.get("input_tokens") or 0)
        + int(usage.get("cache_read_input_tokens") or 0)
        + int(usage.get("cache_creation_input_tokens") or 0)
    )


def git(*args: str) -> str:
    """Короткий git-запрос; пустая строка вместо исключения — хук не имеет
    права падать из-за отсутствующего репозитория."""
    try:
        out = subprocess.run(
            ["git", *args], capture_output=True, text=True, timeout=2, cwd=os.getcwd()
        )
        return out.stdout.strip() if out.returncode == 0 else ""
    except Exception:
        return ""


def handoff_prompt() -> str:
    """Промпт для новой сессии, собранный из ФАКТИЧЕСКОГО состояния репозитория.

    Ссылается на HANDOFF.md, а не пересказывает его: пересказ устаревает в
    момент написания, ссылка — нет (тот же принцип, что single source of truth,
    LEARNING_LOG 2026-08-07).
    """
    branch = git("rev-parse", "--abbrev-ref", "HEAD") or "claude/accessatlas-project-x8fz3t"
    head = git("log", "-1", "--pretty=%h %s")
    dirty = git("status", "--porcelain")

    lines = [
        "Проект AccessAtlas, ветка " + branch + " (от accessatlas, не от main —",
        "в main чужой проект detnav).",
        "",
        "Начни с чтения docs/project/HANDOFF.md, затем STATUS.md. Не читай репозиторий",
        "целиком — HANDOFF это точка входа, остальное подтянешь точечным поиском.",
        "",
        "Проверка среды: npm install && node scripts/build-a11y.mjs — ожидать 245 агентств.",
        "",
        "ЗАДАЧА: <впиши задачу>",
    ]
    if head:
        lines += ["", "Последний коммит предыдущей сессии: " + head]
    if dirty:
        lines += [
            "",
            "ВНИМАНИЕ: в предыдущей сессии остались незакоммиченные изменения "
            f"({len(dirty.splitlines())} файлов) — проверь git status до начала работы.",
        ]
    return "\n".join(lines)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    path = payload.get("transcript_path") or ""
    if not path or not os.path.exists(path):
        return 0

    usage = last_usage(path)
    if not usage:
        return 0

    used = context_tokens(usage)
    try:
        limit = int(os.environ.get("CONTEXT_LIMIT_TOKENS") or DEFAULT_LIMIT)
    except ValueError:
        limit = DEFAULT_LIMIT
    if limit <= 0:
        return 0

    share = used / limit
    if share < NOTICE_AT:
        return 0  # тихо: предупреждение на каждом ходу обесценивает себя

    pct = round(share * 100)
    used_k = round(used / 1000)
    limit_k = round(limit / 1000)

    if share >= HANDOFF_AT:
        visible = (
            f"⚠ Контекст {pct}% ({used_k}k из {limit_k}k). "
            "Пора начинать новую сессию — промпт передачи готов, см. ответ."
        )
        context = (
            "CONTEXT_MONITOR: HANDOFF_NOW\n"
            f"used_tokens={used}\nlimit_tokens={limit}\nshare={pct}%\n"
            "\nКонтекст сессии почти исчерпан. ОБЯЗАТЕЛЬНО в этом же ответе:\n"
            "1) заверши/закоммить текущий кусок работы или честно скажи, что он не закончен;\n"
            "2) убедись, что docs/project/{STATUS,HANDOFF}.md отражают факт;\n"
            "3) скажи владельцу, что пора начать новую сессию, и покажи промпт ниже\n"
            "   ЦЕЛИКОМ, готовым к копированию (в блоке кода, без сокращений).\n"
            "Не начинай новую крупную задачу в этой сессии.\n"
            "\n--- ПРОМПТ ДЛЯ НОВОЙ СЕССИИ ---\n" + handoff_prompt()
        )
    else:
        visible = (
            f"Контекст {pct}% ({used_k}k из {limit_k}k) — "
            "стоит сворачивать текущий узел, не начинать крупный."
        )
        context = (
            "CONTEXT_MONITOR: WRAP_UP\n"
            f"used_tokens={used}\nlimit_tokens={limit}\nshare={pct}%\n"
            "\nКонтекст заполнен более чем на "
            f"{int(NOTICE_AT * 100)}%. Доводи текущий узел до коммита и обнови\n"
            "docs/project/{STATUS,HANDOFF}.md. Крупную новую задачу в этой сессии\n"
            "не начинай — предложи владельцу начать её в новой.\n"
            "Упомяни заполнение контекста владельцу ОДНОЙ строкой, без паники."
        )

    print(
        json.dumps(
            {
                "systemMessage": visible,
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": context,
                },
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
