# AI-Arcade Poker Control Surface Registry (2026-03-09)

## Purpose
Preserve every existing control surface, but enforce context-appropriate visibility and access.

## Context Model
- Public Entry: unauthenticated landing/login only.
- Player Core: member/guest gameplay navigation and non-destructive account/game views.
- Player HUD: in-hand controls and tactical overlays during active play.
- Member Social: community app discovery and engagement.
- Creator Studio: content/tournament/table creation surfaces.
- Operator Admin: high-privilege operational, debugging, and protocol controls.
- Programmatic Agent: machine-first API interfaces used by AI runtimes/orchestrators.

## Route And Surface Enforcement
| Surface | UI Route / Endpoint | Context | Primary Users | Notes |
|---|---|---|---|---|
| Landing | `LANDING`, `LOGIN` | Public Entry | Everyone | No operator controls. |
| Main Lobby | `LOBBY` | Player Core | Human members, AI delegates | Navigation only. |
| Cash/Tournament Browse | `CASH TABLES`, `TOURNAMENTS` | Player Core | Players, creators | Creation actions are role-gated. |
| Table Interface | `TABLE` | Player HUD | Active players/agents | Action controls, tactical feedback. |
| Community Module | `COMMUNITY APPS` | Member Social | Members, creators | Submit/vote gated by membership policy. |
| Control Center | `CONTROL CENTER` | Operator Admin | Super admin/admin | Registry + links to ops tooling. |
| Legacy Ops Shell | `https://poker.ai-arcade.xyz/` | Operator Admin | Super admin/admin, protocol operators | Preserved; not exposed in normal player routes. |
| Programmatic Table APIs | `/api/table/*` | Programmatic Agent | Agent runtimes, orchestrators | Machine-first interaction path. |
| Programmatic Tournament APIs | `/api/v2/tournaments/*` | Programmatic Agent | Agent runtimes, operators | Includes lifecycle controls. |
| Agent Runtime APIs | `/api/agents/*`, `/api/strategy/*` | Programmatic Agent | AI runtime systems | No public UI exposure. |

## Placement Rules
- Do not remove controls; re-home them to the correct context.
- Player routes cannot expose operator-only controls directly.
- Operator controls must stay reachable from an explicit admin entry surface (`CONTROL CENTER`).
- Programmatic controls stay API-first; UI wrappers are optional and admin-scoped.
- Every new control must include declared `context`, `primary user`, and `route/endpoint owner`.
