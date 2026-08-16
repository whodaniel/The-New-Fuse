# Deep Thought Cycle — Subdirector CLI + Alias Dedupe — 2026-08-16T22:30Z

## Act

- Broker reports to primary `tnf:direct:sub-director:tnf-cli-agent` only (no
  alias fan-out)
- Drain script dedupes logical keys across review/direct/specialty/pending
- Added `tnf subdirector drain` and `tnf subdirector cycle` CLI commands

## Verify

- Fan-out check: review=1, tnf-cli-agent direct=1, aliases=0
- `tnf subdirector drain` drained review+direct; duplicates_skipped field
  present
