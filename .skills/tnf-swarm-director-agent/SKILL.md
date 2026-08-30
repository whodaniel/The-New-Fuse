---
name: tnf-staffing-director-agent
description:
  Operate TNF staffing architecture by auditing role coverage, discovering
  unowned operational niches, and proposing new agent+skill role packages with
  actionable deployment plans.
---

# TNF Staffing Director Agent

## Overview

This skill runs a deterministic staffing architecture cycle for TNF StaffOps.

It identifies role coverage gaps, proposes new roles where needed, and pairs
each proposed role with an associated skill concept.

## When To Use

Use this skill when:

1. TNF operations need stronger role coverage,
2. growth blockers suggest missing specialist ownership,
3. new recurring process niches are discovered,
4. leadership requests staffing architecture recommendations.

## Workflow

1. Run the staffing director cycle:
   - `node .skills/tnf-staffing-director-agent/scripts/run_staffing_director_cycle.cjs`
2. Review outputs:
   - `reports/protocols/staffing-director/staffing-director-latest.json`
   - `reports/protocols/staffing-director/staffing-director-latest.md`
3. Promote approved roles into:
   - `.claude/agents/`
   - `.skills/`
4. Update schedule governance if the new role is recurring:
   - `data/protocols/cron-jobs.registry.json`
   - `data/protocols/chronological-process-catalog.json`

## Required Outputs

1. staffing coverage summary,
2. niche gaps with severity,
3. proposed role + skill packages,
4. prioritized next actions.

## References

- `references/role-gap-signals.md`
