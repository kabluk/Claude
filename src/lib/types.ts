export type Lang = 'en' | 'es' | 'ru'
export const LANGS: Lang[] = ['en', 'es', 'ru']

export type Tone = 'r' | 'y' | 'g' | 'n'

// Весь текст живёт в content/ — компоненты рендерят эти структуры.
export type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string; dim?: boolean }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; title?: string; items: string[] }
  | { kind: 'fields'; title?: string; items: string[] }
  | { kind: 'callout'; tone: Tone; title: string; body: string[] }
  | { kind: 'ext'; href: string; label: string; gate?: boolean }
  | { kind: 'ilink'; page: string; label: string }
  | {
      kind: 'onward'
      next?: { page: string; label: string; desc?: string }
      related?: { page: string; label: string }[]
      sources?: { href: string; label: string; gate?: boolean }[]
    }
  | { kind: 'memcard'; title: string; lines: string[]; alts?: string[] }
  | { kind: 'phones'; entries: { num: string; who: string; note: string }[]; footer?: string }
  | { kind: 'kv'; rows: [string, string][] }
  | { kind: 'tool'; tool: 'namevariants' | 'anumber' | 'print' | 'docpack' | 'visitfinder' | 'docmap' }

export interface PageContent {
  title: string
  lede?: string
  blocks: Block[]
}

export interface HomeContent {
  title: string
  sub: string
  hub: {
    eyebrow: string
    cards: {
      tone: 'r' | 'n'
      label?: string
      title: string
      desc: string
      actions: { label: string; page: string; primary?: boolean }[]
    }[]
  }
  heroLead: string
  heroPoints: string[]
  demoLabel: string
  demoTaskLabel: string
  demoWhy: string
  scenarios: { q: string; h: string; a: string[]; pick: number; t: [string, string, string] }[]
  benefitsTitle: string
  benefits: { b: string; p: string }[]
  cta: string
  cta2: string
  trust: string[]
  stepsTitle: string
  steps: { b: string; p: string }[]
  dataTitle: string
  dataBig: { b: string; p1: string; p2: string }
  priceTitle: string
  freeTitle: string
  freeAmt: string
  freeItems: string[]
  paidTitle: string
  paidAmt: string
  paidItems: string[]
  priceNote: string
  limitsTitle: string
  limits: { b: string; p: string }[]
}

export interface JourneyContent {
  title: string
  lede: string
  soonLabel: string
  steps: { t: string; p: string; page?: string }[]
  tracksTitle: string
  tracks: { t: string; p: string }[]
  note: string
}

export interface UIStrings {
  back: string
  listen: string
  stop: string
  noSpeech: string
  allPages: string
  disclaimer: string
  updated: string
  nav: Record<string, string>
  navGroups: { label: string; keys: string[] }[]
  iceGate: {
    title: string
    body: string[]
    open: string
    ask: string
    askHint: string
  }
  nameVariants: {
    label: string
    placeholder: string
    hint: string
  }
  aNumber: {
    label: string
    placeholder: string
    copy: string
    copied: string
    hint: string
  }
  printPage: string
  dirEmpty: string
  browserOnly: string
  national: { title: string; median: string; removal: string; note: string }
  tabs: { home: string; tasks: string; docs: string; find: string }
  docMap: {
    title: string
    formLabel: string
    anum: string
    hearing: string
    court: string
    charges: string
    signature: string
    note: string
  }
  onward: {
    next: string
    related: string
    sources: string
  }
  visitFinder: {
    label: string
    placeholder: string
    inBase: string
    facilityPage: string
    notFoundTitle: string
    notFoundBody: string
    askTitle: string
    ask: string[]
    iceLabel: string
    drilNote: string
    fieldOfficeLabel: string
    circuitLabel: string
    circuits: Record<string, string>
    mandatoryWarn: string
    iceHours: string
    scheduleLink: string
    provenance: string
    moreResults: string
    stayTitle: string
    stayLine: string
    stayNote: string
  }
  docPack: {
    sections: Record<string, string>
    addPhoto: string
    processing: string
    labelPlaceholder: string
    remove: string
    pages: [string, string, string]
    anumLabel: string
    anumHint: string
    makePdf: string
    making: string
    empty: string
    share: string
    download: string
    print: string
    shareUnavailable: string
    deleteAll: string
    deleteAllConfirm: string
    storageNote: string
    readyTitle: string
    readyHint: string
    partLabel: string
    cover: {
      title: string
      date: string
      packet: string
      supplements: string
      noAnum: string
      toc: string
      missing: string
      missingNote: string
      pagesWord: string
      part: string
      footer: string
    }
  }
}

// Справочник: подписи и тексты страниц штата и учреждения.
// Данные — в data/*.json (публичные справочники, ничего чувствительного).
export interface DirectoryContent {
  circuitNames: Record<string, string>
  facility: {
    labels: { addr: string; phone: string; tablets: string; st: string; circuit: string; hours: string }
    warnByFacility: Record<string, { title: string; body: string[] }>
    lettersH2: string
    letters: string[]
    stateH2: string
  }
  statePage: {
    lede: string
    circuitLine: string
    courtsH2: string
    facilitiesH2: string
    helpH2: string
    helpLinks: { href: string; label: string }[]
    fundedLine: string
    verifyNote: string
  }
}

// Опрос: текст по языку, логика в src/lib/intake.ts
type RoleText = string | { self: string; other: string }
export interface IntakeOption {
  t: RoleText
  s?: string
  d?: boolean
}
export interface IntakeQuestion {
  bn: string
  q: string | { self: string; other: string }
  hint?: string
  o: Record<string, IntakeOption>
}
export interface IntakeTask {
  ev?: boolean
  h: string
  p: string
  why?: string
  how?: string[]
  src?: [string, string][]
  info?: string
  say?: string
  form?: string
  warn?: string
  pages?: string[]
}
export interface IntakeContent {
  ui: {
    done: string
    reassure: string
    backBtn: string
    nextBtn: string
    resultEyebrow: string
    resultTitle: string
    resultHint: string
    resultIntro: string
    moreLabel: string
    groups: { now: string; soon: string; later: string }
    whyPrefix: string
    sections: { why: string; how: string; src: string; info: string; say: string; sayTag: string; form: string; warn: string }
    evBadge: string
    evNote: { h: string; p: string }
    zoneBNote: { h: string; p: string }
    printBtn: string
    againBtn: string
    foot: string
  }
  questions: Record<string, IntakeQuestion>
  tasks: Record<string, IntakeTask>
  reasons: Record<string, string>
}
