# TNF Release Gate

This gate is the merge blocker for moving TNF toward public production release.

## Objectives

- Prevent shipping customer-facing mock/demo fallback behavior on critical
  pages.
- Enforce production buildability for frontend and backend type/build health for
  API.
- Verify production env baseline is represented in `.env.production.example`.

## Commands

- Quick gate (local triage):
  - `pnpm run release:gate`
- Strict gate (CI / merge blocking):
  - `pnpm run release:gate:strict`
- Strict gate + API smoke (recommended before deployment):
  - `pnpm run release:gate:strict:smoke`
- Quick gate + type checks (manual):
  - `node scripts/release-gate.cjs --with-type-checks`
- Frontend bundle budget check (manual):
  - `pnpm run release:bundle-check`

## What It Checks

1. Environment baseline file contains: `NODE_ENV`, `JWT_SECRET`, `DATABASE_URL`.
2. Critical pages do not contain known mock/demo fallback markers:
   - `apps/frontend/src/pages/WorkspaceChatPage.tsx`
   - `apps/frontend/src/pages/workspace/WorkspaceAnalytics.tsx`
   - `apps/frontend/src/pages/Admin/WorkspaceManagement.tsx`
   - `apps/frontend/src/pages/workflow-pages/WorkflowBuilderEnhanced.tsx`
3. Frontend production build runs in strict mode (or with `--with-type-checks`)
   for:
   - `@the-new-fuse/frontend-app`
4. API type check runs in strict mode (or with `--with-type-checks`) for:
   - `@the-new-fuse/api-server`
5. Strict mode additionally runs API build.
6. Frontend bundle-size guard runs via `scripts/check-frontend-bundle-size.cjs`.
7. Optional API smoke gate runs `scripts/smoke-api-demock.sh`.

## Timeouts

- Command timeout defaults to 15 minutes per command.
- Override with `RELEASE_GATE_TIMEOUT_MS`, for example:
  - `RELEASE_GATE_TIMEOUT_MS=1200000 pnpm run release:gate:strict`

## CI Enforcement

GitHub Action: `.github/workflows/release-readiness.yml`

- Triggered on `pull_request` and `push` for `main` + `develop`.
- Runs `pnpm run release:gate:strict`.
- Includes a runtime smoke job on `main` pushes and manual dispatch.
- Should be set as a required status check in repository branch protection.
- Detailed setup steps: see "Repository Enforcement" section below.

## Repository Enforcement

The following status checks must be set as required on `main` and `develop`:

- `Production Release Gate` (from `.github/workflows/release-readiness.yml`)
- On `main`, also require: `Runtime Smoke Gate`

Optional additional required checks (if stable in your repo):

- `Test Suite / Type Check`
- `Quality Gates / dependency-audit`

### Branch Protection Setup (GitHub UI)

1. Open `Settings` -> `Branches` -> `Add branch protection rule`.
2. Rule pattern: `main`.
3. Enable:
   - `Require a pull request before merging`
   - `Require status checks to pass before merging`
   - `Require branches to be up to date before merging`
   - `Do not allow bypassing the above settings` (recommended)
4. Add required status check: `Production Release Gate`
5. For `main`, add: `Runtime Smoke Gate`
6. Repeat for `develop`.

### Release Operator Flow

1. Local fast check: `pnpm run release:gate`
2. Local strict check: `pnpm run release:gate:strict`
3. Runtime validation before deploy: `pnpm run release:gate:strict:smoke`
4. Merge only after `Production Release Gate` is green on PR.
5. For `main`, require `Runtime Smoke Gate` green before release tags/deploy.

### Smoke Behavior

`scripts/smoke-api-demock.sh` is env-aware:

- Always requires API startup and `/api/health` readiness.
- AI probes: If provider keys are present (`OPENAI_API_KEY`,
  `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `MISTRAL_API_KEY`,
  `AZURE_OPENAI_API_KEY`), `500` is treated as failure.
- If provider keys are absent, `500` on AI generation is treated as expected
  degraded behavior.
- Auth-protected routes allow `401/403` where appropriate.

### CI Notes

Current CI workflow executes strict gate (without smoke) to keep CI
deterministic. If you want CI smoke too, add a second job with test-only env
vars and service dependencies.

---

## Operator Notes

- If strict gate fails, fix code first, then rerun.
- Use quick mode to iterate during heavy refactors.
- Run smoke gate before staging/prod deploy when runtime envs are available.
- `scripts/smoke-api-demock.sh` handles AI probes differently when provider keys
  are absent (expected degraded path) vs present (500 is failure).
