import type { JourneyContent } from '@/lib/types'

const c: JourneyContent = {
  title: 'The road',
  lede: 'Twelve steps after the person is found. This is not your plan — it is a map of the process: we show every step that exists. Six are open, the rest are in the works.',
  soonLabel: 'IN THE WORKS',
  steps: [
    { t: 'Found · where he is', p: 'The facility, the state, the circuit. From here everything becomes concrete.', page: 'where' },
    { t: 'Staying in touch', p: 'The phone account, letters and postcards, books. Why you cannot call in.', page: 'connect' },
    { t: 'Visiting', p: 'Hours, how to sign up, documents, what cannot be brought in.' },
    { t: 'Attorney', p: 'Free, accredited representative, paid. You can search by language.', page: 'attorney' },
    { t: 'How attorney money is counted', p: 'Rates, phases, the retainer, what belongs in the agreement.' },
    { t: 'Documents', p: 'A queue of tasks, one at a time. Phone photos — a clean PDF for the attorney.', page: 'docpack' },
    { t: 'Release paths', p: 'Which mechanisms exist and what works now. The first question for the attorney.' },
    { t: 'Habeas corpus · federal court', p: 'The path release is most often won through now. An attorney prepares and files it.', page: 'habeas' },
    { t: 'Released · what now', p: 'Check-ins, electronic monitoring, change of address. The case continues.' },
    { t: 'The first court hearing', p: 'The master calendar hearing and how it differs from the merits hearing.' },
    { t: 'Do not miss', p: 'Reminders 14, 3, and 1 day ahead. Form EOIR-33 after a move.', page: 'deadlines' },
    { t: 'The long game', p: 'The case runs for months and years. What to keep accumulating all that time.' },
  ],
  tracksTitle: 'Parallel tracks',
  tracks: [
    { t: 'Children', p: 'School, medical consent, what to tell the child. In the works.' },
    { t: 'Family money', p: 'Rent, missed wages, the conversation with the employer. In the works.' },
    { t: 'He was transferred', p: 'A transfer resets the attorney and the phone money. What to redo. In the works.' },
    { t: 'Health', p: 'Medications, chronic conditions, access to medical information. In the works.' },
  ],
  note: 'Unfinished steps are honestly marked "in the works". Seeing the scale of the whole road is useful in itself: the case does not end at release.',
}

export default c
