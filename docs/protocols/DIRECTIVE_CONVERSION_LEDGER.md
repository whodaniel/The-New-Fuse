# Directive Conversion Ledger

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
/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-phase7-evidence/
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
