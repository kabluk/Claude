---
name: agentos-council
description: >
  AgentOS Council — implements the Frontier Agent OS methodology: structured
  three-role council (Thinker / Worker / Verifier) that replaces manual
  copy-paste between models. Use when starting any complex task, reviewing
  a deliverable ("roast this"), or auditing agent hygiene (CLAUDE.md bloat,
  context, memory). Triggers: /agentos-council, "convene the council",
  "roast this", "run the council", "council review".
---

# AgentOS Council Skill

Implements the full Frontier Agent OS methodology. Replaces the human-as-messenger
pattern (copy task → paste into model B → carry notes back to model A) with a
deterministic three-role council that runs inside Claude Code's Agent and Workflow
harness.

Core insight: different models cover each other's weak spots. A council fixes
that structurally. The Verifier role is the one that matters most — nothing
ships until a Verifier signs off.

---

## When to Invoke

- Starting any non-trivial task (feature, research, refactor, architecture decision)
- Before shipping any deliverable — to run the Roast pass
- When CLAUDE.md / AGENTS.md exceeds 100 lines — hygiene audit
- When you type: "convene the council", "roast this", "run the council",
  "agentos council", or `/agentos-council [task]`

---

## The Three Roles

| Role | Job | When |
|---|---|---|
| **Thinker** | Decompose task, build plan, find holes in it | Start of session |
| **Worker** | Execute: code, draft, data, deliverable | Middle — one step at a time |
| **Verifier** | "SHIP" or "FIX" — must sign off before delivery | End of every deliverable |

Rule: never bundle multiple distinct jobs into one agent call. One role, one task,
one agent.

---

## Phase 1: Interview (Grill-Me)

Before convening the council, sharpen the task definition. Ask all five at once.

```
Before I convene the council I need five things:

1. What is the concrete deliverable? (code / doc / decision / analysis)
2. What does "done" look like? What is the stop condition?
3. What has already been tried or ruled out?
4. What is the biggest risk or unknown?
5. Are there constraints to treat as hard limits?
```

Do not proceed to Phase 2 until all five are answered. Short answers are fine.
One ambiguous answer → one clarifying question, then move on.

---

## Phase 2: Thinker — Build the Plan

Spawn the Thinker agent with this prompt:

```
You are the Thinker in an AgentOS Council. Your only job is planning.

TASK: {user_task_from_interview}
DELIVERABLE: {deliverable}
STOP CONDITION: {stop_condition}
CONSTRAINTS: {constraints}

Produce:
1. Step-by-step plan (numbered, max 10 steps)
2. For each step: which role executes it (Thinker / Worker / Verifier)
3. Three holes in this plan — things that could go wrong
4. How to verify each step is complete (one line per step)

Return ONLY the plan. No preamble.
```

In a Workflow script:
```javascript
phase('Plan')
const plan = await agent(thinkerPrompt, {
  label: 'thinker:plan',
  phase: 'Plan',
  effort: 'high',
  schema: {
    type: 'object',
    properties: {
      steps: { type: 'array', items: { type: 'string' } },
      roles: { type: 'array', items: { type: 'string' } },
      holes: { type: 'array', items: { type: 'string' } },
      checks: { type: 'array', items: { type: 'string' } }
    },
    required: ['steps', 'holes']
  }
})
```

If any hole is critical: loop back — "Address hole #N before proceeding."

---

## Phase 3: Worker — Execute by Role

One Worker per step. Never bundle. Each Worker gets only the context it needs.

Worker prompt template:
```
You are the Worker in an AgentOS Council. Execute this one task precisely.

STEP: {single_step_from_plan}
CONTEXT: {minimal_context_only}
OUTPUT FORMAT: {exact_format}
STOP WHEN: {step_stop_condition}

Do the work. Return the deliverable only. No explanation, no preamble.
```

Worker rules:
- Browser / scraping work → always a subagent (keeps main context clean)
- Parallel Workers that write files → use `isolation: 'worktree'`
- Heavy work (data processing, image analysis) → subagent, not main context

In a Workflow script:
```javascript
phase('Build')
const results = await pipeline(
  plan.steps,
  (step, _, i) => agent(
    `You are the Worker. Execute step ${i + 1}: ${step}\nContext: ${TASK}\nReturn deliverable only.`,
    { label: `worker:step-${i + 1}`, phase: 'Build' }
  )
)
```

---

## Phase 4: Verifier — Roast Pass

After Worker delivers, spawn the Verifier with an adversarial prompt:

```
You are the Verifier in an AgentOS Council. Your job is to find failures.

DELIVERABLE:
{worker_output}

ORIGINAL TASK: {task}
STOP CONDITION: {stop_condition}

Adversarially review this. Try to break it. Find gaps, wrong assumptions,
missing edge cases, security issues, vague claims, unmet requirements.

Output exactly one of:
  VERDICT: SHIP — one-line reason why it's complete
  VERDICT: FIX  — numbered list of specific issues to address

Default to FIX if uncertain. Be a harsh critic. The work is not done
until you say SHIP.
```

Loop logic:
```javascript
phase('Verify')
let output = results.filter(Boolean).join('\n\n')
let iterations = 0

while (iterations < 3) {
  const verdict = await agent(verifierPrompt(output, TASK, STOP_CONDITION), {
    label: `verifier:round-${iterations + 1}`,
    phase: 'Verify',
    effort: 'high',
    schema: {
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['SHIP', 'FIX'] },
        issues: { type: 'array', items: { type: 'string' } },
        reason: { type: 'string' }
      },
      required: ['verdict']
    }
  })

  if (verdict.verdict === 'SHIP') {
    log(`Verifier: SHIP — ${verdict.reason}`)
    break
  }

  log(`Verifier: FIX — ${verdict.issues?.length ?? 0} issues. Re-running Worker.`)
  output = await agent(
    `Fix these issues in your prior output:\n${verdict.issues?.join('\n')}\n\nPRIOR OUTPUT:\n${output}`,
    { label: `worker:fix-${iterations + 1}`, phase: 'Verify' }
  )
  iterations++
}

// If 3 iterations and still FIX → escalate to user
if (iterations >= 3) {
  log('Council could not reach SHIP after 3 iterations. Escalating to user.')
}
```

---

## Phase 5: Agent Hygiene Checks

Run at the end of every council session.

### CLAUDE.md / AGENTS.md Lint

```bash
wc -l CLAUDE.md 2>/dev/null || wc -l AGENTS.md 2>/dev/null
```

If > 100 lines: flag to user. Rules must be: one line, one meaning, no ambiguity.
Models follow ~150-200 instructions reliably — keep well under that ceiling.

### Context Budget

If context is approaching 300k–400k tokens: recommend `/clear` and create checkpoint.

Checkpoint format — append to `learnings.md`:
```markdown
## Checkpoint {date}

- **Task**: {what was being worked on}
- **Status**: {where we are}
- **Next step**: {first thing to do in fresh context}
- **Key decisions**: {list}
- **Files modified**: {list}
```

### Memory File Structure

Recommend maintaining in project root:
- `learnings.md` — updated at end of each session
- `checkpoints.md` — resumption points for long tasks
- `decisions.md` — architectural decisions with rationale (optional)

---

## Six Hygiene Rules (Always Enforce)

| Rule | Check |
|---|---|
| Build own skills | Never suggest downloading a skill library |
| CLI-first | Prefer small CLIs over MCP servers for tool access |
| Light instructions | CLAUDE.md < 100 lines at all times |
| File-based memory | learnings.md + checkpoints, not just context |
| Plain rules | One line, one meaning, no ambiguity |
| Delegate to subagents | Heavy / browser work never in main context |

---

## Full Workflow Template

Drop this into the Workflow tool for any complex task:

```javascript
export const meta = {
  name: 'agentos-council-task',
  description: 'Three-role council: Thinker plans, Worker builds, Verifier signs off',
  phases: [
    { title: 'Plan', detail: 'Thinker decomposes task and finds holes' },
    { title: 'Build', detail: 'Worker executes each step independently' },
    { title: 'Verify', detail: 'Verifier roasts the deliverable, loops until SHIP' },
  ],
}

// args: { task, deliverable, stopCondition, constraints }
const TASK = args.task
const DELIVERABLE = args.deliverable
const STOP = args.stopCondition
const CONSTRAINTS = args.constraints ?? 'none'

// ── Phase 1: Thinker ─────────────────────────────────────────────────────────
phase('Plan')
const plan = await agent(`
You are the Thinker in an AgentOS Council. Your only job is planning.

TASK: ${TASK}
DELIVERABLE: ${DELIVERABLE}
STOP CONDITION: ${STOP}
CONSTRAINTS: ${CONSTRAINTS}

Return:
1. Numbered plan (max 10 steps)
2. Role for each step (Thinker / Worker / Verifier)
3. Three holes in this plan
4. One-line completion check per step
`, {
  label: 'thinker',
  phase: 'Plan',
  effort: 'high',
  schema: {
    type: 'object',
    properties: {
      steps: { type: 'array', items: { type: 'string' } },
      roles: { type: 'array', items: { type: 'string' } },
      holes: { type: 'array', items: { type: 'string' } },
      checks: { type: 'array', items: { type: 'string' } }
    },
    required: ['steps', 'holes']
  }
})

log(`Plan: ${plan.steps.length} steps | Holes: ${plan.holes.join(' / ')}`)

// ── Phase 2: Worker ──────────────────────────────────────────────────────────
phase('Build')
const results = await pipeline(
  plan.steps,
  (step, _, i) => agent(
    `You are the Worker in an AgentOS Council. Execute this one step.\n\nSTEP ${i + 1}: ${step}\nTASK CONTEXT: ${TASK}\n\nReturn the deliverable only. No preamble.`,
    { label: `worker:step-${i + 1}`, phase: 'Build' }
  )
)

// ── Phase 3: Verifier ────────────────────────────────────────────────────────
phase('Verify')
let output = results.filter(Boolean).join('\n\n---\n\n')
let shipVerdict = null

for (let i = 0; i < 3; i++) {
  const v = await agent(`
You are the Verifier in an AgentOS Council. Find failures.

DELIVERABLE:
${output}

ORIGINAL TASK: ${TASK}
STOP CONDITION: ${STOP}

Try to break it. Find gaps, wrong assumptions, missing cases, unmet requirements.

Output VERDICT: SHIP (one-line reason) or VERDICT: FIX (numbered issue list).
Default to FIX if uncertain.
`, {
    label: `verifier:round-${i + 1}`,
    phase: 'Verify',
    effort: 'high',
    schema: {
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['SHIP', 'FIX'] },
        issues: { type: 'array', items: { type: 'string' } },
        reason: { type: 'string' }
      },
      required: ['verdict']
    }
  })

  if (!v) break

  if (v.verdict === 'SHIP') {
    shipVerdict = v
    log(`Verifier SHIP: ${v.reason}`)
    break
  }

  log(`Verifier FIX round ${i + 1}: ${v.issues?.length ?? 0} issues`)

  output = await agent(
    `Fix these specific issues in your prior output:\n${v.issues?.map((x, j) => `${j + 1}. ${x}`).join('\n')}\n\nPRIOR OUTPUT:\n${output}`,
    { label: `worker:fix-${i + 1}`, phase: 'Verify' }
  ) ?? output
}

return {
  plan,
  output,
  shipped: !!shipVerdict,
  shipReason: shipVerdict?.reason ?? 'Max iterations reached — escalate to user'
}
```

---

## Examples

### Example 1: Feature implementation

```
User: /agentos-council implement JWT authentication

Interview:
  Deliverable: REST endpoints + middleware
  Done when: tests pass, refresh token endpoint exists
  Tried: none
  Risk: token storage on client side
  Constraints: Express.js, PostgreSQL

Council runs:
  Thinker  → 7 steps: schema → register → login → middleware → refresh → logout → tests
  Worker   → one subagent per step
  Verifier → FIX: "Missing rate limiting on /login, no token blacklist on logout"
  Worker   → adds rate limiting + blacklist table
  Verifier → SHIP: "All auth flows covered, edge cases handled"
```

### Example 2: Research deliverable

```
User: /agentos-council research vector DB options for our scale

Interview:
  Deliverable: scored comparison matrix + recommendation
  Done when: 5 DBs compared on 4 criteria, one recommended
  Tried: looked at Pinecone docs only
  Risk: latency benchmarks are synthetic, not real-world
  Constraints: self-hosted preferred, < $500/mo

Council runs:
  Thinker  → plan: define criteria → survey 5 DBs → score matrix → recommend
  Worker   → parallel agents: Pinecone / Weaviate / Qdrant / Chroma / pgvector
  Verifier → FIX: "Chroma entry uses outdated v0.3 API, latency numbers missing"
  Worker   → updates Chroma entry, adds latency data
  Verifier → SHIP
```

### Example 3: CLAUDE.md hygiene audit

```
User: /agentos-council audit our CLAUDE.md

(No interview needed — self-contained hygiene task)

Council runs:
  Thinker  → reads file, counts lines, finds vague/duplicate rules
  Worker   → produces trimmed version: plain one-line rules, no overlap
  Verifier → checks: < 100 lines? All rules unambiguous? No contradiction?
  Verifier → FIX: "Rule 12 and Rule 17 are redundant, Rule 4 is ambiguous"
  Worker   → merges Rule 12+17, rewrites Rule 4
  Verifier → SHIP (89 lines, all rules clear)
```

### Example 4: Roast a PR before merging

```
User: /agentos-council roast this PR before I merge

(Attach the diff or describe changes)

Council runs:
  Thinker  → identifies what the PR claims to do and the review criteria
  Verifier → adversarially reviews diff (security, correctness, edge cases)
  Output   → SHIP with minor suggestions, or FIX list before merge
```

---

## Anti-Pattern Reference

| Wrong Default | Better Move | What It Saves |
|---|---|---|
| Chase the latest model | Merge via council | Reliability — best model keeps getting gated |
| Download skill libraries | Build your own | Security & relevance |
| Heavy MCP servers | Small CLIs | Context space |
| Stuffed CLAUDE.md | < 100 lines | Model adherence |
| Keep everything in context | File-based memory + checkpoints | Clarity across sessions |
| Vague rules | Plain, one-meaning rules | Consistency |
| One big agent call | Delegate by role, one step per agent | Quality & debuggability |
| Human as messenger | Council coordinates itself | Speed & reliability |

---

## Quick Reference

```
/agentos-council [task description]

Phases:
  1. Interview   — 5 questions to sharpen the task
  2. Thinker     — plan + 3 holes identified
  3. Worker      — one agent per step, minimal context
  4. Verifier    — SHIP or FIX (max 3 loops, then escalate)
  5. Hygiene     — CLAUDE.md lint + checkpoint if needed

Non-negotiables:
  - Verifier must sign off. Always.
  - Worker gets only the context it needs.
  - Browser / heavy work → always a subagent.
  - CLAUDE.md stays under 100 lines.
  - Context > 350k tokens → /clear + append to learnings.md.
```
