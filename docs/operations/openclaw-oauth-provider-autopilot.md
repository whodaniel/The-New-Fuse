# OpenClaw OAuth Provider Autopilot

Status: Active  
Audience: TNF Super Admin, Cloud Ops

## Scope

This runbook focuses on OAuth LLM provider reliability for TNF OpenClaw
services.

It covers:

- local non-interactive onboarding patterns
  (`openclaw onboard --non-interactive`)
- cloud provider sync for Railway-hosted OpenClaw instances
- recurring cron/poll automation with health verification and rollback

## Provider Matrix

### Wizard CLI auth choices (local onboarding)

Use `openclaw onboard --non-interactive --auth-choice <value>` with:

- `openai-api-key`
- `gemini-api-key`
- `zai-api-key`
- `ai-gateway-api-key`
- `cloudflare-ai-gateway-api-key`
- `moonshot-api-key`
- `mistral-api-key`
- `synthetic-api-key`
- `opencode-zen`
- `custom-api-key`

### TNF cloud OAuth sync providers (Railway)

The TNF cloud sync script currently supports:

- `openai-codex`
- `anthropic`
- `google-antigravity`
- `kilo`

Script: `scripts/railway/sync-openclaw-oauth-instance.sh`

## One-Time Sync (All Cloud Instances)

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
bash scripts/railway/sync-openclaw-oauth-instances.sh --no-wait
```

## Recurring Autopilot Install

Installs two poll-driven cron jobs:

- daily OAuth sync (`tnf-openclaw-oauth-sync`)
- 15-minute cloud health audit (`tnf-openclaw-cloud-health`)

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
bash scripts/runtime/openclaw-oauth-provider-cron.sh install
```

Install now stages a runtime bundle at
`~/.tnf/openclaw-oauth-provider-autopilot` and points cron there.  
This avoids macOS `cron` access failures (`EPERM`) when repositories live under
Desktop/Documents paths.

Check installed jobs:

```bash
bash scripts/runtime/openclaw-oauth-provider-cron.sh status
```

Run immediate sync + verification:

```bash
bash scripts/runtime/openclaw-oauth-provider-cron.sh run-once
```

Tune `run-once` health verification retries for slower deploy windows:

```bash
TNF_OPENCLAW_RUN_ONCE_HEALTH_RETRIES=18 \
TNF_OPENCLAW_RUN_ONCE_HEALTH_RETRY_SLEEP_SEC=10 \
bash scripts/runtime/openclaw-oauth-provider-cron.sh run-once
```

Optional runtime root override:

```bash
TNF_OPENCLAW_OAUTH_RUNTIME_DIR="$HOME/.tnf/openclaw-oauth-provider-autopilot" \
bash scripts/runtime/openclaw-oauth-provider-cron.sh install
```

## Required Environment / Prereqs

- `railway` CLI authenticated (`railway whoami`)
- `jq`, `curl`, `bash` installed
- OAuth auth files present per instance config:
  - `scripts/railway/openclaw-oauth-instances.json`
- valid token fields in auth files:
  - access token
  - refresh token
  - account id (for `openai-codex`)

## Expected Changes

When sync runs, it updates Railway service variables (for each OpenClaw
service), including:

- `OPENAI_CODEX_ACCESS_TOKEN`
- `OPENAI_CODEX_REFRESH_TOKEN`
- `OPENAI_CODEX_ACCOUNT_ID`
- `OPENCLAW_USE_CODEX_OAUTH=true`
- `OPENCLAW_MODEL_PRIMARY`
- `OPENCLAW_MODEL_FALLBACKS`
- `OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY`

Local file changes from this hardening pass:

- `scripts/railway/openclaw-oauth-instances.json`
- `scripts/railway/openclaw-codex-tenants.json`
- `scripts/railway/sync-openclaw-oauth-instance.sh`
- `scripts/railway/sync-openclaw-codex-account.sh`
- `scripts/railway/sync-openclaw-codex-tenants.sh`
- `scripts/railway/check-zeroclaw-instances.sh`
- `scripts/runtime/openclaw-oauth-provider-cron.sh`

## Validation

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
bash scripts/railway/check-zeroclaw-instances.sh openclaw-cloud openclaw-primary openclaw-sandbox-cloud openclaw-oc004
```

Also verify:

```bash
openclaw health
openclaw status --deep
```

## Rollback

1. Remove automation jobs:

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
bash scripts/runtime/openclaw-oauth-provider-cron.sh uninstall
```

2. Re-apply previous fallback model policy (example):

```bash
railway variables set OPENCLAW_MODEL_FALLBACKS="openai-codex/gpt-5.2-codex,openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini" --service openclaw-cloud
```

Repeat for each service as needed.
