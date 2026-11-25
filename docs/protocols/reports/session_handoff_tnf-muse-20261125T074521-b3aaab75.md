# SESSION_HANDOFF (tnf-muse)

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.3` Created At:
`2026-11-25T07:45:21.651Z` Handoff ID: `b3aaab75-5581-42fa-b9c1-488081a5e67e`

## Scope

- Repository: `git@ssh.github.com:whodaniel/The-New-Fuse`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `app-fixes-2026-11-25`
- Head SHA: `4110cf5180502fd660e31cc3bcef268411b63f17`
- Sensitive Scope: `internal`

## Classification

- Work Domain: `unknown`
- Artifact Destination: `unknown`
- Data Residency: `unknown`
- Sensitivity: `unknown`

## Work Summary

- F1+F4 onboarding wiring and hardening shipped: /onboarding now renders the
  real OnboardingFlow (was a LazyPage placeholder); LazyPage grey placeholder
  lines removed (D2); UserTypeDetection 403 state keeps the invite-required
  banner and adds invite guidance with sign-in/register links plus a working Try
  again retry (run-id re-detection), and Try again on generic errors too;
  OnboardingFlow Skip is auth-aware (Dashboard when signed in, Home when logged
  out) and renders the shared GuestFooter; WelcomeStep gains the AgentTruthLayer
  product sentence verbatim as its intro line. Production invite policy verified
  inviteOnly=false, so the keep-public path applies and no RequireAuth gating
  was added (D1/D10). TASK-003 findings 1/4, staged specs fix-01 and fix-04.

## Changed Paths

- apps/frontend/src/ComprehensiveRouter.tsx
- apps/frontend/src/components/onboarding/UserTypeDetection.tsx
- apps/frontend/src/components/wizard/steps/WelcomeStep.tsx
- apps/frontend/src/pages/OnboardingFlow/index.tsx
- apps/frontend/src/pages/Landing/index.tsx
- docs/protocols/AGENT_STATUS_LEDGER.md
- docs/protocols/LIVING_STATE.md
- docs/protocols/handoff-registry.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- docs/protocols/reports/session_handoff_tnf-muse-20261125T074447-dee42f1b.json
- docs/protocols/reports/session_handoff_tnf-muse-20261125T074447-dee42f1b.md
- docs/protocols/workspace-leases.json
- docs/protocols/reports/session_handoff_tnf-muse-20261125T074521-b3aaab75.json
- docs/protocols/reports/session_handoff_tnf-muse-20261125T074521-b3aaab75.md

## Verification

- privacy_guard: `na`
- secret_sweep: `na`
- docs_pii_guard: `na`
- supabase_rls_audit: `na`

## Continuation

- Owner: `tnf-muse`
- Targets: `frontend`
- Priority: `high`

### Resume Checklist

- Read docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- Validate SESSION_HANDOFF_LATEST.json against
  docs/protocols/schemas/tnf-session-handoff.schema.json
- Execute listed next actions in order and preserve privacy/security gates

## Next Actions

- Push branch app-fixes-2026-11-25, merge to main, verify remote HEAD with git
  ls-remote
- Depot bookkeeping: CLNP ledger entry, app-fix-list update (D5/D6 remain open
  for Daniel)
