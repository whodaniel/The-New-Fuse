# SESSION_HANDOFF workspace-tier-injection

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-08-29T15:45:52.073Z` Handoff ID: `36e0e76d-9227-4bc5-8bd0-ff9e08420023`

## Scope

- Branch: `integration/boot-local-live-surfaces-20260829`
- Head SHA: `16dda85847ce8097311971bef218598d40725a6c`

## Work Summary

- Wire resolve-workspace-tier.cjs into tnf onboard as an advisory Turn Zero step
  (print tier, do not block).

## Changed Paths

- scripts/tnf-onboard.cjs
- docs/protocols/reports/session_handoff_workspace-tier-injection-20260829.json
- docs/protocols/reports/session_handoff_workspace-tier-injection-20260829.md

## Next Actions

- Keep the workspace-tier step advisory until isolation enforcement is an
  explicit operator decision.
