import type { DirectoryContent } from '@/lib/types'

const c: DirectoryContent = {
  circuitNames: { '2': 'Second', '5': 'Fifth', '9': 'Ninth', '11': 'Eleventh' },
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
}

export default c
