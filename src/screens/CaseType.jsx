import { useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'

const CASES = [
  {
    key: 'uncontested',
    icon: '🤝',
    title: 'Развод по согласию',
    desc: 'Оба супруга согласны с условиями. Минимум форм, упрощённый порядок.',
    meta: 'Uncontested Dissolution',
  },
  {
    key: 'contested',
    icon: '⚖',
    title: 'Спорный развод',
    desc: 'Есть разногласия по имуществу, опеке или содержанию. Полный пакет форм.',
    meta: 'Contested Dissolution',
  },
  {
    key: 'support-only',
    icon: '💵',
    title: 'Только алименты',
    desc: 'Установление или изменение алиментов на детей либо супруга.',
    meta: 'Support Only',
  },
]

export default function CaseType() {
  const [selected, setSelected] = useState(null)

  return (
    <section className="screen">
      <p className="screen__eyebrow">Шаг 1 из 6 · Начало</p>
      <h1 className="screen__title">С чего начнём ваше дело?</h1>
      <p className="screen__lead">
        Выберите тип дела о разводе в Калифорнии. От этого зависит набор судебных
        форм и порядок их подачи.
      </p>

      <div className="grid grid--3">
        {CASES.map((c) => (
          <button
            key={c.key}
            className={`option-card ${selected === c.key ? 'is-selected' : ''}`}
            onClick={() => setSelected(c.key)}
          >
            <span className="option-card__icon" aria-hidden="true">
              {c.icon}
            </span>
            <h2 className="option-card__title">{c.title}</h2>
            <p className="option-card__desc">{c.desc}</p>
            <span className="option-card__meta">{c.meta}</span>
          </button>
        ))}
      </div>

      <ScreenNav current={1} nextDisabled={!selected} />
    </section>
  )
}
