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

## Closed since (2026-08-12, same day)

**Monitoring.** `tnf services` (alias `svc`) reports every managed launchd
label: crash loops, failures, and plists present but not loaded. A summary panel
runs inside `tnf doctor`, so the check sits where an operator already looks.
`--strict` exits non-zero for cron.

On its first run it surfaced **eight** services needing attention where only two
were known — including `com.thenewfuse.relay-monitor`, `com.thenewfuse.relay`,
`com.tnf.master-heartbeat` and `com.tnf.master-reconciliation`, none of which
had appeared anywhere.

Classification detail that makes it work: a negative launchd status means
killed-by-signal, and under `KeepAlive` the process is already running again by
the time you look. So pid presence must not imply health — that is precisely how
the WS bridge stayed broken while `launchctl list` intermittently showed a
healthy pid.

Two false signals were caught in this surface _before_ it shipped:

- It first reported a `Cannot find module tnf-fleet-mode.cjs` for
  master-heartbeat that a re-sync had already fixed hours earlier. Evidence is
  now age-gated to logs written within 6 hours.
- The age label originally implied the _line_ was recent. It is the _log file's_
  mtime — a live service can hold an old fatal line in its tail, which
  relay-monitor does. The label now reads `log active Nm ago` and leaves the
  judgement to the reader, because these formats carry no reliable per-line
  timestamps.

**A false positive, caught the same way.** After the triage restarts below, the
surface reported _seven_ services as crash-looping — all of them healthy,
because `launchctl kickstart -k` leaves exactly the signature a crash leaves: a
live pid with a negative last exit. Over-reporting destroys trust in a monitor
just as thoroughly as under-reporting, so classification is now
**corroborated**: a live pid with a negative exit and no recent fatal log output
is `restarted` (not a problem), and only corroborated failure earns
`crash-loop`. That is what the docstring had claimed all along; the code was not
doing it.

Evidence gathering is opt-out (`report({ evidence: false })`): tail-reading
every declared log path pushed `tnf doctor` past its 30s budget. Doctor's panel
opts out and costs ~81 ms.

**Rotation coverage.** `rotate-tnf-logs.sh` now also covers `docs/operations/`
`*.log` and `*.jsonl`, which are worse than the `~/.tnf` ones because they live
inside the repository and inflate every clone, and prunes `sync-runtime.sh`
backups to the newest `KEEP_BACKUPS` (3) per file.

## What is still unbounded

- `~/.tnf/sub-director/operator-boot-latest.log` — 2.1 MB, append-only, below
  the 100 MB rotation threshold so nothing trims it yet.
- Redis keys are uncapped and unaudited; this pass covered files and arrays
  only.

## Triage of the eight (2026-08-12)

Most were collateral from the disk exhaustion, not independent faults:

| Service                                                   | Verdict                                                                                                                                                                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `master-heartbeat`, `federation-broker.fuse-activity-log` | stale ENOSPC from 08:17; recovered on restart, now cycling normally                                                                                                                                         |
| `master-reconciliation`                                   | stale `control-plane-state.json missing` from 00:45; the file exists and `verify-process-health.cjs` now passes 29 healthy / 1 finding. Its `exit 1` is a _report_ verdict (NOT CLEAN), not a service fault |
| `relay`                                                   | alive throughout; noisy master-clock registration timeouts                                                                                                                                                  |
| `relay-monitor`                                           | still flagged: its active log tail holds ENOSPC lines, so evidence corroborates. Known limitation — file-level, not line-level, recency                                                                     |
| `fleet-health-probe`, `subdirector-autopilot`             | plists present, never loaded — operator `launchctl bootstrap`                                                                                                                                               |

Note the gitignore interaction: `data/protocols/*-state.json` is ignored by
`.gitignore:293`, so a fresh checkout has no control-plane state and consumers
that treat absence as BLOCKED will fail until something writes it.

## Rule for new services

Any long-lived TNF service must declare, in review:

1. **What it accumulates** — arrays, files, Redis keys — and the ceiling on
   each.
2. **Where its failure becomes visible** to an operator who is not reading
   `launchctl list` by hand.

A service that can only be observed by noticing it is missing is not monitored.
