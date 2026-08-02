import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'If something is wrong in detention',
  lede: 'Mistreatment, denied medication, missing belongings — these are documented and complained about. In 2026 government oversight has been sharply cut, so the main thing is to record and to lean on organizations and the attorney.',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'A threat to life or urgent medical need',
      body: [
        'If the person is in immediate danger or is being denied urgent medical care — call the line below right away and tell the attorney. It can become part of a federal habeas petition.',
      ],
    },
    { kind: 'h2', text: 'What to do, step by step' },
    {
      kind: 'steps',
      items: [
        'Write everything down: date, time, what happened, staff names, who saw it.',
        'Call the free Freedom for Immigrants line — they help document violations.',
        'Tell the attorney: conditions and denied medical care can affect the case and a federal petition.',
        'If you wish, file an official complaint with DHS (channels below).',
      ],
    },
    {
      kind: 'callout',
      tone: 'g',
      title: '9233# — a free line from inside',
      body: [
        'Dialing `9233#` from a facility phone reaches the Freedom for Immigrants line. ICE does not monitor it; volunteers speak many languages and help document a violation and connect you with advocates.',
      ],
    },
    { kind: 'h2', text: 'Official channels' },
    {
      kind: 'phones',
      entries: [
        {
          num: '1-800-323-8603',
          who: 'DHS OIG — Inspector General',
          note: 'complaints of abuse, neglect, and mistreatment',
        },
      ],
      footer: 'The DHS Office for Civil Rights and Civil Liberties (CRCL) takes complaints about conditions online — link below.',
    },
    {
      kind: 'ext',
      href: 'https://www.dhs.gov/file-civil-rights-complaint',
      label: 'File a civil rights complaint (CRCL)',
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Honestly about oversight in 2026',
      body: [
        'The Office of the Immigration Detention Ombudsman (OIDO) has closed and the civil rights office has been cut. Do not count on a fast government response.',
        'That is why documentation and the attorney matter most: the facts you collect work in federal court and in the hands of advocacy organizations.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'We do not file complaints for you and we do not give legal advice. We show where people turn and what is important to record.',
    },
    { kind: 'ilink', page: 'attorney', label: 'Attorney: three paths' },
    { kind: 'ilink', page: 'habeas', label: 'Habeas corpus · federal court' },
  ],
}

export default c
