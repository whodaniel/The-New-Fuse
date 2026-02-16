# OpenClaw Cloud Operations Guide

## Overview

Reference guide for managing OpenClaw cloud instances on Railway.

## Instance Information

| Service                  | Railway URL                                                | Purpose                    |
| ------------------------ | ---------------------------------------------------------- | -------------------------- |
| `openclaw-cloud`         | `https://openclaw-cloud-production-934c.up.railway.app`    | Main production instance   |
| `openclaw-sandbox-cloud` | `https://openclaw-sandbox-cloud-production.up.railway.app` | Sandbox/Testing instance   |
| `openclaw-primary`       | `https://openclaw-primary-production.up.railway.app`       | Secondary/Primary instance |

## Docker Configuration

### Dockerfiles

- **Gateway/Cloud**: `railway-openclaw-gateway/Dockerfile`
  - Installs `openclaw@2026.2.13` (or latest).
  - Copies `openclaw.json`, `kilo-auth.json`, `entrypoint.sh`, `proxy.js`.
  - Uses `ENTRYPOINT ["/entrypoint.sh"]`.
  - Exposes port 8080.

- **Sandbox**: `railway-openclaw-sandbox/Dockerfile`
  - MUST match Gateway configuration to support Auth injection.
  - Originally was simple `npm i -g openclaw` but updated to copy entrypoint
    script.

### Entrypoint Script (`entrypoint.sh`)

- Critical component for injecting Auth credentials at runtime.
- Reads environment variables (e.g., `ANTHROPIC_OAUTH_ACCESS_TOKEN`).
- Generates `auth-profiles.json` in the `/data/.openclaw` volume.
- Launches `node /proxy.js` which spawns `openclaw gateway`.

### Proxy.js

- HTTP proxy to satisfy Railway health checks (`/health`).
- Forwards WS traffic to OpenClaw internal port (19001).

## Authentication Setup

### Anthropic OAuth

To enable Claude (Anthropic) on cloud instances:

1. Obtain OAuth tokens from local machine keychain (after local login).
   - Use `security find-generic-password -s "Claude Code-credentials" -g`.
2. Set Railway Variables:
   - `ANTHROPIC_OAUTH_ACCESS_TOKEN`
   - `ANTHROPIC_OAUTH_REFRESH_TOKEN`
   - `OPENCLAW_USE_ANTHROPIC_OAUTH=true`
   - `OPENCLAW_MODEL_PRIMARY=anthropic/claude-opus-4-6`

### Codex OAuth

Existing setup uses `OPENAI_CODEX_ACCESS_TOKEN` etc.

## Deployment Commands (Railway CLI)

### Deploy Gateway (Main Cloud)

```bash
cd railway-openclaw-gateway
railway up --service openclaw-cloud --detach
```

### Deploy Sandbox

```bash
cd railway-openclaw-sandbox
# Ensure entrypoint.sh is copied from gateway dir first!
cp ../railway-openclaw-gateway/entrypoint.sh .
railway up --service openclaw-sandbox-cloud --detach
```

### Deploy Primary (Secondary)

```bash
cd railway-openclaw-gateway
railway up --service openclaw-primary --detach
```

## Troubleshooting

### Failed Deployments

- If `railway up` fails, check if you are in the correct directory.
- For Sandbox, ensure `railway-openclaw-sandbox/Dockerfile` matches the Gateway
  version.
- Make sure `entrypoint.sh` is present and executable (`chmod +x`).

### Authentication Failures

- If logs show `FailoverError: No API key found`, verify:
  1. Env vars are set (`ANTHROPIC_OAUTH_ACCESS_TOKEN`).
  2. `entrypoint.sh` is running (check logs for "Configuring OpenClaw
     Gateway...").
  3. Volume `/data` is writable.

### Wrong App Served

- If Sandbox serves frontend HTML instead of Gateway:
  - Check Railway Dashboard > Settings > Build.
  - Ensure Dockerfile Path is correct (relative to root context sent by
    `railway up`).
  - Or deploy from subdirectory using `railway up` inside
    `railway-openclaw-sandbox`.
