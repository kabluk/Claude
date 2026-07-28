import type { PageContent } from '@/lib/types'

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
        'Early access to preparation features for your people as they ship: the family dossier, the check-in timer, transfer notifications',
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
