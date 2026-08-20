# TNF Revenue and Partner Operating Plan

**Status:** active canonical operating plan  
**Updated:** 2026-08-20  
**Related:** #113, #117, #118, #119

## Objective

TNF must become financially self-sustaining without compromising its provider-neutral architecture or creating infrastructure liabilities ahead of paid demand. Revenue strategy therefore has two simultaneous goals:

1. create direct recurring revenue from TNF itself; and
2. capture legitimate partner/referral/marketplace/services revenue when TNF creates measurable value for a user who independently benefits from a third-party service.

Affiliate or partner compensation must never be the sole reason TNF selects, ranks, or recommends a provider. Material commercial relationships should be disclosed wherever they could reasonably influence a user decision.

## Revenue stack

### A. Core TNF recurring revenue

- SaaS subscriptions for hosted/shared TNF capabilities.
- Usage credits or metered add-ons for capabilities with material variable provider cost.
- Enterprise contracts for dedicated capacity, isolation, compliance, support, and deployment requirements.
- Team/workspace plans with budget envelopes and administrative controls.
- Optional managed-service operations for customers that do not want to operate TNF infrastructure themselves.

The cost authority introduced in #117 and implemented under #118 is mandatory for protecting gross margin. A subscription entitlement is not an unlimited authorization to incur cloud spend.

### B. Distribution and ecosystem revenue

Maintain `data/business/revenue-channel-registry.json` as the source-attributed ledger for:

- affiliate programs;
- referral programs;
- reseller/channel programs;
- technology partner programs;
- marketplace revenue;
- co-sell programs;
- integration bounties or credits;
- startup/partner credits that directly lower TNF cost of goods sold;
- sponsorships and educational/content partnerships.

Every record must include source, verification date, status, economic signal, TNF fit, and next action. Unknown commission terms must remain unknown; never infer them.

### C. Services revenue

TNF can monetize expertise around its own orchestration layer and around integrated ecosystems without becoming a captive reseller:

- agent/workflow architecture;
- migration and integration work;
- deployment and operations;
- security/governance configuration;
- cost optimization;
- agent capability audits;
- custom MCP/connectors/adapters;
- training and organizational adoption.

Services should create reusable product knowledge. Repeated services work should be harvested into TNF templates, skills, adapters, diagnostics, or documentation where licensing and confidentiality allow.

### D. Marketplace and integration revenue

Priority marketplace/integration candidates include GitHub, Supabase, Cloudflare, OpenAI, Anthropic, and additional ecosystems discovered by scouting. A marketplace presence should be pursued where it produces one or more of:

- distribution;
- qualified leads;
- product credibility;
- co-selling;
- integration support;
- reduced infrastructure/tooling cost;
- direct marketplace revenue.

## Economic guardrails

1. **Local first.** Do not create paid infrastructure merely to make TNF appear cloud-native.
2. **Paid demand pulls infrastructure into existence.** Metered execution requires entitlement, tenant budget, and provider hard-limit protection.
3. **Revenue attribution is explicit.** Track revenue source by customer/workspace/campaign/program where legally and technically appropriate.
4. **Gross margin is measured by capability.** Every metered capability should eventually expose revenue, estimated cost, actual provider cost, support burden, and contribution margin.
5. **Partner income is additive, not hidden subsidy.** A core TNF plan must still make economic sense if a provider ends its affiliate or partner program tomorrow.
6. **Do not create vendor lock-in for commission.** Route selection remains capability/cost/reliability/privacy driven.
7. **Do not auto-upgrade fixed infrastructure.** Reserved capacity requires measured break-even or an explicit contract.

## Funnel

For each partner/revenue channel:

`discovered -> verified -> qualified -> application-ready -> applied -> accepted -> integration-live -> attributable-traffic -> attributable-revenue -> reviewed`

For programs without direct cash commission, replace attributable revenue with the relevant measurable benefit (credits, co-sell pipeline, leads, reduced COGS, training, support, marketplace distribution).

## Immediate application readiness checklist

Before applying to programs that require a business entity or production integration, TNF should have:

- stable business/legal identity and payout account;
- public product/company site;
- Terms of Service, Privacy Policy, Acceptable Use Policy where required;
- support/SLA statement appropriate to the program;
- stable integration documentation;
- public-facing architecture/security summary;
- partner contact inbox;
- attribution/privacy disclosure policy;
- a minimal partner one-sheet describing TNF, customer value, integration, and expected mutual value.

Supabase explicitly states business-viability, legal-policy/SLA, and maintainability expectations for partner listings, so these are not abstract paperwork items; they are distribution prerequisites.

## Decision score for a new ecosystem program

Score 0-5 on each axis:

- user value;
- technical fit;
- existing TNF dependence/use;
- incremental implementation cost;
- revenue/COGS benefit;
- distribution benefit;
- lock-in risk (reverse score);
- data/privacy risk (reverse score);
- maintenance burden (reverse score).

Do not prioritize a program just because commission percentage is high. High user value + strong technical fit + low incremental cost should dominate.

## Reporting cadence

A weekly revenue scout should refresh material changes and create/update actionable GitHub issues only when evidence changes. A monthly business review should summarize:

- active SaaS revenue;
- metered infrastructure COGS;
- contribution margin by major capability;
- partner/referral revenue;
- partner-derived credits or avoided costs;
- applications pending/accepted/rejected;
- newly discovered programs;
- stale programs needing reverification;
- integration work with the highest expected economic leverage.

## Current priority

The immediate priority is not maximizing affiliate links. It is building a trustworthy economic control plane and a source-attributed ecosystem intelligence system so TNF can make better routing, product, partnership, and revenue decisions than a single vendor-specific harness can make.
