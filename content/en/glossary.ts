import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Glossary of terms',
  metaTitle: 'Immigration case glossary: ICE, EOIR, habeas corpus and more · DETNAV',
  metaDesc:
    'What ICE, EOIR, BIA, NTA, bond, credible fear, habeas corpus and other immigration and detention terms mean. Plain definitions, no advice.',
  lede: 'Words that show up in papers, phone calls, and conversations with an attorney. Just definitions — what a term means, not what to do about it.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: 'This is a dictionary, not legal advice',
      body: [
        'The definitions below are general and do not account for a specific case. Some rules differ by state and appellate circuit, and the wording in the law is more precise than this short summary. How a term applies to a particular case is something an attorney determines.',
      ],
    },

    { kind: 'h2', text: 'Who is who' },
    {
      kind: 'terms',
      items: [
        {
          term: 'ICE',
          def: 'Immigration and Customs Enforcement. An agency of the Department of Homeland Security (DHS) that locates, detains, and removes people without legal status inside the country.',
        },
        {
          term: 'ERO',
          def: 'Enforcement and Removal Operations — the part of ICE that carries out arrests, holds people in custody, and organizes removals.',
        },
        {
          term: 'CBP',
          def: 'Customs and Border Protection. Operates at the border, ports, and airports; a separate agency from ICE.',
        },
        {
          term: 'USCIS',
          def: 'U.S. Citizenship and Immigration Services. Processes applications for status — green cards, citizenship, work permits. Does not carry out detentions.',
        },
        {
          term: 'DHS',
          def: 'Department of Homeland Security. The parent agency over ICE, CBP, and USCIS.',
        },
        {
          term: 'EOIR',
          def: 'Executive Office for Immigration Review. Part of the Department of Justice, separate from DHS. Hears removal cases.',
        },
        {
          term: 'Immigration Judge (IJ)',
          def: 'A judge of an EOIR immigration court, appointed by the Department of Justice — not the same thing as a federal judge.',
        },
        {
          term: 'BIA',
          def: 'Board of Immigration Appeals. Hears appeals of an immigration judge’s decisions.',
        },
        {
          term: 'Deportation officer, Officer of Record',
          def: 'The ICE ERO officer assigned to a specific detained person’s case.',
        },
        {
          term: 'Field office',
          def: 'A regional ICE ERO office covering a given area. See the office finder page.',
        },
      ],
    },

    { kind: 'h2', text: 'Detention and status' },
    {
      kind: 'terms',
      items: [
        {
          term: 'A-Number, A-file',
          def: 'A nine-digit number assigned to a person in the immigration system, and the file of documents kept under it. The key to searching ICE and EOIR records.',
        },
        {
          term: 'Detainer (ICE hold)',
          def: 'A request from ICE to a local jail or police department to hold a person for a further period — usually up to 48 hours — past the time they would otherwise be released, so ICE can take custody.',
        },
        {
          term: 'Mandatory detention',
          def: 'Custody with no separate hearing on the possibility of bond, when it applies to a case — for example, under certain criminal grounds (`INA § 236(c)`).',
        },
        {
          term: 'Bond',
          def: 'A monetary payment that secures a person’s release from ICE custody while a case is pending.',
        },
        {
          term: 'Bond hearing',
          def: 'A separate hearing before an immigration judge about the amount of bond, or whether one is set at all.',
        },
        {
          term: 'ATD',
          def: 'Alternatives to Detention — forms of supervision outside a detention facility: an ankle monitor, a check-in app, or scheduled appearances.',
        },
        {
          term: 'ISAP',
          def: 'Intensive Supervision Appearance Program — a private ATD program run under contract with ICE by BI Incorporated.',
        },
        {
          term: 'Check-in',
          def: 'The requirement to periodically report to an ICE office, or check in by phone or app, as part of ATD or after release.',
        },
        {
          term: 'Credible fear interview',
          def: 'An interview with a USCIS officer for a person stopped at the border or re-entering the country, about whether they have a credible fear of persecution at home.',
        },
        {
          term: 'Reasonable fear interview',
          def: 'A similar interview for a person with a prior removal order or certain convictions. The bar to pass it is higher than for credible fear.',
        },
      ],
    },

    { kind: 'h2', text: 'The court process' },
    {
      kind: 'terms',
      items: [
        {
          term: 'Removal proceedings',
          def: 'The EOIR court process deciding whether a person must leave the United States.',
        },
        {
          term: 'NTA, Notice to Appear (Form I-862)',
          def: 'The document that starts removal proceedings: it lists allegations about the person and the charges.',
        },
        {
          term: 'Master calendar hearing',
          def: 'A short administrative hearing: the judge checks the status of the case, sets the next date, and notes whether the person has an attorney.',
        },
        {
          term: 'Individual hearing (merits hearing)',
          def: 'The main hearing on the merits of the case, where evidence is presented and a decision is made.',
        },
        {
          term: 'Continuance',
          def: 'Postponing a hearing to a later date.',
        },
        {
          term: 'In absentia order',
          def: 'A removal order issued when a person did not appear for a scheduled hearing.',
        },
        {
          term: 'Venue',
          def: 'The EOIR court where a specific case is heard. It can change when a person is transferred between detention facilities.',
        },
        {
          term: 'Docket number',
          def: 'The number under which a case is registered with the court.',
        },
      ],
    },

    { kind: 'h2', text: 'Relief and outcomes' },
    {
      kind: 'terms',
      items: [
        {
          term: 'Asylum',
          def: 'A form of protection for a person who cannot return home due to persecution based on race, religion, nationality, political opinion, or membership in a particular social group.',
        },
        {
          term: 'Withholding of removal',
          def: 'A narrower protection than asylum: it bars removal to a specific country but does not lead to a green card.',
        },
        {
          term: 'CAT protection',
          def: 'Protection under the Convention Against Torture — from removal to a country where the person would face torture by, or with the consent of, the government.',
        },
        {
          term: 'Cancellation of removal',
          def: 'Cancels a removal order when certain conditions are met. The rules differ for lawful permanent residents (LPRs) and for others.',
        },
        {
          term: 'Voluntary departure',
          def: 'Permission to leave the U.S. on one’s own and at one’s own expense instead of a forced removal. It can differ from a removal order in its effect on future entry.',
        },
        {
          term: 'Prosecutorial discretion',
          def: 'A decision by ICE or an EOIR prosecutor not to pursue a case further, or to close it, based on agency priorities.',
        },
        {
          term: 'Adjustment of status',
          def: 'Changing status to permanent residence (a green card) without leaving the United States.',
        },
        {
          term: 'Order of removal',
          def: 'The court’s final decision that a person must be removed.',
        },
        {
          term: 'Stay of removal',
          def: 'A temporary postponement of carrying out a removal order.',
        },
        {
          term: 'Motion to reopen, motion to reconsider',
          def: 'A request to have a case reviewed again based on new facts or an error in the decision.',
        },
        {
          term: 'Appeal to the BIA',
          def: 'Challenging an immigration judge’s decision before the Board of Immigration Appeals.',
        },
        {
          term: 'Habeas corpus',
          def: 'A separate case filed in federal district court — not EOIR — about the lawfulness of the detention itself, under `28 U.S.C. § 2241`. Prepared and filed by an attorney.',
        },
      ],
    },

    { kind: 'h2', text: 'Status and documents' },
    {
      kind: 'terms',
      items: [
        {
          term: 'LPR, green card',
          def: 'Lawful Permanent Resident — the status of a permanent U.S. resident.',
        },
        {
          term: 'EAD',
          def: 'Employment Authorization Document — a work permit, separate from a green card.',
        },
        {
          term: 'TPS',
          def: 'Temporary Protected Status — a temporary status for nationals of certain countries it is unsafe to return to (natural disaster, armed conflict).',
        },
        {
          term: 'Naturalization',
          def: 'The process of becoming a U.S. citizen.',
        },
        {
          term: 'Sponsor, petitioner',
          def: 'The person or organization filing a petition on behalf of a relative or worker so they can obtain status.',
        },
      ],
    },

    {
      kind: 'onward',
      related: [
        { page: 'anum', label: 'Where to find the A-Number' },
        { page: 'forms', label: 'Forms and notices: what they are' },
        { page: 'habeas', label: 'Habeas corpus — in detail' },
        { page: 'deadlines', label: 'Not missing a hearing' },
        { page: 'verify', label: 'Check the attorney' },
      ],
    },
  ],
}

export default c
