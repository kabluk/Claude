class AIAnalyzer {
  static async analyze(photoCanvas, apiKey) {
    const base64 = photoCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];

    const prompt = `Ты анализируешь фото для генерации персонажа в файтинге. Посмотри на изображение.

Верни ТОЛЬКО JSON-объект (без пояснений):
{
  "name": "Полное имя если узнаваемый человек, иначе null",
  "gender": "male" или "female",
  "colors": {
    "shirt": "#RRGGBB — доминирующий цвет верхней одежды",
    "pants": "#RRGGBB — доминирующий цвет нижней одежды",
    "hair": "#RRGGBB — цвет волос (#1a1a1a если лысый"
  },
  "traits": {
    "glasses": true/false,
    "beard": true/false,
    "mustache": true/false,
    "hat": true/false,
    "bald": true/false,
    "longHair": true/false — длинные волосы ниже плеч
  },
  "style": "boxer, ninja, karate, wrestler или street — выбери по внешнему виду",
  "phrases": ["фраза1", "фраза2", "фраза3", "фраза4"]
}

Для phrases:
- Если узнаваемая знаменитость — их реальные известные цитаты на русском (макс 28 символов)
- Если обычный человек — смешные реплики бойца по характеру/стилю одежды (макс 28 символов)
- Фразы должны быть весёлыми и подходящими для боя`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: prompt }
        ]}]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Нет JSON в ответе AI');
    return JSON.parse(match[0]);
  }
}
