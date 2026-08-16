import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Visiting',
  metaTitle: 'Visiting someone in ICE detention: rules, scheduling, ID · DETNAV',
  metaDesc:
    'How to visit a person in ICE detention: hours and scheduling, what ID visitors need, per-facility rules, and what to confirm with a single call.',
  lede: 'How to see the person: hours, sign-up, documents, rules. Enter the facility — we assemble the answer. If it is not in our base, we show how to learn everything with one call.',
  blocks: [
    { kind: 'tool', tool: 'visitfinder' },
    { kind: 'h2', text: 'Rules that hold almost everywhere' },
    {
      kind: 'list',
      items: [
        'Arrive at least 15 minutes early — latecomers are turned away',
        'A government-issued photo ID for every adult (driver’s license, passport, or state ID); some facilities ask for a second document. At check-in you fill out a form with the person’s name and A-Number',
        'A limit on visitors per visit — usually up to three, children count',
        'Children usually need a birth certificate; a child stays under adult supervision the whole time, and noisy behavior is grounds to end the visit',
        'Bring nothing in: phones and bags stay in the car or in a locker at the entrance',
        'No hand-offs during visits — books and letters have their own channels',
        'On the day of the visit, call and confirm visits are not cancelled: a lockdown cancels them without notice',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Dress stricter than the rules say',
      body: [
        'The typical requirements: knee length, nothing sheer, tight, or revealing, closed shoes. But guards interpret them on the spot, and the interpretation changes from shift to shift.',
        'At the Delaney Hall facility, families were turned away over leggings, shorts, and Crocs — even children were refused. It is safer to dress well more conservatively than the rules, everyone, children included.',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'If you have no status yourself',
      body: [
        'Visitors fill out a form and show documents; at some facilities visitors are checked against databases.',
        'Legal aid organizations point to an attorney here: discuss the risk of the visit before the trip. Video calls, regular calls, and letters are ways to stay in touch without a visit.',
      ],
    },
    { kind: 'h2', text: 'If you cannot make the trip' },
    {
      kind: 'list',
      items: [
        'Video calls and messages — through the facility’s phone operator',
        'Regular calls: the person calls out when there is money on the account',
        'Letters and postcards by mail arrive more reliably than any service',
      ],
    },
    { kind: 'ilink', page: 'connect', label: 'Staying in touch: calls, money, letters' },
    {
      kind: 'p',
      dim: true,
      text: 'Every facility has its own rules, and they change without notice. As of July 2026 — confirm by phone on the day of the visit.',
    },
    {
      kind: 'onward',
      next: {
        page: 'journey',
        label: 'The whole road',
        desc: 'Where you are now and what comes next — twelve steps from "found" to court.',
      },
      related: [{ page: 'where', label: 'First, find him: where he is' }],
    },
  ],
}

export default c
