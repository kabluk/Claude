import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { countyBySlug, ALL_COUNTIES } from '../data/counties.js'
import { PRICING } from '../config/pricing.js'

const PRICE = PRICING.essentials // landing "from" price (Essentials tier)

// Locales the county landing has CONTENT for → drives the hreflang cluster
// (see useSeo). Add a code here only when that county content is translated;
// the hreflang tags are generated from this list, never hardcoded per language.
const COUNTY_LOCALES = ['en', 'es']

// Bilingual page chrome (county landing has its own EN/ES toggle).
const UI = {
  en: {
    lang: 'EN',
    brandTag: 'California Divorce Forms',
    eyebrow: 'California Divorce — Self-Service',
    heroTitle: (c) => `Divorce in ${c} County, California`,
    heroLead:
      'Prepare your California divorce forms yourself — guided step by step, in plain language. Official Judicial Council forms, ready to file.',
    from: 'from',
    cta: 'Start your divorce',
    ctaHow: 'See how it works',
    diff: 'How divorce differs in this county',
    court: 'Your court',
    courtNote: 'File at the courthouse assigned to your ZIP code.',
    cost: 'Cost to file',
    filingFee: 'Filing fee (first appearance)',
    feeWaiver: 'Can’t afford it? Fee waiver',
    feeWaiverVia: (f) => `Request a waiver with form ${f}.`,
    localForms: 'Local forms for this county',
    how: 'How to file',
    timeline: 'How long it takes',
    timelineText:
      'California law requires a minimum of 6 months from the date your spouse is served before a divorce can be final — even when both spouses agree.',
    spanish: 'Available in Spanish',
    spanishText:
      'The whole process — interview, field explanations, and checklist — is available in Spanish. Court forms are filed in English (translation is provided for your understanding).',
    faq: 'Frequently asked questions',
    trust: 'Why Califormis',
    trustItems: [
      ['Official forms', 'We fill the current Judicial Council PDFs — not look-alikes.'],
      ['Plain language', 'Every field is explained with examples, in your language.'],
      ['You stay in control', 'No lawyer required. Review everything before you file.'],
      ['Fee-waiver ready', 'If money is tight, we prepare form FW-001 so you can ask the court to waive the filing fee.'],
    ],
    ctaFinal: (c) => `Ready to start your ${c} County divorce?`,
    ctaFinalLead: 'Answer a few guided questions — we prepare the forms.',
    soon: 'Detailed local information for this county is coming soon.',
    otherCounties: 'Other counties',
    copies: 'copies/sets',
    efilingYes: 'e-filing available',
    efilingNo: 'paper filing accepted',
    disclaimer:
      'Califormis is software for self-service document preparation. We do not provide legal advice. Information ≠ legal advice.',
    steps: (c) => [
      'Answer the guided interview and generate your Judicial Council forms.',
      `Print ${c.copies_needed} sets and sign where marked.`,
      `File with the court (in person or by mail${c.efiling_required ? ', or e-file' : ''}) and pay the $${c.filing_fee} fee — or request a waiver (${c.fee_waiver_form}).`,
      'Serve the Summons and Petition on your spouse, then file proof of service.',
    ],
  },
  es: {
    lang: 'ES',
    brandTag: 'Formularios de Divorcio de California',
    eyebrow: 'Divorcio en California — Autoservicio',
    heroTitle: (c) => `Divorcio en el condado de ${c}, California`,
    heroLead:
      'Prepare usted mismo sus formularios de divorcio de California — guiado paso a paso, en lenguaje sencillo. Formularios oficiales del Consejo Judicial, listos para presentar.',
    from: 'desde',
    cta: 'Comenzar mi divorcio',
    ctaHow: 'Ver cómo funciona',
    diff: 'En qué se diferencia el divorcio en este condado',
    court: 'Su tribunal',
    courtNote: 'Presente en el tribunal asignado según su código postal.',
    cost: 'Costo de presentación',
    filingFee: 'Tasa de presentación (primera comparecencia)',
    feeWaiver: '¿No puede pagarla? Exención de tasas',
    feeWaiverVia: (f) => `Solicite una exención con el formulario ${f}.`,
    localForms: 'Formularios locales de este condado',
    how: 'Cómo presentar',
    timeline: 'Cuánto tarda',
    timelineText:
      'La ley de California exige un mínimo de 6 meses desde que se notifica a su cónyuge antes de que el divorcio sea definitivo, incluso si ambos están de acuerdo.',
    spanish: 'Disponible en español',
    spanishText:
      'Todo el proceso — la entrevista, las explicaciones de los campos y la lista de verificación — está disponible en español. Los formularios se presentan en inglés (la traducción se ofrece para su comprensión).',
    faq: 'Preguntas frecuentes',
    trust: 'Por qué Califormis',
    trustItems: [
      ['Formularios oficiales', 'Rellenamos los PDF vigentes del Consejo Judicial, no imitaciones.'],
      ['Lenguaje sencillo', 'Cada campo se explica con ejemplos, en su idioma.'],
      ['Usted tiene el control', 'Sin abogado. Revise todo antes de presentar.'],
      ['Exención de tasas', 'Si el dinero es limitado, preparamos el formulario FW-001 para solicitar al tribunal la exención de la tasa.'],
    ],
    ctaFinal: (c) => `¿Listo para comenzar su divorcio en el condado de ${c}?`,
    ctaFinalLead: 'Responda unas preguntas guiadas — preparamos los formularios.',
    soon: 'La información local detallada de este condado estará disponible pronto.',
    otherCounties: 'Otros condados',
    copies: 'copias/juegos',
    efilingYes: 'presentación electrónica disponible',
    efilingNo: 'se acepta presentación en papel',
    disclaimer:
      'Califormis es software para la preparación autónoma de documentos. No ofrecemos asesoría legal. Información ≠ asesoría legal.',
    steps: (c) => [
      'Responda la entrevista guiada y genere sus formularios del Consejo Judicial.',
      `Imprima ${c.copies_needed} juegos y firme donde esté marcado.`,
      `Presente ante el tribunal (en persona o por correo${c.efiling_required ? ', o electrónicamente' : ''}) y pague la tasa de $${c.filing_fee} — o solicite una exención (${c.fee_waiver_form}).`,
      'Notifique la Citación y la Petición a su cónyuge y presente la prueba de notificación.',
    ],
  },
}

// Set SEO <title>/meta + FAQ JSON-LD; clean up on unmount/lang change.
function useSeo(county, lang) {
  useEffect(() => {
    if (!county) return
    const name = county.name
    const title =
      lang === 'es'
        ? `Divorcio en el condado de ${name}, California | Califormis`
        : `Divorce in ${name} County, California | Califormis`
    const desc =
      lang === 'es'
        ? `Cómo divorciarse en el condado de ${name}: tribunal, costo de presentación ($${county.filing_fee}), formularios y plazos. Prepare los formularios oficiales usted mismo.`
        : `How to file for divorce in ${name} County, California: court, filing fee ($${county.filing_fee}), forms, and timeline. Prepare the official forms yourself.`

    const prevTitle = document.title
    document.title = title
    document.documentElement.lang = lang

    const tags = []
    const meta = (attr, key, content) => {
      const el = document.createElement('meta')
      el.setAttribute(attr, key)
      el.setAttribute('content', content)
      document.head.appendChild(el)
      tags.push(el)
    }
    meta('name', 'description', desc)
    meta('property', 'og:title', title)
    meta('property', 'og:description', desc)
    meta('property', 'og:type', 'website')

    const base = `https://califormis.example/california/${county.slug}`
    const canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    canonical.setAttribute('href', base)
    document.head.appendChild(canonical)
    tags.push(canonical)

    // hreflang cluster — built from the locale list (COUNTY_LOCALES), never
    // hardcoded per-language. Extend COUNTY_LOCALES as county content is
    // translated so the cluster grows without touching this code.
    const alt = (hreflang, href) => {
      const el = document.createElement('link')
      el.setAttribute('rel', 'alternate')
      el.setAttribute('hreflang', hreflang)
      el.setAttribute('href', href)
      document.head.appendChild(el)
      tags.push(el)
    }
    for (const code of COUNTY_LOCALES) alt(code, code === 'en' ? base : `${base}?lang=${code}`)
    alt('x-default', base)

    // FAQPage structured data
    let ld = null
    if (county.faq?.length) {
      ld = document.createElement('script')
      ld.type = 'application/ld+json'
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: county.faq.map((f) => ({
          '@type': 'Question',
          name: f.q[lang],
          acceptedAnswer: { '@type': 'Answer', text: f.a[lang] },
        })),
      })
      document.head.appendChild(ld)
      tags.push(ld)
    }

    return () => {
      document.title = prevTitle
      tags.forEach((t) => t.remove())
    }
  }, [county, lang])
}

export default function CountyPage() {
  const { county: slug } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState('en')
  const county = countyBySlug(slug)
  useSeo(county, lang)

  const t = UI[lang]

  if (!county) {
    return (
      <main className="cty">
        <div className="cty-wrap" style={{ padding: '80px 24px' }}>
          <h1 className="cty-h1">County not found</h1>
          <p className="cty-lead">Choose a county:</p>
          <ul>
            {ALL_COUNTIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/california/${c.slug}`}>{c.name} County</Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    )
  }

  const branches =
    county.court_branches?.length > 0
      ? county.court_branches
      : [{ name: county.branch, address: `${county.street}, ${county.cityZip}` }]
  const startApp = () => navigate('/')

  return (
    <main className="cty">
      {/* top bar */}
      <header className="cty-top">
        <div className="cty-wrap cty-top__inner">
          <Link to="/" className="cty-brand">
            Califor<b>mis</b>
          </Link>
          <div className="cty-toggle" role="group" aria-label="Language">
            {['en', 'es'].map((l) => (
              <button
                key={l}
                className={`cty-toggle__btn ${lang === l ? 'is-on' : ''}`}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <article>
        {/* HERO */}
        <section className="cty-hero" aria-labelledby="hero-h">
          <div className="cty-wrap">
            <p className="cty-eyebrow">{t.eyebrow}</p>
            <h1 className="cty-h1" id="hero-h">
              {t.heroTitle(county.name)}
            </h1>
            <p className="cty-lead">{t.heroLead}</p>
            <div className="cty-hero__cta">
              <button className="cty-btn cty-btn--primary" onClick={startApp}>
                {t.cta} →
              </button>
              <a className="cty-btn cty-btn--ghost" href="#how">
                {t.ctaHow}
              </a>
              <span className="cty-price">
                {t.from} <b>${PRICE}</b>
              </span>
            </div>
          </div>
        </section>

        {/* PARTICULARITIES */}
        <section className="cty-sec" aria-labelledby="diff-h">
          <div className="cty-wrap">
            <h2 className="cty-h2" id="diff-h">
              {t.diff}
            </h2>
            {county.particularities?.length ? (
              <div className="cty-cards">
                {county.particularities.map((p, i) => (
                  <div className="cty-card" key={i}>
                    <span className="cty-card__n">{i + 1}</span>
                    <p>{p[lang]}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="cty-soon">{t.soon}</p>
            )}
          </div>
        </section>

        {/* COURT */}
        <section className="cty-sec cty-sec--alt" aria-labelledby="court-h">
          <div className="cty-wrap">
            <h2 className="cty-h2" id="court-h">
              {t.court}
            </h2>
            <ul className="cty-branches">
              {branches.map((b, i) => (
                <li key={i}>
                  <strong>{b.name}</strong>
                  <span>{b.address}</span>
                </li>
              ))}
            </ul>
            <p className="cty-note">{t.courtNote}</p>
          </div>
        </section>

        {/* COST + TIMELINE */}
        <section className="cty-sec" aria-labelledby="cost-h">
          <div className="cty-wrap cty-grid2">
            <div>
              <h2 className="cty-h2" id="cost-h">
                {t.cost}
              </h2>
              <div className="cty-fee">
                <span className="cty-fee__amt">${county.filing_fee}</span>
                <span className="cty-fee__lbl">{t.filingFee}</span>
              </div>
              <p className="cty-note">
                <strong>{t.feeWaiver}:</strong> {t.feeWaiverVia(county.fee_waiver_form)}
              </p>
            </div>
            <div>
              <h2 className="cty-h2">{t.timeline}</h2>
              <div className="cty-fee">
                <span className="cty-fee__amt">6 mo</span>
                <span className="cty-fee__lbl">{lang === 'es' ? 'mínimo legal' : 'legal minimum'}</span>
              </div>
              <p className="cty-note">{t.timelineText}</p>
            </div>
          </div>
        </section>

        {/* LOCAL FORMS */}
        <section className="cty-sec cty-sec--alt" aria-labelledby="lf-h">
          <div className="cty-wrap">
            <h2 className="cty-h2" id="lf-h">
              {t.localForms}
            </h2>
            {county.local_forms?.length ? (
              <ul className="cty-forms">
                {county.local_forms.map((f) => (
                  <li key={f.code}>
                    <span className="cty-forms__code">{f.code}</span>
                    <span>{f.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cty-soon">{t.soon}</p>
            )}
          </div>
        </section>

        {/* HOW TO FILE */}
        <section className="cty-sec" id="how" aria-labelledby="how-h">
          <div className="cty-wrap">
            <h2 className="cty-h2" id="how-h">
              {t.how}
            </h2>
            <ol className="cty-steps">
              {t.steps(county).map((s, i) => (
                <li key={i}>
                  <span className="cty-steps__n">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="cty-note">
              {county.copies_needed} {t.copies} ·{' '}
              {county.efiling_required ? t.efilingYes : t.efilingNo}
            </p>
          </div>
        </section>

        {/* SPANISH */}
        <section className="cty-sec cty-sec--accent" aria-labelledby="es-h">
          <div className="cty-wrap">
            <h2 className="cty-h2" id="es-h">
              🌐 {t.spanish}
            </h2>
            <p className="cty-lead">{t.spanishText}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="cty-sec" aria-labelledby="faq-h">
          <div className="cty-wrap">
            <h2 className="cty-h2" id="faq-h">
              {t.faq}
            </h2>
            {county.faq?.length ? (
              <dl className="cty-faq">
                {county.faq.map((f, i) => (
                  <div className="cty-faq__item" key={i}>
                    <dt>{f.q[lang]}</dt>
                    <dd>{f.a[lang]}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="cty-soon">{t.soon}</p>
            )}
          </div>
        </section>

        {/* TRUST */}
        <section className="cty-sec cty-sec--alt" aria-labelledby="trust-h">
          <div className="cty-wrap">
            <h2 className="cty-h2" id="trust-h">
              {t.trust}
            </h2>
            <div className="cty-cards">
              {t.trustItems.map(([title, body]) => (
                <div className="cty-card" key={title}>
                  <strong className="cty-card__title">{title}</strong>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cty-cta" aria-labelledby="cta-h">
          <div className="cty-wrap">
            <h2 className="cty-h2 cty-h2--light" id="cta-h">
              {t.ctaFinal(county.name)}
            </h2>
            <p className="cty-cta__lead">{t.ctaFinalLead}</p>
            <button className="cty-btn cty-btn--primary" onClick={startApp}>
              {t.cta} →
            </button>
          </div>
        </section>

        {/* internal links */}
        <nav className="cty-sec" aria-label={t.otherCounties}>
          <div className="cty-wrap">
            <h2 className="cty-h2">{t.otherCounties}</h2>
            <ul className="cty-other">
              {ALL_COUNTIES.filter((c) => c.slug !== county.slug).map((c) => (
                <li key={c.slug}>
                  <Link to={`/california/${c.slug}`}>{c.name} County →</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </article>

      <footer className="cty-foot">
        <div className="cty-wrap">{t.disclaimer}</div>
      </footer>
    </main>
  )
}
