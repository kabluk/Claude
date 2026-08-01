import type { PageContent } from '@/lib/types'

export const about: PageContent = {
  title: 'About',
  lede: 'DETNAV is a map for the families of people detained by US immigration authorities, and for those preparing in advance.',
  blocks: [
    {
      kind: 'p',
      text: 'The principle is a map, not a navigator. We show the paths that exist and explain the mechanics of each. We never say "go this way": choosing the path belongs to the person and their attorney.',
    },
    { kind: 'h2', text: 'What we do not do' },
    {
      kind: 'list',
      items: [
        'We do not give legal advice and do not assess situations',
        'We do not recommend specific attorneys — we show the government registries',
        'We do not draft legal documents — we explain and point to the official form',
      ],
    },
    { kind: 'h2', text: 'Three languages' },
    {
      kind: 'p',
      text: 'English, Spanish and Russian are equal from the first screen. Every page exists in all three languages.',
    },
    { kind: 'ilink', page: 'data', label: 'Your data' },
    { kind: 'ilink', page: 'disclaimer', label: 'We are not lawyers' },
  ],
}

export const data: PageContent = {
  title: 'Your data',
  lede: 'A short page, because there is nothing to store.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: 'We store nothing about you',
      body: [
        'Questionnaire answers, photos of documents and your task list stay on your phone. They are never sent to our server — not one word, not one file.',
        'So we have nothing to lose, nothing to sell and nothing to hand over on request.',
      ],
    },
    { kind: 'h2', text: 'How it works' },
    {
      kind: 'list',
      items: [
        'No accounts and no registration',
        'No analytics — no counters, no pixels, no third-party scripts',
        'The questionnaire runs entirely in the browser: close the tab — nothing remains',
        'The only external requests are fonts',
        'Following external links does not tell those sites where you came from',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'The ICE website, by its own notice, records visitors’ IP addresses — we warn about this with a separate screen before you go there.',
    },
  ],
}

export const disclaimer: PageContent = {
  title: 'We are not lawyers',
  blocks: [
    {
      kind: 'p',
      text: 'We are not attorneys and we do not give legal advice. Everything on this site is reference information: facts, the mechanics of processes, and links to official sources.',
    },
    {
      kind: 'list',
      items: [
        'We do not assess your situation and do not predict outcomes',
        'The task lists organize everyday matters and document gathering — they are not a legal position',
        'Text samples are everyday correspondence; we do not draft legal documents',
        'Rules change — pages carry the date they were last checked',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Questions about your case belong to an attorney or a DOJ accredited representative. How to check them is on the verification page.',
    },
    { kind: 'ilink', page: 'verify', label: 'Check the attorney' },
  ],
}
