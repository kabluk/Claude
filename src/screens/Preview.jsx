import { useNavigate } from 'react-router-dom'

const DOCS = [
  { code: 'FL-100', name: 'Petition — Marriage/Domestic Partnership', sub: 'Исковое заявление о расторжении брака' },
  { code: 'FL-110', name: 'Summons', sub: 'Судебная повестка' },
  { code: 'FL-105', name: 'Declaration Under UCCJEA', sub: 'Декларация по делам с детьми' },
  { code: 'FL-150', name: 'Income and Expense Declaration', sub: 'Декларация о доходах и расходах' },
  { code: 'FL-141', name: 'Declaration of Disclosure', sub: 'Декларация о раскрытии активов' },
]

export default function Preview() {
  const navigate = useNavigate()

  return (
    <section className="screen">
      <p className="screen__eyebrow">Шаг 5 из 6 · Пакет</p>
      <h1 className="screen__title">Превью пакета документов</h1>
      <p className="screen__lead">
        Состав судебного пакета на основе ваших ответов. После оплаты вы получите
        готовые к подаче PDF-формы с инструкцией.
      </p>

      <div
        className="preview-layout"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}
      >
        <div className="panel">
          <h2 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>
            Включённые формы
          </h2>
          <ul className="doc-list">
            {DOCS.map((d) => (
              <li key={d.code}>
                <span className="doc-code">{d.code}</span>
                <span className="doc-name">
                  {d.name}
                  <span>{d.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="summary">
          <div className="summary__row">
            <span>Подготовка форм</span>
            <span>$129</span>
          </div>
          <div className="summary__row">
            <span>Инструкция по подаче</span>
            <span>включено</span>
          </div>
          <div className="summary__row">
            <span>Чек-лист и поддержка</span>
            <span>включено</span>
          </div>
          <div className="summary__total">
            <span>Итого</span>
            <b>$129</b>
          </div>
          <button
            className="btn btn--primary btn--block"
            onClick={() => navigate('/cabinet')}
          >
            Оплатить и получить пакет
          </button>
          <p
            style={{
              fontSize: 12,
              color: 'rgba(247,244,238,0.55)',
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            Оплата — заглушка. Платёжный шлюз будет подключён позже.
          </p>
        </aside>
      </div>

      <div className="actions">
        <button className="btn btn--ghost" onClick={() => navigate('/calculator')}>
          ← Назад
        </button>
        <span />
      </div>
    </section>
  )
}
