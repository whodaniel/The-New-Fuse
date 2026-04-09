# Poker Bug List (Ranked)

## 1. Critical: Duplicate table actions could mutate state twice under race

- Severity: Critical
- Status: Fixed
- Affected endpoint: `POST /api/table/action`
- Impact: Replay/duplicate submits could advance hand state unexpectedly and
  alter pot/turn order.
- Repro (before fix):

1. Initialize a table via `POST /api/table/state/init`.
2. Send two concurrent `POST /api/table/action` requests with the same
   `idempotencyKey`.
3. Observe second request could fail as `NOT_YOUR_TURN` after state already
   mutated instead of deterministic duplicate rejection.

- Fix:

1. Added pre-check for processed idempotency keys in realtime bus.
2. Added deterministic duplicate rejection path before action application.
3. Added stale cursor/seq rejection (`409`) to prevent reconnect race replay.

## 2. High: Session settlements were not durable across restart

- Severity: High
- Status: Fixed
- Affected flow: terminal hand settlement from table action / settle APIs
- Impact: Restart could roll back bankroll outcomes after hand settlement.
- Repro (before fix):

1. Create two sessions and bind `sessionBySeat`.
2. Complete a terminal hand by fold/showdown.
3. Restart server process.
4. Query `GET /api/session`; bankrolls revert to pre-settlement values.

- Fix:

1. Persist state when `settleSessionsFromSnapshot` writes bankroll outcomes.
2. Persist table snapshots into state and restore snapshots at startup.

## 3. High: Malformed/oversized JSON payloads could return 500 or drop socket

- Severity: High
- Status: Fixed
- Affected endpoints: all JSON POST handlers using shared body reader
- Impact: Unreliable behavior for abuse traffic; possible client disconnect and
  poor observability.
- Repro (before fix):

1. Send invalid JSON body to `/api/session`.
2. Send >64KB body to `/api/fair/verify`.
3. Observe 500 responses or abrupt connection close.

- Fix:

1. Standardized invalid JSON / payload-too-large handling to explicit 400
   responses.
2. Updated body reader to avoid destroying socket on overflow.

## 4. High: Fairness commit endpoint leaked secret server seed

- Severity: High
- Status: Fixed
- Affected endpoints: `POST /api/fair/commit`, `POST /api/fair/rotate`
- Impact: If server seed is exposed before reveal, commit-reveal integrity is
  broken.
- Repro (before fix):

1. Call `POST /api/fair/commit`.
2. Observe `serverSeed` returned directly in response.

- Fix:

1. Redacted `serverSeed` from commit/next responses.
2. Exposed only public commit metadata (`serverSeedHash`, `nonce`, timestamps).
3. Kept seed reveal only in rotate `reveal` path.

## 5. High: Shared state file clobber risk across concurrent server processes

- Severity: High
- Status: Fixed
- Affected flow: v2 restart/integration tests and any multi-process local
  execution sharing default `.data/state.json`
- Impact: Parallel writers could overwrite each other's snapshots, causing
  intermittent missing table/tournament state after restart.
- Repro (before fix):

1. Start multiple server processes concurrently using the default data path.
2. Mutate table/tournament state in each process.
3. Restart one process and query recently written entities.
4. Observe intermittent `Unknown *Id` or missing hand/tournament details due to
   lost update.

- Fix:

1. Added `CASIN8_DATA_DIR` support to isolate persistence roots per server
   process.
2. Updated v2 restart tests to use dedicated temp data directories, eliminating
   cross-test state clobber.

## Residual Risks / Mitigations

- Risk: In-memory rate-limit state resets on process restart.
- Severity: Medium
- Mitigation: Acceptable for now in QA scope; production hardening should
  externalize rate-limit store.
