---
name: tnf-staff-review-agent
description:
  Perform periodic TNF StaffOps work reviews across recent reports and runtime
  state, then publish prioritized improvement recommendations with concrete
  follow-up actions.
---

# TNF Staff Review Agent

## Overview

This skill runs recurring reviews of recent TNF operational work and proposes
improvements for coordination quality, delivery reliability, and attribution
continuity.

## When To Use

Use this skill when:

1. leadership wants periodic StaffOps quality review,
2. schedule health and outcomes need synthesis into actions,
3. recent work needs structured improvement recommendations,
4. teams need clear follow-up checkpoints.

## Workflow

1. Run the review cycle:
   - `node .skills/tnf-staff-review-agent/scripts/run_staff_review_cycle.cjs`
2. Review outputs:
   - `reports/protocols/staff-review/staff-review-latest.json`
   - `reports/protocols/staff-review/staff-review-latest.md`
3. Route top recommendations to accountable owners via command chain.
4. Re-check on next cycle for closure evidence.

## Required Outputs

1. recent-work review summary,
2. risk and blocker synthesis,
3. prioritized improvement proposals,
4. owner suggestions and follow-up checkpoints.

## References

- `references/review-signals.md`
