# Chronological Task Orchestration Governance Protocol

## 1. Core Philosophy

The orchestration and scheduling of autonomous agents within the TNF framework is subject to the same strict self-improvement and validation processes as any other codebase logic. 

**Hardcoded intervals (e.g., cron schedules like `*/15 * * * *`) are assumptions of compute necessity.** Over time, these assumptions drift into inefficiency. A schedule running every 15 minutes may only need to run once per day if the underlying data no longer mutates quickly. 

To combat this, TNF requires all chronological task logic to adhere to this **Orchestration Governance Protocol**.

## 2. The Scheduling Challenge & Verify Loop

Before any cron job or master-clock subroutine interval is created, adjusted, or merged into the primary branches, it must answer the following:

- **Why this specific interval?**
- **What is the compute waste ratio?** (Successful runs vs. No-op runs)
- **What is the failure cadence?** (How often does the task fail due to rate limits or deadlocks because it ran too frequently?)

### 2.1 Enforced Rationale
Whenever a pull request alters an interval (e.g., increasing frequency), the `validate-orchestration-health.cjs` CI gate requires a documented `challenge_rationale` in the schedule matrix or PR description.

## 3. Telemetry and Master Clock Handshakes

A scheduled task that runs in the dark is an untrusted task.

- **Heartbeats:** All cron routines executed by the SaaS layer (`CLOUD_RUNTIME`), Local Cron (`jules:supervisor`), or Master Clock must emit a verifiable state heartbeat indicating completion status, duration, and ops performed.
- **The Stale Run Window:** If a task on the `TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md` goes longer than 3x its scheduled interval without an emitted success heartbeat, it is marked as `stale` and is eligible for automatic suspension by the Orchestrator.

## 4. Periodic Agent Audits

The **Continuous Improver Agent** (and related Super-Cycle agents) are explicitly tasked with evaluating schedule density.
1. They parse the master schedule.
2. They compare the defined interval against historical execution telemetry.
3. If they find 90% of runs are "No-ops", they are authorized to propose a PR that reduces the cron frequency, appending the required `challenge_rationale`.

## 5. Drift Protection (SaaS vs. Local)

The `TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md` serves as the single source of truth for both:
- `CLOUD_RUNTIME_CRON_SETUP.md` (SaaS layer mappings)
- `tnf-voice-cron-entries.txt` (Local crontabs)

Any drift between the Master Calendar and these downstream deployment artifacts will fail the Orchestration Audit Gate in CI.
