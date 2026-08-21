# 2026-08-20 Revenue + Agent Ecosystem Implementation Receipt

**Canonical repo:** `whodaniel/tnf-monorepo`  
**Parent baseline:** `f6be506774ef57537dd899d9757ee2ed48fee511` (#117)  
**Working branch:** `feat/revenue-agent-ecosystem-intelligence`  
**Umbrella:** #119  
**Related:** #113, #118, #120, #121

## Operator priority received

Treat local-first/user-funded SaaS economics, ecosystem intelligence, partner/referral revenue, and cross-agent awareness as a top TNF priority. Implement as much as possible immediately, keep work well logged, keep docs current, and continue exploratory scouting.

## Implemented in this branch

### Revenue/business intelligence

- Added `data/business/revenue-channel-registry.json` with dated, source-attributed program records and anti-bias/disclosure policy.
- Added `docs/business/TNF_REVENUE_AND_PARTNER_OPERATING_PLAN.md` consolidating SaaS, metered, services, marketplace, partner, affiliate, and COGS strategy.
- Opened #120 for application readiness and execution.
- Initial verified/high-value program signals include Google Cloud, Cloudflare, Supabase, Upstash, OpenAI, Anthropic, GitHub, Netlify, Railway, DigitalOcean, Vercel, and Cursor watch state.

### Executable cost policy

- Added `packages/control-plane-contracts/src/cost-policy-utils.ts`.
- Deterministic compatible-route ranking now expresses TNF policy in code: local first, then free/included quota, then least-cost metered route.
- Paid routes fail closed without entitlement, tenant budget, and provider hard-limit protection.
- Budget exhaustion defers rather than silently overspending.
- Added focused tests under `packages/control-plane-contracts/tests/` and made package test build/run them.
- Added durable database migration `20260820000100_add_metered_execution_and_agent_activity_ledgers.sql` with budget envelopes, pre-enqueue/pre-execution authorization records, normalized usage receipts, cross-agent instance snapshots, and cross-agent activity receipts.
- Tenant/workspace-scoped ledger tables enable and FORCE RLS without broad end-user policies, so ordinary database roles fail closed until the canonical authorization helper/policies are explicitly installed. Privileged hosted executor access remains a server-side concern.
- Full executor enforcement remains coordinated with #118/#113; this branch provides the reusable policy and durable schema but does not claim the stale downstream executor is fixed.

### Cross-agent ecosystem awareness

- Preserved existing `data/agent-registry/*` as the persona/agent registry rather than creating a competing store.
- Added `data/agent-ecosystem/platform-capabilities.json` for source-attributed platform-level capability truth.
- Added public `AgentInstanceSnapshot`, `AgentActivityReceipt`, adapter, connector, schedule, and ledger contracts in `packages/control-plane-contracts/src/agent-interop.ts`.
- Added language-neutral JSON schemas.
- Added `docs/protocols/CROSS_AGENT_CAPABILITY_ACTIVITY_LEDGER.md`.
- Added local `scripts/agent-registry/agent-activity-ledger.cjs` with snapshot upsert, idempotent receipt ingest, secret-like-field rejection, receipt query, status, and compact orientation output. Default storage is private operator-local `~/.tnf/agent-activity`.
- Added hosted durable storage tables for the same snapshot/receipt model so local and SaaS modes can share the public contract rather than diverging.
- Opened #121 for Gemini Spark, Claude/Cowork/Claude Code, ChatGPT/Codex, and Cursor adapters plus Turn Zero orientation projection.

### Scouting

- Added `scripts/scouting/build-scout-queue.cjs`, which converts registry verification dates/priorities into a local zero-inference stale-aware scout queue.
- Added `docs/operations/CONTINUOUS_ECOSYSTEM_SCOUTING.md` with evidence hierarchy, material-change test, domains, cadence, and anti-lock-in rules.
- External recurring scouts established separately for agent ecosystems and revenue programs, complementing the existing provider-cost watch.

## Important current platform observations

- Gemini Spark now documents persistent tasks, time schedules, Gmail-filter monitors, topic monitors, skills, Workspace actions, and custom Connected Apps through MCP server URLs. This makes Spark a priority TNF MCP/receipt integration target.
- Gemini Scheduled Actions are a separate product surface and should not be conflated with Spark Schedules.
- Codex documents parallel worktrees/agents, skills, scheduled/background work, plugins/apps, and mobile supervision.
- Claude connectors are MCP-powered and can expose both context and authorized actions, aligning well with TNF adapter contracts.
- Cursor background agents expose GitHub branch workflows and an API for programmatic background agents, but usage is metered and must fall under TNF cost authority when TNF pays.

## Revenue observations requiring concrete follow-up

Direct affiliate/revenue-share signals are currently strongest/easiest to quantify for:

- Google Cloud Affiliate;
- Railway Affiliate;
- DigitalOcean Affiliate / Partner Services;
- Netlify Partners.

Strategic integration/co-sell/distribution paths are currently strongest for:

- Cloudflare;
- Supabase;
- OpenAI;
- Anthropic;
- GitHub;
- Upstash.

Vercel legal affiliate terms are confirmed, but current program guidelines/fee schedule still need explicit verification before economics are modeled. Cursor referral revenue should currently be treated as unavailable/watch-only based on provider-staff reporting.

## Guardrails

- Never route a user to a provider solely because TNF can earn commission.
- Disclose material referral/partner relationships.
- Never put provider/user secrets into capability or activity ledgers.
- Avoid automatic paid polling to keep agent systems synchronized.
- Prefer events, local callbacks, TNF local scheduling, and included APIs before metered synchronization.
- Treat public platform docs as platform truth only; enabled per-user capabilities require instance evidence.

## Next implementation frontier

1. merge this branch after review/build validation;
2. integrate cost-policy utilities + durable authorization/usage writes into the canonical real executor under #113/#118;
3. expose TNF MCP endpoints for cross-agent snapshot/receipt publish/query;
4. implement Gemini Spark first because custom MCP Connected Apps are documented now;
5. install narrowly scoped hosted RLS policies only after canonical auth/workspace helper semantics are verified;
6. complete #120 application-readiness artifacts and begin the highest-fit partner applications;
7. expand capability and revenue registries through scheduled scout receipts rather than ad hoc memory.
