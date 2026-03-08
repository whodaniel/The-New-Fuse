# AI-ARCADE Control Surface Assessment

## Objective

Define explicit control-surface ownership by user/member stratum so production
pages only expose controls to the correct actors.

## Actor strata

- `PUBLIC`: unauthenticated web visitor.
- `MEMBER`: paid TNF subscriber (active status).
- `CREATOR`: trusted member lane for submitting/running community experiences.
- `ADMIN`: operational admin lane.
- `SUPER_ADMIN`: global override lane (`owner@example.com`).
- `AI_AGENT`: non-human service/operator lane for internal systems.

## Assessment decisions

- `ai-arcade.xyz` landing should only show consumer experience discovery to
  `PUBLIC`/`MEMBER`.
- Internal economy diagnostics (Merkaba equations, EV simulators, compatibility
  matrices) are not front-page content.
- Poker-facing creation controls (create SNG/MTT/table) are creator+ operations,
  not default member controls.
- Community submission/vote/comment is member-gated and must be enforced
  server-side, not just hidden in UI.
- Any unresolved or not-yet-implemented control route must not be exposed as a
  clickable card.

## Surface-level policy

- `PUBLIC`:
  - browse, view, launch published apps/games.
  - no submit/vote/comment/create actions.
- `MEMBER`:
  - all public actions plus submit/vote/comment in Community Apps.
- `CREATOR`:
  - member actions plus create tournament/table controls.
- `ADMIN` + `SUPER_ADMIN`:
  - creator actions plus internal labs, diagnostics, and admin consoles.
- `AI_AGENT`:
  - internal telemetry, orchestration, and backend control surfaces only.

## Current corrections applied

- AI-ARCADE app:
  - internal economics sections are policy-gated
    (`ADMIN`/`SUPER_ADMIN`/`AI_AGENT`).
- Poker app:
  - tournament/table creation controls are gated to creator/admin lanes.
  - unresolved `LAB` card exposure is removed from lobby-facing controls.
  - unknown control-route navigation is blocked with explicit user feedback.
- Community API worker:
  - submit/vote/comment require active membership.
  - membership resolver uses TNF billing verification endpoint with API key
    guard.

## Identity and federation direction

- Keep identity authority in TNF user records; do not duplicate authority per
  game surface.
- Treat NFT ownership as additive capability claims, never a replacement for
  account or paid-member status.
- Map ID encoding/federation claims to capability grants only after identity +
  membership checks pass.
- Keep a strict precedence model:
  - `SUPER_ADMIN` override
  - explicit role grants (`ADMIN`/`CREATOR`)
  - paid membership state
  - optional NFT/capability extensions

## Implementation checkpoints

- Every privileged control must have:
  - UI visibility gate
  - backend authorization gate
  - audit trail event for denied and approved actions
- Avoid “hidden but callable” endpoints for creator/admin actions.
- Keep this document aligned with `docs/ai-arcade/ACCESS_CONTROL_MATRIX.md`.
