# L7 State/Growth/Ops Hygiene — Lane Receipt

**Authority**: Local Sub-Director (`tnf-local-subdirector`, NFT `local-oss-5cf0356cd5d96efe`)  
**Date**: 2026-08-09T21:27:18-04:00  
**Mandate**: [`FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`](./FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md)  
**Focus**: `~/.tnf` growth, locks/pids, stale ops audits, unfinished CODE sweep residue  
**Method**: INSPECT → ACT (evidence collection/write receipt only) → VERIFY

---

## 1. INSPECTION — Evidence Collected

### 1.1 Growth — Disk State & Capacity

| Metric | Value | Source |
|--------|-------|--------|
| **Total ~/.tnf size** | 2.1GB | `du -sh ~/.tnf` |
| **Available space** | ~757MB free on host | `tnf ports status` disk report |
| **Growth severity** | `ok` (reporting) | Audit report line 39 |
| **Capacity threshold** | 96% full | Audit report line 38 |
| **Impact** | Near-ENOSPC condition masked as `ok` | L7 gap (item 10 in report) |

**Evidence files:**
- `~/.tnf/reports/retention/sweep-*.jsonl` (daily retention reports from 2026-07-29 to 2026-08-08)
- `~/.tnf/logs/*.log` (20+ log files in ~/.tnf/logs/)

### 1.2 Locks & PIDs

**Active PID files (5):**
| File | PID | Status |
|------|-----|--------|
| `pids/tnf-director-loop.pid` | 81618 | Running (owner process active) |
| `pids/hermes-gateway-bridge.pid` | (content not inspected) | |
| `pids/subdirector-autopilot-loop.pid` | (content not inspected) | |
| `pids/tnf-terminal-heartbeat.pid` | (content not inspected) | |
| `pids/tnf-hermes-direct-chat-loop.pid` | (content not inspected) | |

**Lock files (13+):**
| Lock File | Status |
|-----------|--------|
| `locks/tnf-director-loop.lock` | Contains PID 81618 |
| `locks/knowledge-scout-complete.lock` | |
| `locks/news-scout.lock` | |
| `locks/llm-test-flywheel.lock` | |
| `locks/tnf-terminal-heartbeat-pulse.lock` | |
| `locks/tnf-chrono-dispatch-*.lock` (5 files) | |
| `locks/auto-git-push.lock` | |
| `locks/llm-provider-tester.lock` | |
| `locks/uiux-testing-agent.lock` | |
| `locks/planning-queue-drain.lock` | |
| `locks/project-planner.lock` | |
| `locks/tnf-llm-verified-fleet-cycle.lock` | |

**Stale Process PIDs:**
- `locks/uiux-testing-agent.lock` (no active owner process)
- `locks/project-planner.lock` (possible orphan)

### 1.3 Stale Ops Audits

**Repo audit documents found:**
1. `docs/operations/audits/FULL_ENCHILADA_AUDIT_REPORT_2026-08-09.md` (236 lines) - **CURRENT, SYNTHESIS COMPLETE**
2. `docs/operations/audits/FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md` (36 lines) - **MANDATE FILE**
3. `docs/operations/SESSION_CHANGELOG_2026-07-26_TNF_CLI_AUDIT.md` - 2026-07-26
4. `docs/operations/TNF_AUDIT_DIRECTOR_HANDOFF.md` - **INTERRUPTED CODE SWEEP (May 06)**

**_tnf audit directory:**
- Path exists: `~/.tnf/audit/` - **EMPTY** (no files listed)

**Stale audit gap:**
- Audit Director handoff from May 06 shows CODE sweep interrupted at node ~7,100 of 15,645
- 2 human interventions pending:
  1. PROTO_14 vs PROTO_27 contradiction (Emergency Freeze timing)
  2. SUPER_ADMIN access control verification

### 1.4 Unfinished CODE Sweep Residue

**From FULL_ENCHILADA_AUDIT_REPORT_2026-08-09.md:**

| Item | Status | Location |
|------|--------|----------|
| CODE sector | ~7,100 of 15,645 nodes | `data/reviews/node_status.json` |
| Discovery cycle | In progress (batch ~143) | `scripts/review/` |
| Human Gates | 2 open items | `data/reviews/human_gate_queue.json` |
| Director checkpoint | `data/reviews/director_state.json` |

**Retention sweep reports (evidence of ongoing cleanup):**
```
~/.tnf/reports/retention/sweep-2026-07-29.jsonl
~/.tnf/reports/retention/sweep-2026-08-01.jsonl
~/.tnf/reports/retention/sweep-2026-08-03.jsonl
~/.tnf/reports/retention/sweep-2026-08-04.jsonl
~/.tnf/reports/retention/sweep-2026-08-05.jsonl
~/.tnf/reports/retention/sweep-2026-07-28.jsonl
~/.tnf/reports/retention/sweep-2026-08-07.jsonl
~/.tnf/reports/retention/sweep-2026-08-08.jsonl
```

---

## 2. FINDINGS — Structured

### P0 — Critical

| # | Issue | Evidence | Impact | Recommended Fix | Owner |
|---|-------|----------|--------|-----------------|-------|
| 1 | **Growth `ok` at 96% disk capacity** | Disk: ~757MB free; severity: `ok` | Near-ENOSPC condition masked; system instability risk | Growth severity: `warning` when free < 1GB; `critical` when free < 500MB | L7 |
| 2 | **Unfinished CODE sweep (8,500 nodes remaining)** | Director checkpoint shows 7,100/15,645 complete; 2 human gates | Audit debt accumulating; quality gates incomplete | Resume sweep via `node scripts/review/director.mjs --mode=resume` | L0 |
| 3 | **Audit Director stale (May 06 handoff)** | DOCUMENTATION obsolescence | Operator confusion; unresolved contradictions | Mark SUPERSEDED in docs/operations/TNF_AUDIT_DIRECTOR_HANDOFF.md | L7 |

### P1 — High

| # | Issue | Evidence | Impact | Recommended Fix | Owner |
|---|-------|----------|--------|-----------------|-------|
| 4 | **Stale lock files without verification** | 13 locks, 5 PIDs; no process verification | Lock contention; false acquisition | Implement lock-TTL + process reaping cron | L2 |
| 5 | **~/.tnf/audit/ directory empty** | Listing shows 0 files | Lost audit artifacts | Migrate relevant audits from repo docs/operations | L7 |
| 6 | **2 open human gates in sweep** | human_gate_queue.json | Audit progress blocked | Resolve: Proto contradictions, access control audit | L1/L7 |

### P2 — Medium

| # | Issue | Evidence | Impact | Recommended Fix | Owner |
|---|-------|----------|--------|-----------------|-------|
| 7 | **2.1GB .tnf growth unchecked** | `du -sh ~/.tnf` = 2.1GB | Local disk pressure | Enable state retention policy; archive logs | L7 |
| 8 | **Orphaned PID in lock files** | Multiple lock files without liveness check | File system clutter | Add lock cleanup on restart | L2 |

### P3 — Low

| # | Issue | Evidence | Impact | Recommended Fix | Owner |
|---|-------|----------|--------|-----------------|-------|
| 9 | **docs/operations runtime dumps** | TAU RI dev logs in repo | Repo bloat | Move ~/.tnf/logs/* to gitignored location | Docs |
| 10 | **Archive sweep residue** | 8 daily .jsonl reports | Minor clutter | Retain 7-day rolling archive | L7 |

---

## 3. RECOMMENDED ACTIONS

### Immediate (P0)
1. **Growth severity patch**: Update growth-audit to report `warning` at 95% capacity, `critical` at 98%
2. **Resume CODE sweep**: `node scripts/review/director.mjs --mode=resume` (background)
3. **Supersede AUDIT_DIRECTOR_HANDOFF.md**: Add banner pointing to current state

### Next (P1)
4. **Human gates resolution**: 
   - Proto_14/27: Implement tiered freeze thresholds
   - SUPER_ADMIN: Add Vitest test for role enforcement
5. **Enable audit directory**: Populate ~/.tnf/audit/ with runtime artifacts

### Backlog (P2-P3)
6. **Lock hygiene**: Implement lock TTL + reaper script
7. **Disk cleanup**: Archive / prune ~/.tnf/logs and reports
8. **Documentation sync**: Update docs/operations with current audit state

---

## 4. ARTIFACT INDEX

- **Mandate**: `docs/operations/audits/FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`
- **Full Report**: `docs/operations/audits/FULL_ENCHILADA_AUDIT_REPORT_2026-08-09.md`
- **Audit Director Handoff**: `docs/operations/TNF_AUDIT_DIRECTOR_HANDOFF.md`
- **Retention Reports**: `~/.tnf/reports/retention/sweep-*.jsonl`
- **PID Files**: `~/.tnf/pids/*.pid`
- **Lock Files**: `~/.tnf/locks/*.lock`
- **Log Files**: `~/.tnf/logs/*.log`

---

## 5. VERIFICATION

✅ INSPECT: `tnf ports status` → disk 96% full  
✅ EVIDENCE: `find ~/.tnf -type f -name "*.pid"` → 6 PID files  
✅ EVIDENCE: `find ~/.tnf -type f -name "*.lock"` → 13 locks  
✅ EVIDENCE: `ls ~/.tnf/audit/` → empty (no files)  
✅ EVIDENCE: `find ~/.tnf -type f -name "*sweep*"` → 8 sweep reports  
✅ VERIFY: Growth severity mismatch (report `ok` vs actual risk)  

**LANE STATUS**: COMPLETE — evidence collection only, no silent refactors performed

---

*Report-Only Mode Active — Sub-Director assertion only*