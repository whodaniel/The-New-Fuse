# OpenClaw OAuth Rotation

> **⚠️ Railway references below are DEPRECATED.** TNF has migrated from Railway
> to **GCP (Cloud Run) + Cloudflare + Supabase + Upstash**. Replace `railway`
> CLI commands with GCP/Cloudflare equivalents. See
> `CLOUD_MIGRATION_BLUEPRINT.md`.

## Purpose

Safely rotate OAuth credentials and active model routing for any OpenClaw
Railway service, with encrypted credential storage, RBAC, audit logging,
deployment validation, and health checks. ⚠️ **Railway service references are
historical — update to GCP Cloud Run.**

## Pre-Flight Checklist

1. Confirm operator role is `SUPER_ADMIN` for API-driven execution.
2. Confirm `ENCRYPTION_KEY` is set for encrypted binding storage.
3. Confirm Railway CLI auth is healthy (`railway whoami`). ⚠️ **DEPRECATED — use
   `gcloud` CLI instead**
4. Confirm target service exists (`railway status --json`). ⚠️ **DEPRECATED —
   use `gcloud run services list` instead**
5. Confirm provider model mapping is valid (`openai-codex`, `anthropic`,
   `google-antigravity`, `kilo`).

## Self-Referential Knowledge

- Backend API endpoints:
  - `PUT /api/admin/openclaw/oauth/bindings`
  - `GET /api/admin/openclaw/oauth/bindings`
  - `POST /api/admin/openclaw/oauth/execute/:tenantId/:service/:provider`
- CLI scripts:
  - `scripts/railway/sync-openclaw-oauth-instance.sh`
  - `scripts/railway/sync-openclaw-oauth-instances.sh`
- Super Admin UI:
  - `apps/frontend/src/pages/Admin/components/OAuthInstanceRotationControl.tsx`

## Workflow Diagram

```text
Collect Tokens -> Encrypt + Store Binding -> Execute Rotation -> Wait Deploy
      |                   |                      |                |
      v                   v                      v                v
   Validate DTO      RBAC + Audit Log      Railway Vars Set   /overview 200
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

## Testing

Run:

```bash
bash scripts/railway/sync-openclaw-oauth-instances.sh --config scripts/railway/openclaw-oauth-instances.json
```

Then verify:

```bash
railway variable list --service openclaw-cloud --json | jq -r '.OPENAI_CODEX_ACCOUNT_ID,.OPENCLAW_MODEL_PRIMARY,.OPENCLAW_USE_CODEX_OAUTH'
railway variable list --service openclaw-primary --json | jq -r '.OPENAI_CODEX_ACCOUNT_ID,.OPENCLAW_MODEL_PRIMARY,.OPENCLAW_USE_CODEX_OAUTH'
```

## Integration with TNF

Use this skill when:

- onboarding a new OpenClaw instance
- swapping to a new tenant account
- validating post-incident OAuth drift
- rotating provider credentials during lifecycle automation
