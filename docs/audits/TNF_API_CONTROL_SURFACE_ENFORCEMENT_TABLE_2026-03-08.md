# TNF API Control Surface Enforcement Table (2026-03-08)

## Scope

- Focus: backend control surfaces with operational, financial, or governance
  impact.
- Goal: make route-level access explicit and reduce misplaced privileged
  endpoints.

## Principal levels

- `PUBLIC`: no auth required.
- `USER`: authenticated user.
- `MEMBER`: authenticated user with active paid membership.
- `ADMIN`: admin/system role.
- `SUPER_ADMIN`: highest governance level (includes master override account).

## Enforcement table

| Endpoint                                               | Current enforcement                               | Required principal            | Status                      |
| ------------------------------------------------------ | ------------------------------------------------- | ----------------------------- | --------------------------- |
| `POST /api/agentic/goose/dispatch`                     | JWT + service policy check                        | `ADMIN` or `MEMBER`           | Enforced                    |
| `GET /api/agentic/goose/access`                        | JWT                                               | `USER`                        | Enforced                    |
| `POST /api/marketplace/experiences/submit`             | JWT + membership/admin check                      | `MEMBER` or `ADMIN`           | Enforced                    |
| `POST /api/marketplace/catalog/submit`                 | JWT + membership/admin check                      | `MEMBER` or `ADMIN`           | Enforced                    |
| `POST /api/marketplace/catalog/:id/publication-status` | `@AdminOnly()`                                    | `ADMIN`                       | Enforced                    |
| `POST /api/marketplace/research/crawl/run`             | `@AdminOnly()`                                    | `ADMIN`                       | Enforced                    |
| `GET /api/marketplace/research/crawl/runs`             | `@AdminOnly()`                                    | `ADMIN`                       | Enforced                    |
| `GET /api/marketplace/research/crawl/runs/:id`         | `@AdminOnly()`                                    | `ADMIN`                       | Enforced                    |
| `POST /api/auth/invite-codes/generate`                 | existing auth guard path                          | `ADMIN`                       | Verify in integration tests |
| `POST /api/auth/invite-codes/:inviteId/disable`        | existing auth guard path                          | `ADMIN`                       | Verify in integration tests |
| `POST /api/billing/stripe/subscribe`                   | JWT                                               | `USER`                        | Enforced                    |
| `POST /api/billing/stripe/checkout-session`            | JWT                                               | `USER`                        | Enforced                    |
| `POST /api/billing/paypal/subscribe`                   | JWT                                               | `USER`                        | Enforced                    |
| `GET /api/billing/membership/me`                       | JWT                                               | `USER`                        | Enforced                    |
| `POST /api/onboarding/start`                           | Public route + invite/token gate when invite-only | `PUBLIC_WITH_INVITE_OR_TOKEN` | Enforced                    |
| `/api/agents/brand-consistency/*`                      | `RequireAuthLevel(USER)`                          | `USER`                        | Hardened                    |
| `/api/agents/browser-hub-swarm/*`                      | `RequireAuthLevel(USER)`                          | `USER`                        | Hardened                    |

## Follow-up hardening backlog

1. Add automated authorization tests for every endpoint above (deny/allow
   matrix).
2. Promote `SUPER_ADMIN`-only enforcement for endpoints that mutate global
   config or cross-tenant state.
3. Add per-request audit logging (`actor`, `route`, `policyDecision`,
   `resourceId`, `result`) for privileged routes.

## Reusable policy primitive added

- Guard: `apps/api/src/guards/member-or-admin.guard.ts`
- Decorator: `@MemberOrAdmin()`
- Current usage:
  - `POST /api/marketplace/experiences/submit`
  - `POST /api/marketplace/catalog/submit`
