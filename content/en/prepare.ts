import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'A plan in case of detention',
  lede: 'Fill it in by hand on paper and keep it at home, so your family knows what to do in the first hour. Nothing is entered online.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: 'Why on paper, not in an app',
      body: [
        'In the first hour after a detention, the household is in a panic and simple things slip away — whose phone number, where the papers are, who picks up the kids. A sheet filled in ahead of time answers those questions at once.',
        'We deliberately do not make this an online form: no server, ours included, should see this data. It is a family memo, not a questionnaire.',
      ],
    },
    {
      kind: 'p',
      text: 'Print this page, fill it in by hand, and put it where your family will find it. Update it every few months.',
    },
    { kind: 'tool', tool: 'print' },
    {
      kind: 'fields',
      title: 'Who to call first',
      items: [
        'Trusted person — who and phone',
        'Second person, if the first is unreachable',
        'Attorney or organization — name and phone',
      ],
    },
    {
      kind: 'fields',
      title: 'Children',
      items: [
        'Who picks the children up from school or daycare',
        'That person’s phone',
        'Where the children’s documents are',
      ],
    },
    {
      kind: 'fields',
      title: 'Home and daily life',
      items: [
        'Where the important papers are (passports, contracts)',
        'Who pays the rent while I am away',
        'Who cares for the pet',
      ],
    },
    {
      kind: 'fields',
      title: 'Health',
      items: [
        'Medicines I take, and where they are',
        'Conditions people should know about',
      ],
    },
    {
      kind: 'fields',
      title: 'What to know by heart',
      items: [
        'The trusted person’s phone — memorize it, don’t only write it down',
        'The code for a free call to the DHS OIG complaint line from detention: 9233#',
      ],
    },
    { kind: 'h2', text: 'Give the plan to a trusted person — today' },
    {
      kind: 'p',
      text: 'Hand the filled-in plan and the assembled document packet to someone you trust, ahead of time. Then they start acting the moment you are detained, instead of losing a day figuring out what happened.',
    },
    {
      kind: 'p',
      text: 'Agree on a simple signal: every evening you send them one word that all is well. Two evenings missed in a row — they start with the steps below.',
    },
    {
      kind: 'steps',
      title: 'What the trusted person does if you go silent',
      items: [
        'Finds you through the ICE locator — by name and country of birth, or by the A-Number from the plan.',
        'Calls the attorney or organization whose numbers are written in the plan above.',
        'Signs nothing for you and pays no one without checking first.',
        'Gives the attorney the document packet you handed over in advance.',
      ],
    },
    { kind: 'h2', text: 'Money and property: it works only if done in advance' },
    {
      kind: 'p',
      text: 'While a person is in detention, the rent, the car loan and the bank account do not pause. Loved ones can act for them legally only with papers signed ahead of time — they cannot be made after the fact.',
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Financial power of attorney (durable POA)',
      body: [
        'A notarized durable financial power of attorney naming a trusted person lets them legally end a lease, collect belongings, deal with the bank, and sell a car. Without it, the landlord and the bank do not even have to talk to them.',
        'It is signed before a notary in advance. Which powers to include is a question for an attorney: the wording depends on the state.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'The bank account',
      body: [
        'Login verification tied only to SMS stops working once the phone is confiscated or the number is cut off. Bank settings usually allow adding e-mail verification — keeping access to a mailbox is easier.',
        'Many banks accept a power of attorney only on their own form and only in person. Visiting a branch together with the trusted person ahead of time removes that barrier.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'The rented home and belongings',
      body: [
        'An apartment left unpaid turns into debt: lease-break fees, collectors, and the belongings go to storage or the curb. A person holding a power of attorney can end the lease by the rules and collect the things.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'A financed or leased car',
      body: [
        'A car with missed payments gets repossessed by the lender and sold at auction. The remaining balance stays with the owner, and the forgiven part may be counted as taxable income (Form 1099-C).',
        'The legal paths that exist: a power of attorney with authority to sell the vehicle, or an official transfer of the loan or lease to another person. The terms are in the contract and with the lender.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Retirement accounts: 401(k) and IRA',
      body: [
        'Savings in a 401(k) or IRA remain the person’s property regardless of immigration status or deportation — they do not burn up.',
        'Withdrawing before age 59½ usually carries a 10% IRS penalty plus taxes, which is why accounts are often left to grow until retirement age. From abroad, tax status is certified with Form W-8BEN. What to do with a specific account is a question for a tax adviser.',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.irs.gov/forms-pubs/about-form-w-8-ben',
      label: 'Form W-8BEN — official IRS page',
    },
    {
      kind: 'steps',
      title: 'Three tasks for this week',
      items: [
        'Switch the bank login verification from SMS to e-mail, or add e-mail as a backup method.',
        'Sign a financial power of attorney before a notary and register it at the bank in person.',
        'Put scans of the SSN/ITIN, the lease and loan contracts and the car papers into encrypted storage, and give the trusted person access.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'This is a map, not legal advice',
      body: [
        'What to include in the power of attorney, how to end a lease, and what to do with a retirement account depend on the state and on the contract. Those decisions are made with an attorney and a tax adviser, not from an internet memo.',
      ],
    },
    { kind: 'h2', text: 'What to carry with you' },
    {
      kind: 'p',
      text: 'The filled-in plan stays home. On you — only the small rights card. Take a photo of the card and keep it on your phone.',
    },
    {
      kind: 'memcard',
      title: 'RIGHTS CARD · CARRY WITH YOU',
      lines: [
        'I do not want to talk, answer questions, or sign documents without a lawyer. I do not consent to entry into my home without a judicial warrant signed by a judge.',
      ],
      alts: [
        'No quiero hablar, responder preguntas ni firmar documentos sin un abogado. No doy consentimiento para entrar a mi casa sin una orden judicial firmada por un juez.',
        'Я не хочу говорить, отвечать на вопросы и подписывать документы без адвоката. Я не даю согласия войти в дом без судебного ордера, подписанного судьёй.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Do not carry the plan with names and phones on you',
      body: [
        'If it is found during a detention, it holds the names and addresses of your loved ones. The plan stays home; only the rights card goes in your pocket.',
      ],
    },
    { kind: 'ilink', page: 'docpack', label: 'Assemble the document packet for the attorney' },
    { kind: 'ilink', page: 'documents', label: 'What the papers mean and what not to sign' },
    { kind: 'ilink', page: 'intake', label: 'If someone is already detained — where to start' },
  ],
}

export default c
