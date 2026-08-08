// Registry for the accessible component library (CN-COMPONENTS, §22, D-068).
//
// Convention, not a hand-maintained list — the same shape as guides (markdown →
// pages) and /wcag (coverage JSON → pages): metadata lives in
// data/a11y/components.json; here we join each *ready* entry to its live demo
// and its real source code. The code shown on a page is the implementation
// file's actual source, imported with Vite's ?raw, so it can never drift from
// the working example rendered above it. Adding a component means adding a JSON
// entry (+ an impl file + a demo below for a ready one), never editing routes,
// the sitemap, or the audit list by hand — scripts/components.test.mjs guards
// that those stay in step.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import componentsData from '@data/a11y/components.json'
import { countries, paths, type CountryInfo } from '@/lib/data'
import { Accordion } from '@/components/library/Accordion'
import { Tabs } from '@/components/library/Tabs'
import { Modal } from '@/components/library/Modal'
import { ToastRegion, useToasts } from '@/components/library/Toast'
import { Tooltip } from '@/components/library/Tooltip'
import { Breadcrumbs } from '@/components/library/Breadcrumbs'
import { Combobox } from '@/components/library/Combobox'

import AccordionSrc from '@/components/library/Accordion.tsx?raw'
import TabsSrc from '@/components/library/Tabs.tsx?raw'
import ModalSrc from '@/components/library/Modal.tsx?raw'
import ToastSrc from '@/components/library/Toast.tsx?raw'
import TooltipSrc from '@/components/library/Tooltip.tsx?raw'
import BreadcrumbsSrc from '@/components/library/Breadcrumbs.tsx?raw'
import ComboboxSrc from '@/components/library/Combobox.tsx?raw'

export type ComponentStatus = 'ready' | 'planned'
export interface KeyRow {
  keys: string
  does: string
}
export interface Pitfall {
  bad: string
  good: string
}
export interface ComponentMeta {
  slug: string
  name: string
  status: ComponentStatus
  pattern: string
  summary: string
  impl?: string
  keyboard?: KeyRow[]
  screenReader?: string[]
  ariaNotes?: string[]
  pitfalls?: Pitfall[]
}

export const components = (componentsData.components as ComponentMeta[])

// --- Live demos + real source for the ready components ----------------------

function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {/* data-a11y-demo-open lets the permanent axe gate open this dialog and
          audit its open state — see scripts/audit-own-a11y.mjs. */}
      <button type="button" data-a11y-demo-open className="btn" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Request an audit quote">
        <p>
          A modal is the right tool only when the task genuinely blocks everything else. This one
          traps focus, closes on Escape, and returns focus to the button you opened it with.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <a className="btn" href="/request-quote/">
            Continue
          </a>
        </div>
      </Modal>
    </div>
  )
}

function ToastDemo() {
  const { toasts, notify, dismiss } = useToasts()
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => notify('Changes saved.', { tone: 'status' })}>
          Save changes
        </button>
        {/* data-a11y-demo-toast lets the permanent axe gate raise a toast and audit
            its live state — see scripts/audit-own-a11y.mjs. The error tone persists
            (no timer), so the audited toast never vanishes mid-run. */}
        <button
          type="button"
          data-a11y-demo-toast
          className="btn-ghost"
          onClick={() => notify('Could not save — check your connection and try again.', { tone: 'alert' })}
        >
          Trigger an error
        </button>
      </div>
      <p className="mt-3 max-w-prose text-xs text-on-surface-variant">
        “Save changes” posts a polite status message that clears itself after a few seconds; “Trigger an
        error” posts an assertive alert that stays until you dismiss it. Neither one moves your focus — the
        message is announced in the background.
      </p>
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function TooltipDemo() {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-6">
        {/* data-a11y-demo-focus lets the permanent axe gate focus this trigger and
            audit the tooltip in its OPEN state — see scripts/audit-own-a11y.mjs.
            Focus, not hover, is the trigger the gate can drive, which is also the
            trigger keyboard users depend on. */}
        <Tooltip content="Automated checks cover 31 of the 50 web criteria in EN 301 549. The rest need a human reviewer.">
          <button type="button" data-a11y-demo-focus className="btn-ghost">
            What does the score cover?
          </button>
        </Tooltip>
        <Tooltip content="Verified against a public source: a certification register, a procurement record, or a published accessibility statement naming the auditor.">
          <span tabIndex={0} className="chip chip-info">
            Verified listing
          </span>
        </Tooltip>
      </div>
      <p className="mt-3 max-w-prose text-xs text-on-surface-variant">
        Tab to either trigger — the tooltip appears on focus, not only on hover. Escape hides it
        without moving your focus away.
      </p>
    </div>
  )
}

function ComboboxDemo() {
  const [picked, setPicked] = useState<CountryInfo | null>(null)
  // Real catalogue data (D-045/D-047): the same country list — and the same
  // agency counts — that /countries/ renders, so this demo is the site's own
  // country filter rather than an invented fruit list.
  const options = countries.map((c) => ({
    value: c.slug,
    label: c.name,
    hint: `${c.count} ${c.count === 1 ? 'agency' : 'agencies'}`,
  }))
  return (
    // data-a11y-demo-combobox marks the demo for the permanent axe gate, which
    // clicks the input inside it, types, and arrows down to audit the OPEN
    // state — the listbox, its options, and the active-option highlight (see
    // scripts/audit-own-a11y.mjs). The marker sits on the demo wrapper, not
    // inside the component, so the primitive's own API stays free of
    // test hooks.
    <div data-a11y-demo-combobox>
      <Combobox
        label="Filter by country"
        placeholder="Start typing a country…"
        options={options}
        onSelect={(o) => setPicked(countries.find((c) => c.slug === o.value) ?? null)}
      />
      <p className="mt-3 max-w-prose text-xs text-on-surface-variant">
        {picked ? (
          <Link className="underline underline-offset-2" to={paths.country(picked)}>
            {picked.count} audit {picked.count === 1 ? 'agency' : 'agencies'} in {picked.name} →
          </Link>
        ) : (
          'Type to filter, or press Down to see every country. Arrow keys move the highlight while the caret stays in the field; Enter picks the highlighted country; Escape closes the list and keeps what you typed.'
        )}
      </p>
    </div>
  )
}

const DEMOS: Record<string, { demo: () => JSX.Element; code: string }> = {
  accordion: {
    code: AccordionSrc,
    demo: () => (
      <Accordion
        items={[
          {
            title: 'What does an accessibility audit cover?',
            content:
              'A manual audit checks a sample of pages against WCAG success criteria using a keyboard, a screen reader, and zoom — the things automation cannot judge.',
          },
          {
            title: 'How long does it take?',
            content: 'Typically one to three weeks, depending on the size of the site and the number of unique templates.',
          },
          {
            title: 'Do you re-test after fixes?',
            content: 'A remediation re-test confirms the reported issues are resolved and nothing new regressed.',
          },
        ]}
      />
    ),
  },
  tabs: {
    code: TabsSrc,
    demo: () => (
      <Tabs
        label="Standards"
        tabs={[
          {
            label: 'WCAG',
            content: 'The Web Content Accessibility Guidelines — the technical baseline that nearly every law points back to.',
          },
          {
            label: 'EN 301 549',
            content: 'The European harmonised standard; its chapter 9 maps directly onto WCAG for websites under the EAA.',
          },
          {
            label: 'Section 508',
            content: 'The United States federal requirement for information and communication technology, aligned with WCAG 2.0 AA.',
          },
        ]}
      />
    ),
  },
  'modal-dialog': {
    code: ModalSrc,
    demo: () => <ModalDemo />,
  },
  toast: {
    code: ToastSrc,
    demo: () => <ToastDemo />,
  },
  tooltip: {
    code: TooltipSrc,
    demo: () => <TooltipDemo />,
  },
  combobox: {
    code: ComboboxSrc,
    demo: () => <ComboboxDemo />,
  },
  breadcrumbs: {
    code: BreadcrumbsSrc,
    demo: () => (
      // This page already carries the site's own "Breadcrumb" landmark above,
      // so the example must name itself differently — otherwise two landmarks
      // share a name and neither can be identified. axe's landmark-unique
      // caught exactly this before the label became a prop.
      <Breadcrumbs
        label="Breadcrumb example"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Countries', path: '/countries/' },
          { name: 'Germany', path: '/germany/' },
        ]}
        current="Accessibility audit"
      />
    ),
  },
}

export interface ReadyComponent extends ComponentMeta {
  demo: () => JSX.Element
  code: string
}

export const readyComponents: ReadyComponent[] = components
  .filter((c) => c.status === 'ready')
  .map((c) => {
    const d = DEMOS[c.slug]
    if (!d) throw new Error(`Component "${c.slug}" is marked ready but has no demo/code in componentsLib.tsx`)
    return { ...c, demo: d.demo, code: d.code }
  })

export const readyComponentBySlug = (slug: string): ReadyComponent | undefined =>
  readyComponents.find((c) => c.slug === slug)
