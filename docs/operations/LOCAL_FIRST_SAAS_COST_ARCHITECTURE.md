# TNF Local-First / User-Funded SaaS Cost Architecture

> **Status:** Active cost and scaling policy
>
> **Updated:** 2026-08-20
>
> Machine-readable companion: `data/operations/cloud-cost-policy.json`

## Governing rule

TNF is a local-first harness. The SaaS layer is an acceleration, persistence,
sharing, and managed-execution layer — not a prerequisite for the framework to
function.

**No metered cloud workload should become active merely because TNF is installed,
a repository changes, or a user account exists.** A paid route is eligible only
when all of these are true:

1. the requested capability cannot be satisfied acceptably by local/self-hosted
   capacity or an included/free allowance;
2. the user/workspace is entitled to the capability;
3. an explicit budget envelope exists and has remaining funds;
4. the selected provider route is the least expensive compatible route known at
   decision time;
5. a provider-side hard limit or bounded concurrency/instance policy exists;
6. usage is attributable to the tenant/workspace and produces a receipt.

Entitlement must be checked before enqueue **and again before execution**. This
prevents a queued job from consuming money after a subscription is cancelled,
a budget is exhausted, or routing policy changes.

## Organic scaling ladder

### Tier 0 — local / OSS

Default for developers and self-hosted users. Use the TNF CLI, relay, local
schedulers/launchd, browser tooling, local databases/caches where appropriate,
and user-owned model/provider credentials. Cloud spend is zero unless the user
explicitly opts into a hosted capability.

### Tier 1 — shared free/included capacity

A hosted TNF account may use shared provider free/included quotas for light
control-plane traffic. Exhausting a free quota must degrade gracefully, defer,
or ask for an upgrade; it must not silently cross into billable usage.

### Tier 2 — metered, user-funded SaaS

Paid subscriptions/workspace credits unlock metered routes. TNF records an
estimated cost before execution, applies a tenant hard limit, and records actual
usage afterward. Bursty workloads stay on request/step/command-priced services
that scale to zero.

### Tier 3 — reserved / enterprise

Dedicated or fixed capacity is justified only after observed utilization shows
it beats usage-based pricing, or an SLA/compliance/isolation contract requires
it. Revenue should precede the reservation whenever practical.

## Provider roles — 2026-08-20 baseline

This is a routing baseline, not vendor lock-in. Provider capabilities and prices
must be refreshed before major commitments.

### Cloudflare — edge, session coordination, AI traffic control

Prefer Cloudflare for public ingress, caching/rate limiting, lightweight edge
logic, WebSockets/session coordination, and Durable Objects where a room/session
needs a single strongly coordinated actor. Hibernating Durable Objects are a
particularly useful shape for TNF because idle eligible objects do not incur
compute-duration charges.

Workers AI is attractive for small/serverless inference and experimentation,
but model-by-model price/quality must be compared with direct providers before
routing production traffic. AI Gateway's core analytics, caching, and rate
limiting are useful even when inference remains with another provider.

Do **not** enable AI Gateway Unified Billing by default: it adds a credit fee.
Use it only when centralized prepaid billing/operations are worth that premium.
Workers for Platforms becomes interesting when TNF hosts large numbers of
isolated user scripts because it supports per-user Worker CPU limits, but its
monthly platform fee means it belongs after real paid demand, not before it.

### Supabase — shared system of record

Prefer one shared, RLS-isolated multi-tenant Postgres project for application
state rather than one Supabase project per tenant. Each hosted Supabase project
has dedicated compute, so project-per-customer creates a fixed cost floor that
works against organic scaling.

Use Postgres/RLS for users, organizations, subscriptions, entitlements, usage
receipts, durable jobs, and idempotency metadata. Before adding another paid
service, evaluate native Postgres modules already available in the stack:

- Supabase Queues / `pgmq` for durable background messages;
- Cron / `pg_cron` for database-adjacent schedules;
- `pg_net` + Edge Functions for short HTTP work;
- `pgvector` for semantic/hybrid retrieval when Postgres is already the source
  of truth.

This reduces service duplication and cross-provider egress. Edge Functions are
best for short-lived request/webhook/database-adjacent work, not a substitute
for long-running agent compute.

### Upstash — bursty coordination and durable delivery

Prefer usage-based Redis when traffic is intermittent; revisit fixed Redis only
when measured command volume reaches the fixed-plan break-even point. Keep Redis
for ephemeral coordination, hot state, leases, rate counters, and caches — not
as the canonical billing ledger.

Use QStash for cheap durable HTTP delivery, retries, and delayed messages. Use
Upstash Workflow when multi-step sleeping/retrying workflows save us from
running an always-on worker. Both align well with a user-funded model because
cost maps naturally to messages/steps.

Treat Upstash Vector/Search as optional accelerators. If Supabase pgvector or
Postgres full-text/hybrid search already satisfies the workload, do not pay to
maintain duplicate indexes. Upstash Box is worth benchmarking for short-lived
isolated compute because it charges active CPU time, but it should compete with
Cloud Run on measured workload economics rather than become a default.

### Google Cloud — scale-to-zero container execution

Cloud Run is the preferred escape hatch when a TNF workload needs a real
container, native dependencies, longer execution, or stronger workload
isolation than edge functions provide. Start with request-based billing,
minimum instances at zero, bounded maximum instances, and the highest safe
request concurrency. This preserves scale-to-zero economics and prevents a
traffic spike from turning into an unbounded bill.

Move to instance-based billing or committed capacity only after measured steady
traffic shows it is cheaper. GPU routes are paid-capability routes and require a
per-tenant budget gate.

Vertex AI Agent Engine is an **optional adapter**, not TNF's orchestration core.
It now meters runtime plus services such as code execution, sessions, and memory
features separately. Use it only when a paying workload specifically benefits
from those managed capabilities enough to justify the extra metering.

## Request routing model

Every hosted execution request should resolve through the following policy:

```text
request
  -> capability classifier
  -> local/self-hosted available? -------- yes -> local route
  -> entitlement check
  -> included/free quota available? ------ yes -> shared-free route
  -> enumerate compatible paid routes
  -> estimate route cost + latency + durability/isolation score
  -> choose cheapest route satisfying SLO
  -> tenant budget check
  -> provider hard-limit check
  -> durable enqueue with idempotency key
  -> entitlement + budget recheck at execution time
  -> execute
  -> actual usage/cost receipt
  -> reconcile estimate vs actual
```

The router should optimize **cost subject to capability/SLO constraints**, not
cost in isolation. A route that loses required durability or creates a security
boundary failure is not cheaper.

## Billing and denial-of-wallet rules

Hosted TNF needs separate ledgers for entitlement and usage. Subscription tier
answers "may this workspace use the feature?" while the usage ledger answers
"how much may this workspace spend right now?" Never infer one from the other.

At minimum every metered execution carries:

- tenant/workspace and user attribution;
- capability and provider/SKU route;
- idempotency key;
- estimated cost;
- hard budget remaining before execution;
- provider request/run identifier;
- actual metered units and reconciled cost;
- outcome/refund/credit status where applicable.

Set provider-level maximum concurrency/instances/CPU where available in addition
to TNF's own limits. Tenant rate limiting alone is insufficient protection
against software loops, credential compromise, or aggregate multi-tenant spikes.

## GitHub's role

GitHub is source control and collaboration infrastructure, not TNF compute.
Automatic GitHub-hosted jobs should be limited to small, path-scoped correctness
or security gates that provide unique merge-time value. The following require
explicit dispatch or self-hosted/local execution:

- full builds and broad test matrices;
- browser crawls and semantic audits;
- framework/intelligence evolution jobs;
- recurring repository graph/mention/history jobs;
- provider-billed AI reviews;
- routine publication (the local `sync:repos` path remains authoritative).

Do not introduce a new scheduled GitHub-hosted workflow without an explicit
cost justification and owner approval.

## Provider review cadence

Provider pricing and AI products change too quickly to bake permanent vendor
assumptions into code. Maintain provider adapters behind TNF capability
contracts, record the date/pricing basis used by routing policy, and perform a
fresh comparison before:

- enabling a new billable provider feature;
- moving a workload from free/usage-based to fixed capacity;
- signing a commitment;
- adding a duplicate database, queue, vector store, or scheduler;
- changing the default AI inference route.

The desired outcome is not "use every platform." It is **compose the fewest
metered services necessary to deliver the greatest reliable capability, and let
revenue pull infrastructure into existence rather than infrastructure costs
running ahead of revenue.**

## Current implementation follow-ups

1. Make the canonical control-plane executor (#113) consume this policy before
   enqueue and before execution.
2. Keep the extension/satellite contract (#114) provider-neutral so user-funded
   capabilities can select routes dynamically.
3. Add provider usage adapters that normalize actual units/cost receipts into a
   common TNF usage ledger.
4. Add dashboards/alerts for tenant budget, provider free-tier saturation,
   aggregate spend, estimate-vs-actual drift, and unit economics per capability.
5. Keep direct/local execution as a first-class fallback rather than treating
   SaaS availability as framework availability.

## Source refresh notes (official docs checked 2026-08-20)

Pricing numbers are intentionally not hard-coded into runtime decisions in this
document. The router should load versioned policy/config because provider prices
change. At this review the important economic shapes were:

- Cloudflare Workers: free tier plus a low-minimum paid plan; no Workers data
  transfer/throughput charge in the standard paid pricing model.
- Cloudflare Durable Objects: free/paid SQLite-backed objects; eligible idle
  objects can hibernate without duration billing.
- Cloudflare Workers AI: daily free allocation plus neuron-based usage pricing.
- Cloudflare AI Gateway: core analytics/caching/rate limiting free; Unified
  Billing adds a credit fee.
- Upstash Redis/QStash/Workflow: free allowances plus fine-grained usage-based
  pricing, well suited to bursty workloads.
- Supabase: a shared paid organization/project can absorb many tenants, whereas
  every additional project introduces dedicated compute cost; Edge Function
  overage is invocation-based.
- Cloud Run: scale-to-zero and 100ms-granularity pay-per-use; maximum instances
  and billing mode are explicit cost levers.
- Vertex AI Agent Engine: managed agent runtime features are separately metered,
  so they must remain opt-in behind TNF capability routing.
