import { useI18n } from '../i18n/I18nContext.jsx'

// Persistent legal disclaimer shown at the bottom of every screen.
export default function Disclaimer() {
  const { t } = useI18n()
  return (
    <footer className="disclaimer">
      <div className="disclaimer__inner">
        <span className="disclaimer__icon" aria-hidden="true">
          ⚖
        </span>
        <p style={{ margin: 0 }}>
          <strong>Califormis</strong>
          {t.disclaimerBody}
        </p>
      </div>
    </footer>
  )
}
