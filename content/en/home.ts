import type { HomeContent } from '@/lib/types'

const c: HomeContent = {
  title: 'Someone was taken?\nWant to be prepared?',
  sub: 'Answer the questions — get your own task list. In plain language, step by step.',
  heroLead: 'We help you:',
  heroPoints: [
    'find the person in the system',
    'get your own task list in 2 minutes',
    'set up contact with the detained person — calls, letters',
    'see where families find money — fundraisers and funds',
    'put together the package for the attorney',
    'safely: we store nothing about you',
  ],
  demoLabel: 'HOW IT WORKS',
  demoTaskLabel: 'YOUR TASK',
  demoWhy: 'why it is on the list',
  scenarios: [
    {
      q: 'WHO IS ON WHAT',
      h: 'Whose signature is on the lease?',
      a: ['Mine', 'His', 'Both of ours'],
      pick: 1,
      t: [
        'Talk to the landlord before a missed payment',
        'The lease is not in your name. That conversation goes differently before a missed payment than after.',
        'the lease is in his name',
      ],
    },
    {
      q: 'CHILDREN',
      h: 'Who is allowed to pick the child up from school?',
      a: ['Both of us', 'Only him', 'I do not know'],
      pick: 1,
      t: [
        'Add yourself at the school right now',
        'Right now only he is allowed to pick the child up. Fixed with a form at the school office.',
        'only he is listed at the school',
      ],
    },
    {
      q: 'ATTORNEY',
      h: 'Do you know which attorney you would call if trouble comes?',
      a: ['Yes, the contact is saved', 'Not yet', 'I do not know'],
      pick: 1,
      t: [
        'Decide in advance which attorney to call',
        'There is no court-appointed attorney in immigration proceedings. The contact is chosen before trouble — we show where to look and how to check.',
        'an attorney is found before detention, not after',
      ],
    },
  ],
  benefitsTitle: 'How this helps',
  benefits: [
    {
      b: 'Your own task list in 2 minutes',
      p: 'Not generic advice — tasks for your circumstances. Each one says why it matters, how to do it, and where to get things.',
    },
    {
      b: 'The first night without panic',
      p: 'How to find the person, what not to sign, who not to pay. In plain language, with read-aloud.',
    },
    {
      b: 'A ready package for the attorney',
      p: 'Arrive with the documents gathered — pay for work on the case, not for sorting papers.',
    },
  ],
  cta: 'Start · 2 minutes',
  cta2: 'See how it all works first',
  trust: ['FREE', 'NO SIGN-UP', 'EN · ES · RU'],
  stepsTitle: 'Three steps',
  steps: [
    {
      b: 'You answer questions',
      p: 'Simple ones, each with a note on why it is asked. Do not know the answer? Say so — that is normal.',
    },
    {
      b: 'You get your list',
      p: 'Not generic advice — tasks for your circumstances. Each one says why it matters and what to do, step by step.',
    },
    {
      b: 'You follow the map',
      p: 'You can see where you are and what comes next. Twelve steps from "found him" to court.',
    },
  ],
  dataTitle: 'Your data',
  dataBig: {
    b: 'We store nothing about you',
    p1: 'Answers, photos of documents and your list stay on your phone. They are never sent to our server — not one word, not one file.',
    p2: 'So we have nothing to lose, nothing to sell and nothing to hand over on request.',
  },
  priceTitle: 'What it costs',
  freeTitle: 'Everything you need now',
  freeAmt: 'FREE',
  freeItems: [
    'How to find a person and what an empty result means',
    'What the documents they are given to sign actually do',
    'The first call: what to ask and what to keep silent about',
    'Checking an attorney against government registries',
    'Calls, money on the account, letters',
    'Release paths: what works now and the first questions for the attorney',
    'The questionnaire and your personal task list',
    'Assembling the document package for the attorney',
  ],
  paidTitle: 'Prepare in advance',
  paidAmt: 'IN THE WORKS',
  paidItems: [
    'A family dossier and an archive of evidence',
    'Check-in: miss it — your message goes out',
    'A notification if the person is transferred',
    'Shared access for relatives',
  ],
  priceNote:
    'There is nothing paid right now. When there is, the price will be here — and everything in the first list stays free forever. Parishes and organizations will be able to buy access for their people directly.',
  limitsTitle: 'What we do not do',
  limits: [
    {
      b: 'We do not give legal advice',
      p: 'We do not assess your situation and we do not say how it will end.',
    },
    {
      b: 'We do not recommend specific attorneys',
      p: 'We show the government registries — you check for yourself.',
    },
    {
      b: 'We do not draft documents',
      p: 'We explain what a document does and point to the official form.',
    },
  ],
}

export default c
