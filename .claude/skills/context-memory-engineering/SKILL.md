---
name: context-memory-engineering
description: Design reliable agentic systems by separating context engineering (single inference call assembly) from memory engineering (persistent write, store, retrieve, maintain). Use when building multi-step agents, long-running workflows, Claude Code agents with memory, or when agents drop constraints, bleed context, or retrieve poorly. Triggers include context engineering, memory engineering, retrieval boundary, write policy, context window assembly, lost in the middle, agent memory systems.
---

# Context & Memory Engineering for Agentic Systems

Separate two disciplines that are often conflated. Context engineering shapes one inference call. Memory engineering controls what survives across calls. They meet at retrieval. Get both right or agents become unreliable as workflows lengthen.

## Core Distinction

**Context Engineering** — ephemeral, single-call decisions:
- What to include, compress, place, or discard in the current window
- System prompt, task, history, tool outputs, retrieved docs, subagent summaries
- Everything clears when the call ends

**Memory Engineering** — persistent across interactions:
- Write policy, storage, retrieval, maintenance, trust, TTL
- What is written, in what form, under what confidence, and how it is later retrieved and kept accurate

## Context Engineering Rules

### 1. Selective Inclusion
Never dump raw tool output, full search results, or large database rows into the window. Decide at the source:
- Keep only the facts the next reasoning step needs
- Compress everything else immediately after the tool returns
- Drop low-value material before it enters context

### 2. Structural Placement (Lost-in-the-Middle)
Models attend more strongly to the beginning and end of long contexts. Place information deliberately:
- Hard constraints and critical instructions → top of the window
- Most relevant retrieved material → near the end, just before the current task
- Current user query / task → after the relevant retrieved content so both sit close to generation

### 3. Compress on Arrival
Summarize tool outputs and long results the moment they return. Do not wait until the window is full and then truncate reactively.

### 4. Conversation History Management
Full history grows faster than any other component. Apply a defined strategy at intervals:
- Rolling window
- Hierarchical summarization
- Structured state extraction (preferred for facts that must stay reliable)

Never carry the entire history into every call by default.

## Memory Engineering Rules

### 1. Write Policy (Most Overlooked)
Define explicitly before building storage:
- What events trigger a write
- What information is eligible
- Format (raw text, structured records, extracted facts, summaries)
- Confidence / validation requirements
- Which agents or tools may write to which namespaces
- How updates, corrections, and conflicts are handled
- Retention, expiration, TTL per memory type

Without a write policy the store fills with low-value, outdated, equally-trusted entries. Retrieval quality collapses even if the retriever is good.

### 2. Storage Layer
Match backend to purpose:
- Working memory → fast exact key lookup
- Episodic / semantic → vector or hybrid search
- Structured facts that must be reliable → typed state extraction rather than pure retrieval of raw conversation (OpenAI context personalization pattern)

### 3. Retrieval Strategy
Treat retrieval as a multi-stage process:
1. Check working memory first (cheap, exact)
2. Fall back to semantic search only if needed
3. Apply metadata filters (recency, trust level, namespace)
4. Return only what the current step requires

### 4. Memory Maintenance
A store with no maintenance degrades:
- Confidence decay on volatile facts
- Deduplication of near-duplicates
- TTL expiry on time-sensitive and working memory
- Periodic compression of old episodic records into session-level summaries

Encode these concerns in a MemoryEntry schema so write and maintenance logic stay coherent.

## The Retrieval Boundary (Where the Two Disciplines Meet)

Memory produces candidates. Context assembly decides:
- Whether the candidate enters the prompt
- How much of it is included
- Where it is placed inside the window

### Failure Mode 1 — Retrieval Without Context Budget
Retrieving first and injecting everything fills the window with memories, starving instructions, tools, and reasoning space. Symptoms look like “retrieval is good but the agent still fails.”

Fix: allocate a token budget for retrieved material **before** retrieval runs. Retrieve only the highest-value items that fit the budget.

### Failure Mode 2 — Poor Placement of Retrieved Information
Even perfect retrieval fails if the material is dumped in the middle of a long context. The model behaves as if the information is missing.

Fix: place must-use retrieved content near the active reasoning region (near the end, just before the current task).

## Practical Checklist for Claude Code / Agent Builders

When designing or reviewing an agent:

1. Draw a clear line between the current context window and the persistent memory store.
2. Write an explicit write policy before adding any memory store.
3. Compress tool outputs and long results immediately after they arrive.
4. Budget tokens for retrieved memory before calling the retriever.
5. Place critical constraints at the top and high-value retrieved material near the generation point.
6. Prefer structured state extraction for facts that must be applied reliably across sessions.
7. Schedule maintenance (decay, dedup, TTL, compression).
8. Never treat full conversation history as free — manage it deliberately.

## When to Load This Skill

- Designing multi-step or multi-session agents
- Agents that drop constraints mid-workflow or bleed earlier context
- Building memory systems (vector stores, state stores, session summaries)
- Reviewing retrieval quality problems that are actually context-assembly problems
- Creating Claude Code skills or CLAUDE.md files that involve long-running agent behaviour

Keep the two layers aligned: memory decides what is available; context decides what becomes actionable.

## Applied in this project (AccessAtlas)

`docs/project/{STATUS,DECISIONS,HANDOFF,BACKLOG}.md` + `GRAPH.yaml` ARE the memory
store — the write policy is CLAUDE.md's "Source of truth" section (repo is durable,
chat is not) plus `/project-orchestrator`'s Step 6/7 (compact return contract,
DECISIONS.md as append-only log, HANDOFF.md capped near 150 lines as a retrieval
budget). A new session's context assembly is exactly the retrieval boundary this
skill describes: `HANDOFF.md` is the high-value item placed first (near generation),
`domains/*.md` is the fallback semantic layer fetched only on demand, and raw chat
history is deliberately not trusted (Failure Mode 1/2 above map directly onto why
sessions read files instead of relying on carried-over conversation).
