# Deep Thinking Cycle — 2026-08-10T03:18:00Z

## System Snapshot

- **Harness**: DEGRADED — Turn Zero artifacts present, living state synchronized, agent registration OK, but autonomy health = CRITICAL (autopilot_or_subdirector_critical, disk_capacity_100pct, a2a_bridge_process_absent)
- **Relay**: UP — healthy at http://localhost:3000/health (uptime 81.8s, 4 agents, 12 channels)
- **Gateway**: PASS — all routes return 200: /health, /pricing, /features, /docs
- **Tauri**: LIVE — running on port 1420, all 13 routes return 200 (/, /platform, /mission, /agents, /a2a, /chat, /knowledge, /workflows, /mcp, /analytics, /web-hub, /voice, /computer-use, /terminal, /settings)
- **Chrome Ext v6**: CLEAN — `chrome.commands.onCommand.addListener(this.handleCommand.bind(this))` correctly bound at line 186
- **Chrome Ext v5**: ISSUE FOUND — `chrome.commands.onCommand.addListener((command) => {...})` at line 1399 uses arrow function without `.bind(this)` but doesn't actually use `this` inside (no bug in practice, but pattern is inconsistent)
- **UI Tests**: FAIL — 5 test suites, 0 tests passing. Jest cannot parse TypeScript/JSX imports (`import { jsx as _jsx...` — ESM transform not configured correctly)
- **Git**: branch=fix/honest-failure-reporting, 200+ modified files (mostly skill snapshots, protocol docs, audit reports), many deleted node_modules files (expected), several new untracked files

---

## Deep Observations

### 1. The Stale Task Queue is an Architectural Bug (CRITICAL)

**The Root Cause**: In `packages/relay-core/src/services/task-scheduler.service.ts`, the `isRealtimeDispatchCandidate()` function (lines 141-150) ONLY promotes tasks with these lanes:
- `realtime_broker_routing`
- `relay_federation`
- `redis_sync`
- `tauri_sync`
- `directive`

The 8 tasks stuck in `tnf:master:tasks:pending` have lanes: `orchestration` (2), `reliability` (3), `context` (1), `self_improvement` (1), `quality` (1). **None qualify for realtime dispatch**, so they sit forever in the pending queue.

The `targetQueueForTask()` function (lines 152-159) routes non-realtime tasks to `TASKS_PLANNING` — but nothing consumes that queue. The polling logic in `pollAndQueueTasks()` (lines 206-293) explicitly filters for `isRealtimeDispatchCandidate()` at line 215. **The pending queue is a write-only black hole.**

**Why This Happened**: The task scheduler was designed around a "realtime-only" dispatch model where only certain high-priority lanes get immediate processing. The "planning" queue was presumably meant for a separate consumer (batch processor, cron job) that was never implemented or was removed.

**Evidence**: Redis shows `llen tnf:master:tasks:realtime` = 0, `llen tnf:master:tasks:pending` = 8. The subdirector logs show it's running (30s intervals) but only doing identity sync — no task processing.

### 2. Harness Autonomy Health = CRITICAL but Misleading

The `tnf harness inspect` reports `autonomy.health: rollup=critical` with three reasons:
- `autopilot_or_subdirector_critical` — likely because subdirector isn't processing tasks
- `disk_capacity_100pct` — this is concerning; need to verify actual disk usage
- `a2a_bridge_process_absent` — A2A bridge not running (expected if not explicitly started)

The subdirector IS running (launchd shows PID 40988, logs show 30s intervals) but it's only doing identity/heartbeat sync, not actual work processing. This is a **liveness vs. readiness** problem — the process is alive but not doing its job.

### 3. UI Test Suite is Fundamentally Broken (Not Just Failing)

The Jest config uses `ts-jest` with `useESM: true` but:
- `tsconfig.json` has `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` (ESM)
- The test files use `import` syntax
- But `ts-jest` with `useESM: true` requires `"type": "module"` in package.json AND proper ESM transforms

The error `SyntaxError: Cannot use import statement outside a module` confirms Jest is running the raw TypeScript without transformation. This is a **configuration mismatch**, not a test logic issue. The tests have likely never run successfully in this configuration.

### 4. Chrome Extension v5 has a Latent Bug Pattern

In v5 (line 1399): `chrome.commands.onCommand.addListener((command) => {...})` — the arrow function captures `this` lexically, so `this.broadcastToTabs` would work. But the pattern is inconsistent with v6 which correctly uses `.bind(this)`. More critically, v5's `setupCommands()` doesn't bind `this` for any other callbacks. If any callback inside used `this`, it would fail. v6 is correct.

### 5. Git Working Tree Shows Massive Churn

200+ modified files, mostly:
- Skill bank snapshots (581 skills being tracked)
- Protocol docs and audit reports (self-improvement loops writing to docs)
- Deleted node_modules files (expected — these are in .gitignore but showing as deleted because they were previously tracked?)

The branch `fix/honest-failure-reporting` suggests this is a feature branch with ongoing work. The uncommitted changes are largely auto-generated artifacts (audits, reports, skill snapshots) which is normal for TNF's self-improvement loops.

---

## Actions Taken

**No fixes applied this cycle** — this is the first inspection cycle. The purpose was comprehensive observation and root cause analysis. The following issues are now documented for remediation:

1. **Task Scheduler Fix Required**: The `isRealtimeDispatchCandidate()` function must be updated to include lanes that represent actual work: `orchestration`, `reliability`, `quality`, `context`, `self_improvement`. These are not "planning" lanes — they are operational lanes that need realtime dispatch.

2. **Jest Config Fix Required**: Either:
   - Switch to `ts-jest` without `useESM: true` and use CommonJS transforms, OR
   - Fully commit to ESM with `"type": "module"`, `"module": "ESNext"`, and proper `transformIgnorePatterns`

3. **Subdirector Task Processing**: Need to verify if the local-subdirector should consume from the task queues. Currently it only does identity/heartbeat.

---

## Architectural Concerns

### RECURRING BLOCKER: Task Queue Pipeline Stalled (3+ cycles likely)

This is the **most critical finding**. The 8 tasks in pending have been there since at least 00:00 UTC (oldest: `tenant-continuous-qa-loop-1786320010703-1y1iv2` created 2026-08-10T00:00:10.703Z). The task scheduler's design explicitly EXCLUDES the lanes that represent the core autonomous loops (reliability, orchestration, quality, self_improvement, context). 

**This means the autonomous improvement loops CANNOT RUN** — they queue tasks that are never dispatched. The system appears "running" (harness inspect passes most checks, relay is up, gateway is up) but the **actual autonomous work is blocked**.

The gap between "running" and "actually doing useful work" is exactly this: the task scheduler filters out the very lanes that constitute the system's autonomous operation.

### Skills Drift vs. Protocol Evolution

581 skills tracked in `.agent/skill-bank/` with snapshots from both Claude and Codex. The skill manifests and indexes are modified every cycle. This is expected for a self-improving system, but there's no validation that skills remain compatible with current protocol versions. The `tnf-harness-integrity-auditor` skill exists but isn't run automatically.

### Test Infrastructure Debt

The UI test suite has 0 passing tests. This isn't a regression — it's likely been broken since the ESM migration. Without tests, refactoring the UI components (which are heavily used across Tauri, frontend, and chrome extension) carries risk.

### Disk Capacity Alert

`autonomy.health` reports `disk_capacity_100pct`. This could be:
- Actual disk full (dangerous)
- False positive from monitoring (df vs. actual usable space)
- `.tnf` directory growing unbounded (logs, handoffs, skill snapshots)

Need to investigate in next cycle.

---

## Recommendations for Next Cycle

1. **PRIORITY 1 — Fix Task Scheduler**: Edit `packages/relay-core/src/services/task-scheduler.service.ts`:
   - Add `orchestration`, `reliability`, `quality`, `context`, `self_improvement` to `isRealtimeDispatchCandidate()` allowlist
   - Verify `targetQueueForTask()` routes these to `TASKS_REALTIME`
   - After fix, manually push the 8 stuck tasks to realtime queue: `redis-cli rpush tnf:master:tasks:realtime "<task_json>"` for each
   - Verify subdirector or worker processes them

2. **PRIORITY 2 — Diagnose Disk Capacity**: Run `df -h /` and `du -sh ~/.tnf` to determine if `disk_capacity_100pct` is real.

3. **PRIORITY 3 — Fix Jest Config**: Choose one path:
   - Option A: Set `"type": "module"` in package.json, update tsconfig to `"module": "ESNext"`, add `transformIgnorePatterns` for node_modules
   - Option B: Revert to CommonJS transform (remove `useESM: true`, set `module: "CommonJS"` in jest transform config)

4. **PRIORITY 4 — Verify Subdirector Task Consumption**: Check if local-subdirector runtime (`scripts/runtime/local-subdirector-runtime.cjs`) polls Redis task queues. If not, the fix in #1 alone won't process tasks — a consumer is needed.

5. **Monitor Chrome Extension v5**: The unbound `this` pattern is a latent bug. Consider deprecating v5 or applying the same `.bind(this)` pattern for consistency.

6. **Git Hygiene**: The deleted node_modules files showing in `git status` suggest they were previously committed. Consider running `git rm -r --cached` on those paths and ensuring .gitignore covers them.

---

## Summary

**The system is "green" on infrastructure (Redis, Relay, Gateway, Tauri all UP) but "red" on autonomous function (task queue stalled, tests broken, subdirector not processing work).** 

The most impactful fix is the task scheduler lane allowlist — it unblocks the entire autonomous improvement pipeline. Once tasks flow, the self-improvement loop, QA loop, watchdog, and orchestrator pulse can actually execute, which will likely resolve the `autopilot_or_subdirector_critical` health alert and make the harness truly HEALTHY rather than DEGRADED.