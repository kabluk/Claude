import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Bond granted · how to pay',
  lede: 'The mechanics of the money, without judgments: who pays, through what, what to keep. As of July 27, 2026.',
  blocks: [
    { kind: 'h2', text: 'Amounts' },
    {
      kind: 'list',
      items: [
        'The legal minimum is `$1,500`; judges usually set more',
        'The costs after that are monthly, not one-time: calls, commissary, travel for visits',
      ],
    },
    { kind: 'h2', text: 'How it is paid' },
    {
      kind: 'list',
      items: [
        'A US citizen or green card holder pays through the `CeBONDS` system, form `I-352`',
        'Payment by `Fedwire` or `ACH`',
        'Actual release takes time after payment — from hours to days',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Keep the I-305',
      body: [
        'Receipt `I-305` is the document for getting the money back. Without it there is no refund.',
        'The refund comes at the end of the case, to whoever paid. That can be years. The refund request is form `I-391`.',
      ],
    },
    { kind: 'h2', text: 'Bondsmen' },
    {
      kind: 'callout',
      tone: 'y',
      title: '15–20% is non-refundable',
      body: [
        'A commercial bondsman keeps 15–20% of the bond amount permanently, usually plus an ankle monitor with a monthly fee.',
        'That is the structure of their service, not a judgment. Compare terms in writing.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'The right to a bond hearing is currently disputed',
      body: [
        'The answer depends on the circuit where the person is held, and changes with a transfer. This is the first question for the attorney — before looking for money or a sponsor.',
      ],
    },
    { kind: 'ilink', page: 'sponsor', label: 'Bond sponsor' },
  ],
}

export default c
