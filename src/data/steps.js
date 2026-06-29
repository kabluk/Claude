// Cross-cutting flow: «Шаг X из 6».
// Each screen maps to one global step. Order defines navigation.
export const STEPS = [
  { n: 1, key: 'case-type', path: '/', short: 'Тип дела', label: 'Тип дела' },
  { n: 2, key: 'county', path: '/county', short: 'Округ', label: 'Округ и дети' },
  { n: 3, key: 'wizard', path: '/wizard', short: 'Интервью', label: 'Интервью' },
  { n: 4, key: 'calculator', path: '/calculator', short: 'Алименты', label: 'Калькулятор' },
  { n: 5, key: 'preview', path: '/preview', short: 'Пакет', label: 'Пакет и оплата' },
  { n: 6, key: 'cabinet', path: '/cabinet', short: 'Кабинет', label: 'Личный кабинет' },
]

export const stepByPath = (path) => STEPS.find((s) => s.path === path) || STEPS[0]
export const nextStep = (n) => STEPS.find((s) => s.n === n + 1)
export const prevStep = (n) => STEPS.find((s) => s.n === n - 1)
