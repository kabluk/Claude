import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Calls, money, letters',
  lede: 'He calls you — you almost never call him. Calls are paid at carrier rates and limited in time.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: '9233# — free from inside',
      body: [
        'Dialing `9233#` connects to the National Detention Hotline and is free from the facility. It works when the account is at zero — that is, at the most desperate point.',
      ],
    },
    { kind: 'h2', text: 'How the phone account works' },
    {
      kind: 'list',
      items: [
        'While there is no money on the account, there is no contact at all — you cannot call in, only he calls out',
        'Option 1: top up the detained person’s own balance — he can call anyone',
        'Option 2: link an account to your number — calls only to you, usually cheaper per the carrier’s own rates',
        'Which carrier depends on the facility: GettingOut, Securus, ConnectNetwork. Adelanto uses Talton tablets',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Payment does not work in the GettingOut app',
      body: [
        'The app shows the balance and messages, but you cannot add money in it. Top up through the carrier’s website in a browser.',
        'Other carriers can be the same: if the app has no payment button — look for the website, do not reinstall the app.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'A transfer to another facility changes the carrier',
      body: ['Money on the old carrier’s account does not move with the person. Do not deposit a lot at once.'],
    },
    { kind: 'h2', text: 'Before the first call' },
    {
      kind: 'p',
      text: 'Turn off blocking of unknown numbers — the call will come from an unfamiliar number. iOS and Android instructions are on the first-call page.',
    },
    { kind: 'ilink', page: 'firstcall', label: 'The first call' },
    { kind: 'h2', text: 'Letters and postcards' },
    {
      kind: 'list',
      items: [
        'A plain postcard by regular mail arrives more reliably than any service',
        'Books: new only, shipped directly by a store or publisher, not by a private person',
        'Softcover: hardcovers take longer to screen and are often refused',
        'The A-Number is required on the envelope and on everything you send',
        'Every facility has its own rules — confirm by phone before sending',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Regular warm contact is what protects a person inside more than anything else.',
    },
  ],
}

export default c
