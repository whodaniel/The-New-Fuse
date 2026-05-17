# Session Handoff Enforcement (TNF)

This protocol is mandatory for critical-path changes.

## Rule

If a change set touches critical paths (`apps/`, `packages/`, `supabase/`,
`scripts/`, `data/`, `docs/protocols/`, `.github/workflows/`), the same change
set MUST include:

1. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
2. `docs/protocols/reports/SESSION_HANDOFF_LATEST.md`
3. `docs/protocols/AGENT_STATUS_LEDGER.md`

## Required ACK

`SESSION_HANDOFF_LATEST.json` and `.md` must include:

- `protocol_ack = TNF_PROTOCOL_ACK`

## Supabase Rule

If the change set touches Supabase-sensitive paths (`supabase/**`,
`apps/virtual-library-blueprints/supabase/**`, `apps/api/supabase/**`), then:

- `verification.supabase_rls_audit` in `SESSION_HANDOFF_LATEST.json` MUST be
  `pass`.
- Run strict audit before emit: `pnpm run supabase:rls:audit:strict`.

## Validation

- Schema: `docs/protocols/schemas/tnf-session-handoff.schema.json`
- Gate script: `scripts/protocols/enforce-session-handoff.cjs`

## Automation Commands

- Emit/update handoff artifacts:
  - `pnpm run handoff:emit`
  - `pnpm run handoff:emit:verified` (auto-runs guard checks and records
    verification states)
- Validate handoff gate in CI-mode:
  - `pnpm run validate:session-handoff`
- Pre-push enforcement:
  - `pnpm run handoff:pre-push`

## CI + Hook Integration

- `.husky/pre-push` runs lightweight blocking checks (privacy/secrets/docs PII)
  and keeps handoff + strict RLS checks advisory (non-blocking).
- `.github/workflows/privacy-security-gate.yml` is the strict enforcement
  surface for handoff freshness/coverage, governance tiering, and RLS audits on
  PR/push.

## Operator Intent

This eliminates silent continuity failures by making handoff artifacts a hard
gate, not a best-effort guideline.
