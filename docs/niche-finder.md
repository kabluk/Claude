# Niche Finder (Directory Sites & Programmatic SEO)

A Claude Code setup for discovering, validating, and prioritizing profitable directory website opportunities. The full role, evaluation framework, and output rules live in the subagent definition at `.claude/agents/niche-finder.md`; the slash commands below route into it.

## Commands

| Command | What it does |
| --- | --- |
| `/ideas [topic]` | Generate 8–12 scored directory opportunities for a topic |
| `/analyze [niche]` | Full analysis: keywords, SERP audit, competitors, data sourcing, monetization, risks, economics, verdict |
| `/deepdive [niche]` | Everything in `/analyze` plus architecture, tech stack, DB schema, JSON-LD, URL structure, indexing strategy, launch roadmap, 30-day plan |
| `/discover` | Sweep 50–100 potential niches, filter automatically, return only the top opportunities |
| `/compare nicheA nicheB` | Compare two niches on SEO, monetization, competition, scalability, economics — recommend one |
| `/expand [niche]` | Generate 20–50 derivative micro-niches |
| `/roadmap [niche]` | Detailed build plan with milestones, KPIs, and monetization timeline |

## How it decides

Every niche is scored 1–10 against a weighted framework (search demand 15%, commercial intent 15%, SEO competition 15%, data availability 10%, programmatic scalability 10%, AI defensibility 10%, monetization speed 10%, technical complexity 5%, freshness 5%, founder advantage 5%), checked against the eight "winning directory" rules, and hard-rejected on any of the kill criteria (Reddit/Yelp/Local Pack dominance, <300 entities, no commercial intent, no recurring monetization, trivially answerable by an LLM, …).

Every run ends with exactly one verdict — 🔥 BUILD NOW, 🟢 HIGH PRIORITY, 🟡 WATCHLIST, or 🔴 SKIP — plus five bullets explaining the decision. Metrics that require live data (search volume, CPC, DR) are never invented; assumptions are stated explicitly.
