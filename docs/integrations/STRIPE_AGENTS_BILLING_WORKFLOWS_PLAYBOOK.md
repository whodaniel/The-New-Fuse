# Stripe Agents Billing Workflows Playbook (TNF)

Last updated: 2026-03-08

## Objective

Use Stripe and PayPal together without breaking current TNF membership
operations:

- Keep PayPal as the existing recurring membership rail for `thenewfuse.com`.
- Add Stripe as an additional rail for agentic billing workflows, usage
  metering, and automation.

## Source Docs

- https://docs.stripe.com/agents-billing-workflows
- https://docs.stripe.com/agents
- https://docs.stripe.com/agents/quickstart
- https://docs.stripe.com/get-started/use-cases/usage-based-billing

## What Stripe Adds Beyond Current PayPal Flow

1. Agent-native function/tool calling:

- Stripe Agent Toolkit supports OpenAI Agents SDK, Vercel AI SDK, LangChain, and
  CrewAI.
- This enables agents to create and manage payment objects (for example payment
  links, subscriptions) under controlled tool permissions.

2. Usage-based billing for AI products:

- Meter-based billing for input/output usage and overages.
- Better fit for AI workloads than flat recurring subscriptions alone.

3. Better agent observability and control surface:

- Explicit meter events and billing middleware patterns for LLM usage.
- Stronger model for per-agent and per-feature monetization.

## Security Baseline For Agentic Stripe Use

1. Use restricted keys (`rk_*`) for agent tool execution.
2. Keep secret keys server-side only.
3. Validate webhooks cryptographically and store idempotency keys.
4. Start in Stripe sandbox and run eval/test loops before live rollout.

## TNF Coexistence Model (PayPal + Stripe)

## Rail split

- PayPal (existing):
  - TNF core membership subscription status (`active member`) and community
    submit/vote/comment gating.

- Stripe (new):
  - Agentic usage billing (token or action meters).
  - Optional secondary checkout rail on membership page.
  - Future add-ons: per-agent subscriptions, credits, and enterprise plans.

## Canonical entitlement strategy

Use one entitlement view regardless of rail:

- `membership_active` (from PayPal OR Stripe)
- `membership_tier`
- `billing_provider` (`paypal`, `stripe`, or `dual`)
- `usage_plan` and meter status (Stripe-first)

## Recommended Integration Sequence

1. Keep PayPal as source of truth for current membership checks.
2. Add Stripe customer linkage to TNF user identity (`stripe_customer_id`).
3. Add Stripe webhook ingestion for subscription + invoice events into the same
   entitlement projection used by PayPal.
4. Add usage metering (input/output) for agent actions using Stripe meter
   events.
5. Promote dual-rail entitlement resolver: active if either provider is valid.

## Data Model Additions (minimal)

- `users.stripe_customer_id` (nullable)
- `billing_subscriptions` unified table:
  - `provider` (`paypal|stripe`)
  - `provider_subscription_id`
  - `status`
  - `plan_code`
  - `current_period_end`
- `billing_entitlements` materialized view/projection:
  - `user_id`
  - `membership_active`
  - `membership_tier`
  - `source_provider`

## API Surface To Add Next

- `POST /api/billing/stripe/checkout-session`
- `POST /api/billing/stripe/webhook`
- `GET /api/billing/membership/:identity` (provider-agnostic resolver)
- `POST /api/billing/usage/meter-event` (agent usage writes)

## Frontend Changes Completed In This Session

- Membership page now supports dual-rail UX:
  - PayPal subscription button remains primary.
  - Optional Stripe checkout button appears when
    `VITE_STRIPE_MEMBERSHIP_CHECKOUT_URL` is set.
- Pricing copy updated to `$30 / month`.

## Operational Notes For Future AI Sessions

When continuing this track, use this playbook as the canonical context file
first, then:

1. confirm webhook signatures and idempotency,
2. unify entitlement projection,
3. migrate route guards from auth-only to entitlement-aware checks.
