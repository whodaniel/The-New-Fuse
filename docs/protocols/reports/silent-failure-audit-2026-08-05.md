# Silent-Failure Audit — 2026-08-05

Status: findings recorded, fixes landed where noted Session handoff:
`cab8a8fb-7733-4293-9945-b0f32accab79` Branch: `fix/honest-failure-reporting`

## Why this exists

Seven independent components were found reporting success they had not achieved.
They are the same defect in different clothing, and the Turn Zero Mandate's
operating loop (**Inspect → Act → Verify**) already forbids all of them.
Recorded here per the Non-Temporal Proliferation Mandate so the pattern is
recognizable rather than rediscovered.

**Core insight:** honest failure reporting is the _precondition_ for graceful
degradation. A pathway that reports success prevents failover from ever firing —
every silent success is a failover that never happened.

## The seven

| #   | Component                      | Reported                 | Reality                                                         |
| --- | ------------------------------ | ------------------------ | --------------------------------------------------------------- |
| 1   | Chronological cron             | `exit 0`                 | `data/protocols/*.json` absent; **no job ran for ~11 weeks**    |
| 2   | `ModelsService.fetchModels`    | `[]`                     | 401 / 429 / timeout indistinguishable from "no models"          |
| 3   | `tnf-frontend-tester-cycle.sh` | "endpoint unreachable"   | TLS cert rejected; site was **up** the whole time               |
| 4   | Alert channel                  | 1,021 criticals enqueued | **zero consumers** since 2026-07-25                             |
| 5   | `claude_with_tnf`              | telemetry sent           | `wscat` not installed; `\|\| true` swallowed every message      |
| 6   | `check-proprietary-leakage.sh` | PASS                     | bare filenames matched nothing — **published proprietary code** |
| 7   | Session build wrapper          | `exit 0`                 | `tail` masked `tsc --build` failing underneath                  |

**#6 is the reference case.** Every `PROPRIETARY_SCRIPTS` entry was a bare
filename, so the remover resolved them repo-root-relative, matched nothing,
removed nothing — and the leak checker had the identical bug, so it also matched
nothing and reported clean. Closed source shipped to the public repo while the
guard said the boundary held. Fixed 2026-07-25; see `scripts/sync-repos.sh`.

**#4 is the most instructive.** The same unread queue held a _false_ critical
(386 × "endpoint unreachable") and a _true_ one (11 × "disk headroom below
2GB"). The fleet detected the disk exhaustion correctly, eleven times, days
before it was rediscovered by hand. Detection was never the problem; delivery
was. A fleet that detects correctly and reports into a void is indistinguishable
from one that is not watching.

## Root causes behind the noise

- **FortiGate TLS interception.** `thenewfuse.com` presents a chain issued by
  `O=Fortinet, CN=F2K61FTK23900187`. The site answers `403` when verification is
  skipped; google.com and github.com verify at 200, so the local trust store is
  fine. All 386 "outage" alerts were a certificate-trust problem wearing the
  wrong label. **Operator action required:** confirm the appliance is expected.
- **Duplicate master clocks.** 2–3 concurrent chains → double dispatch.
- **Control-plane artifacts are gitignored.** `data/protocols/*.json` are not
  recoverable from git; a cleanup sweep re-breaks the control plane silently.

## Fixes landed

| Fix                                                                                          | File                                                                   |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Probe classifies TLS / DNS / refused / timeout separately                                    | `scripts/agents/tnf-frontend-tester-cycle.sh`                          |
| Provider registry user-configurable; probes time-boxed; `unconfigured \| probe_failed \| ok` | `packages/tnf-cli/src/services/provider-config.ts`, `ModelsService.ts` |
| Leak checker refuses no-arg default and monorepo root; build outputs no longer false-stale   | `scripts/check-proprietary-leakage.sh`                                 |
| Turn Zero frontload wired across every global runtime surface                                | `scripts/install-agent-frontload.cjs`, `scripts/postinstall.cjs`       |
| Node version single-sourced: 41 pins → `node-version-file: .nvmrc`                           | `.github/workflows/*.yml`, `.nvmrc`                                    |
| Control plane rebuilt from service defaults + staff calendar                                 | `data/protocols/*.json`                                                |

Verification: 20/20 provider-config tests; leak checker regression-tested to
still detect real leaks (source **and** `dist/`) after the false-alarm fix; 34
workflows parse clean, 0 hardcoded pins; cleanroom boundary passes;
`verify-honest-failure.cjs` passes.

## Still open — operator-gated

Per **D1** (process kills, commits, deletes, credentials) and **D9** (financial
autonomy forbidden):

1. **GitHub Actions billing** — disabled since 2026-05-28; every gate dark,
   including `honest-failure-gate.yml`, which has never run, and "TNF Repo
   Separation Sync", which guards the boundary that already failed once.
2. **FortiGate** — expected, or an unexpected interception?
3. **Alert channel** — add a consumer, or stop producing into it.
4. **Duplicate master clocks** — needs a process kill.
5. **`hooks.SessionStart`** in `~/.claude/settings.json` — hook built,
   unregistered.
6. **`fix/honest-failure-reporting`** — 5 commits unmerged.

## Anti-pattern checklist

Before shipping any check, gate, or probe:

- Does every failure mode produce a _distinguishable_ result?
- Does the wrapper's exit code reflect the inner command's? (`cmd | tail` does
  not)
- If this ran and found nothing, is that because nothing is wrong — or because
  it looked in the wrong place?
- Does anything actually _consume_ what this emits?
- Would a fresh checkout make it cry wolf, training operators to ignore it?
