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
import { Link, useNavigate } from 'react-router-dom'
import componentsData from '@data/a11y/components.json'
import type { StandardSlug } from '@data/a11y/types'
import { countries, paths, STANDARDS, standardLabel, tax, type CountryInfo } from '@/lib/data'
import { Accordion } from '@/components/library/Accordion'
import { Tabs } from '@/components/library/Tabs'
import { Modal } from '@/components/library/Modal'
import { ToastRegion, useToasts } from '@/components/library/Toast'
import { Tooltip } from '@/components/library/Tooltip'
import { Breadcrumbs } from '@/components/library/Breadcrumbs'
import { Combobox } from '@/components/library/Combobox'
import { MenuButton, type MenuItemDef } from '@/components/library/MenuButton'
import { ListboxSelect } from '@/components/library/ListboxSelect'
import { FormField } from '@/components/library/FormField'

import AccordionSrc from '@/components/library/Accordion.tsx?raw'
import TabsSrc from '@/components/library/Tabs.tsx?raw'
import ModalSrc from '@/components/library/Modal.tsx?raw'
import ToastSrc from '@/components/library/Toast.tsx?raw'
import TooltipSrc from '@/components/library/Tooltip.tsx?raw'
import BreadcrumbsSrc from '@/components/library/Breadcrumbs.tsx?raw'
import ComboboxSrc from '@/components/library/Combobox.tsx?raw'
import MenuButtonSrc from '@/components/library/MenuButton.tsx?raw'
import ListboxSelectSrc from '@/components/library/ListboxSelect.tsx?raw'
import FormFieldSrc from '@/components/library/FormField.tsx?raw'

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

function MenuButtonDemo() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string | null>(null)

  // Ordinary page actions on this component library page itself — not a claim
  // that the site has a "share" feature. "Report an issue" is the one item
  // with a real destination: /contact/ already exists on this site, so
  // choosing it really navigates there, same as clicking a link would.
  const items: MenuItemDef[] = [
    {
      label: 'Copy link',
      onSelect: async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          setStatus('Link copied to the clipboard.')
        } catch {
          setStatus("Couldn't copy automatically — copy the address bar instead.")
        }
      },
    },
    {
      label: 'Print this page',
      onSelect: () => {
        setStatus('Opening the print dialog…')
        window.print()
      },
    },
    {
      label: 'Report an issue',
      onSelect: () => navigate(paths.contact()),
    },
  ]

  return (
    // data-a11y-demo-menu lets the permanent axe gate click the button and
    // audit the OPEN menu (role=menu + role=menuitem) — see
    // scripts/audit-own-a11y.mjs. It never activates an item, so the
    // navigation in "Report an issue" cannot fire during the audit.
    <div data-a11y-demo-menu>
      <MenuButton label="Page actions" items={items} />
      <p className="mt-3 max-w-prose text-xs text-on-surface-variant" role="status">
        {status ??
          'Click, or Down/Up on the button, to open the menu. Arrow keys move real focus between items and wrap at both ends; typing a letter jumps to the next item starting with it; Enter/Space runs the item; Escape closes without running anything.'}
      </p>
    </div>
  )
}

function ListboxSelectDemo() {
  const [picked, setPicked] = useState<StandardSlug | null>(null)
  // Real catalogue data (D-045/D-047): the same seven standards — and the
  // same scopes — that /standards/ lists and /standards/[slug]/ documents,
  // so this demo is the site's own standards picker rather than an invented
  // option list.
  const scopeLabel: Record<string, string> = {
    global: 'Global',
    eu: 'EU',
    us: 'US',
    de: 'DE',
    fr: 'FR',
  }
  const options = STANDARDS.map((s) => ({
    value: s,
    label: standardLabel(s),
    hint: scopeLabel[tax.standards[s].scope] ?? tax.standards[s].scope,
  }))
  return (
    // data-a11y-demo-listbox marks the demo for the permanent axe gate, which
    // opens the popup (button click) and waits for the visible role=listbox
    // before the second axe pass audits the OPEN state — see
    // scripts/audit-own-a11y.mjs.
    <div data-a11y-demo-listbox>
      <ListboxSelect
        label="Choose a standard to learn about"
        placeholder="Select a standard…"
        options={options}
        onSelect={(o) => setPicked(o.value as StandardSlug)}
      />
      <p className="mt-3 max-w-prose text-xs text-on-surface-variant">
        {picked ? (
          <Link className="underline underline-offset-2" to={paths.standard(picked)}>
            Read about {standardLabel(picked)} →
          </Link>
        ) : (
          'Click, or Enter/Space/Down/Up on the button, to open the list — focus lands on the current selection, or the first standard if nothing is chosen yet. Arrow keys move real focus between options and wrap at both ends; typing a letter jumps to the next option starting with it; Enter/Space confirms the focused option and closes the popup; Escape closes without changing anything you had already chosen.'
        )}
      </p>
    </div>
  )
}

// A plausible, if synthetic, validation rule (must look like an email) —
// the UI mechanic being demonstrated is real, the "you must be a valid
// address" rule is a stand-in, not a claim about any real backend endpoint
// (D-045-style boundary: no invented catalogue facts, an invented UI rule is
// fine). Starts already touched with an invalid value, so the error — and
// the fact that the hint stays put alongside it — is visible in the page's
// static, no-interaction state (same reasoning as Accordion/Tabs already
// having an example open by default): no INTERACT hook needed in
// scripts/audit-own-a11y.mjs, and the a11y gate gets the real thing rather
// than an idle empty field.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function FormFieldDemo() {
  const [value, setValue] = useState('not-an-email')
  const [touched, setTouched] = useState(true)
  const error = touched && !EMAIL_RE.test(value) ? 'Enter a valid email address, like name@example.com.' : undefined

  return (
    <div className="max-w-sm">
      <FormField
        label="Email address"
        hint="We'll only use this to send your accessibility report."
        error={error}
      >
        <input
          type="email"
          inputMode="email"
          className="input mt-1.5 block w-full"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      </FormField>
      <p className="mt-3 max-w-prose text-xs text-on-surface-variant">
        Clear the field or type a valid address, then tab or click away — the hint never disappears;
        the error (role="alert") joins it in aria-describedby instead of replacing it, and focus stays
        on the field the whole time.
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
  'menu-button': {
    code: MenuButtonSrc,
    demo: () => <MenuButtonDemo />,
  },
  'listbox-select': {
    code: ListboxSelectSrc,
    demo: () => <ListboxSelectDemo />,
  },
  'form-field': {
    code: FormFieldSrc,
    demo: () => <FormFieldDemo />,
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
