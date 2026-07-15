#!/usr/bin/env node
// Dry-run of the milestone notifier WITHOUT any secrets or network. Renders the
// reminder lines the notify-milestone Edge Function would send, in ru + es, to
// prove the templating end-to-end. Live delivery (Telegram/Twilio) is
// deploy-gated — it needs Supabase secrets + a project (see supabase/functions).
//
//   npm run milestone-dryrun

import { translations } from '../src/i18n/translations.js'
import { generateMilestones } from '../src/timeline/milestones.js'
import { renderMilestones } from '../src/timeline/render.js'

const SERVICE_DATE = '2026-03-01'
const FILED_DATE = '2026-02-20'
const milestones = generateMilestones({ serviceDate: SERVICE_DATE, petitionFiledDate: FILED_DATE })

for (const lang of ['ru', 'es']) {
  const t = translations[lang]
  console.log(`\n=== ${lang.toUpperCase()} — ${t.milestones.cardTitle} (served ${SERVICE_DATE}) ===`)
  for (const r of renderMilestones(t, milestones)) {
    console.log(`  [${r.dueDate}] ${r.line}`)
  }
}
console.log('\n(Live delivery is deploy-gated — see supabase/functions/notify-milestone/.)')
