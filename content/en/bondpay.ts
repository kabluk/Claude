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
      title: '10–20% is non-refundable',
      body: [
        'A commercial bondsman usually keeps 10–20% of the bond amount permanently, usually plus an ankle monitor with a monthly fee.',
        'Example: on a `$75,000` bond the bondsman is paid around `$7,500–15,000`, and it is not refunded. Whoever posts the full amount themselves gets it back at the end of the case.',
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
    {
      kind: 'callout',
      tone: 'y',
      title: 'Far fewer people are released on bond',
      body: [
        'According to independent TRAC statistics, 2025 had the lowest share of granted bonds on record, and early 2026 is lower still: in April 2026, 755 people nationwide were released on bond.',
        'This is general statistics, not a prediction for a specific case. That is why other paths are prepared in parallel with bond — the attorney lists them.',
      ],
    },
    { kind: 'ilink', page: 'sponsor', label: 'Bond sponsor' },
  ],
}

export default c
