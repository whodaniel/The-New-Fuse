# TNF Release Enforcement

This document turns release gating into an enforced repository policy.

## Required Checks

Set the following status check as required on `main` and `develop`:

- `Production Release Gate` (from `.github/workflows/release-readiness.yml`)
- On `main`, also require: `Runtime Smoke Gate`

Optional additional required checks (if stable in your repo):

- `Test Suite / Type Check`
- `Quality Gates / dependency-audit`

## Branch Protection (GitHub UI)

1. Open `Settings` -> `Branches` -> `Add branch protection rule`.
2. Rule pattern: `main`.
3. Enable:
   - `Require a pull request before merging`
   - `Require status checks to pass before merging`
   - `Require branches to be up to date before merging`
   - `Do not allow bypassing the above settings` (recommended)
4. Add required status check:
   - `Production Release Gate`
5. For `main`, add:
   - `Runtime Smoke Gate`
6. Repeat for `develop`.

## Release Operator Flow

1. Local fast check:
   - `pnpm run release:gate`
2. Local strict check:
   - `pnpm run release:gate:strict`
3. Runtime validation before deploy:
   - `pnpm run release:gate:strict:smoke`
4. Merge only after `Production Release Gate` is green on PR.
5. For `main`, require `Runtime Smoke Gate` green before release tags/deploy.

## Smoke Behavior

`scripts/smoke-api-demock.sh` is env-aware:

- Always requires API startup and `/api/health` readiness.
- AI probes:
  - If provider keys are present (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
    `GEMINI_API_KEY`, `MISTRAL_API_KEY`, `AZURE_OPENAI_API_KEY`), `500` is
    treated as failure.
  - If provider keys are absent, `500` on AI generation is treated as expected
    degraded behavior.
- Auth-protected routes allow `401/403` where appropriate.

## CI Notes

Current CI workflow executes strict gate (without smoke) to keep CI
deterministic. If you want CI smoke too, add a second job with test-only env
vars and service dependencies.
