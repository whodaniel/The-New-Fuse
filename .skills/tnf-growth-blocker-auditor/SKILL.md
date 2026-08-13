---
name: tnf-growth-blocker-auditor
description:
  Audit TNF protocols, cron schedules, and operations policies for
  growth-limiting constraints, coordination gaps, and attribution blind spots.
  Use when throughput drops, coordination is fragmented, policy drift is
  suspected, or leadership asks for corporate-wide process optimization.
---

# TNF Growth Blocker Auditor

## Overview

Run a deterministic audit that identifies policies and recurring jobs that may
be suppressing TNF delivery velocity or masking attribution.

This skill is for corporation-wide operations tuning, not one-off debugging.

## When To Use

Use this skill when:

1. multiple agent teams are active but progress is fragmented,
2. blocked or disabled policies are suspected to be stale,
3. leadership asks for better cross-team coordination and dependency flow,
4. downstream processes are not consistently producing attribution evidence.

## Workflow

1. Build/update the master schedule graph:
   - `node scripts/protocols/build-staff-master-calendar.cjs`
2. Run the growth blocker audit:
   - `node .skills/tnf-growth-blocker-auditor/scripts/run_growth_blocker_audit.cjs`
3. Review outputs:
   - `reports/protocols/growth-blocker-audit/growth-blocker-audit-latest.json`
   - `reports/protocols/growth-blocker-audit/growth-blocker-audit-latest.md`
4. Prioritize remediations in this order:
   - critical runtime blockers
   - stale disabled controls
   - coordination/ownership gaps
   - attribution blind spots

## Required Outputs

Every run must provide:

1. top blocker list with severity and rationale,
2. schedule/process candidates requiring policy review,
3. attribution coverage signal and missing evidence notes,
4. concrete remediation actions for next cycle.

## Coordination and Attribution Rules

1. Coordination Rule: every high-impact recurring loop must have a clearly
   identified owner agent and runbook.
2. Tributary Rule: upstream/downstream schedule relationships must remain
   visible in the master calendar artifacts.
3. Attribution Rule: process outputs should include dispatch/run evidence so
   value and outcomes remain traceable.

## References

- `references/blocker-signals.md`
