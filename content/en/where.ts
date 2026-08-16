import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'How to find him',
  metaTitle: 'How to find someone detained by ICE — locator by A-Number or name · DETNAV',
  metaDesc:
    'Step by step: searching the official ICE Online Detainee Locator by A-Number or by name and country of birth. Why a person may not appear right away and what to do if there is no result.',
  lede: 'The official system does the search. We explain how to use it and what the result means.',
  blocks: [
    { kind: 'h2', text: 'What you need' },
    {
      kind: 'list',
      items: [
        'The A-Number — the letter A and nine digits',
        'Or: first and last name, country of birth, date of birth',
      ],
    },
    { kind: 'tool', tool: 'anumber' },
    {
      kind: 'callout',
      tone: 'y',
      title: 'The name must match letter for letter',
      body: [
        'Many people find someone only on the third or fourth try: a different name order, a second surname, a different transliteration.',
        'The tool below builds spelling variants. Everything stays in this browser.',
      ],
    },
    { kind: 'tool', tool: 'namevariants' },
    { kind: 'ext', href: 'https://locator.ice.gov', label: 'Open the official locator', gate: true },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Empty does not mean he is not there',
      body: [
        'Records are entered with a delay: the system itself warns that a person may appear up to 72 hours after the arrest.',
        'An empty result in the first hours is common.',
      ],
    },
    { kind: 'h2', text: 'What the result means' },
    {
      kind: 'list',
      items: [
        '`In Custody` — found: the facility is shown, and visits and calls become concrete',
        '`Not in Custody` — released or deported within the last 60 days',
        'Empty — not found: a record update takes 20 minutes to 8 hours, plus initial processing at an ICE office of about a day',
      ],
    },
    { kind: 'h2', text: 'When the system will not show him' },
    {
      kind: 'list',
      items: [
        'In the first hours with the border agency a person is not visible; people held by CBP longer than 48 hours do appear in this same locator',
        'Minors do not appear in this locator',
        'During a transfer the record can disappear for several days',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'People are moved between states',
      body: [
        'Families are not notified. Someone can be flown across the country without warning, and the facility changes on its own.',
        'Check again even if you found him yesterday.',
      ],
    },
    { kind: 'h2', text: 'If the search finds nothing' },
    {
      kind: 'phones',
      entries: [
        {
          num: '1-888-351-4024',
          who: 'DRIL · official ICE line',
          note: 'locating a person, problems in detention, separation from a child · Mon–Fri 8:00–20:00 ET · Spanish available',
        },
        {
          num: '1-800-898-7180',
          who: 'National Detention Hotline',
          note: 'nonprofit, not governmental · contact with family, documenting violations',
        },
      ],
      footer: 'The first line is run by ICE. The second by a nonprofit organization. The choice is yours.',
    },
    { kind: 'h2', text: 'ICE office: where to go and where to check in' },
    {
      kind: 'p',
      text: 'If the person has been ordered to check in (ankle monitor, ISAP) or you need to know which office covers the area, find the nearest office by city or state.',
    },
    { kind: 'tool', tool: 'officefinder' },
    { kind: 'ilink', page: 'facilities', label: 'All ICE detention facilities — addresses by state' },
  ],
}

export default c
