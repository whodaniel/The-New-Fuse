# Unbounded Growth Audit

_Recorded 2026-08-12. Companion to `TNF_TRANSPORT_LANE_SPEC.md` and
`TNF_PROVIDER_RESOLUTION_COHERENCE.md`._

Three service failures investigated on the same day turned out to be one defect
wearing three costumes: **something accumulates without a ceiling, and nothing
reports it until the thing dies.**

## The three instances

| Symptom                                                     | Accumulator                                                                                                | Outcome                                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `com.tnf.ws-green-blue-bridge` exit **-6** (SIGABRT)        | `state.inbox`, `events`, `state.channelMessages` in `check-federated-ws-channels.cjs`                      | V8 reached ~4 GB heap, aborted after ~39 min, launchd restarted it, repeat — a permanent crash loop |
| `com.tnf.subdirector-autopilot` exit **-15**, then unloaded | — (victim, not cause)                                                                                      | `ENOSPC: no space left on device` writing its own state file                                        |
| Volume at 100%, `~/.tnf` at 6.5 GB                          | `relay-stdout.log` 2.8 GB, `green-coordinator/logs/stdout.log` 1.2 GB, `relay-stderr.log` 958 MB, + 2 more | Filled the disk, which is what starved the autopilot                                                |

The causal chain runs right to left: unbounded logs filled the volume, the full
volume killed the autopilot, and separately an unbounded array killed the
bridge. **One service was killed by a different service's logging.**

## Why none of it surfaced

Neither failing service appears in `tnf agents list`, `tnf doctor`, or any
health surface. Both were visible only in `launchctl list` exit codes and their
own log files. A crash loop that restarts cleanly looks identical to a healthy
service from every dashboard TNF has.

This is the same lesson as `tnf send` reporting delivery it never achieved: a
signal that cannot fail is not a signal.

## Fixes applied

**Bridge.** `pushBounded()` caps the three arrays at 500 entries, oldest dropped
first. The delivery assertions only inspect recent traffic, so the check's
verdict is unchanged — verified `verdict: pass` before and after, both on the
discovered relay and on the `:3000` the service pins.

The port pin was investigated and **exonerated**: the check passes against both
`:3000` and `:3007`, so the plist's `TNF_RELAY_WS_URL` was not a contributor and
was left alone.

**Logs.** `scripts/runtime/rotate-tnf-logs.sh` caps any `*.log` under `~/.tnf`
above `MAX_MB` (default 100) to its last `KEEP_LINES` (default 20 000).
Reclaimed 5 892 MB across 5 files on first run; `~/.tnf` went 6.5 GB → 761 MB
and the volume 2.1 GB → 7.9 GB free.

Truncation is deliberately **in place** (`cat tail > file`), never `mv`.
Rotating by rename would leave every running service writing to an unlinked
inode: the log disappears from the directory, the space is not reclaimed until
the process exits, and the writer never notices. In-place truncation preserves
the inode, so writers keep working and the space is genuinely returned.

Wired into `establish-core-federated-fleet.cjs` alongside the sub-director sync,
so it runs on every fleet establish. Best-effort — a rotation failure records a
warning rather than aborting the fleet.

**Autopilot.** No code fix needed; it was a victim. It should recover now that
the volume has headroom. It is currently unloaded from launchd and will need a
`launchctl bootstrap` to return — deliberately left to the operator, since
loading a service is a machine-state change rather than a repo fix.

## What is still unbounded

Not exhaustive — this audit covered what was actively failing:

- `docs/operations/tnf-full-auto-daemon.log` and the `*.jsonl` run ledgers under
  `docs/operations/` grow without a cap. They are inside the repo, so they
  inflate the working tree and every clone rather than the volume alone.
- `~/.tnf/sub-director/operator-boot-latest.log` was 2.1 MB and is append-only.
- `sync-runtime.sh` writes a timestamped `.bak` on every replaced file and never
  prunes them.

## Rule for new services

Any long-lived TNF service must declare, in review:

1. **What it accumulates** — arrays, files, Redis keys — and the ceiling on
   each.
2. **Where its failure becomes visible** to an operator who is not reading
   `launchctl list` by hand.

A service that can only be observed by noticing it is missing is not monitored.
