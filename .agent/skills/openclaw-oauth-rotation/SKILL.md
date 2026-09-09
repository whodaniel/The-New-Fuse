# OpenClaw OAuth Rotation

> **⚠️ Railway is retired.** TNF runs on **GCP (Cloud Run) + Cloudflare +
> Supabase + Upstash**. Any `railway` or `cloud_runtime` CLI command in this
> file is dead — use `gcloud` equivalents. (`CLOUD_MIGRATION_BLUEPRINT.md` is
> referenced throughout the repo but does not exist.)

## Purpose

Safely rotate OAuth credentials and active model routing for any OpenClaw Cloud
Run service, with encrypted credential storage, RBAC, audit logging, deployment
validation, and health checks.

## Pre-Flight Checklist

1. Confirm operator role is `SUPER_ADMIN` for API-driven execution.
2. Confirm `ENCRYPTION_KEY` is set for encrypted binding storage.
3. Confirm CLI auth is healthy (`gcloud auth list`).
4. Confirm target service exists (`gcloud run services list`).
5. Confirm provider model mapping is valid (`openai-codex`, `anthropic`,
   `google-antigravity`, `kilo`).

## Self-Referential Knowledge

- Backend API endpoints:
  - `PUT /api/admin/openclaw/oauth/bindings`
  - `GET /api/admin/openclaw/oauth/bindings`
  - `POST /api/admin/openclaw/oauth/execute/:tenantId/:service/:provider`
- CLI scripts:
  - `scripts/cloud-run/sync-openclaw-oauth-instance.sh`
  - `scripts/cloud-run/sync-openclaw-oauth-instances.sh`
  - Shared helper: `scripts/lib/tnf-cloud-run.sh` (gcloud Cloud Run env ops)
- Super Admin UI:
  - `apps/frontend/src/pages/Admin/components/OAuthInstanceRotationControl.tsx`

## Workflow Diagram

```text
Collect Tokens -> Encrypt + Store Binding -> Execute Rotation -> Wait Deploy
      |                   |                      |                |
      v                   v                      v                v
   Validate DTO      RBAC + Audit Log      Cloud Run Env Set  /overview 200
```

## Standard Workflow

1. Save or update binding via API (encrypted at rest).
2. Execute binding for target `tenantId/service/provider`.
3. Verify:
   - expected account/provider vars
   - expected primary/fallback model vars
   - deployment status `SUCCESS`
   - `/overview` status `200`

## Common Mistakes to Avoid

- Using `copilot-proxy/*` model keys when gateway expects provider-prefixed
  models.
- Updating only `OPENCLAW_MODEL_PRIMARY` without
  `OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY`.
- Reusing one token set across tenants accidentally.
- Rotating tokens without checking account ID alignment.

## Known Breakage (resolved 2026-07-23 / 2026-07-24)

When Railway was retired, `railway` was string-replaced with `cloud_runtime`
repo-wide. `cloud_runtime` is **not a real binary**. The OAuth sync scripts
under `scripts/cloud-run/` now call `gcloud` via `scripts/lib/tnf-cloud-run.sh`
(env update / verify / wait-ready). Prefer `--no-wait` only when you
intentionally skip the Cloud Run ready poll.

## Testing

Run:

```bash
bash scripts/cloud-run/sync-openclaw-oauth-instances.sh \
  --config scripts/cloud-run/openclaw-oauth-instances.json --no-wait
```

Then verify (Cloud Run):

```bash
gcloud run services describe openclaw-cloud --format=json \
  | jq -r '.spec.template.spec.containers[0].env[] | select(.name|test("OPENAI_CODEX_ACCOUNT_ID|OPENCLAW_MODEL_PRIMARY|OPENCLAW_USE_CODEX_OAUTH")) | "\(.name)=\(.value)"'
```

## Integration with TNF

Use this skill when:

- onboarding a new OpenClaw instance
- swapping to a new tenant account
- validating post-incident OAuth drift
- rotating provider credentials during lifecycle automation
