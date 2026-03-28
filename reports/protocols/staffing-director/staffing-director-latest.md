# TNF Staffing Director Report

Generated: 2026-03-26T20:32:29.639Z

## Coverage Summary

- Registered agents: 117
- Registered skills: 101
- Schedules: 23
- Staff coordination schedules: 1
- Staff architecture schedules: 1
- Staff review schedules: 1
- High-priority blocker findings: 9

## Niche Gaps

- [medium] blocker_driven_staffing_pressure: 9 critical/high blocker findings
  indicate potential staffing specialization gaps.

## Role + Skill Proposals

- tnf-staffops-staffing-director-01 -> tnf-staffing-director-agent (implemented)
  rationale: Maintains corporation-wide staffing architecture and proposes new
  role+skill packages for uncovered niches.
- tnf-staffops-staff-review-01 -> tnf-staff-review-agent (implemented)
  rationale: Runs periodic review of recent staff outputs and publishes ranked
  improvement recommendations.

## Next Actions

- Ensure Staffing Director and Staff Review schedules are enabled in cron
  governance control plane.
- Require each proposed niche role to include an associated skill and runbook
  reference before activation.
- Route high-severity blocker findings into staffing proposals when ownership
  gaps repeat across cycles.
