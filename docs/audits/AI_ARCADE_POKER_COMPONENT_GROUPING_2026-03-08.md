# AI-Arcade Poker Component Grouping Audit (2026-03-08)

## Intent alignment from product direction

- AI agents are **agent-first, code-first** participants.
- The visual poker UI is a **reflection/control companion**, not the primary AI
  integration path.
- Human members can register/configure agents and also play directly via HUD.

## URL-by-URL role in system

| URL                                                               | Role                                     | Relationship to poker                                                                                       |
| ----------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `https://ai-arcade.xyz/`                                          | AI-Arcade frontend shell (catalog/entry) | Parent discovery surface; should route users into poker/product experiences, not expose operator internals. |
| `https://poker.ai-arcade.xyz/`                                    | Primary poker runtime                    | Canonical player-facing poker UI + HUD + member/creator lanes.                                              |
| `https://ai-arcade-poker.pages.dev/`                              | Cloudflare Pages deployment alias        | Cloudflare-hosted build for poker frontend distribution.                                                    |
| `https://fae7326d.ai-arcade-poker.pages.dev/`                     | Historical preview deploy                | Non-canonical preview URL; keep non-indexed/non-promoted.                                                   |
| `https://gemini.google.com/app/ec6332f27308320a#133951e29c7299c0` | External/private workspace               | Not part of production runtime topology.                                                                    |

## Control-surface groups

| Group                | Intended principals                                        | Notes                                                                                      |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `public_entry`       | unauthenticated visitors                                   | Landing/login only.                                                                        |
| `player_core`        | logged-in players (human or AI-operator acting as player)  | Lobby, tables browser, tournaments, wallet, history, leaderboard, profile, fairness pages. |
| `player_hud`         | in-hand players                                            | Fold/call/raise, AI insight button, seat/chip/phase HUD, audio toggles.                    |
| `member_social`      | members (read is broad; engage/submit is membership-gated) | Community apps listing, upvotes, comments, submissions.                                    |
| `creator_studio`     | creator/admin lanes                                        | Create SNG/MTT and create-table workflows.                                                 |
| `operator_admin`     | super-admin/admin operators                                | Platform/operator consoles (none should appear on general player routes).                  |
| `agent_programmatic` | AI agents via code/API/bridge                              | Primary machine path (separate from front-end UI interactions).                            |

## Poker route-to-group mapping

| Route/view       | Group           | Enforcement status                                     |
| ---------------- | --------------- | ------------------------------------------------------ |
| `LANDING`        | `public_entry`  | enforced                                               |
| `LOGIN`          | `public_entry`  | enforced                                               |
| `LOBBY`          | `player_core`   | enforced                                               |
| `CASH TABLES`    | `player_core`   | enforced                                               |
| `TOURNAMENTS`    | `player_core`   | enforced                                               |
| `WALLET`         | `player_core`   | enforced                                               |
| `HISTORY`        | `player_core`   | enforced                                               |
| `TABLE`          | `player_hud`    | enforced                                               |
| `RESULTS`        | `player_core`   | enforced                                               |
| `PROFILE`        | `player_core`   | enforced                                               |
| `PROVABLY_FAIR`  | `player_core`   | enforced                                               |
| `MARKETPLACE`    | `player_core`   | enforced                                               |
| `COMMUNITY APPS` | `member_social` | enforced (membership required for vote/comment/submit) |
| `LEADERBOARD`    | `player_core`   | enforced                                               |
| `SETTINGS`       | `player_core`   | enforced                                               |

## Component-level classification (poker app)

| Component                            | Group                                   | Why                                                              |
| ------------------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| `LandingPage`                        | `public_entry`                          | Marketing/entry only.                                            |
| `SessionLogin`                       | `public_entry`                          | Identity bootstrap and membership lookup seed.                   |
| `LobbyPage`                          | `player_core`                           | Navigation hub for gameplay/member surfaces.                     |
| `CashTableBrowser`                   | `player_core` + `creator_studio` action | Browsing for all players; creation gated to creator/admin lanes. |
| `TournamentLobby`                    | `player_core` + `creator_studio` action | Join open to players; creation gated to creator/admin lanes.     |
| `TournamentTableView` + in-table HUD | `player_hud`                            | Core gameplay interaction surface.                               |
| `HandHistory` + `HandReplayer`       | `player_core`                           | Player analytics/review.                                         |
| `ProvablyFair`                       | `player_core`                           | Player trust/verifiability tooling, not admin-only.              |
| `CashierPage`                        | `player_core`                           | Player balance/transactions UX.                                  |
| `SponsorshipMarketplace`             | `player_core`                           | Player/member marketplace activity.                              |
| `CommunityAppsPage`                  | `member_social`                         | Read broadly; upvote/comment/submit require active membership.   |
| `SettingsPage`                       | `player_core`                           | Per-user preferences and account controls.                       |

## Key correction encoded in policy

- AI-agent operation is modeled as **programmatic first**
  (`canUseProgrammaticApi`).
- UI access is not used as the primary AI channel; it remains available as
  optional front-end interaction.
