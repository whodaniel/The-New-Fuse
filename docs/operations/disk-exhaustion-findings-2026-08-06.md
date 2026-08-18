# Disk Exhaustion — Findings, 2026-08-06

Status: growth source fixed and bounded. Baseline consumption **not** addressed
— see "What this does not fix".

## Symptom chain

The volume sat at 99% for the whole session, and the consequences were not
cosmetic:

| When              | Symptom                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| session start     | `ENOSPC` writing a scratch file                                            |
| every commit      | `pack-objects died of signal 11` — auto-gc could not repack                |
| a commit          | `fatal: unable to write new_index file` — **a log file cost a commit**     |
| 11× before either | fleet alerts `disk headroom below 2GB`, unread in a queue with no consumer |

The fleet detected this correctly, eleven times, days before a human did. That
failure is documented separately in `silent-failure-audit-2026-08-05.md`.

## Measured, not assumed

Volume: 466 GiB, 437 GiB used, ~6.4 GiB free.

**Baseline (large, static, not TNF's):**

| Path            | Size     | Nature                                                              |
| --------------- | -------- | ------------------------------------------------------------------- |
| `/Library`      | 142 GiB  | Application Support 76, **Audio 39, Arturia 13** — music production |
| `/Applications` | 26 GiB   | installed software                                                  |
| home            | ~50 GiB  | Desktop 21 (incl. the repo), Library 21, Documents 6                |
| unaccounted     | ~220 GiB | not readable without elevated privileges                            |

**Growth (small, dynamic, TNF's — files written in the last 24h):**

| Path                                         | Size       |
| -------------------------------------------- | ---------- |
| `.agent/runtime-logs/api-gateway.log`        | 499 MB     |
| `.agent/runtime-logs/master-clock-dev.log`   | 442 MB     |
| `.agent/runtime-logs/api-local.log`          | 269 MB     |
| `.agent/runtime-logs/relay-dev.log`          | 136 MB     |
| `.agent/runtime-logs/factory-supervisor.log` | 122 MB     |
| `~/.tnf/relay-monitor/logs/stderr.log`       | 56 MB      |
| **`.agent/runtime-logs` total**              | **1.4 GB** |

`grep -rln "logrotate\|rotateLog\|maxSize\|truncate"` across `scripts/runtime/`
and `scripts/agents/` found no rotation for any of these.

**The distinction that matters:** the baseline is large but static and mostly
not TNF's to manage. The logs are smaller but _grow without bound_ from services
that have been up for days. Only the second category causes recurring
exhaustion, and only the second category is fixable here.

## Root cause

Long-lived services (`master-clock`, `api-gateway`, `api-local`, `relay`,
`factory-supervisor`) append to fixed log paths with no size cap and no
rotation. Uptime alone guarantees the volume fills.

## Fixes applied

**1. Immediate reclaim — 1,554 MB.** Free space 6.9 → 8.2 GiB.

**2. `scripts/protocols/rotate-runtime-logs.cjs`,** registered as
`tnf-runtime-log-rotation` (system_framework / observability) on `13 */4 * * *`.
Rotates any `.log`/`.out`/`.err` over 50 MB down to a 5 MB tail across
`.agent/runtime-logs`, `~/.tnf/relay-monitor/logs`, `~/.tnf/poll-jobs`,
`~/.hermes/logs`.

Three design points that are load-bearing:

- **Truncate in place, never delete.** These files are held open by running
  processes. Deleting one frees nothing — the inode survives until the writer
  exits, so the space stays consumed while `ls` shows the file gone. That is
  disk usage you cannot find by looking. Rewriting through the same path keeps
  the descriptor valid and returns the blocks immediately.
- **Keep a tail, don't zero.** A log truncated to nothing at the moment
  something breaks is worse than a large log.
- **Finding nothing to rotate is exit 0.** A rotator that goes non-zero on a
  healthy system trains its operator to ignore it.

## Verification

Reproducible end to end:

```bash
# 1. rotator is a no-op on a healthy system
node scripts/protocols/rotate-runtime-logs.cjs --dry-run     # "nothing above 50MB", exit 0

# 2. it actually rotates (proven, not assumed)
python3 -c "open('.agent/runtime-logs/_t.log','w').write('x'*80000000)"
node scripts/protocols/rotate-runtime-logs.cjs               # 78M -> 5M, reclaimed 73MB
rm -f .agent/runtime-logs/_t.log

# 3. newest data survives, oldest is dropped
#    verified: last line identical before/after; first line advanced

# 4. scheduled and consistent
node scripts/protocols/build-process-registry.cjs --verify   # exit 0
node scripts/protocols/verify-declarations.cjs               # exit 0 (crontab integrity)
node scripts/protocols/run-chronological-process.cjs --process-id tnf-runtime-log-rotation
```

The first draft of the rotation test used a 37 MB file — under the 50 MB
threshold — and "passed" by doing nothing. Recorded because it is the same
mistake this codebase keeps making: a test that cannot fail proves nothing.

## What this does not fix

Stated plainly so the fix is not mistaken for more than it is.

1. **~437 GiB of baseline usage is untouched**, dominated by audio production
   libraries and ~220 GiB not readable without elevated privileges. Rotation
   bounds _growth_; it does not create headroom. If the volume is near-full at
   rest, it will approach full again from other sources.
2. **`git gc` still segfaults.** `pack-objects died of signal 11` recurred on
   every commit this session. A manual
   `git -c pack.threads=1 -c pack.windowMemory=256m gc` succeeded, so it is
   memory pressure on a 1.14 GiB pack, not corruption —
   `git fsck --connectivity-only` returned exit 0 with zero errors. Automatic
   maintenance remains broken.
3. **Rotation runs every 4 hours.** A service that logs faster than ~12 MB/min
   could still fill the disk between cycles. Nothing observed logs near that
   rate, but the bound is time-based, not rate-based.
4. **The 5 MB tail discards history.** Anything needing full logs must ship them
   elsewhere before rotation.

## Follow-ups worth taking

- Clear `.git/gc.log` and schedule a memory-limited `git gc`, or accept that
  packs grow unbounded.
- Decide whether the ~220 GiB unaccounted region is reclaimable; it needs
  privileges this audit did not have.
- Consider having services log through a size-capped writer rather than
  appending forever, which would make rotation a safety net instead of the
  mechanism.
