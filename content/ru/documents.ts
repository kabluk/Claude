import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Что означают эти бумаги',
  lede: 'Эта страница работает без интернета. Сохраните её.',
  blocks: [
    {
      kind: 'memcard',
      title: 'СОХРАНИТЬ И ПЕРЕСЛАТЬ',
      lines: ['Я пользуюсь правом хранить молчание. Я не буду подписывать документы без адвоката.'],
      alts: [
        'Estoy ejerciendo mi derecho a guardar silencio. No firmaré documentos sin un abogado.',
        'I am exercising my right to remain silent. I will not sign documents without an attorney.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Сделайте скриншот этой карточки и перешлите в WhatsApp — она работает без регистрации и без интернета.',
    },
    { kind: 'h2', text: 'Механика документов' },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Voluntary departure',
      body: [
        'Означает согласие уехать самостоятельно и отказ от слушания в суде. После подписания дело в суд не идёт.',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Stipulated removal',
      body: ['Согласие на приказ о выдворении без слушания. Судья дело не рассматривает.'],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: '«Подпишешь — быстрее выйдешь»',
      body: [
        'Эта фраза регулярно встречается в описаниях задержаний. Подпись под этими документами прекращает дело, а не ускоряет освобождение.',
      ],
    },
    { kind: 'h2', text: 'Что публикуют правозащитные организации' },
    {
      kind: 'p',
      dim: true,
      text: 'ACLU, FIRRP и ILRC публикуют рекомендацию не подписывать никакие документы до разговора с адвокатом, а также называть только своё имя.',
    },
    { kind: 'ext', href: 'https://www.aclu.org', label: 'ACLU' },
    { kind: 'ext', href: 'https://firrp.org', label: 'FIRRP' },
    { kind: 'ext', href: 'https://www.ilrc.org', label: 'ILRC' },
  ],
}

export default c
