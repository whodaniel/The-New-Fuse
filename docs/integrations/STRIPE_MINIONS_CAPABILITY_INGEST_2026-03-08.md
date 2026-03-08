# Stripe Minions Capability Ingest (2026-03-08)

## Why this exists

This document captures actionable platform capabilities inspired by Stripe's
Minions posts and adjacent Stripe agentic developer resources, so TNF AI
sessions can build from persistent context instead of rediscovering patterns.

## Clarification

- Stripe Minions is Stripe's internal engineering pipeline pattern, not a
  publicly available product to directly install.
- TNF can still apply the same architectural pattern: deterministic
  orchestration around delegated coding agents (for example Goose via bridge
  adapters).

## Sources

Primary:

- https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents
- https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2
- https://stripe.dev/blog
- https://docs.stripe.com/agents-billing-workflows
- https://docs.stripe.com/agents

Supplemental extraction mirror (used because Stripe blog article body is
JS-rendered in our CLI fetch path):

- https://www.engineering.fyi/article/minions-stripe-s-one-shot-end-to-end-coding-agents-part-2

## What can be accomplished (TNF-relevant)

1. One-shot end-to-end agent execution:

- Agents can plan and implement multi-file, end-to-end product tasks from a
  single prompt.
- This supports "spec to merged implementation" loops with less human
  choreography.

2. Reliable decomposition + parallelism:

- Minions-style systems emphasize multi-agent decomposition and per-slice
  execution.
- TNF can map this to route/control-surface audits, payment rail work, and
  feature module delivery in parallel streams.

3. Integrated product context:

- Strong outcomes require full-stack context loading (API contracts, DB
  constraints, production guardrails).
- TNF should continue explicit context frontloading before execution phases.

4. Evaluation-first agent productivity:

- Agent coding systems are most useful when wrapped by evaluation loops,
  replayable tests, and measurable quality gates.
- For TNF, tie this to billing webhook tests, entitlement checks, and route
  authorization test matrices.

5. Agent-safe financial operations:

- Stripe agent tooling is powerful but should run with narrow permissions and
  auditable actions.
- TNF should enforce restricted-key patterns and idempotent write paths for all
  money movement flows.

## Implementation mapping in TNF

## Completed in this session

- Unified membership read endpoint added (`/api/billing/membership/:identity`,
  `/api/billing/membership/me`).
- Stripe webhook controller with signature verification and Stripe subscription
  persistence path added.
- Stripe checkout-session creation endpoint added with forced `metadata.userId`
  for deterministic identity linkage.
- AI-ARCADE Cloudflare community worker switched to unified membership endpoint.
- Frontend member-route enforcement moved from auth-only to entitlement-aware
  (`RequireMembership`).

## Next execution backlog

1. Webhook hardening:

- Add replay protection table keyed by Stripe event id.
- Expand webhook verification tests with signed payload fixtures and
  failure-path assertions.

2. Checkout orchestration:

- Wire frontend membership Stripe button to call
  `/api/billing/stripe/checkout-session` directly (instead of static URL) when
  authenticated.
- Auto-attach customer identity and federation metadata.

3. Entitlement projection:

- Materialize provider-agnostic entitlement records (`paypal|stripe|dual`).
- Use entitlement projection for route guard responses and service-level
  authorization.

4. Agentic billing extensions:

- Add Stripe meter-event ingestion for AI token/action usage.
- Add per-agent metered plans and overage handling.

5. Control-surface tests:

- Add automated route-by-route access tests by role + membership state + invite
  state.

## Operating guidance for future AI sessions

When asked to "continue Stripe agentic buildout", load these first:

1. `docs/integrations/STRIPE_AGENTS_BILLING_WORKFLOWS_PLAYBOOK.md`
2. `docs/integrations/STRIPE_MINIONS_CAPABILITY_INGEST_2026-03-08.md`
3. `docs/audits/THENEWFUSE_ROUTE_ENFORCEMENT_TABLE.md`

Then execute in this order:

1. payment integrity (webhooks/idempotency),
2. entitlement consistency,
3. control-surface enforcement,
4. UX and conversion improvements.
