import type { UIStrings } from '@/lib/types'

const ui: UIStrings = {
  back: '← Back',
  listen: 'Listen to this page',
  stop: 'Stop',
  noSpeech: 'This browser cannot read aloud',
  allPages: 'All pages',
  disclaimer:
    'We are not attorneys and we do not give legal advice. This page has facts and links to official sources only.',
  updated: 'Information updated July 27, 2026. Rules change — check the date.',
  nav: {
    where: 'How to find him',
    anum: 'Where to find the A-Number',
    documents: 'What these papers mean',
    firstcall: 'The first call',
    verify: 'Check who you are paying',
    connect: 'Calls, money, letters',
    journey: 'The road',
    attorney: 'Attorney',
    sponsor: 'Bond sponsor',
    bondpay: 'Paying the bond',
    deadlines: 'Do not miss a hearing',
    intake: 'Your task list',
    'facility-adelanto': 'Adelanto',
    'state-ca': 'California',
    'state-tx': 'Texas',
    'state-la': 'Louisiana',
    orgs: 'For organizations',
    about: 'About',
    data: 'Your data',
    disclaimer: 'We are not lawyers',
  },
  navGroups: [
    { label: 'The first night', keys: ['intake', 'where', 'anum', 'documents', 'firstcall', 'verify'] },
    { label: 'The road and bond', keys: ['journey', 'connect', 'attorney', 'sponsor', 'bondpay', 'deadlines'] },
    { label: 'Directory', keys: ['state-ca', 'state-tx', 'state-la', 'facility-adelanto'] },
    { label: 'About', keys: ['orgs', 'about', 'data', 'disclaimer'] },
  ],
  iceGate: {
    title: 'You are about to open the ICE website',
    body: [
      'According to its own privacy notice, it records the IP address and domain of every visitor.',
      'We do not send it any data about you.',
    ],
    open: 'Open',
    ask: 'Ask another person to do this',
    askHint: 'Forward this address to someone who can run the search for you:',
  },
  nameVariants: {
    label: 'Spelling variants of the name — everything stays in this browser',
    placeholder: 'First and last name as you know them',
    hint: 'The name must match letter for letter. Use the checkboxes to mark variants you have tried.',
    // min-ok: подпись инструмента, данные не покидают браузер
  },
  aNumber: {
    label: 'Check the A-Number format',
    placeholder: 'Digits only, 8 or 9',
    copy: 'Copy',
    copied: 'Copied',
    hint: 'Eight digits is fine too: a zero is added at the front. The number is printed on the wristband — you can ask for it to be read aloud.',
  },
  printPage: 'Print this page',
  dirEmpty: 'No data yet. We do not publish phone numbers or addresses we have not verified.',
}

export default ui
