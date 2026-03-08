# TNF + AI-Arcade Control Surface Enforcement Matrix (2026-03-08)

## Identity strata (explicit)

| Stratum           | Principal signals                                  | Baseline access                                                    |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `PUBLIC`          | no auth                                            | marketing/public catalog only                                      |
| `MEMBER`          | authenticated + active paid membership             | product surfaces, non-admin creation/use flows                     |
| `CREATOR_MEMBER`  | `MEMBER` + creator role/capability                 | app submission/publishing workflows                                |
| `AI_AGENT_MEMBER` | machine principal + membership signal              | agentic execution/control surfaces scoped to assigned capabilities |
| `AGENCY_ADMIN`    | `AGENCY_OWNER/AGENCY_ADMIN/AGENCY_MANAGER`         | agency-scoped operations                                           |
| `SUPER_ADMIN`     | role claim or `owner@example.com` master override | platform governance + all control surfaces                         |

## Current policy anchors

- Membership entitlement: `/api/billing/membership/me` and shared role checks.
- Master super admin normalization: `owner@example.com`.
- Goose dispatch policy: admin/system OR active paid membership.
- AI-Arcade access policy: centralized in
  `apps/ai-arcade/src/security/accessPolicy.ts`.

## thenewfuse.com route policy source

- Route-by-route table: `docs/audits/THENEWFUSE_ROUTE_ENFORCEMENT_TABLE.md`.
- Operational rule:
  - any route with admin, debug, system control, or governance actions =>
    `SUPER_ADMIN`.
  - member product routes => `MEMBER`.
  - onboarding/register routes remain public, but server-side invite enforcement
    remains mandatory.

## AI-Arcade control surface decisions

| Surface                                          | Who should access                 | Enforcement state                                                                          |
| ------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------ |
| Arcade landing and playable catalog              | `PUBLIC`                          | Enforced                                                                                   |
| Internal economics widgets (Merkaba monitor/lab) | `SUPER_ADMIN` + `AI_AGENT_MEMBER` | Enforced in UI policy                                                                      |
| Genesis protocol view                            | `SUPER_ADMIN` + `AI_AGENT_MEMBER` | Enforced in UI policy                                                                      |
| Admin dashboard/modal                            | `SUPER_ADMIN`                     | Enforced in UI policy                                                                      |
| App submission capability                        | `MEMBER` (or `SUPER_ADMIN`)       | Enforced in API (`/api/marketplace/experiences/submit`, `/api/marketplace/catalog/submit`) |

## ID/federation/NFT ownership alignment (design guardrails)

- `ID#` and federation identity must be authorization inputs, not UI-only
  metadata.
- NFT ownership should be additive capability proof (entitlement booster), not a
  replacement for core auth/membership.
- Effective authorization should resolve in this order:
  1. identity + session validity
  2. role claims
  3. membership entitlement
  4. federation/ID#/NFT capability overlays
  5. route/action policy evaluation

## Remaining implementation gaps

1. Complete backend route/action policy map for TNF API endpoints (not only
   frontend routes).
2. Add centralized policy engine input contract including `idNumber`, federation
   claims, and NFT ownership claims.
3. Add explicit capability claims for creator/AI-agent submission scopes (beyond
   base member entitlement).
