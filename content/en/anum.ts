import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Where to find the A-Number',
  metaTitle: 'What is an A-Number and where to find it (EAD, green card, NTA) · DETNAV',
  metaDesc:
    'The Alien Number is the nine-digit key to the ICE locator, the court and the attorney. Where it is printed: the work permit (EAD), the green card, the Notice to Appear, USCIS letters.',
  lede: 'It is the key to everything: the search, the attorney, court. It is probably already in your home.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: 'Format',
      body: [
        'The letter `A` and nine digits. Sometimes written with dashes or spaces.',
        'Eight digits is fine too: a zero is added at the front. The number is printed on the wristband.',
      ],
    },
    { kind: 'h2', text: 'Where to look at home' },
    {
      kind: 'list',
      items: [
        'Any letter from the immigration court or from USCIS — the agency that issues work permits and green cards',
        'A work permit, even an expired one',
        'Fee receipts, copies of old applications',
        'Papers from an earlier case, if there was one',
        'The folder of documents kept "just in case"',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Found a letter? Photograph it now',
      body: ['All pages. The number is almost certainly there, and paper gets lost.'],
    },
    { kind: 'h2', text: 'If there is nothing at home' },
    {
      kind: 'p',
      dim: true,
      text: 'The number can be asked for on the first call. How to make that call is on a separate page.',
    },
    { kind: 'ilink', page: 'firstcall', label: 'The first call' },
  ],
}

export default c
