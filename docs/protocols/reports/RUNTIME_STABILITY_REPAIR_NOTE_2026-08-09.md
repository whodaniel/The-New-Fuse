# Runtime-Stability Repair Note — 2026-08-09

This file records the actions taken to resolve the remaining CAUTION findings
after commits `8f1628a887`, `c5d7aacc4a`, `b4eb8329ae`.

## Verified / Completed by this agent

1. **Redis / master-heartbeat**: Confirmed `PONG` (redis-cli ping);
   master-heartbeat `healthy`; live-check `CAUTION` (not BLOCK).
2. **Subdirector relay wake**: Structured `AGENT_REGISTER`
   (`actorId: tnf-local-subdirector`, `subdirectorIdNumber: 7`), `CHANNEL_JOIN`
   (green, blue, fuse-activity-log), `WAKE_PING` (target `ttys003` stalled +
   idle lanes), and `WORK_PROMPT` (`local-subdirector-attention-check`)
   delivered over `ws://127.0.0.1:3000/ws`. Relay responded: `WELCOME`,
   `AGENT_LIST`, `CHANNEL_LIST`, `REGISTRATION_CONFIRMED`, `AGENT_STATUS`,
   `BRIDGE_CONNECTED`. No terminal injection performed (per
   `TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`).
3. **Subdirector heartbeat**: Updated
   `~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json` with
   `lastRepairAttempt`, `lastRepairAction`, `relayResponseSummary`, and new
   `functionalGaps` entry.
4. **Full-auto attempt**: Ran
   `bootstrap_full_auto_network.sh --repo . --mode once`. Substrate attestation
   failed (`lockfile drift vs seal`); full-auto remains `idle` (`mode=idle`,
   `updatedAt` refreshed with attempt log); `failedCycles=0`; relay and Redis
   OK.
5. **Full-auto state**: Updated `docs/operations/tnf-full-auto-state.json` with
   `updatedAt`, `lastAttempt`, and `protectedTokensStatus`.
6. **Security gates**: All staged gates pass (`privacy-guard`, `secret-sweep`,
   `docs-pii-guard`, `session-handoff-gate`).

## Remains blocked — requires user action

### Protected full-auto tokens (`input/policy tokens missing`)

Evidence:

- `docs/protocols/reports/LIVE_AGENT_WORK_CHECK_LATEST.json` finding:
  `Protected full-auto remains gated because input/policy tokens are missing.`
- Environment variables checked (`echo` output):
  - `TNF_SUPER_ADMIN_INPUT_TOKEN` = NOT SET
  - `CI_SUPER_ADMIN_TOKEN` = NOT SET
  - `TNF_GATE_POLICY_TOKEN` = NOT SET (script reports it set but env shows
    empty; likely read from a different source/config)
  - `BROKER_GATE_POLICY_TOKEN` = NOT SET
- `bootstrap_full_auto_network.sh` requires `--super-admin-token` (from
  `TNF_SUPER_ADMIN_INPUT_TOKEN` or `CI_SUPER_ADMIN_TOKEN`) for `run_once` /
  `run_start`.
- `.tnf/skills/tnf-full-auto-network-autopilot/scripts/bootstrap_full_auto_network.sh`:
  `TOKEN_ARG` remains empty without these env vars.

**Exact actions required from you:**

1. Provide `TNF_SUPER_ADMIN_INPUT_TOKEN` (primary) or `CI_SUPER_ADMIN_TOKEN` (CI
   fallback) in the environment running full-auto.
2. If `BROKER_GATE_POLICY_TOKEN` is required by your deployment, set it as well.
3. Re-run:
   `bash .tnf/skills/tnf-full-auto-network-autopilot/scripts/bootstrap_full_auto_network.sh --repo . --mode once --skip-build`
4. Verify `docs/operations/tnf-full-auto-state.json` updates with a new
   `lastRun` and non-null `currentCycle`.

### Subdirector stalled lanes (`localSubdirector: critical`)

Evidence:

- `local-subdirector-heartbeat.json`: `status: critical`, `stalledSessions: 1`
  (`ttys003`, `node`, `lastActivityAt` ~11:17, `noChangeCycles`: 96),
  `idleSessions`: 4, `wakePingsEmitted`: 0.
- Relay wake delivered successfully; no terminal injection performed.

**What remains:**

- The stalled session (`ttys003`) and the 4 idle sessions must respond over the
  relay (not terminal) to update their `interactiveReady`, `activityAgeMs`, and
  declare capacity.
- If you have resident relay consumers for each lane, confirm they are running
  (`launchctl print gui/501/com.tnf.local-subdirector` shows active).
- If the relay consumers are missing, restart them (`launchctl load` / `start`
  the subdirector plist) and verify `wakePingsEmitted` increases in the
  heartbeat file.
- Once the lanes respond, `summary.stalledSessions` should drop to 0 and
  `status` should move from `critical` to `healthy`.

## Where to verify results

- `node scripts/protocols/live-agent-work-check.cjs --json` → confirm `verdict`
  improves from `CAUTION`.
- `cat docs/protocols/reports/LIVE_AGENT_WORK_CHECK_LATEST.json` → check
  findings count.
- `cat ~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json` →
  confirm `status`, `summary.stalledSessions`, `wakePingsEmitted`.
- `cat docs/operations/tnf-full-auto-state.json` → confirm `mode` no longer
  `idle` and `currentCycle` advances.
- `cat /tmp/live-agent-check.json` (if regenerated) → confirm `localSubdirector`
  finding clears.

## What this agent did NOT do (intentional boundary)

- Did NOT inject prompts into visible agent terminals (`claude`, `node` on
  `ttys003`) — this is prohibited by
  `TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`.
- Did NOT create synthetic protected tokens.
- Did NOT commit unrelated dirty files (`data/intelligence-artifacts/`, logs,
  `.agent/test-reports/`) into the fix branch.
- Did NOT force a full-auto cycle without the required `super-admin-token`
  (would fail the substrate gate anyway).
