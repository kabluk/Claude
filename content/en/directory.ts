import type { DirectoryContent } from '@/lib/types'

const c: DirectoryContent = {
  circuitNames: {
    '1': 'First',
    '2': 'Second',
    '3': 'Third',
    '4': 'Fourth',
    '5': 'Fifth',
    '6': 'Sixth',
    '7': 'Seventh',
    '8': 'Eighth',
    '9': 'Ninth',
    '10': 'Tenth',
    '11': 'Eleventh',
    DC: 'D.C. Circuit',
  },
  facility: {
    labels: {
      addr: 'Address',
      phone: 'Phone',
      tablets: 'Tablets',
      st: 'State',
      circuit: 'Appellate circuit',
      hours: 'Hours',
    },
    warnByFacility: {
      adelanto: {
        title: 'The address gets confused',
        body: ['Other sites list a different street number. The official mailing address is the one above.'],
      },
    },
    lettersH2: 'Letters and postcards',
    letters: [
      'A plain postcard by regular mail arrives more reliably than any service',
      'Books: new only, shipped directly by the seller',
      'Softcover: hardcovers take longer to screen and are often refused',
      'The A-Number is required on the envelope',
    ],
    stateH2: 'State page',
  },
  statePage: {
    lede: 'Courts, facilities and free help — by state.',
    circuitLine: 'Appellate circuit',
    courtsH2: 'Immigration courts',
    facilitiesH2: 'Facilities',
    helpH2: 'Free help',
    helpLinks: [
      {
        href: 'https://www.justice.gov/eoir/list-pro-bono-legal-service-providers',
        label: 'EOIR pro bono providers list',
      },
      { href: 'https://www.freedomforimmigrants.org', label: 'Freedom for Immigrants map of facilities and resources' },
      { href: 'https://www.immigrationlawhelp.org', label: 'Directory of free and low-cost help' },
    ],
    fundedLine: 'This state has funded representation programs — see the lists below.',
    verifyNote: 'Lists and phone numbers change. Last checked July 27, 2026.',
  },
  dirFacility: {
    metaTitle: '{name} ({city}, {st}) — find a detainee, mail, typical stay · DETNAV',
    metaDesc:
      '{name} in {city}, {st}: mailing address, how to find a detained person in the ICE locator, staying in touch, and how long people are typically held. Free, in three languages.',
    lede: 'ICE detention facility in {city}, {st}. How to find a person, where to write, and what to do next.',
    countyLabel: 'County',
    officeLabel: 'ICE office',
    zipLabel: 'ZIP',
    findH2: 'Someone may be held here — what to do',
    findLinks: [
      { page: 'where', label: 'Find a person in the ICE locator' },
      { page: 'firstcall', label: 'The first call: what to ask, what not to say' },
      { page: 'visit', label: 'Visiting: the rules and what to bring' },
      { page: 'connect', label: 'Calls, messages, and money on the account' },
    ],
    sourceNote:
      'Address and assignment come from ICE data compiled by the Deportation Data Project (June 2026). Phones and hours are not published here — confirm them on the official ICE page or by calling the facility.',
  },
  dirIndex: {
    title: 'ICE facilities',
    metaTitle: 'List of ICE detention centers by state — addresses and how to find a detainee · DETNAV',
    metaDesc:
      'Every ICE detention facility from official data: addresses, states, appellate circuits. How to find a detained person and stay in touch. Free, EN/ES/RU.',
    lede: 'Detention facilities from official ICE data — by state. Each has an address, mail rules, and typical stay lengths.',
    note: 'The list is built from ICE data (Deportation Data Project, June 2026). A facility may have opened or closed after that date.',
  },
}

export default c
