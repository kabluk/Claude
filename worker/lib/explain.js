// AI-пояснения находок сканера (D-005, D-016). Claude Haiku, кэш по ruleId×locale
// в KV — генерик-пояснение самого правила, не конкретного экземпляра на конкретном
// сайте (потому и не входит в ключ кэша sampleHtml — иначе первый вызывающий
// "засорял" бы кэш формулировкой под свой сайт для всех последующих).
//
// VISION.md UX-требование 3: перевод технических находок на язык бизнеса, а не
// сырой ruleId/селектор.

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 400
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 дней — генерик-текст правила меняется редко

const SUPPORTED_LOCALES = ['en']
const DEFAULT_LOCALE = 'en'

export function isValidRuleId(ruleId) {
  return typeof ruleId === 'string' && /^[a-z0-9-]{1,100}$/.test(ruleId)
}

export function normalizeLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE
}

export function cacheKey(ruleId, locale) {
  return `explain:${ruleId}:${normalizeLocale(locale)}`
}

// Промпт намеренно не получает sampleHtml/selector — см. заголовок файла.
// Просим строго JSON, чтобы parseExplainResponse не гадал по свободному тексту.
export function buildExplainPrompt(ruleId, locale) {
  return `You explain web accessibility (WCAG) issues found by the axe-core automated
scanner to non-technical business owners who received an automated accessibility
report and need to understand what to do next.

The axe-core rule id is: "${ruleId}"

Respond in ${locale === 'en' ? 'English' : locale} with ONLY a JSON object, no other
text, matching exactly this shape:
{"explanation": "2-3 plain-language sentences: what is wrong, who it affects, and why it matters for a business (legal/reputational/commercial risk framed honestly, no exaggeration)", "fixExamples": ["short, concrete fix instruction 1", "short, concrete fix instruction 2"]}

Rules:
- Base the explanation only on well-established, general knowledge of this specific
  axe-core rule and the WCAG success criteria it maps to. Do not invent specifics
  about any particular website, law, deadline, or monetary figure.
- Do not claim this is legal advice or a compliance certification.
- fixExamples: 1-3 items, each a short actionable instruction a developer or content
  editor could follow (e.g. "Add a concise alt attribute describing the image's
  purpose" not "fix the alt text").
- If "${ruleId}" is not a real axe-core rule you recognize with confidence, respond
  with {"explanation": "", "fixExamples": []} instead of guessing.`
}

// Модель нередко оборачивает ответ в markdown code fence (```json ... ```),
// несмотря на явную просьбу в промпте вернуть "ONLY a JSON object" — обнаружено
// живой проверкой с реальным ключом (D-020), синтетические фикстуры этот случай
// не покрывали. Снимаем фенс перед JSON.parse, а не переписываем промпт ещё
// строже — поведение модели не гарантировано, парсер должен быть терпимее.
function stripCodeFence(text) {
  const trimmed = text.trim()
  const match = /^```(?:json)?\s*\n([\s\S]*?)\n```$/.exec(trimmed)
  return match ? match[1] : trimmed
}

// Валидирует и нормализует ответ модели. Возвращает null при явно мусорном/
// неполном JSON — вызывающий код решает, что делать (не кэшировать, отдать 502).
export function parseExplainResponse(text) {
  let parsed
  try {
    parsed = JSON.parse(stripCodeFence(text))
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  if (typeof parsed.explanation !== 'string') return null
  if (!Array.isArray(parsed.fixExamples) || !parsed.fixExamples.every((f) => typeof f === 'string')) return null
  if (!parsed.explanation.trim()) return null // модель сама сигналит "не знаю" пустой строкой
  return { explanation: parsed.explanation.trim(), fixExamples: parsed.fixExamples.filter((f) => f.trim()) }
}

async function callClaude(apiKey, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Anthropic API error: HTTP ${res.status} ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = data.content?.[0]?.text
  if (typeof text !== 'string') throw new Error('unexpected Anthropic response shape')
  return text
}

// Оркестрация: KV-кэш -> (промах) Claude Haiku -> кэш -> вернуть.
export async function explainRule(env, { ruleId, locale }) {
  const norm = normalizeLocale(locale)
  const key = cacheKey(ruleId, norm)

  const cached = await env.EXPLAIN_CACHE.get(key)
  if (cached) return JSON.parse(cached)

  const prompt = buildExplainPrompt(ruleId, norm)
  const raw = await callClaude(env.ANTHROPIC_API_KEY, prompt)
  const parsed = parseExplainResponse(raw)
  if (!parsed) throw new Error('model returned an unparseable or empty explanation')

  await env.EXPLAIN_CACHE.put(key, JSON.stringify(parsed), { expirationTtl: CACHE_TTL_SECONDS })
  return parsed
}
