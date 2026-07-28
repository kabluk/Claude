import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Check who you are paying',
  lede: 'Three government registries. The check takes three minutes and costs nothing.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: '1 · State bar association',
      body: [
        'Active license and no discipline on record. Each state has its own registry — search for "state bar" and the state name.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: '2 · DOJ accredited representatives',
      body: [
        'Not attorneys, but authorized to represent people in immigration court. Often free or low cost — this is legitimate help.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: '3 · EOIR disciplinary list',
      body: [
        'Who is barred from practicing before the immigration courts. EOIR is the office at the US Department of Justice that runs the immigration courts.',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.justice.gov/eoir/list-of-currently-disciplined-practitioners',
      label: 'EOIR disciplinary list',
    },
    {
      kind: 'ext',
      href: 'https://www.justice.gov/eoir/recognition-accreditation-roster-reports',
      label: 'Accredited representatives roster',
    },
    { kind: 'h2', text: 'Notario' },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Notario público ≠ lawyer',
      body: [
        'In Latin American countries a notario público is a trained legal professional. In the United States it is someone who witnesses signatures. They cannot represent anyone in immigration court.',
        'That difference in meaning between countries is the basis of the most common fraud.',
      ],
    },
    { kind: 'h2', text: 'Red flags' },
    {
      kind: 'list',
      items: [
        'A promise of release on a specific day',
        // upl-ok: описание красного флага обмана, не наше обещание
        'A guarantee of the case outcome',
        'Cash up front with no written agreement',
        'Refusing to give a license number',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: '"Out today with a petition already prepared"',
      body: [
        'A habeas petition requires the person to already be in custody, naming the specific facility. A pre-prepared petition for instant release does not exist.',
      ],
    },
  ],
}

export default c
