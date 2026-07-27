import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Bond sponsor',
  lede: 'The detained person does not post their own bond. It takes a person with status — or an organization.',
  blocks: [
    {
      kind: 'callout',
      tone: 'y',
      title: 'First — find out whether there will be a bond hearing',
      body: [
        'Since July 2025 the government’s position is that a person who entered the country without inspection is subject to mandatory detention and gets no bond. The appellate circuits split; the Fifth Circuit — Texas, Louisiana, Mississippi — sided with the government. Supreme Court review is expected.',
        'The answer depends on where the person is held, and it changes with a transfer. Only an attorney can determine whether this applies to a specific person — ask that question first.',
        'This describes the state of the dispute as of July 27, 2026 — it moves fast, check the date.',
      ],
    },
    { kind: 'h2', text: 'Who can post bond' },
    {
      kind: 'list',
      items: [
        'A US citizen or green card holder, 18 or older',
        'Law firms',
        'Nonprofit organizations and bond funds',
      ],
    },
    { kind: 'h2', text: 'What the sponsor will need' },
    {
      kind: 'list',
      items: [
        'A US passport, birth certificate, or green card',
        'The same spelling of their details on the document, the bank account, and the profile',
        'Readiness to pay by wire transfer',
      ],
    },
    { kind: 'h2', text: 'What they risk and what they do not' },
    {
      kind: 'list',
      items: [
        'The money comes back at the end of the case — to whoever paid',
        'That can take years: the timing depends on neither of you',
        'Receipt `I-305` is the document for the refund — keep it like money',
      ],
    },
    { kind: 'h2', text: 'How to ask' },
    {
      kind: 'p',
      text: 'There are usually only a few people with the right status around, and the request is a serious one — so it gets postponed until the last moment. Better to start the conversation before the day of the hearing.',
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Sample · adjust to your own words',
      body: [
        'I need to ask something serious. For a person to be released, the bond must be posted by a citizen or green card holder — I cannot do it myself. The money is returned after the case ends, but that can take a long time. I will understand any answer. May I explain how it works?',
      ],
    },
    { kind: 'h2', text: 'If there is no suitable person' },
    {
      kind: 'list',
      items: [
        'A nonprofit organization can act as the sponsor — for many people this is the only path',
        'Look for funds working in the facility’s state, and ask whether they take this facility',
        'Ask about the waiting list and the conditions',
        'Check the organization against the same registries as an attorney',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'The set of funds keeps changing',
      body: ['Some close. Make sure the organization is operating now.'],
    },
    { kind: 'ilink', page: 'bondpay', label: 'Paying the bond' },
  ],
}

export default c
