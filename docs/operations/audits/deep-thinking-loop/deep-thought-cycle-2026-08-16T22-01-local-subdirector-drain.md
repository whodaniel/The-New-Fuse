# Deep Thought Cycle — Local Subdirector Drain — 2026-08-16T22:01Z

## Goal

Wire Local Subdirector (tnf-cli-agent) to consume review + direct report queues.

## Act

- Added `scripts/sub-director/drain_local_subdirector.py`
- Added `scripts/agents/subdirector-local-cli-agent-cycle.sh`
- Installed cron `*/5` for local drain cycle
- Synced drain script to `~/.tnf/sub-director/`

## Verify

- Queues drained to 0 (review + direct aliases)
- Ack artifacts written under
  `~/.tnf/sub-director/run-artifacts/subdirector-ack-*`
- E2E: critical watchdog → broker Local Subdirector escalate → drain ack
