import type { PlaybookContent } from '@/lib/types'

const c: PlaybookContent = {
  mapTitle: 'Map of this document',
  mapSub: 'The whole road on one page. Every item is broken down in detail inside — the section number matches the item number.',
  phases: [
    {
      id: 'A',
      title: 'Someone was taken · the first hours',
      goal: 'Right now only two things matter: learn where he is, and do not miss his call. Sign nothing, pay no one.',
      items: [
        {
          n: 'A1',
          what: 'Find where he is',
          how: 'ICE locator: by A-Number or by name',
          why: 'Until you know which building he is in, nothing else works: no calls, no money on the account, no attorney visit. An empty search in the first hours is normal: the record appears within 72 hours. Check again.',
        },
        {
          n: 'A2',
          what: 'Prepare your phone',
          how: 'unblock unknown callers, volume all the way up',
          why: 'You cannot call him — only he can call you, from an unfamiliar number. If your phone silently rejects strangers, his one call goes nowhere.',
        },
        {
          n: 'A3',
          what: 'Open a calling account and add money',
          how: 'GettingOut / Securus / ICSolutions — by facility',
          why: 'Calls from inside are paid, and you pay. While the balance is zero, he physically cannot dial your number. Money on the account is his voice.',
        },
        {
          n: 'A4',
          what: 'His first call — with a short plan',
          how: '3 questions on paper: facility · A-Number · health',
          why: 'Minutes are few and the line is recorded. With the questions written down, you will not freeze, you will learn what matters, and you will not say too much.',
        },
      ],
    },
    {
      id: 'B',
      title: 'The attorney — job one · the first days',
      goal: 'The government does not provide a free attorney in immigration cases — the family finds one. With an attorney, people get out three times more often.',
      items: [
        {
          n: 'B5',
          what: 'Where to look',
          how: 'AILA (language filter) · the court’s pro bono list · state organizations',
          why: 'An attorney can handle the case from any state — search by language, not by city. Free and low-cost paths exist: the lists and phones are inside.',
        },
        {
          n: 'B6',
          what: 'Verify before paying',
          how: 'license in the state bar registry · 2 minutes',
          why: 'People prey on families in trouble: they take money and disappear. A “notario” in the U.S. is not a lawyer. The check takes two minutes and saves thousands of dollars.',
        },
        {
          n: 'B7',
          what: 'Prepare the first meeting',
          how: 'document packet + timeline + A-Number',
          why: 'Attorneys bill by the hour. If the papers are collected and organized, they work on the case from the first hour instead of sorting your folder at your expense.',
        },
      ],
    },
    {
      id: 'C',
      title: 'Paths out · discussed with the attorney',
      goal: 'There are two paths out of custody. The attorney chooses — but when you know both, you understand what they are doing and can ask why this one.',
      fork: {
        a: {
          h: 'Bond',
          sub: 'immigration court (EOIR)',
          text: 'Money as a promise to attend every hearing. Right now broad categories get no bond hearing at all — this door is often closed.',
        },
        b: {
          h: 'Habeas corpus',
          sub: 'federal district court',
          text: 'A complaint to an independent federal judge: “check whether holding me is lawful.” Works even where bond was denied. Filed by an attorney.',
        },
      },
    },
    {
      id: 'D',
      title: 'The longer road · weeks',
      goal: 'The first-days crisis is over — the marathon begins. Three things that keep a family afloat for months.',
      items: [
        {
          n: 'D8',
          what: 'The road of the case',
          how: '12 steps from “found” to court',
          why: 'The case drags on for months, and the unknown is the scariest part. The map shows where you are and what comes next. Iron rule: a missed hearing = a removal order in absentia.',
        },
        {
          n: 'D9',
          what: 'The family plan on paper',
          how: 'fill-in fields + the rights card',
          why: 'If trouble strikes again, the family will not scramble for phone numbers in a panic — everything is already written down at home. Takes one evening to fill in.',
        },
        {
          n: 'D10',
          what: 'Glossary and every link',
          how: '45 terms + every address on one page',
          why: 'Words like habeas and NTA are frightening until they are understood. And the links page can be photographed and sent to a relative in one shot.',
        },
      ],
    },
  ],

  spreads: [
    {
      part: 'A',
      title: 'The first hours: find him, get the call, stay connected',
      lede: 'The goal of these hours is two things: learn where he is and do not miss his call. Sign nothing, pay no one until verified.',
      sections: [
        {
          id: 'A1',
          h: 'Find where he is',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'How to search',
                  items: [
                    'The official ICE locator: locator.ice.gov. You need either the A-Number (the letter A and 9 digits) or the name + country of birth.',
                    'The name must match letter for letter. People find someone on the 3rd–4th try: a different name order, a second surname, a different transliteration. The tool on the site builds spelling variants.',
                    'Results: `In Custody` — found, the facility is shown; `Not In Custody` — released or removed within the last 60 days; empty — not entered yet.',
                  ],
                },
                {
                  h: 'If nothing comes up',
                  items: [
                    '“Empty” does not mean “he is not there.” The record appears within 72 hours of the arrest — the system itself warns about this.',
                    'In the first hours with the border agency (CBP) a person is not visible; held by CBP longer than 48 hours — he appears in this same locator.',
                    'Minors do not appear in the locator.',
                    'During a transfer the record can vanish for several days.',
                  ],
                },
              ],
            },
            { kind: 'act', href: 'https://locator.ice.gov', label: 'Open the official locator' },
            {
              kind: 'why',
              text: 'Until you know the facility, nothing else works: no calls, no money, no attorney. And check again even if you found him yesterday: people are moved between states without notifying the family.',
            },
          ],
        },
        {
          id: 'A2',
          h: 'Prepare your phone for his call',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Do right now',
                  items: [
                    'iPhone: Settings → Phone → turn off “Silence Unknown Callers.”',
                    'Android: Phone app → settings → number blocking — turn it off.',
                    'Check the spam filter with your carrier — it also mutes strangers.',
                    'Volume all the way up, phone not on silent. Tell everyone in the family.',
                  ],
                },
                {
                  h: 'Why this is critical',
                  items: [
                    'You cannot make the call — only he can call you, from an unfamiliar number.',
                    'If the phone silently rejects the call, his only call goes nowhere, and the next one may be a long wait away.',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'A3',
          h: 'Open a calling account and add money',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'How it works',
                  items: [
                    'He calls — from the housing-unit phones. Calls are paid, and you pay. Zero balance = he cannot dial your number.',
                    'Find the facility’s operator: most often `GettingOut` (the ViaPath company); some use `Securus` or `ICSolutions`.',
                    'On the operator’s site, create an account and link it by A-Number and facility.',
                  ],
                },
                {
                  h: 'Two ways to fund',
                  items: [
                    'His personal account — he can call anyone.',
                    'Linking to your number (AdvancePay) — he can call only you; it usually costs less.',
                    'Mail always works: a plain postcard arrives more reliably than any service. The A-Number is required on the envelope.',
                  ],
                },
              ],
            },
            { kind: 'act', href: 'https://www.gettingout.com', label: 'GettingOut — account, calls; the app is there too' },
            { kind: 'act', href: 'https://securustech.net', label: 'Securus — if the facility uses Securus' },
            { kind: 'act', href: 'https://www.icsolutions.com', label: 'ICSolutions — if the facility uses ICSolutions' },
          ],
        },
        {
          id: 'A4',
          h: 'His first call — with a short plan',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Three questions — write the answers on paper',
                  num: true,
                  items: [
                    'Tell me the full A-Number, one digit at a time.',
                    'What exactly is the facility called and what city is it in?',
                    'Did you sign anything? What exactly? Do you need medicines?',
                  ],
                },
                {
                  h: 'What this call is not for',
                  items: [
                    'The call is recorded and monitored (except registered attorney lines).',
                    'Do not discuss: past deportations and orders, arrests, case details, defense plans. Those are for the attorney only.',
                  ],
                },
              ],
            },
            {
              kind: 'mem',
              title: 'If the balance is zero',
              body: [
                'Dialing 9233# is free from inside the facility — the Freedom for Immigrants help line, unmonitored, works with a zero balance.',
                'The official ICE line for families: DRIL 1-888-351-4024.',
                'His phone will be taken — the numbers must be written on paper in his pocket.',
              ],
            },
            {
              kind: 'why',
              text: 'Minutes are few and the line can drop. With three questions in front of you, you will not freeze, you will learn what matters for finding an attorney, and you will not say too much into a recorded line.',
            },
          ],
        },
      ],
    },

    {
      part: 'B',
      title: 'The attorney: find, verify, prepare the meeting',
      lede: 'The government does not provide a free attorney in immigration cases — the family finds one. This is the main task of the first days: with an attorney, people get out three times more often (42% vs 14%).',
      sections: [
        {
          id: 'B5',
          h: 'Where to look',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Three paths — all legitimate',
                  items: [
                    'A private attorney. The AILA directory has a language filter. The practice is federal: an attorney from any state can handle a case in any state, so search by language, not by city.',
                    'Free (pro bono). The court’s official EOIR list by state; in New York — the NYIFUP program (free representation for detained people).',
                    'Organizations. By the facility’s state: CHIRLA (California), RAICES (Texas), LaAID (Louisiana), Americans for Immigrant Justice (Florida) — links on the links page.',
                  ],
                },
                {
                  h: 'About money — ask up front',
                  items: [
                    'Is the consultation paid, and how much?',
                    'A flat fee per stage or hourly? What exactly is included?',
                    'Is a payment plan possible?',
                    'Any agreement — in a written contract only.',
                  ],
                },
              ],
            },
            { kind: 'act', href: 'https://www.ailalawyer.com', label: 'AILA attorney search — language filter' },
            {
              kind: 'why',
              text: 'Attorney prices vary widely, and in a panic it is easy to agree to anything. Three questions about money before the work starts save thousands and remove surprises.',
            },
          ],
        },
        {
          id: 'B6',
          h: 'Verify before paying',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'A two-minute check',
                  items: [
                    'License: the state bar registry — by name.',
                    'The EOIR discipline list — not suspended from practice.',
                    'DOJ accredited representatives — a lawful alternative to an attorney at nonprofit organizations.',
                  ],
                },
                {
                  h: 'Signs of a scam',
                  items: [
                    'A “notario” in the U.S. is not a lawyer. In Latin America a notario is a legal professional; in the U.S. it is not — a classic scam is built on this.',
                    'Promises an exact outcome (“I will get him out, one hundred percent”) — it does not work that way.',
                    'Asks for a “percentage of the bond,” money without a contract or receipt, cash “quickly.”',
                  ],
                },
              ],
            },
            {
              kind: 'callout',
              tone: 'r',
              title: 'This is where families lose the most money',
              body: [
                'People prey on families in a panic: they take a prepayment and disappear, or “file papers” that do not exist. Two minutes checking the registry is the most profitable investment of this week.',
              ],
            },
          ],
        },
        {
          id: 'B7',
          h: 'Prepare the first meeting',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Assemble the document packet',
                  items: [
                    'IDs and immigration papers — any: old visas, permits, USCIS letters.',
                    'A timeline: when and where he was detained, when transferred, what papers he was given.',
                    'Proof of ties to the U.S. — what the judge looks at in a bond hearing: address and years of residence, family here, work history, taxes (tax transcripts — free at irs.gov), community involvement.',
                    'Medical records, if there are conditions.',
                    'The A-Number and the exact facility name — on the first page.',
                  ],
                },
                {
                  h: 'How it pays off',
                  items: [
                    'Attorneys bill by the hour. With the papers collected and organized, they work on the case from the first hour instead of sorting your folder at your expense.',
                    'The builder on the site puts everything into one PDF right on your phone — sending nothing anywhere.',
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    {
      part: 'C',
      title: 'Paths out: bond and habeas — how they work together',
      lede: 'Everything as it is, with no “which is better”: choosing the path is the attorney’s job. This spread helps you understand their logic and ask the right questions.',
      sections: [
        {
          id: 'C1',
          h: 'First things first: what the plan depends on',
          blocks: [
            {
              kind: 'p',
              text: 'Everything is determined by which section of the law he is held under. Simplified, there are three categories:',
            },
            {
              kind: 'list',
              items: [
                'Regular detention — bond can be requested from an immigration judge.',
                'Mandatory detention (certain criminal grounds) — no bond hearing at all.',
                '“Arriving” — since July 2025 the agency broadly counts here even people who have lived in the U.S. for years, if they once entered without inspection. The agency’s position: no bond at all.',
              ],
            },
            {
              kind: 'why',
              label: 'Why know this',
              text: 'The first question for the attorney: “Which section is he held under?” The answer determines whether the bond door is open — or whether to go straight to federal court.',
            },
          ],
        },
        {
          id: 'C2',
          h: 'Bond — the full breakdown',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'How much it is now',
                  items: [
                    'Judges most often set $5,000 or $10,000. The median is $7,500 (early 2026; a year earlier — $6,000), the average about $11,000. $15,000–$25,000 and higher happens.',
                    'The formal legal minimum is $1,500, but such amounts are now rare.',
                    'The money is returned to the obligor after the case ends, if the person attended every hearing.',
                  ],
                },
                {
                  h: 'Who pays and who is responsible',
                  items: [
                    'The bond is posted by an obligor — a person 18+ with lawful status in the U.S.; most reliably a citizen or a green-card holder. An ID and a taxpayer number (SSN/ITIN) are required.',
                    'The obligor signs a contract with ICE (form `I-352`), deposits the full amount at once, and takes responsibility: the person appears at every hearing.',
                    'All appearances made — the money comes back to the obligor. Missed — it is forfeited.',
                  ],
                },
              ],
            },
            {
              kind: 'cols',
              cards: [
                {
                  h: 'What the amount and decision depend on',
                  items: [
                    'The judge decides two questions: is the person dangerous, and will he come to court. The detained person carries the burden of proof.',
                    'The factors (Matter of Guerra): years in the U.S., a fixed address, family here, work history, past violations, manner of entry, any missed hearings. Ability to pay is also considered.',
                    'A ready dossier of ties to the U.S. — address, work, family — is exactly what the document packet from part B collects.',
                  ],
                },
                {
                  h: 'Worth knowing',
                  items: [
                    'Denied — you can appeal to the BIA and request a new hearing when circumstances change.',
                    'Bond frees the person but does not resolve the case — the removal proceedings continue.',
                    'Reality of 2026: more than two-thirds of bond requests are denied. With an attorney they are granted three times more often (42% vs 14%).',
                    'Pay only directly at an ICE office under form `I-352`. No one legitimate takes a “percentage of the bond.”',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'C3',
          h: 'Habeas corpus — the full breakdown',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'How it works',
                  items: [
                    'A separate case in the federal district court where the person is held — against the custodian. The filing fee is $5; the real cost is the attorney’s work.',
                    'An independent judge reviews whether the detention itself is lawful. He answers to neither ICE nor the immigration court.',
                    'Typical grounds: held without a bond hearing; classified as “arriving” despite years of living here; held too long without review.',
                  ],
                },
                {
                  h: 'What the judge can and cannot do',
                  items: [
                    'Can: order a bond hearing (sometimes with the burden on the government), release, bar a transfer (TRO), pause a removal (stay) — on a separate motion by the attorney.',
                    'Cannot: overturn a removal order or grant status — those are different procedures.',
                    'Reality of 2026: about 2,000 petitions a week nationwide (a year ago — about 20). Judges appointed under very different administrations grant them: what decides is the quality of the petition and the facts.',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'C4',
          h: 'How they connect — the key idea',
          blocks: [
            {
              kind: 'callout',
              tone: 'g',
              title: 'It is not either-or',
              body: [
                'These are two doors in different buildings — and habeas often opens the one the agency slammed shut. The typical link now: the agency says “no bond for you” → the attorney files habeas → the federal judge checks whether that is true — and can order a bond hearing or release.',
              ],
            },
            {
              kind: 'list',
              items: [
                'Can they run at the same time? Yes — they are different systems and do not interfere. Together, in sequence, and which first — that is the attorney’s strategy for the specific case.',
                'Geography decides. The federal circuits split: the Second, Third and Sixth — for bond hearings; the Fifth and Eighth — for the agency. The Supreme Court took the question; arguments are expected in October 2026. So “which state the facility is in” = “the rules of the game,” and a transfer to another state changes everything.',
              ],
            },
            {
              kind: 'callout',
              tone: 'y',
              title: 'Habeas is not a shield against deportation',
              body: [
                'The petition by itself does not stop a removal: a stay is a separate ruling the court makes, and the attorney asks for it. If someone promises “file habeas and deportation becomes impossible,” that is not true.',
              ],
            },
          ],
        },
        {
          id: 'C5',
          h: '“So which is better?” — the honest answer',
          blocks: [
            {
              kind: 'p',
              text: 'There is no general answer — what fits depends on the detention section, the circuit, and the facts of the specific case. That is exactly the attorney’s job. Our part is that you understand the plan and can ask:',
            },
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Questions for the attorney — copy onto paper',
                  num: true,
                  items: [
                    'Which section is he held under? Is a bond hearing available?',
                    'If not — are there grounds for habeas? Which exactly?',
                    'Which federal circuit is the facility in, and what does that change for us?',
                    'What do we file first, and why? Do we file in parallel?',
                    'Are we asking for a stay/TRO — protection from transfer and removal while the case runs?',
                  ],
                },
              ],
            },
            {
              kind: 'table',
              head: ['Bond', 'Habeas corpus'],
              rows: [
                ['Where decided', 'immigration court (EOIR, a DOJ agency)', 'federal district court, an independent judge'],
                ['The question', 'release on money while the case runs', 'whether holding him is lawful at all'],
                ['Who prepares', 'an attorney (possible alone — see the statistics)', 'an attorney with federal practice'],
                ['Cost of entry', 'the bond amount, usually $5,000–$10,000 (returned to the obligor)', '$5 filing fee + the attorney’s work'],
                ['If denied', 'appeal to the BIA; a new hearing when circumstances change', 'appeal to the federal court of appeals'],
                ['Effect on the removal case', 'does not resolve it', 'does not resolve it; a stay is separate'],
              ],
            },
            {
              kind: 'p',
              dim: true,
              text: 'Sources: TRAC Immigration (reports 722, 738), Matter of Guerra (BIA), ICE form I-352, ILRC (Dec. 2025), 28 U.S.C. § 2241, INA § 236. As of August 2026 — rules change; the Supreme Court takes up the question in fall 2026.',
            },
          ],
        },
      ],
    },

    {
      part: 'D',
      title: 'Weeks and months: the road and the family plan',
      lede: 'The first-days crisis is over — the marathon begins. Here is what keeps a family afloat for months.',
      sections: [
        {
          id: 'D8',
          h: 'The road of the case — 12 steps',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'How the case is built',
                  items: [
                    'A map of 12 steps: from “we found him,” through the first court date (master calendar — a short administrative hearing), to the main hearing on the merits (individual hearing) and the decision.',
                    'The case drags on for months and years. Each step on the site explains what happens and what the family does.',
                  ],
                },
                {
                  h: 'Two iron rules',
                  items: [
                    'A missed hearing = a removal order in absentia. The most common reason is not flight but a move: the notice went to the old address.',
                    'Moved — form `EOIR-33` to the court within 5 business days. Notifying the post office, the bank, or USCIS is not enough: the court gets its own separate form.',
                  ],
                },
              ],
            },
            {
              kind: 'why',
              text: 'The unknown is the scariest part. When the family sees the map — where we are now, what comes next month — panic turns into a plan. And the EOIR-33 rule prevents the most painful disaster: losing the case over a letter sent to an old address.',
            },
          ],
        },
        {
          id: 'D9',
          h: 'The family plan on paper',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'What is inside — fields for a pen',
                  items: [
                    'Who to call first: the trusted person, a backup, the attorney.',
                    'Children: who picks them up from school, the phone, where the documents are.',
                    'Home: where the papers are, who pays the rent, the pet.',
                    'Health: medicines and conditions people should know about.',
                    'Memorize: the trusted person’s phone and 9233#.',
                  ],
                },
                {
                  h: 'Money and property — advance only',
                  items: [
                    'A financial power of attorney (durable POA) naming a person with lawful status — without it, the landlord and the bank do not have to talk to the family.',
                    'The bank: login verification from SMS to e-mail; register the power of attorney at a branch in advance.',
                    'A financed car, the apartment, 401(k) accounts — what happens to them and which lawful paths exist is covered on the site.',
                  ],
                },
              ],
            },
            {
              kind: 'mem',
              title: 'The rights card · carry with you (3 languages)',
              body: [
                '“I do not want to talk, answer questions, or sign documents without a lawyer. I do not consent to entry into my home without a judicial warrant signed by a judge.”',
              ],
            },
            {
              kind: 'callout',
              tone: 'y',
              title: 'The plan with names and phones stays home — not in a pocket',
              body: [
                'If it is found during a detention, it holds the names and addresses of your loved ones. On you — only the rights card.',
              ],
            },
            {
              kind: 'why',
              text: 'It takes one evening to fill in. If trouble strikes again, the family will not scramble for numbers in a panic — everything is written down at home, and the trusted person knows what to do from the first hour.',
            },
          ],
        },
      ],
    },
  ],

  linksTitle: 'Every link — one page',
  linksLede: 'Every address from this document in one place. Photograph this page and send it in one shot. In the digital version everything is clickable.',
  linksGroups: {
    official: 'Official and services',
    orgs: 'Help organizations by state',
    site: 'detnav.com pages with tools',
  },
}

export default c
