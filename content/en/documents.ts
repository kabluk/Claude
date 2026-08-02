import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'What these papers mean',
  lede: 'This page works without internet. Save it.',
  blocks: [
    {
      kind: 'memcard',
      title: 'SAVE AND SHARE',
      lines: ['I am exercising my right to remain silent. I will not sign documents without an attorney.'],
      alts: [
        'Estoy ejerciendo mi derecho a guardar silencio. No firmaré documentos sin un abogado.',
        'Я пользуюсь правом хранить молчание. Я не буду подписывать документы без адвоката.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Take a screenshot of this card and share it on WhatsApp — it works without an account and without internet.',
    },
    { kind: 'h2', text: 'What each document does' },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Voluntary departure',
      body: [
        'Means agreeing to leave on your own and giving up the court hearing. After signing, the case does not go before a judge.',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Stipulated removal',
      body: ['Agreeing to a removal order without a hearing. A judge never reviews the case.'],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: '"Sign and you will get out faster"',
      body: [
        'This phrase appears regularly in accounts of detentions. Signing these documents ends the case; it does not speed up release.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'A detainer (ICE hold) — if the person is still in a local jail',
      body: [
        'A detainer is a request from ICE to a local jail to hold the person for up to 48 hours after they should have been released, so ICE can pick them up. It is a request, not a warrant.',
        'The jail is not required to honor it, and if ICE does not come within 48 hours (weekends and holidays count), the person must be released. This is a question for the criminal defense attorney.',
      ],
    },
    { kind: 'h2', text: 'What advocacy organizations publish' },
    {
      kind: 'p',
      dim: true,
      text: 'ACLU, FIRRP and ILRC publish the recommendation not to sign any document before speaking with an attorney, and to give only your name.',
    },
    { kind: 'ext', href: 'https://www.aclu.org', label: 'ACLU' },
    { kind: 'ext', href: 'https://firrp.org', label: 'FIRRP' },
    { kind: 'ext', href: 'https://www.ilrc.org', label: 'ILRC' },
    { kind: 'ilink', page: 'forms', label: 'Dictionary of forms and notices' },
  ],
}

export default c
