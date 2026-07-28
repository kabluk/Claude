import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Attorney',
  lede: 'Three paths, all legitimate. We show all of them — which one fits is decided by you and the people who know the case.',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'There is no court-appointed attorney',
      body: [
        'In immigration proceedings the government does not provide an attorney. Free help exists, but with waiting lists, and not everyone is taken.',
        'According to TRAC data for 2026, bond is granted three times more often with an attorney: 42% of hearings versus 14% without one.',
      ],
    },
    { kind: 'h2', text: 'Path 1 · Free' },
    {
      kind: 'list',
      items: [
        'The free-help list from EOIR — the service that runs the immigration courts',
        'The legal orientation program inside the facility itself',
        'Local nonprofit organizations — call several at once, there are queues everywhere',
        'Ask whether they take detained cases and whether they work with this facility',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.justice.gov/eoir/list-pro-bono-legal-service-providers',
      label: 'EOIR pro bono providers list',
    },
    { kind: 'ext', href: 'https://www.immigrationlawhelp.org', label: 'Directory of free and low-cost help' },
    {
      kind: 'p',
      dim: true,
      text: 'The consulate of one’s country must be notified of a citizen’s detention; the help can be substantial, but proof of kinship will be required. For Russian speakers this channel barely works in the US.',
    },
    { kind: 'h2', text: 'Path 2 · Accredited representative' },
    {
      kind: 'callout',
      tone: 'g',
      title: 'Not an attorney, but represents legally',
      body: [
        'DOJ accredited representatives are authorized to handle cases in immigration court. Often free or low cost. The most underrated path.',
        'They are checked against the official roster — the link is on the verification page.',
      ],
    },
    { kind: 'h2', text: 'Path 3 · Paid' },
    {
      kind: 'list',
      items: [
        'Before paying — the three-registry check, three minutes',
        'A written agreement is a must: what is included, what is not, how the price is calculated',
        'Ask about the retainer and the minimum billing unit — conversations with the family are billed too',
      ],
    },
    { kind: 'ilink', page: 'verify', label: 'Check who you are paying' },
    { kind: 'h2', text: 'You can search by language' },
    {
      kind: 'callout',
      tone: 'g',
      title: 'The practice is federal',
      body: [
        'An attorney licensed in any state can handle an immigration case in any state — entering the case is done with form `EOIR-28`.',
        'So you can search by language rather than by office location. The AILA directory has a language filter.',
      ],
    },
    { kind: 'ext', href: 'https://www.ailalawyer.com', label: 'AILA lawyer search · language filter' },
    {
      kind: 'ext',
      href: 'https://www.americanbar.org/groups/legal_services/flh-home/',
      label: 'ABA Free Legal Answers',
    },
  ],
}

export default c
