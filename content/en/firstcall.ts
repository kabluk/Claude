import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'The first call',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'The call is recorded',
      body: [
        'Calls from the facility are recorded and monitored. Registered attorney lines are the exception.',
      ],
    },
    { kind: 'h2', text: 'Before the call' },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Turn off blocking of unknown numbers',
      body: [
        'He calls, and the phone silently rejects it — the most painful failure of all. The call will come from an unfamiliar number.',
        'iPhone: Settings → Phone → turn off "Silence Unknown Callers".',
        'Android: Phone app → settings → blocked numbers.',
        'Also check the spam filter with your carrier.',
      ],
    },
    { kind: 'h2', text: 'What to ask — you can read this aloud' },
    {
      kind: 'list',
      items: [
        'Tell me the full A-Number, one digit at a time',
        'What exactly is the facility called and what city is it in',
        'Did you sign anything? What exactly?',
        'Do you need medication?',
        'How do I put money on the phone account',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'What this line should not touch',
      body: [
        'Past removals and orders. Arrests and convictions. Case details and defense plans.',
        'The recording can be used. Those things are discussed with an attorney.',
      ],
    },
    { kind: 'h2', text: 'The card to learn by heart and carry on paper' },
    {
      kind: 'memcard',
      title: 'LEARN AND COPY ONTO PAPER',
      lines: ['9233#'],
      alts: [
        'Dialing 9233# is free from inside the facility — it connects to the nonprofit help line. It works when the account is at zero.',
        'Then, in order: the number of a trusted person · the number of an attorney or organization · 1-888-351-4024 (DRIL, the official ICE line).',
        'The phone is taken first. A slip of paper in a wallet or pocket is the only thing that stays with the person.',
      ],
    },
    {
      kind: 'list',
      items: [
        'Copy the numbers onto paper by hand — the phone does not go inside',
        'Add the number of the trusted person and of the attorney once chosen',
        'Keep one copy in the wallet and one at home; give copies to those close to you',
        'If there is no attorney yet — 9233# reaches the nonprofit line, where you can ask where to look for free help',
      ],
    },
    { kind: 'tool', tool: 'print' },
    { kind: 'h2', text: 'Before you call' },
    {
      kind: 'p',
      dim: true,
      text: 'Keep paper and a pen next to you. There will be little time and you may not get to repeat a question.',
    },
    { kind: 'ilink', page: 'connect', label: 'Calls, money, letters' },
  ],
}

export default c
