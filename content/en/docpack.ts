import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Document package for the attorney',
  lede: 'You photograph the documents — you get one clean PDF with a cover page and a table of contents. Everything happens in this browser: the files never go to any server.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: 'Why this matters',
      body: [
        'An attorney who receives forty unlabeled photos spends hours sorting them — and the family pays for those hours. The same package with a cover page and a table of contents takes minutes.',
        'The cover page builds itself: what is inside by section, what is still missing, the date and the package number.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Do not wait until you have everything',
      body: [
        'Half of the documents today is more useful to the attorney than everything in a month. The package has a number: the next one simply supplements this one.',
      ],
    },
    { kind: 'tool', tool: 'docpack' },
    { kind: 'h2', text: 'How it works' },
    {
      kind: 'list',
      items: [
        'Every photo is compressed right in the browser — thirty pages take about 10 MB and pass through any email',
        'The photos are stored only in this browser, on this device. We do not see them and do not receive them',
        'Pages are grouped by dossier section, and each one can be labeled: what it is and which year it covers',
        'The PDF is named by A-Number and date, without the person’s name',
        'A large package is automatically split into parts: email does not accept files over 25 MB',
        'After sending, the photos can be deleted from the browser with one button',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'What we do not do',
      body: [
        'We do not send the files ourselves and we do not store them: the "Share" button opens your phone’s own menu, and the package travels by your email or messenger. What a specific case needs is determined by the attorney.',
      ],
    },
    { kind: 'ilink', page: 'intake', label: 'The task list: which documents to collect' },
    { kind: 'ilink', page: 'attorney', label: 'Attorney: three paths' },
  ],
}

export default c
