# Continuous Ecosystem Scouting Program

**Status:** active  
**Updated:** 2026-08-20  
**Related:** #119

## Goal

TNF must continuously understand the capabilities, economics, interoperability surfaces, business programs, and operational risks of the ecosystems around it without turning that research process into another uncontrolled cloud bill.

Scouting is therefore **local-first, evidence-driven, stale-aware, and material-change oriented**.

## Scout domains

1. **Agent platforms** — ChatGPT/Codex, Claude/Cowork/Claude Code, Gemini/Spark, Cursor, GitHub Copilot, OpenCode, Windsurf, and newly discovered systems.
2. **Agent protocols/harnesses** — MCP, A2A-style protocols, skills/plugin systems, browser-control systems, workflow engines, agent SDKs, sandboxes, memory systems, evaluation/observability systems.
3. **Infrastructure** — GCP, Cloudflare, Supabase, Upstash and lower-cost/emerging alternatives for compute, queueing, storage, databases, edge/session coordination, browser execution, vector/search, auth, billing, observability, and communications.
4. **Revenue channels** — affiliate, referral, reseller, channel, marketplace, co-sell, partner credits, startup programs, sponsorships, and integration programs.
5. **Limits and risks** — pricing changes, free-tier changes, concurrency limits, retention/privacy changes, deprecations, export controls, vendor lock-in, minimum-spend changes, and surprise-billing risks.

## Evidence hierarchy

Prefer, in order:

1. official product documentation/help center;
2. official product announcement/blog;
3. official partner/program page or terms;
4. provider staff statement in an official forum/community;
5. trustworthy secondary source when no primary source exists.

Every stored claim records a source and verification date. Secondary-only claims must be visibly marked.

## Material-change test

A scouting observation is material if it changes one or more of:

- TNF's cheapest safe provider route;
- a capability TNF can expose or integrate;
- an interoperability path;
- a user's ability to exchange state between agent systems;
- a provider hard-limit or billing-risk assumption;
- a partner/affiliate revenue opportunity;
- a program's eligibility or payout economics;
- a build-vs-buy decision;
- a planned TNF feature or priority.

Do not generate issues or operator noise for cosmetic announcements.

## Local tooling

Run:

```bash
node scripts/scouting/build-scout-queue.cjs
```

The script reads:

- `data/business/revenue-channel-registry.json`
- `data/agent-ecosystem/platform-capabilities.json`

and writes due/stale priority queues to `reports/scouting/`.

The script itself does no paid AI inference and requires no GitHub Actions. It can be run by a local TNF agent, operator, or self-hosted scheduler.

## Scouting run receipt

Every substantive scout run should record:

- scout ID;
- start/end timestamps;
- domains searched;
- sources inspected;
- material findings;
- registry records changed;
- issues created/updated;
- unresolved unknowns;
- estimated or actual paid cost (normally zero for research control plane);
- agent/platform that performed the scout.

Receipts should use the cross-agent activity model where practical so a scout performed in Gemini Spark, Codex, Claude Cowork, Cursor, or TNF can be understood by the other systems.

## Scheduling policy

- Use TNF/local scheduling by default.
- Use provider-native scheduled actions when they are already included in the user's subscription and offer unique access to that provider's own connected context.
- Do not duplicate the same recurring research across multiple paid agent platforms unless the diversity is deliberate and budgeted.
- Prefer complementary scout assignments: one agent explores platform capabilities, another validates economics/partner terms, another tests interoperability.
- When a provider-native schedule discovers something material, ingest a concise receipt into TNF rather than continuously copying full result histories.

## Scout portfolio

### Fast-moving agent capability scout

Cadence: twice weekly by default.

Questions:

- What new task, schedule, monitor, memory, skills, app-action, MCP, API, plugin, background-agent, or multi-agent feature appeared?
- Can TNF discover or invoke it programmatically?
- Can it publish a capability/activity receipt into TNF?
- Did limits, pricing, privacy, approval, or data-retention semantics change?

### Revenue and partner scout

Cadence: weekly by default.

Questions:

- Which existing TNF dependencies now offer an affiliate/referral/partner channel?
- Which adjacent tools offer meaningful revenue share or credits?
- Did a program close, open, change payouts, change eligibility, or add marketplace/co-sell options?
- Is there a user-beneficial integration TNF could build that also creates sustainable revenue?

### Infrastructure cost scout

Cadence: weekly; already represented by the provider-cost watch established after #117.

Questions:

- What free-tier/pricing changes alter the routing curve?
- What new serverless/scale-to-zero capability makes an existing dependency unnecessary?
- What new hard-limit/budget feature reduces billing risk?

## Discovery expansion

Every scout may nominate new providers/platforms. A candidate graduates into the tracked registry when it has at least one of:

- a capability TNF lacks or can expose more cheaply;
- significant user adoption/relevance;
- an interoperability standard TNF should support;
- a material revenue/distribution channel;
- a credible path to lower COGS;
- a strategic risk if TNF ignores it.

## Anti-lock-in rule

Scouting should make TNF **more** vendor-independent over time. New discoveries should be translated into capability contracts and provider adapters rather than hard-coded product dependencies wherever practical.
