import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Habeas corpus · federal court',
  lede: 'The path release is most often won through now. We explain how it works. An attorney prepares and files the petition — this is a map, not instructions for filing on your own.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: 'What it is',
      body: [
        'Habeas corpus is a petition to a federal district court: a judge examines whether the government is holding a person lawfully.',
        'It is a different system, not the immigration court. A federal judge does not answer to the agency: the judge can demand explanations from the government, order a release hearing — or order release.',
      ],
    },
    { kind: 'h2', text: 'Why everyone is talking about it now' },
    {
      kind: 'p',
      text: 'Since 2025 bond and parole are granted very rarely, and the center of gravity has shifted to the federal courts: in February 2026 about 2,000 habeas petitions were filed nationwide every week — a year earlier it was about 20. Federal judges across the spectrum schedule hearings and order releases when the petition is prepared well.',
    },
    {
      kind: 'p',
      text: 'Lawyers of AILA, the immigration attorneys association, put it plainly: for a growing number of detained people, habeas in federal court is in practice the only path to freedom.',
    },
    {
      kind: 'p',
      dim: true,
      text: 'As of July 2026. This is the overall picture, not a prediction for a specific case.',
    },
    { kind: 'h2', text: 'How it works' },
    {
      kind: 'list',
      items: [
        'The petition is filed in the federal district court for the place of detention — which is why it matters so much where the facility is',
        'A transfer to another state changes the court and the applicable rules — one more reason not to wait',
        'Together with the petition, the attorney can ask for an emergency court order against transfer or deportation (TRO)',
        'The judge can schedule a hearing, order release — or deny: the outcome depends on the specific case',
        'An attorney prepares and files the petition — this is work for a lawyer with federal practice',
      ],
    },
    { kind: 'h2', text: 'Your part — preparation' },
    {
      kind: 'list',
      items: [
        'The dossier of ties to the US: address, years of residence, family, work, community — the tasks for it are collected in the questionnaire',
        'The timeline: when and where the person was detained, when transferred, what papers were issued',
        'The A-Number and the exact name of the facility',
        'Medical documents, if there are conditions',
      ],
    },
    { kind: 'ilink', page: 'intake', label: 'Your task list' },
    { kind: 'ilink', page: 'docpack', label: 'Assemble the document package for the attorney' },
    { kind: 'h2', text: 'Questions for the attorney' },
    {
      kind: 'list',
      items: [
        'Whether habeas fits this case, and why',
        'Which federal circuit the facility is in and what that changes',
        'What is needed from the family, and by when',
        'What changes if the person is transferred to another state',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'What we do not do',
      body: [
        'We do not prepare or file petitions and we do not give legal advice. Only an attorney can determine whether this path applies to a specific case.',
        'If anyone other than an attorney with a verified license promises to "file habeas" and win a quick release for money — check them against the registries.',
      ],
    },
    { kind: 'ilink', page: 'attorney', label: 'Attorney: three paths' },
    { kind: 'ilink', page: 'verify', label: 'Check the attorney' },
  ],
}

export default c
