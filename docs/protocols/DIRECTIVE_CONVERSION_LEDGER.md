`[CLASS:INTEL] [STATUS:PENDING]` `[DOC_AUDIT_BACKFILL:2026-07-14]` — header
restored for Gate 3 compliance; reclassify on next vetting pass.

# Directive Conversion Ledger

## CORE TENET (CORRECTED 2026-07-22) — Protocol Enforcement

TNF exists to PARODY + ASSIMILATE the BEST from ANY and ALL cutting-edge AI
agents. Daily news gathering by scouting agents feeds the assimilation cycle.
NOT "Hermes-to-TNF parity". Self-iterative basis.

**Purpose**: Track AI5 directives through execution states: `ready` → `claimed`
→ `running` → `verified` → `landed`

---

## Batch 001: Deep Sec Security Workflow

**Batch ID**: `ai5-phase7-batch-001`  
**Objective**: Convert the first top-priority AI5 directives into verified work
with evidence - Deep Sec security workflow  
**Owner**: `local-subdirector`  
**Claimed**: 2026-06-12T08:05:43Z  
**Executed**: 2026-06-12T08:30:00Z

### Execution Summary

| State       | Count | Percentage |
| ----------- | ----- | ---------- |
| ✅ Verified | 1     | 16.7%      |
| ⚠️ Blocked  | 4     | 66.7%      |
| 🔄 Running  | 0     | 0%         |
| 🔴 Failed   | 0     | 0%         |
| ⏭️ Skipped  | 1     | 16.7%      |
| **Total**   | **6** | **100%**   |

### Directive States

| ID          | Title                                                | State       | Blocked Reason                 | Evidence                                               |
| ----------- | ---------------------------------------------------- | ----------- | ------------------------------ | ------------------------------------------------------ |
| directive-1 | Initialize Deep Sec Scanner and Install Dependencies | ✅ verified | -                              | `ai5-phase7-evidence/directive-1-init-deepsec.json`    |
| directive-2 | Run Initial Deep Sec Project Scan                    | ⚠️ blocked  | scan-timeout-large-monorepo    | `ai5-phase7-evidence/batch-001-execution-summary.json` |
| directive-3 | Process Deep Sec Scan Findings with Language Model   | ⚠️ blocked  | dependency-blocked:directive-2 | -                                                      |
| directive-4 | Generate Deep Sec Security Report                    | ⚠️ blocked  | dependency-blocked:directive-2 | -                                                      |
| directive-5 | Apply Security Fixes using Open Spec                 | ⚠️ blocked  | dependency-blocked:directive-2 | -                                                      |
| directive-6 | Revalidate Security Fixes with Deep Sec              | ⏭️ skipped  | dependency-blocked:directive-2 | -                                                      |

### Blocker Analysis

**Primary Blocker**: `scan-timeout-large-monorepo`

- **Description**: Deep Sec scan hangs during file discovery on TNF's large
  monorepo (174+ directories)
- **Impact**: Blocks 4 of 6 directives (66.7% of batch)
- **Root Cause**:
  - TNF monorepo size exceeds deepsec's default scanning capacity
  - INFO.md contains placeholder content (not actual context)
  - No scan exclusions configured for node_modules, build artifacts
- **Resolution Path**:
  1. Fill `.deepsec/data/The-New-Fuse/INFO.md` with actual project context
  2. Configure scan exclusions in `deepsec.config.ts`
  3. Run scan with `--fast` mode or target specific packages
  4. Consider incremental scanning (packages/ first, then apps/)

### Evidence Artifacts

```
$TNF_ROOT/data/ingestion-runs/ai5-phase7-evidence/
├── directive-1-init-deepsec.json (1.5 KB)
└── batch-001-execution-summary.json (1.7 KB)
```

### Landed Artifacts

- ✅ Batch file updated:
  `data/ingestion-runs/ai5-phase7-tight-loop-batch-001.json`
- ✅ Evidence captured: `data/ingestion-runs/ai5-phase7-evidence/`
- ⏳ Security findings: pending (blocked by scan timeout)
- ⏳ Fix recommendations: pending (blocked by scan timeout)

---

## KPI Summary

**Phase 7 Conversion Velocity**:

- Directives claimed: 6
- Directives verified: 1 (16.7%)
- Directives landed: 0 (0%)
- Blocker rate: 66.7%

**Infrastructure Health**:

- Deepsec installed: ✅
- Project registered: ✅
- Scan completion: ❌ (timeout)
- Evidence capture: ✅

**Next Actions**:

1. Resolve scan timeout blocker
2. Re-run directives 2-6
3. Capture security findings
4. Generate fix recommendations

---

_Last updated: 2026-06-12T08:30:00Z_

---

## Batch 002: Hermes Cron Interpreter Bug Fix

**Batch ID**: `tnf-phase7-batch-002` **Objective**: Fix the Hermes cron
scheduler RuntimeError that renders Hermes-native cron unusable. All TNF agents
must use system cron as a workaround until this is resolved. **Owner**:
`local-subdirector` **Claimed**: 2026-06-23T22:58:00Z`

### Directive States

| ID          | Title                                                     | State      |
| ----------- | --------------------------------------------------------- | ---------- |
| directive-1 | Investigate Hermes cron scheduler RuntimeError root cause | ⚠️ blocked |
| directive-2 | Implement fix in hermes-agent cron internals              | ⚠️ blocked |
| directive-3 | Add regression test for cron interpreter restart          | ⚠️ blocked |
| directive-4 | Verify Hermes cron works end-to-end after fix             | ⚠️ blocked |
| directive-5 | Remove system cron workaround (restore Hermes-only)       | ⚠️ blocked |

### Known Symptoms

**Error**:
`RuntimeError: cannot schedule new futures after interpreter shutdown`
**Location**: `hermes-agent/cron/scheduler.py` (or equivalent Gemini-style cron)
**Affected jobs**: `be1d08855b63`, `7565931a6dc3`, `a28f0d31a6b3`,
`6f0bec6dae4e`, `a9407d63ca93` **Observation window**: 2026-06-09 to 2026-06-22

### Workaround in Place (2026-06-23)

System cron now drives all TNF cron agents:

- `*/5 * * * *` → `tnf-frontend-tester-cycle.sh`
- `*/15 * * * *` → `tnf-fleet-health-probe-cycle.sh`
- `*/15 * * * *` → `tnf-continuous-improver-watchdog.sh`

This workaround is stable. The directive is to **resolve the root cause** so
Hermes cron can be the sole scheduler.

### Root Cause Hypothesis

The cron interpreter thread dies after the first job completes (Python asyncio
event loop not restarted on `concurrent.futures.ThreadPoolExecutor` after
`shutdown` call). The `last_run_at` / `last_status` fields are never updated
because the thread exits before writing state.

### Evidence Artifacts

```
~/.hermes/cron/output/{be1d08855b63,7565931a6dc3,a28f0d31a6b3,6f0bec6dae4e,a9407d63ca93}.jsonl
```

### KPI Summary

**Phase 7 Conversion Velocity**:

| Metric                | Value             |
| --------------------- | ----------------- |
| Directives claimed    | 5                 |
| Directives verified   | 0 (0%)            |
| Directives landed     | 0 (0%)            |
| Workaround active     | Yes — system cron |
| Root cause identified | Pending           |

**Next Actions**:

1. Read `hermes-agent/cron/scheduler.py` source
2. Reproduce the RuntimeError in isolation
3. Fix event loop restart on ThreadPoolExecutor
4. Add test that verifies cron survives 3 consecutive runs
5. Switch back to Hermes-native cron after fix verified

_Last updated: 2026-06-23T22:58:00Z_

- 2026-08-07: Registry-sync protocol gap reconciled. CLI surfaces and .claude
  agents integrated into the native TNF agent registry.

---

## Batch 012: Silent-Gate Remediation (Turn Zero 2026-08-12)

**Batch ID**: `turn-zero-2026-08-12-silent-gates` **Objective**: Convert four
ASSIMILATE_CHECK findings — all cases of a health gate reporting the opposite of
the truth — into landed code with regression tests **Owner**: Claude Code
(interactive Turn Zero, operator Daniel Goldberg) **Handoff**:
`0151b397-7eb3-40a1-ba8d-a24e2cb70290` **Claimed / Executed**: 2026-08-12

### Directive States

| ID          | Title                                                        | State       | Evidence                                                                                                         |
| ----------- | ------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| directive-1 | Arm the full-auto circuit breaker inside the cycle loop      | ✅ verified | `full-auto-cycle.test.ts` (5 new streak assertions); 212-cycle streak reproduced from `tnf-full-auto-runs.jsonl` |
| directive-2 | Gate quarantine on a trailing streak, not a lifetime counter | ✅ verified | `validate-substrate-attestation.test.cjs` 8/8 pass, incl. 2 new cases covering both failure directions           |
| directive-3 | Point the A2A probe at the federation relay                  | ✅ verified | probe returns `ok:true`, responder `BROKER-Fuse-activity-log`; live check BLOCK → CAUTION                        |
| directive-4 | Keep probe diagnostics off the JSON stdout contract          | ✅ verified | `JSON.parse(probe.stdout)` succeeds; was throwing `Unexpected token 'C'` on every run                            |
| directive-5 | Correct the ASSIMILATE_CHECK scan path                       | ✅ verified | mandate + directives + continuous-improver updated to recurse `<job-hash>/<timestamp>.md`                        |
| directive-6 | Repair the `tnf-cli` test suite (missing `whatsapp.test.ts`) | ✅ verified | `WorkerEnvelope.test.ts` added; whatsapp chain removed; full `pnpm test` passes (2026-08-12)                     |

### Root Cause — shared across directives 1–4

Every one of these gates failed **toward "healthy"**. A gate that can only ever
report green is indistinguishable from a system that is actually green, and
nothing in CI could tell them apart because none of the four had a test
exercising the failure path. Directives 1–4 each ship with a regression test
that fails if the gate stops working.

Corollary worth keeping: two of the four (directives 3 and 4) were independent
defects in the **same 60-line probe**, either of which alone was sufficient to
produce the CRITICAL. Fixing the obvious one would have left the check broken
and looked like a fix. Verify a repair against the actual consumer, not the
symptom.

### KPI Summary

| Metric                       | Value                         |
| ---------------------------- | ----------------------------- |
| Findings raised              | 6                             |
| Landed with regression test  | 5 (83%)                       |
| Blocked on operator decision | 1                             |
| False CRITICALs eliminated   | 1 (`a2a-bridge-unresponsive`) |
| Live check verdict           | BLOCK → CAUTION               |
| Undetected failure window    | 212 cycles / ~7 weeks         |

_Last updated: 2026-08-12_
