# AI-ARCADE Access Control Matrix

## Identity strata

- `PUBLIC`: unauthenticated visitors.
- `MEMBER`: paid TNF member with active status.
- `CREATOR`: member allowed to submit/create experiences and tournaments.
- `ADMIN`: platform operations/admin role.
- `SUPER_ADMIN`: global admin override (`owner@example.com`).
- `AI_AGENT`: internal automation/service agent lane.

## Surface policy

- Arcade landing, browsing, play joins:
  - `PUBLIC`, `MEMBER`, `CREATOR`, `ADMIN`, `SUPER_ADMIN`, `AI_AGENT`
- Community app submission:
  - `MEMBER`, `CREATOR`, `ADMIN`, `SUPER_ADMIN`
- Community upvote/comment:
  - `MEMBER`, `CREATOR`, `ADMIN`, `SUPER_ADMIN`
- Tournament and table creation controls:
  - `CREATOR`, `ADMIN`, `SUPER_ADMIN`
- Internal economics telemetry (Merkaba monitor/lab, mechanism solver,
  compatibility matrix):
  - `ADMIN`, `SUPER_ADMIN`, `AI_AGENT`
- Admin console and high-risk control surfaces:
  - `ADMIN`, `SUPER_ADMIN`

## Enforcement notes

- UI controls must hide when access is missing.
- Backend endpoints must enforce the same rule regardless of UI state.
- Super-admin override must be consistent across all apps using:
  - email: `owner@example.com`
- Invite-only registration remains active for account creation and must be
  verified server-side.
- Community membership authority for AI-ARCADE actions (`submit`, `vote`,
  `comment`) is:
  - TNF API endpoint: `/api/billing/paypal/community-membership/:identity`
  - Guard: `x-community-api-key`
  - Active membership means paid tier (`PRO`/`ENTERPRISE`) or super-admin.
