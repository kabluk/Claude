import type { IntakeContent, Lang, UIStrings } from '@/lib/types'
import { Layout } from '@/components/Layout'
import { Quiz } from '@/components/Quiz'

export function IntakePage({
  lang,
  c,
  ui,
  title,
}: {
  lang: Lang
  c: IntakeContent
  ui: UIStrings
  title: string
}) {
  return (
    <Layout lang={lang} pageKey="intake" ui={ui} title={`${title} · DETNAV`}>
      <Quiz c={c} lang={lang} ui={ui} />
    </Layout>
  )
}
