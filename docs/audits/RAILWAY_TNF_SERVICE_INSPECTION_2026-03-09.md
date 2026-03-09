# Railway TNF Service Inspection (2026-03-09)

Source snapshot commands:
- `railway status --json`
- `railway service status -a --json`
- targeted `railway logs <deployment-id> --build/--deployment`

## Fleet summary
- Total services observed: 28
- Success: 14
- Deploying: 2
- Failed: 12

## Service inventory (latest deployment state)

| Service | Status | Source Repo | Source Image | Config File | Builder | Dockerfile Path |
|---|---|---|---|---|---|---|
| Frontend Application | FAILED | whodaniel/fuse | - | /railway.toml | DOCKERFILE | /Dockerfile.railway |
| Postgres | FAILED | - | ghcr.io/railwayapp-templates/postgres-ssl:17 | - | RAILPACK | - |
| Redis | FAILED | - | redis:8.2.1 | - | RAILPACK | - |
| TheNewFuse | FAILED | whodaniel/fuse | - | /railway.toml | DOCKERFILE | /apps/frontend/Dockerfile |
| ai-arcade | SUCCESS | whodaniel/fuse | - | railway.toml | DOCKERFILE | /apps/ai-arcade/Dockerfile |
| api | FAILED | whodaniel/fuse | - | railway.toml | DOCKERFILE | Dockerfile.railway |
| api-gateway | SUCCESS | whodaniel/fuse | - | railway.toml | DOCKERFILE | Dockerfile.railway |
| api-gateway-CtDk | SUCCESS | whodaniel/fuse | - | railway.toml | DOCKERFILE | Dockerfile.railway |
| backend | SUCCESS | whodaniel/fuse | - | /railway.toml | DOCKERFILE | /Dockerfile.railway |
| backend-jfal | DEPLOYING | whodaniel/fuse | - | railway.toml | DOCKERFILE | Dockerfile.railway |
| casin8-games | SUCCESS | - | - | - | DOCKERFILE | Dockerfile |
| clawdbot-railway-template | FAILED | vignesh07/clawdbot-railway-template | - | railway.toml | DOCKERFILE | Dockerfile |
| core-vector-db | DEPLOYING | whodaniel/fuse | - | railway.toml | DOCKERFILE | Dockerfile.railway |
| fuse-theia-ide | FAILED | whodaniel/SkIDEancer | - | /railway.toml | DOCKERFILE | Dockerfile |
| open-audio-deck | SUCCESS | - | - | - | RAILPACK | - |
| openclaw-cloud | FAILED | - | - | railway.json | DOCKERFILE | Dockerfile |
| openclaw-oc004 | SUCCESS | - | - | railway.json | DOCKERFILE | Dockerfile |
| openclaw-primary | SUCCESS | - | - | railway.json | DOCKERFILE | Dockerfile |
| openclaw-sandbox-cloud | SUCCESS | - | - | railway.toml | DOCKERFILE | Dockerfile |
| picoclaw-perplexity | FAILED | - | - | - | DOCKERFILE | Dockerfile |
| picoclaw-subject | FAILED | - | - | - | DOCKERFILE | Dockerfile |
| picoclaw-tester | FAILED | - | - | - | DOCKERFILE | Dockerfile |
| picoclaw-tester-v2 | SUCCESS | - | alpine:latest | - | RAILPACK | - |
| relay-server | SUCCESS | - | - | railway.toml | DOCKERFILE | Dockerfile |
| searxng | SUCCESS | - | searxng/searxng:latest | - | RAILPACK | - |
| tnf-cloud-sandbox | FAILED | - | - | railway.toml | DOCKERFILE | /Dockerfile.railway |
| tnf-cloud-sandbox-v2 | SUCCESS | - | - | railway.toml | DOCKERFILE | apps/cloud-sandbox/Dockerfile.local |
| zeroclaw-sandbox | SUCCESS | - | - | railway.json | DOCKERFILE | Dockerfile |

## Failed service root-cause signatures

### 1) Frontend build compile error (blocks TheNewFuse + Frontend Application)
- Service(s): `TheNewFuse`, `Frontend Application`
- Signature: `MultiAgentChat.tsx ... ERROR: The symbol "MessageItem" has already been declared`
- Impact: frontend image build aborts.

### 2) Runtime healthcheck failures after build success
- Service(s): `api`, `tnf-cloud-sandbox`, `picoclaw-perplexity`, `picoclaw-subject`, `picoclaw-tester`, `fuse-theia-ide`
- Signature: repeated `service unavailable` attempts then `Healthcheck failed!`
- Impact: deployment rejected post-build.

### 3) Infrastructure/image service deploy failures
- Service(s): `Postgres`, `Redis`, `openclaw-cloud`, `clawdbot-railway-template`
- Signature: short `Deploy failed` with limited logs (platform/image/runtime level)
- Impact: latest deployment failed without actionable in-repo compile trace.

## Changes executed during this session
- Converted `relay-server` into a real deployable service and validated `SUCCESS`.
- Brought `casin8-games` to `SUCCESS` via explicit source-root deploy.
- Added maintenance and deploy workflows:
  - `.github/workflows/railway-maintenance-window.yml`
  - `.github/workflows/railway-deploy-casin8-games.yml`

## Immediate remediation priority
1. Fix frontend compile conflict (`MessageItem` duplicate symbol) in deployment branch/source currently used by Railway.
2. Stabilize health endpoints/start commands for `api`, `tnf-cloud-sandbox`, `picoclaw-*`, and `fuse-theia-ide`.
3. Reconcile provider/image services (`Postgres`, `Redis`) with either pinned known-good image revision or platform redeploy policy.
