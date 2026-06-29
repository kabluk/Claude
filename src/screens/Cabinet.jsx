import { useNavigate } from 'react-router-dom'

const CHECKLIST = [
  'Распечатать все формы в одном экземпляре + 2 копии',
  'Подписать там, где отмечено маркером',
  'Подать в канцелярию суда вашего округа',
  'Оплатить судебный сбор (filing fee)',
  'Вручить копии второму супругу (service of process)',
]

export default function Cabinet() {
  const navigate = useNavigate()

  return (
    <section className="screen">
      <p className="screen__eyebrow">Шаг 6 из 6 · Готово</p>
      <h1 className="screen__title">Личный кабинет</h1>
      <p className="screen__lead">
        Ваш пакет готов. Скачайте документы, изучите инструкцию по подаче и
        пройдите по чек-листу. Все функции — заглушки на этапе каркаса.
      </p>

      <div className="cabinet-grid">
        <div className="cab-card">
          <span className="cab-card__icon">📄</span>
          <h3>Скачать PDF</h3>
          <p>Полный пакет судебных форм, заполненный по вашим ответам.</p>
          <button className="btn btn--dark btn--block">Скачать пакет (.pdf)</button>
        </div>

        <div className="cab-card">
          <span className="cab-card__icon">📘</span>
          <h3>Инструкция</h3>
          <p>Пошаговое руководство по подаче документов в суд вашего округа.</p>
          <button className="btn btn--ghost btn--block">Открыть инструкцию</button>
        </div>

        <div className="cab-card">
          <span className="cab-card__icon">✅</span>
          <h3>Чек-лист</h3>
          <ul className="checklist">
            {CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn--ghost" onClick={() => navigate('/preview')}>
          ← Назад
        </button>
        <button className="btn btn--primary" onClick={() => navigate('/')}>
          Новое дело →
        </button>
      </div>
    </section>
  )
}
