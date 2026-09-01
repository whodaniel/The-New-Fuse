# TNF Resource Governance Mandate

**Status:** ACTIVE — 2026-08-27 **Enforced by:**
`scripts/lib/tnf-resource-guard.cjs`, `scripts/runtime/tnf-launchd-guard.sh`,
`scripts/runtime/tnf-resource-watchdog.cjs` **Registry:** job registration files
under `~/.tnf/resource-watchdog/registry/` (runtime, ephemeral); class budgets
are defined in `tnf-resource-guard.cjs`'s `CLASS_DEFAULTS`

## Purpose

Memory and CPU/process management are a highest-tier concern in TNF, not an
afterthought bolted on after an incident. This mandate exists because, until
2026-08-27, it was the latter.

The 2026-08-27 incident: `com.thenewfuse.qa-swarm`, a `KeepAlive` launchd job
running an unbounded continuous-build loop, drove load average to 84–88 and free
memory to ~15MB on this host, with **zero resource guard of any kind**. The
resulting starvation crashed shell processes across every open terminal
(`[Process completed]`). Audit found the gap was structural: the cron path had a
CPU-load-only preflight gate; every launchd job — the entire always-on fleet —
had no preflight gate at all; and nothing anywhere enforced a budget on a
process once it was already running. `tnf-process-health.sh --kill-stuck`
existed as a manual remedy for "stuck vite builds" specifically because this
exact failure mode had already happened before with no automated fix.

This mandate is what closes that gap, and what keeps it closed as the fleet
grows.

## Rules

### R1 — Every cron/launchd job runs under a resource guard, no exceptions

- Cron-routed jobs (`scripts/protocols/run-chronological-process.cjs`) get this
  automatically via its `loadGuardSnapshot()` integration.
- Every launchd job's `ProgramArguments` MUST route through
  `scripts/runtime/tnf-launchd-guard.sh` before the real command. A plist that
  execs its program directly, unwrapped, is a mandate violation — this is
  exactly the shape of the 2026-08-27 incident.
- The one deliberate exception is `com.thenewfuse.redis-tnf-bus`: given the
  prior Redis-bus doom-loop incident history in this fleet, its plist is left
  untouched rather than risk introducing a regression in the message bus every
  other job depends on. It is still `PROTECTED_LABELS`-excluded from automatic
  kill actions in the watchdog (monitored, never auto-killed) as
  defense-in-depth, independent of whether it's ever wrapped.

### R2 — Every job declares a resource class before being registered

A class is a budget: `maxCpuPercent`, `maxRssMb`, `maxWallClockMs`,
`maxConcurrent`, `nice` (see `CLASS_DEFAULTS` in `tnf-resource-guard.cjs`).
Current classes:

| Class              | For                                                                      | Wall-clock cap               |
| ------------------ | ------------------------------------------------------------------------ | ---------------------------- |
| `build`            | bounded one-shot builds                                                  | 6 min                        |
| `continuous-build` | supervised build/test loops designed to run indefinitely (e.g. qa-swarm) | none — CPU/RSS still bounded |
| `daemon`           | long-running services                                                    | none                         |
| `watchdog`         | the resource watchdog itself                                             | none, tightest CPU/RSS       |
| `probe`            | short periodic health checks                                             | 60s                          |
| `default`          | anything unlabeled                                                       | 5 min                        |

Picking the wrong class is a real failure mode, not a formality: within the
first hour of deployment, the watchdog correctly-but-wrongly killed a healthy
qa-swarm cycle because it was classed `build` (6-minute cap) when its inner loop
is actually a `continuous-build` (no cap, by design). Get the class right, or
the mechanism protects nothing and just adds false-positive kills. A job with
genuinely unusual requirements gets its own class added to `CLASS_DEFAULTS` — do
not silently work around a bad-fit class by disabling enforcement for that job
instead.

### R3 — The watchdog is mandatory infrastructure, not optional tooling

`com.tnf.resource-watchdog` (itself wrapped, class `watchdog`, `Nice 10`,
`ProcessType Background`) is the runtime-enforcement layer: it attributes
processes to jobs via registration files `tnf-launchd-guard.sh` writes to
`~/.tnf/resource-watchdog/registry/`, walks the live process tree from each
job's root pid, and enforces budgets with SIGTERM → 5s grace → SIGKILL. It never
signals anything not attributed to a registered job — there is deliberately no
"kill top CPU consumer system-wide" mode, to keep the user's own shell, editor,
and terminal sessions categorically out of reach.

Attribution never reads any process's environment. An earlier design tagged jobs
via an exported env var and read it back with `ps eww`; that failed in testing
because macOS blocks reading another process's environment across the launchd
bootstrap-namespace boundary — the watchdog could never see the tag on the exact
class of process (launchd daemons) it exists to protect. The registry-file
design also means the watchdog never touches the live secrets that `ps eww`
output contains for every process on the box. Do not revert to env-based
attribution.

### R4 — Fleet-wide overload trips the existing pause switch, automatically

If the system itself is overloaded (CPU load average or real macOS memory
pressure, via `vm_stat` — not the unreliable `os.freemem()`) regardless of
attribution, the watchdog sets `~/.tnf/fleet/mode.json` to `paused`
(`scripts/lib/tnf-fleet-mode.cjs`, already respected by every cron-routed job)
and kills the single worst CPU offender among registered TNF jobs. This
productionizes what was previously a manual step. It auto-resumes once the
system has been healthy for a few consecutive samples — but only a pause it set
itself; an operator-set pause (`updatedBy` other than `resource-watchdog`) is
never auto-cleared.

This is a deliberate operating choice: the watchdog is fully auto-remediating by
design here, not alert-only. Every action is logged to `~/.tnf/alerts.json` (the
existing, already-consumed alert channel — read at every session's Turn Zero
startup) for audit.

### R5 — Verify claims about this system, don't assert them

Per the fleet's own state-freshness discipline: "the guard exists" is not "the
guard works." Before trusting a resource-governance change, confirm the guard's
allow/deny paths actually fire (`tnf-resource-guard.cjs preflight`), the
watchdog's decision logic passes `tnf-resource-watchdog.cjs --self-test`, and —
ideally — that a real breach gets caught in production, the way the qa-swarm
wall-clock miscalibration was caught on 2026-08-27: by watching it happen, not
by assuming the code was right.

## Non-goals

- This mandate does not currently give cron catalog entries
  (`data/protocols/chronological-process-catalog.json`) a `class`/budget schema
  — none of the current ~20 cron entries are build-class or otherwise need one;
  the per-run `timeoutMs` they already have is sufficient. Add that schema when
  a real consumer needs it, not preemptively.
- Per-job budget _tuning_ beyond the class defaults above is a fast-follow, not
  a blocker — most of the fleet runs fine on class defaults. Tune a specific
  job's budget only when you have evidence it needs something different, the way
  qa-swarm did.
