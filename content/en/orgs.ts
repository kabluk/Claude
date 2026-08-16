import type { Block, PageContent } from '@/lib/types'
import { SUPPORT_URL } from '@/lib/support'

// The support block only appears once a Stripe link is set in
// src/lib/support.ts. Payment happens entirely on stripe.com — Zero-Data holds.
const support: Block[] = SUPPORT_URL
  ? [
      { kind: 'h2', text: 'Support the project' },
      {
        kind: 'p',
        text: 'Everything a family needs in a crisis is free and will stay free. If your organization wants to support the work, a one-time contribution is possible.',
      },
      { kind: 'ext', href: SUPPORT_URL, label: 'Support DETNAV' },
      {
        kind: 'p',
        dim: true,
        text: 'Payment happens on stripe.com. detnav.com still has no payment forms, no accounts, and no data about you.',
      },
    ]
  : []

const c: PageContent = {
  title: 'For parishes, organizations and employers',
  lede: 'When trouble comes, your people come to you. We provide a tool you can put in their hands.',
  blocks: [
    { kind: 'h2', text: 'What your people get — free' },
    {
      kind: 'list',
      items: [
        'A personal task list in 2 minutes — for the family’s circumstances, in three languages',
        'The first night step by step: how to find the person, what not to sign, who not to pay',
        'Checking a helper against government registries — before money changes hands',
        'A draft document package for the attorney — saving their billed hours',
        'We store nothing: answers stay on the phone, we have nothing to hand over on request',
      ],
    },
    { kind: 'h2', text: 'What we offer organizations' },
    {
      kind: 'list',
      items: [
        'Printed first-night cards with your contact on them — to hand out in advance',
        'A meeting or webinar "the first night" for your families — in their language',
        'Preparation features to give your people ahead of time: the family preparedness plan and the attorney document packet',
        'A direct line to us: your questions and cases reach the product first',
      ],
    },
    {
      kind: 'callout',
      tone: 'g',
      title: 'Why this is set up honestly',
      body: [
        'Everything a family needs in a crisis is free for everyone and will stay free. Organizations pay for training, materials and early access to preparation features — not for rescue.',
        'We never take a percentage of a bond and we sell nothing to a family in the first 72 hours.',
      ],
    },
    ...support,
    { kind: 'h2', text: 'Talk to us' },
    {
      kind: 'p',
      text: 'We usually share this page personally. If you received the link — reply to whoever sent it and set up a short conversation: 20 minutes, no commitments.',
    },
    {
      kind: 'p',
      dim: true,
      text: 'We are not attorneys and we do not give legal advice — and we tell your people that on every page.',
    },
  ],
}

export default c
