# SESSION_HANDOFF (tnf-muse)

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.3` Created At:
`2026-11-25T07:35:50.157Z` Handoff ID: `a2cce4e8-a6d8-4c3e-916e-0ecb637ebd48`

## Scope

- Repository: `git@ssh.github.com:whodaniel/The-New-Fuse`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `app-fixes-2026-11-25`
- Head SHA: `3e74004b55c5ee9d79c3b249fc2b3ee92f332c20`
- Sensitive Scope: `internal`

## Classification

- Work Domain: `unknown`
- Artifact Destination: `unknown`
- Data Residency: `unknown`
- Sensitivity: `unknown`

## Work Summary

- F3 auth link bundle shipped: new shared GuestFooter component (Privacy Policy
  / Terms of Service) wired into Login, Register, ForgotPassword;
  forgot-password link added to Login; SSO labels standardized (Continue with
  Google/GitHub, Email me a magic link) with or-continue-with divider; Register
  gains GitHub and magic-link parity with Login plus a Terms of Service /
  Privacy Policy consent line. TASK-003 findings 3/5/6, staged spec fix-03.

## Changed Paths

- apps/frontend/src/components/auth/GuestFooter.tsx
- apps/frontend/src/pages/auth/ForgotPassword.tsx
- apps/frontend/src/pages/auth/Login.tsx
- apps/frontend/src/pages/auth/Register.tsx
- apps/frontend/src/pages/Landing/index.tsx
- REPO_MAP.md
- docs/protocols/reports/session_handoff_tnf-muse-20261125T073550-a2cce4e8.json
- docs/protocols/reports/session_handoff_tnf-muse-20261125T073550-a2cce4e8.md

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

- Apply F2 app-root landing change (ComprehensiveRouter MarketplaceRootRoute
  renders Landing for logged-out app-host visitors; Landing page chrome/copy
  cleanup)
- Apply F1+F4 onboarding wiring (real OnboardingFlow at /onboarding, LazyPage
  placeholder lines removed) and hardening (UserTypeDetection retry, auth-aware
  Skip, GuestFooter in flow, WelcomeStep product sentence)
- Run the frontend build, push the branch, merge to main, verify remote HEAD
