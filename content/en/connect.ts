import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'How to reach the person',
  lede: 'The key rule: he can call you. You cannot call him. Below, step by step — calls, messages, video, money, and letters.',
  blocks: [
    { kind: 'h2', text: 'Where to start' },
    {
      kind: 'steps',
      items: [
        'Find out which phone provider your facility uses.',
        'On your own phone, turn off blocking of unknown numbers — otherwise he cannot get through.',
        'Set up an account and put a little money on it.',
      ],
    },

    { kind: 'h2', text: '1 · Calls' },
    {
      kind: 'p',
      text: 'He calls out from the phones in the housing unit. You cannot call him — only he can call you. With no money on the account, there are no calls at all.',
    },
    {
      kind: 'steps',
      title: 'How to turn on calls',
      items: [
        'Find the facility’s provider — most often it is `GettingOut` (the ViaPath company); some use `Securus` or `ICSolutions`.',
        'Open the provider’s website in a browser (or its app) and create an account.',
        'Link the account by `A-Number` and facility.',
        'Choose how: fund his personal account — he calls anyone; or link it to your number (AdvancePay) — he calls only you, usually cheaper.',
        'Put a little on it — the minimum is usually `$10`. If he is transferred to another facility, the money does not move with him.',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.gettingout.com',
      label: 'GettingOut website — account for calls and messages',
    },
    {
      kind: 'callout',
      tone: 'g',
      title: '9233# — free and not monitored',
      body: [
        'Dialing `9233#` from a facility phone reaches the free Freedom for Immigrants line. Regular calls are recorded; ICE does not monitor this one.',
        'Volunteers speak many languages, help, and can notify your family of where the person is. Hours: Mon–Fri, 8 a.m.–8 p.m. Pacific.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'A regular call is recorded and time-limited (about 15–20 minutes). The price is around 7 cents a minute domestically, more for international; it varies by facility. Saying the A-Number on the phone is safe; case details are not. The free-call program some facilities had was ended by ICE in 2026 — expect calls to be paid.',
    },
    { kind: 'ilink', page: 'firstcall', label: 'The first call: how to unblock numbers' },

    { kind: 'h2', text: '2 · Messages (text)' },
    {
      kind: 'p',
      text: 'These are not regular texts to a phone. They are messages inside the provider’s system — he reads them on a tablet.',
    },
    {
      kind: 'steps',
      title: 'How to send',
      items: [
        'The same provider and the same account as for calls.',
        'Open the “Messages” section on the provider’s website.',
        'Pay for “stamps” (credits) — on the website, by phone, or in the app, minimum usually `$10`.',
        'The same funds let you send a photo and a 30-second video message.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Tablets are not in every facility. Delivery is delayed, and everything is screened.',
    },

    { kind: 'h2', text: '3 · Video calls' },
    {
      kind: 'p',
      text: 'Some facilities have video calls — scheduled in advance, through the provider’s website or a kiosk in the lobby. Paid, and the account is needed in advance.',
    },
    {
      kind: 'p',
      dim: true,
      text: 'This is not an in-person visit — it has its own rules and hours.',
    },
    { kind: 'ilink', page: 'visit', label: 'Visiting' },

    { kind: 'h2', text: '4 · Money for daily needs (inside)' },
    {
      kind: 'p',
      text: 'This is a separate account — not the one for calls. From it the person buys food, hygiene, and sometimes phone time inside. It is often a different vendor.',
    },
    {
      kind: 'steps',
      title: 'How to deposit',
      items: [
        'Find the money instructions on this facility’s ICE page (the commissary / trust account section) — the details differ by facility.',
        'The methods, whichever exist — depends on the place: online by card with the vendor (`Access Corrections`, `TouchPay`, `ViaPath/ConnectNetwork`, `Western Union`); by phone with the vendor; by mail with a money order to the facility’s address; in person at a kiosk in the lobby.',
        'All of them need the full name and `A-Number` (often the date of birth too).',
        'Deposit only with the vendor listed for this facility. After a transfer the money gets stuck and is hard to get back.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'If there is no one to help',
      body: [
        'The Freedom for Immigrants Commissary Fund puts money on the account for people who have no one.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Money for daily needs cannot be withdrawn as cash — it is only spent inside.',
    },

    { kind: 'h2', text: '5 · Letters and postcards' },
    {
      kind: 'list',
      items: [
        'A plain postcard by mail arrives more reliably than any service',
        'The A-Number goes on the envelope and on every item, always',
        'Books — only new and directly from a store or publisher, not from a private person',
        'Softcover passes faster: hardcover is checked longer and often not allowed',
        'Every facility has its own rules — confirm by phone before sending',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Regular warm contact is what protects the person inside the most.',
    },
  ],
}

export default c
