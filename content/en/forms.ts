import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Forms and notices: what they are',
  lede: 'A short dictionary of the papers handed out at detention and in court. Only “what it is,” no advice. Show any of them to an attorney.',
  blocks: [
    {
      kind: 'callout',
      tone: 'y',
      title: 'An ICE warrant is usually administrative, not judicial',
      body: [
        'A warrant for arrest (form `I-200`) is signed by an ICE officer, not a judge. Advocacy organizations (ACLU, NILC) explain: such a warrant does not give the right to enter a home without consent — unlike a judicial warrant, which a court judge signs.',
        'You check by the signature: a judicial warrant has a judge’s signature and a court name. You can ask for the document to be shown through a window or slid under the door.',
      ],
    },
    { kind: 'tool', tool: 'docmap' },
    { kind: 'h2', text: 'Common papers' },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-862 · Notice to Appear (NTA)',
      body: [
        'The document with which the government starts a removal case in immigration court. It lists allegations about the person and the charges. It may show the date of the first hearing; if not, the court sends a separate Notice of Hearing.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-200 · Warrant for Arrest',
      body: ['An administrative ICE warrant for detention (see the box above — it is not judicial).'],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-205 · Warrant of Removal',
      body: ['Issued once a final order of removal has already been entered in the case.'],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-286 · Notice of Custody Determination',
      body: [
        'ICE’s decision on whether to keep the person in custody. A bond amount may be stated here, if one was set.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-220A · Order of Release on Recognizance',
      body: [
        'Conditional release from custody, with the obligation to attend all hearings and comply with the conditions.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'EOIR-33 · Change of Address',
      body: [
        'The court form to report a new address within 5 business days of moving. Missing this notice is a common reason a person misses a hearing.',
      ],
    },
    {
      kind: 'onward',
      sources: [
        { href: 'https://www.justice.gov/eoir/eoir-forms', label: 'Official court forms (EOIR)' },
        { href: 'https://respondentaccess.eoir.justice.gov/en/forms/eoir33ic/', label: 'EOIR-33 · change of address online' },
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'We do not interpret your papers and we do not give advice. What a specific document means and what to do about it is determined only by an attorney.',
    },
    { kind: 'ilink', page: 'documents', label: 'What not to sign' },
    { kind: 'ilink', page: 'deadlines', label: 'Do not miss a hearing' },
  ],
}

export default c
