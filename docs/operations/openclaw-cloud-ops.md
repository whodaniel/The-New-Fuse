# OpenClaw Cloud Operations Guide

## Overview

Reference guide for managing OpenClaw cloud instances on CloudRuntime.

## Instance Information

| Service                  | CloudRuntime URL                                                | Purpose                    |
| ------------------------ | ---------------------------------------------------------- | -------------------------- |
| `openclaw-cloud`         | `https://openclaw-cloud-production-934c.thenewfuse.com`    | Main production instance   |
| `openclaw-sandbox-cloud` | `https://openclaw-sandbox-cloud-production.thenewfuse.com` | Sandbox/Testing instance   |
| `openclaw-primary`       | `https://openclaw-primary-production.thenewfuse.com`       | Secondary/Primary instance |

## Docker Configuration

### Dockerfiles

- **Gateway/Cloud**: `cloud_runtime-openclaw-gateway/Dockerfile`
  - Installs `openclaw@2026.2.13` (or latest).
  - Copies `openclaw.json`, `kilo-auth.json`, `entrypoint.sh`, `proxy.js`.
  - Uses `ENTRYPOINT ["/entrypoint.sh"]`.
  - Exposes port 8080.

- **Sandbox**: `cloud_runtime-openclaw-sandbox/Dockerfile`
  - MUST match Gateway configuration to support Auth injection.
  - Originally was simple `npm i -g openclaw` but updated to copy entrypoint
    script.

### Entrypoint Script (`entrypoint.sh`)

- Critical component for injecting Auth credentials at runtime.
- Reads environment variables (e.g., `ANTHROPIC_OAUTH_ACCESS_TOKEN`).
- Generates `auth-profiles.json` in the `/data/.openclaw` volume.
- Launches `node /proxy.js` which spawns `openclaw gateway`.

### Proxy.js

- HTTP proxy to satisfy CloudRuntime health checks (`/health`).
- Forwards WS traffic to OpenClaw internal port (19001).

## Authentication Setup

### Anthropic OAuth

To enable Claude (Anthropic) on cloud instances:

1. Obtain OAuth tokens from local machine keychain (after local login).
   - Use `security find-generic-password -s "Claude Code-credentials" -g`.
2. Set CloudRuntime Variables:
   - `ANTHROPIC_OAUTH_ACCESS_TOKEN`
   - `ANTHROPIC_OAUTH_REFRESH_TOKEN`
   - `OPENCLAW_USE_ANTHROPIC_OAUTH=true`
   - `OPENCLAW_MODEL_PRIMARY=anthropic/claude-opus-4-6`

### Codex OAuth

Existing setup uses `OPENAI_CODEX_ACCESS_TOKEN` etc.

## Deployment Commands (CloudRuntime CLI)

### Deploy Gateway (Main Cloud)

```bash
cd cloud_runtime-openclaw-gateway
cloud_runtime up --service openclaw-cloud --detach
```

### Deploy Sandbox

```bash
cd cloud_runtime-openclaw-sandbox
# Ensure entrypoint.sh is copied from gateway dir first!
cp ../cloud_runtime-openclaw-gateway/entrypoint.sh .
cloud_runtime up --service openclaw-sandbox-cloud --detach
```

### Deploy Primary (Secondary)

```bash
cd cloud_runtime-openclaw-gateway
cloud_runtime up --service openclaw-primary --detach
```

## Troubleshooting

### Failed Deployments

- If `cloud_runtime up` fails, check if you are in the correct directory.
- For Sandbox, ensure `cloud_runtime-openclaw-sandbox/Dockerfile` matches the Gateway
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
  - Check CloudRuntime Dashboard > Settings > Build.
  - Ensure Dockerfile Path is correct (relative to root context sent by
    `cloud_runtime up`).
  - Or deploy from subdirectory using `cloud_runtime up` inside
    `cloud_runtime-openclaw-sandbox`.
