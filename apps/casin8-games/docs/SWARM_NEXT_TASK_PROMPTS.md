# Swarm Next Task Prompts

Use these prompts as-is with your other agent teams.

## Prompt 1: Backend No-Limit Guardrails

You are working in:
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games`

Goal: Harden poker no-limit action validation in `server.js` so betting is
realistic and cannot break state.

Implement:

- Add per-action validation for `fold/check/call/bet/raise` using:
  - current street bet
  - player stack
  - min raise size
  - all-in short raise rules
- Reject invalid transitions with clear errors.
- Ensure raise reopening logic only occurs on full raises.
- Add a table-level `lastAggressorSeat` and `bettingRoundId` for deterministic
  flow.

Acceptance criteria:

- Invalid actions return `400` with precise error reason.
- Valid all-in short raises are accepted but do not reopen action.
- Pot, invested, stack, currentBet, minRaise remain internally consistent after
  every action.
- Existing route contract remains unchanged (`/api/table/action`).
- `node --check server.js` passes.

Output:

- Patch + brief test transcript for 3 cases:
  1. invalid check facing bet
  2. valid all-in call
  3. invalid under-min raise

## Prompt 2: Hand History + Replay API

You are working in:
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games`

Goal: Create persistent hand history and replay payload APIs.

Implement:

- Add persistent hand history storage in `.data` (append-safe JSON file).
- On every settled hand, store:
  - tableId, handId, timestamp
  - seats snapshot (stack/invested/folded)
  - hole cards by seat (server-side full record)
  - community cards
  - action timeline
  - side pots, payoutBySeat, winnerSeat
  - sessionSettlement
- New APIs:
  - `GET /api/hands?tableId=...&limit=...`
  - `GET /api/hands/:handId` (or equivalent query endpoint)
  - `GET /api/hands/:handId/replay` optimized for UI playback sequence

Acceptance criteria:

- Hand list returns newest-first.
- Replay payload includes ordered phases: preflop/flop/turn/river/showdown.
- Server restarts keep history intact.
- Response serialization is BigInt-safe.

Output:

- Patch + curl examples + sample replay JSON.

## Prompt 3: Agent Hints + Pot Odds Service

You are working in:
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games`

Goal: Provide a deterministic hint API for agents/humans.

Implement:

- New endpoint:
  - `POST /api/table/hints`
- Inputs:
  - tableId, seat, toCallUnits, potUnits, stackUnits, legalActions
  - optional handStrength proxy
- Outputs:
  - pot odds percentage
  - required equity threshold
  - recommended action bucket (`fold/check/call/raise`)
  - suggested sizing bands for raise
  - risk flags (`short_stack`, `icm_pressure`, `all_in_risk`)
- Reuse agent strategy modules where possible.

Acceptance criteria:

- Deterministic output for same input.
- Handles missing optional inputs gracefully.
- No side effects on table state.

Output:

- Patch + 5 request/response examples.

## Prompt 4: Frontend Replay + Poker HUD Integration

You are working in:
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games`

Goal: Integrate new backend features into current poker UI (`index.html`,
`script.js`, `styles.css`).

Implement:

- Add “Hand History” panel with list + detail view.
- Add “Replay” controls:
  - play/pause
  - step forward/backward
  - speed selector
- Add “Hints” panel calling `/api/table/hints`.
- Maintain current visual direction and responsive behavior.

Acceptance criteria:

- No regressions in existing live hand controls.
- Replay can run through all street phases.
- UI handles empty/loading/error states.
- Works on mobile width.

Output:

- Patch + short walkthrough of UX states.

## Prompt 5: QA + Scenario Regression Pack

You are working in:
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games`

Goal: Add robust scenario tests for poker engine APIs.

Implement:

- Add test file(s) covering:
  - blind posting correctness
  - min raise enforcement
  - all-in short raise not reopening
  - side-pot split with tie
  - settlement idempotency
  - replay payload validity
- Add script target for running poker scenario suite.

Acceptance criteria:

- Tests are deterministic.
- Failures clearly describe broken rule.
- Existing swarm check remains green.

Output:

- New tests + command to run + sample pass output.

## Prompt 6: Graphics Team (NanoBanana) Production Loop

You are working in:
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games`

Goal: Generate and drop assets lane-by-lane, then validate progress.

Steps:

- Use:
  - `docs/NANOBANANA_POKER_GRAPHICS_TASK_PACKET_CORE_TABLE.json`
  - `docs/NANOBANANA_POKER_GRAPHICS_TASK_PACKET_HUD_CONTROLS.json`
  - `docs/NANOBANANA_POKER_GRAPHICS_TASK_PACKET_MOBILE_STATES.json`
- Save outputs to:
  - `assets/generated/poker`
- Run:
  - `node scripts/validate-nanobanana-graphics-pack.mjs`
  - `node scripts/nanobanana-progress-report.mjs`

Acceptance criteria:

- Filenames strictly follow packet names.
- Required variants present.
- Progress report increments lane completion.

Output:

- Generated asset list + validator output + progress JSON/MD diff.
