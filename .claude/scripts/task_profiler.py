#!/usr/bin/env python3
"""Claude Code UserPromptSubmit hook: recommend an economical model for each task."""

from __future__ import annotations

import json
import re
import sys
from typing import Any


LIGHT_TERMS = {
    "переименуй", "опечатк", "форматир", "исправь текст", "переведи",
    "rename", "typo", "format", "lint", "comment", "объясни строку",
    "найди файл", "grep", "replace", "замени слово", "короткий ответ",
}
HEAVY_TERMS = {
    "архитектур", "спроектир", "рефакторинг", "миграц", "безопасност",
    "аудит", "race condition", "масштабирован", "распределенн",
    "distributed", "architecture", "security audit", "threat model",
    "redesign", "root cause", "оптимизируй всю", "исследуй проект",
}
CRITICAL_TERMS = {
    "production", "продакш", "платеж", "финанс", "авторизац",
    "аутентификац", "шифрован", "персональн", "удаление данных",
    "database migration", "breaking change", "compliance",
}
MULTI_DOMAIN_TERMS = {
    "backend", "frontend", "devops", "маркетинг", "marketing",
    "database", "база данных", "инфраструктур", "api", "дизайн",
    "analytics", "аналитик", "мобильн", "product",
}


def contains_any(text: str, terms: set[str]) -> int:
    return sum(1 for term in terms if term in text)


def classify(prompt: str) -> dict[str, Any]:
    text = prompt.lower().strip()
    words = re.findall(r"\w+", text, flags=re.UNICODE)
    score = 1
    reasons: list[str] = []

    light = contains_any(text, LIGHT_TERMS)
    heavy = contains_any(text, HEAVY_TERMS)
    critical = contains_any(text, CRITICAL_TERMS)
    domains = contains_any(text, MULTI_DOMAIN_TERMS)

    if len(words) > 80:
        score += 1
        reasons.append("подробный запрос")
    if len(words) > 220:
        score += 1
        reasons.append("большой объём требований")
    if heavy:
        score += min(2, heavy)
        reasons.append("нужно сложное рассуждение или проектирование")
    if critical:
        score += 1
        reasons.append("высокая цена ошибки")
    if domains >= 3:
        score += 1
        reasons.append("несколько проектных направлений")
    if re.search(r"\b(весь|всю|полностью|end[- ]to[- ]end|с нуля)\b", text):
        score += 1
        reasons.append("широкая область изменений")
    if re.search(r"\b(один файл|одну строку|мелк|быстро|просто)\b", text):
        score -= 1
    if light and not heavy and not critical:
        score -= 1
        reasons.append("локальная механическая задача")

    score = max(0, min(5, score))

    if score <= 1:
        model = "haiku"
        label = "LOW"
        context = "малый"
        risk = "низкий"
    elif score <= 3:
        model = "sonnet"
        label = "MEDIUM"
        context = "средний"
        risk = "средний" if score == 3 else "низкий"
    else:
        model = "opus"
        label = "HIGH" if score == 4 else "VERY HIGH"
        context = "большой"
        risk = "высокий"

    if not reasons:
        reasons.append("обычная задача без явных признаков крайной сложности")

    return {
        "score": score,
        "label": label,
        "model": model,
        "context": context,
        "risk": risk,
        "reasons": reasons[:3],
    }


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    prompt = str(payload.get("prompt", "")).strip()
    if not prompt or prompt.startswith("/model"):
        print("{}")
        return 0

    result = classify(prompt)
    command = f"/model {result['model']}"
    reason = "; ".join(result["reasons"])

    visible = (
        f"Model Advisor · {result['label']} ({result['score']}/5) · "
        f"рекомендуется {result['model'].upper()} · "
        f"контекст: {result['context']}, риск: {result['risk']}. "
        f"Причина: {reason}. При необходимости: {command}"
    )

    context = (
        "MODEL_ADVISOR_RESULT\n"
        f"complexity={result['label']} ({result['score']}/5)\n"
        f"recommended_model={result['model']}\n"
        f"risk={result['risk']}\n"
        f"expected_context={result['context']}\n"
        f"reason={reason}\n"
        "Before doing substantial work, add one short first sentence only when the "
        "recommended model materially differs from what the task appears to require: "
        f"«Совет по модели: для этой задачи достаточно /model {result['model']} — <краткая причина>.» "
        "Do not claim you know the current session model. Do not repeatedly ask for confirmation. "
        "For trivial conversational follow-ups, acknowledge the recommendation silently."
    )

    output = {
        "systemMessage": visible,
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context,
        },
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
