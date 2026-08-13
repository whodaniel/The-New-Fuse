---
name: tnf-honest-guard-review
description:
  Review any check, gate, probe, validator, health monitor, or CI workflow
  before it ships, to ensure it cannot report success it did not achieve. Use
  when writing or modifying anything that reports pass/fail, when a guard has
  never failed, when a monitor has gone quiet, or when a "working" system turns
  out to have been silently broken.
---

# TNF Honest Guard Review

A guard that reports success it did not achieve is worse than no guard: it
converts an unknown into a false certainty, and it prevents failover from ever
firing. Every severe defect in the 2026-08-05 audit was an instance of this.

Authority: `docs/protocols/TURN_ZERO_MANDATE.md` (Inspect → Act → Verify).
Evidence: `docs/protocols/reports/silent-failure-audit-2026-08-05.md`.
Enforcement: `scripts/protocols/verify-honest-failure.cjs` (source patterns),
`scripts/protocols/verify-declarations.cjs` (declared vs actual).

## When to run this

Before shipping anything that answers "is this OK?" — a validator, a health
probe, a CI gate, a cron cycle, a monitor, a boundary check, a lint rule.

## The seven questions

Apply every one. Each maps to a defect that actually shipped.

**1. Does every failure mode produce a distinguishable result?**
`catch { return [] }` made a 401, a 429, a timeout and "genuinely no results"
identical, so failover could not route around a failure it could not see. Return
a discriminated outcome — `ok | unconfigured | failed(reason)` — not a bare
empty value.

**2. Does the exit code reflect the work, or the last thing in the pipe?**
`cmd | tail` reports `tail`'s status. `cmd > log; echo $?` reports the
command's. Shell scripts without `set -e` exit 0 after an inner failure. 270 of
645 TNF shell scripts still lack `set -e`.

**3. If it found nothing, is that because nothing is wrong — or because it
looked in the wrong place?** `PROPRIETARY_SCRIPTS` entries were bare filenames,
so the checker resolved them against the repo root, matched nothing, and
reported PASS while proprietary code published. Missing input must be a distinct
outcome (exit 2), never a silent pass.

**4. Does anything actually consume what this emits?** 1,021 critical alerts
accumulated in `tnf:master:tasks:planning` with zero consumers for 11 days —
including 11 true disk-exhaustion warnings nobody read. An emitter without a
proven reader is a no-op with extra steps.

**5. Would a fresh or unbuilt checkout make it cry wolf?** A check that fails by
default trains operators to ignore its output, which is how a real failure hides
among false ones. Legitimately-absent conditions (build outputs, optional
runtimes) report NOTE, not FAIL.

**6. Is the thing it validates declared in more than one place?** Four hardcoded
provider lists, node versions in 42 files, three model-config sources. Every
duplicate is a drift surface. Single-source it, and have the others read from
that source.

**7. Has it ever actually failed?** A gate that has never gone red is either
guarding nothing or has never run. `honest-failure-gate.yml` was correct,
committed, and had **never executed** — CI was disabled for billing. Prove the
guard fires: inject the defect it exists to catch and confirm it goes red.

## Required proof before shipping

Do not report a guard as working on the strength of it passing:

1. **Inject the defect.** Create the exact condition it must catch; confirm
   non-zero exit and an actionable message.
2. **Confirm the clean case.** Run against known-good input; confirm exit 0 and
   no noise.
3. **Confirm the blocked case.** Remove an input it depends on; confirm it
   reports "cannot run" distinctly from "nothing wrong".
4. **Read the real exit code.** Not through a pipe.

## Message quality

A finding must name the fix. `endpoint unreachable` cost 11 days because the
real fault was `TLS certificate verification failed` — the label named a symptom
class the operator could not act on. Report _what resolves it_, and where.

## Anti-patterns, verbatim

```
catch { return [] }                 # failure indistinguishable from empty
|| true                             # swallows the reason
2>/dev/null                         # discards the only diagnostic
cmd | tail                          # exit code is tail's
exit 0  # (after an error branch)   # cron records success
TARGET="${1:-$DEFAULT}"             # no-arg default that scans the wrong thing
```
