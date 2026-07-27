import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Do not miss a hearing',
  lede: 'A missed hearing is the most common irreversible loss. And almost always — because of a change of address.',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'Absent — the case is decided without him',
      body: [
        'If a person does not appear at a scheduled hearing, the judge can issue a removal order in absentia.',
        'Most often this happens not because of flight, but because of a move: the notice goes to the old address.',
      ],
    },
    { kind: 'h2', text: 'What to do' },
    {
      kind: 'list',
      items: [
        'Check the hearing date in the official system — by A-Number',
        'Set reminders 14, 3, and 1 day ahead',
        'After a move, file the change of address with the court on its own form, `EOIR-33`',
        'Keep the proof of filing',
      ],
    },
    { kind: 'ext', href: 'https://acis.eoir.justice.gov', label: 'Check the hearing date' },
    { kind: 'ext', href: 'https://www.justice.gov/eoir/form-eoir-33', label: 'Change of address form EOIR-33' },
    {
      kind: 'callout',
      tone: 'y',
      title: 'The court’s change of address is separate from everything else',
      body: [
        'Notifying the postal service, the bank, or USCIS does not change the address at the immigration court. The court gets its own form.',
      ],
    },
  ],
}

export default c
