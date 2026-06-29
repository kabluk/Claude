// Persistent legal disclaimer shown at the bottom of every screen.
export default function Disclaimer() {
  return (
    <footer className="disclaimer">
      <div className="disclaimer__inner">
        <span className="disclaimer__icon" aria-hidden="true">
          ⚖
        </span>
        <p style={{ margin: 0 }}>
          <strong>Califormis</strong> — это software для самостоятельной подготовки
          документов. Мы не предоставляем юридических консультаций. Информация ≠
          юридический совет.
        </p>
      </div>
    </footer>
  )
}
