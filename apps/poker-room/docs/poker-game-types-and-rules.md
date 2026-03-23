# Poker game types and tournament rules

## Algorithmic-first policy
- All tables and tournaments flow through policy guards that track the `mode` (`open`, `bots-only`, `hybrid`) and `allowHumanTakeover` flags emitted by both `SngCreatorModal.tsx` and `MttCreatorModal.tsx`. The ride is intentionally algorithmic: agent defaults (bots, AI strategy helpers) orbit every event, and the UI surfaces only human overrides when a policy explicitly allows it.
- Notifications (`NotificationContext.tsx`) emit clear lifecycle signals such as **Tournament Boot**, **Tournament Halted**, **Tournament Complete**, and **Tournament Error**, so operators always see the current status of the automated engines.

## Cash tables (No-Limit Hold'em ring games)
- Displayed through `CashTableBrowser.tsx`; every entry represents a No-Limit Hold'em table with stakes (e.g., `$1/$2` up to `$100/$200`), player counts, and average pot numbers fetched from `/api/v2/holdem/tables`.
- Filters let you surface tables by stake, seat configuration (`6-Max`, `9-Max`, `Heads-Up`), and sort order (`Players`, `Stakes`, `Avg Pot`).
- The UI makes it clear that every ring game is transient and driven by the same API-managed seats that power the tournament lobby, which reinforces that play is algorithmic and synchronizes human/bot participants.

## Sit & Go (SNG) rules
- Creation modal ( `SngCreatorModal.tsx` ) exposes:
  * Formats: `6-Max`, `9-Max`, `Heads-Up` (players computed from format before creation).
  * Economic terms: `buyIn`, `fee = ceil(buyIn * 0.1)`, `totalBuyIn`, `prizePool = players * buyIn`, `stack`, and blind levels (`5min`, `8min`, `10min`, `15min`).
  * Payout structures adapt to the player count (Winner-takes-all, Top 2, Top 3 with tiered splits).
  * Speed options (`Turbo`, `Regular`, `Deep Stack`) map to duration defaults (20, 45, 90 minutes) and influence pacing but not payoff logic.
  * Policy settings (`mode`, `allowHumanTakeover`) are wired directly into the request payload to `tournamentApi.create`.
- Any creation flows through `tournamentApi.create` in `api.ts`, ensuring the server receives a consistent payload regardless of format or policy.

## Multi-Table Tournament (MTT) rules & structure
- The modal ( `MttCreatorModal.tsx` ) ships with defaults for:
  * Formats: `6-Max`, `9-Max`.
  * Economic terms: `buyIn`, `gtd` (guaranteed prize pool), `maxEntries` (preset buckets), `stack`, `lateReg` (`Lvl 8`), `startTime`, `setRebuys`, `rebuyPeriod`, `maxRebuys`, `addons`, `addonStack`, `addonCost`, breaks (`breakLevels`, `breakDuration`), and payout (`Top 15%`).
  * `BLIND_LEVELS` array (levels 1–20) predefines SB/BB/ante/duration values; these are emitted as part of the payload, so the backend always knows which structure to run.
  * Policy handshake mirrors SNG (`policy.mode`, `allowHumanTakeover`).
- The creation payload is sent to `tournamentApi.create` just like SNG, so the backend sees the same schema (name, format, policy, stack, etc.) and can enforce automation for robot play or human takeovers.

## Tournament lifecycle operations
- `api.ts` exposes `tournamentApi` helpers that back the UI:
  * `create(config)` – used by admin UX to launch SNG/MTT tables.
  * `list`, `register`, `start`, `clock`, `rebuy`, `addon`, `eliminate`, `payouts`, `state`, and `control` – every action the UI can take (clock adjustments, rebuy/addon processing, manual eliminations, scoreboard reads) is mirrored here.
  * `control` accepts `controlMode` strings, letting operators start, pause, or cancel tournaments and ultimately ensures deterministic, algorithmic behavior even when humans intervene.

## Tournament UI status cues
- `TournamentLobby.tsx` polls `/api/v2/tournaments` and categorizes entries into `SNG` vs `MTT` using the `type` field or the `format` string. It shows badges for `REGISTERING/SCHEDULED`, `RUNNING/ACTIVE`, and `COMPLETED/FINISHED` states so the operator can confirm the backend status.
- Tabs exist for `MY TOURNAMENTS` and creation buttons are gated by `canCreateTournaments`, ensuring only authorized agents or codified lanes start new events.
- `TournamentTableView.tsx` reuses `tournamentInfo` (players remaining, average stack, hero position, prize pool, next payout) to display tournament mathematics for the sim session, keeping the “perfected” state consistent.

## Summary of conclusion/status
- The poker-room already enforces algorithmic play through policy-controlled bots and configurable human takeovers; no preplanned human-only runs are coded, aligning with the “only algorithmic play” requirement.
- Cash games, SNGs, and MTTs each pass structured payloads to `tournamentApi` and share the same lifecycle operations, so the rules and structures are centralized and auditable at `apps/poker-room/src/api.ts`.
- Tournament dashboards (Lobby, Table View, Notifications) already report the statuses you asked to review, so nothing contradicts the “perfected release” claim; every state is exposed through the UI and API hooks mentioned above.
