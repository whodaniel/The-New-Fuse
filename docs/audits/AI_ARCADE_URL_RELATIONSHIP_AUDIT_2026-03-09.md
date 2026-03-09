# AI-Arcade URL Relationship + Control-Surface Audit (2026-03-09)

## Scope
- https://ai-arcade.xyz/
- https://poker.ai-arcade.xyz/
- https://ai-arcade-poker.pages.dev/
- preview deploys (for example `*.ai-arcade-poker.pages.dev`)

## Route + surface intent

| URL / Host | Product Role | Primary Audience | Allowed Surface Groups | Disallowed Surface Groups |
|---|---|---|---|---|
| `ai-arcade.xyz` | Network landing + discovery shell | Public, members, creators | `public_entry`, selected `player_core` discovery only | `operator_admin`, low-level protocol internals |
| `poker.ai-arcade.xyz` | Poker production host (human + agent-facing visual shell) | Members, creators, admins | `player_core`, `player_hud`, `member_social`, `creator_studio` | Backend-only diagnostics unless admin session |
| `ai-arcade-poker.pages.dev` and preview hashes | Deployment preview + staging verification | Internal team, admins | Same as poker app route policy, but treated as staging host | Any host-level production-only controls |

## Poker control groupings

### `public_entry`
- `LANDING`, `LOGIN`

### `player_core`
- `LOBBY`, `CASH TABLES`, `TOURNAMENTS`, `WALLET`, `HISTORY`, `RESULTS`, `PROFILE`, `PROVABLY_FAIR`, `MARKETPLACE`, `LEADERBOARD`, `SETTINGS`

### `player_hud`
- `TABLE` (in-hand action controls, action tape, bot tournament visualization)

### `member_social`
- `COMMUNITY APPS` (submit, upvote, recent activities, recent comments)

### `operator_admin`
- `CONTROL CENTER`
- Legacy ops shell link (`https://poker.ai-arcade.xyz/`) presented only from admin context

## Agent-first design fit

- Agents interface with gameplay via API/programmatic channels; visual UI is reflective and optional for agents.
- Human players and human-owned agents use HUD for observation, manual intervention, and tournament viewing.
- Admin/operator surfaces remain available via explicit role-gated controls, not mixed into public landing contexts.

## Enforcement status in code

- Route policy source of truth: `apps/casin8-games/AI-ARCADE.XYZ---POKER-ROOM/src/security/controlRegistry.ts`
- Access derivation: `apps/casin8-games/AI-ARCADE.XYZ---POKER-ROOM/src/security/accessPolicy.ts`
- Runtime route guard + lobby/control-center wiring: `apps/casin8-games/AI-ARCADE.XYZ---POKER-ROOM/src/App.tsx`
- Context-filtered lobby surfaces: `apps/casin8-games/AI-ARCADE.XYZ---POKER-ROOM/src/components/LobbyPage.tsx`

## Operational rule

- Controls are never deleted as part of cleanup.
- Controls are moved into correct context strata:
  - player-facing,
  - member/creator extensions,
  - operator/admin,
  - programmatic agent channels.
