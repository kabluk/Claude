import ScreenNav from '../components/ScreenNav.jsx'

// Support calculator — stub only (no formula yet).
export default function Calculator() {
  return (
    <section className="screen">
      <p className="screen__eyebrow">Шаг 4 из 6 · Расчёт</p>
      <h1 className="screen__title">Калькулятор алиментов</h1>
      <p className="screen__lead">
        Предварительная оценка алиментов на детей и супруга по гайдлайнам
        Калифорнии. Сейчас это заглушка — расчётная модель появится позже.
      </p>

      <div className="calc">
        <div className="panel">
          <div className="field">
            <label className="field__label">Ваш месячный доход (брутто)</label>
            <input type="number" placeholder="0" disabled />
          </div>
          <div className="field">
            <label className="field__label">Доход второго супруга</label>
            <input type="number" placeholder="0" disabled />
          </div>
          <div className="field">
            <label className="field__label">Число детей</label>
            <input type="number" placeholder="0" disabled />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field__label">Доля времени с детьми</label>
            <input type="text" placeholder="напр. 50%" disabled />
          </div>
          <span className="stub-badge" style={{ marginTop: 18 }}>
            Поля неактивны
          </span>
        </div>

        <div className="calc__result">
          <span className="stub-badge">Заглушка</span>
          <div className="calc__amount">$ —</div>
          <p className="calc__note">
            Здесь будет ориентировочная сумма ежемесячных алиментов. Расчёт по
            формуле California Guideline (раздел Family Code §4055) будет добавлен
            на следующем этапе.
          </p>
        </div>
      </div>

      <ScreenNav current={4} nextLabel="К пакету документов" />
    </section>
  )
}
