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
        'Since July 2025 the government’s position is that a person who entered the country without inspection is subject to mandatory detention and gets no bond. The appellate circuits split: the Second, Third and Sixth are for hearings; the Fifth (Texas, Louisiana, Mississippi) and the Eighth are for mandatory detention. The Supreme Court will take up the question in October 2026.',
        'The answer depends on where the person is held, and it changes with a transfer. Only an attorney can determine whether this applies to a specific person — ask that question first.',
        'This describes the state of the dispute as of July 28, 2026 — it moves fast, check the date.',
      ],
    },
    { kind: 'h2', text: 'Who can post bond' },
    {
      kind: 'list',
      items: [
        'A US citizen or green card holder, 18 or older',
        'Law firms',
        'Nonprofit organizations and bond funds',
        'Commercial bond companies — for a non-refundable percentage',
      ],
    },
    { kind: 'h2', text: 'Two ways to post the money' },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Path 1 · The full amount personally',
      body: [
        'A citizen or green card holder posts the full amount through `CeBONDS`. The money is returned at the end of the case to whoever paid — that can take years.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Path 2 · Through a bondsman',
      body: [
        'A commercial company posts the bond for the client. A percentage of the amount is paid — usually 10–20% — and that money is not refunded. An ankle monitor with a monthly fee is usually added.',
        'Example: a `$75,000` bond — the bondsman is paid around `$7,500–15,000` permanently, or someone close posts the full `$75,000` themselves and gets it back at the end of the case.',
        'We do not say which path is better — we show how both work. Requirements differ between companies; compare terms in writing.',
      ],
    },
    { kind: 'h2', text: 'What the person posting it will need' },
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
        'I need to ask something serious. For a person to be released, the bond must be posted by a citizen or green card holder — I cannot do it myself. The money is returned after the case ends, but that can take a long time. If the full amount is too much, there is a path through a bond company: then only a percentage is paid, but it is not refunded. I will understand any answer. May I explain how it works?',
      ],
    },
    { kind: 'h2', text: 'If there is no suitable person' },
    {
      kind: 'list',
      items: [
        'A nonprofit organization can post the bond — for many people this is the only path',
        'Look for funds working in the facility’s state, and ask whether they take this facility',
        'Ask about the waiting list and the conditions',
        'The second path is a bondsman for a non-refundable percentage; every company has its own requirements',
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
