# CloudRuntime TNF Service Inspection (2026-03-09)

Source snapshot commands:
- `cloud_runtime status --json`
- `cloud_runtime service status -a --json`
- targeted `cloud_runtime logs <deployment-id> --build/--deployment`

## Fleet summary
- Total services observed: 28
- Success: 14
- Deploying: 2
- Failed: 12

## Service inventory (latest deployment state)

| Service | Status | Source Repo | Source Image | Config File | Builder | Dockerfile Path |
|---|---|---|---|---|---|---|
| Frontend Application | FAILED | whodaniel/fuse | - | /cloud_runtime.toml | DOCKERFILE | /Dockerfile.cloud_runtime |
| Postgres | FAILED | - | ghcr.io/cloud_runtimeapp-templates/postgres-ssl:17 | - | RAILPACK | - |
| Redis | FAILED | - | redis:8.2.1 | - | RAILPACK | - |
| TheNewFuse | FAILED | whodaniel/fuse | - | /cloud_runtime.toml | DOCKERFILE | /apps/frontend/Dockerfile |
| ai-arcade | SUCCESS | whodaniel/fuse | - | cloud_runtime.toml | DOCKERFILE | /apps/ai-arcade/Dockerfile |
| api | FAILED | whodaniel/fuse | - | cloud_runtime.toml | DOCKERFILE | Dockerfile.cloud_runtime |
| api-gateway | SUCCESS | whodaniel/fuse | - | cloud_runtime.toml | DOCKERFILE | Dockerfile.cloud_runtime |
| api-gateway-CtDk | SUCCESS | whodaniel/fuse | - | cloud_runtime.toml | DOCKERFILE | Dockerfile.cloud_runtime |
| backend | SUCCESS | whodaniel/fuse | - | /cloud_runtime.toml | DOCKERFILE | /Dockerfile.cloud_runtime |
| backend-jfal | DEPLOYING | whodaniel/fuse | - | cloud_runtime.toml | DOCKERFILE | Dockerfile.cloud_runtime |
| casin8-games | SUCCESS | - | - | - | DOCKERFILE | Dockerfile |
| clawdbot-cloud_runtime-template | FAILED | vignesh07/clawdbot-cloud_runtime-template | - | cloud_runtime.toml | DOCKERFILE | Dockerfile |
| core-vector-db | DEPLOYING | whodaniel/fuse | - | cloud_runtime.toml | DOCKERFILE | Dockerfile.cloud_runtime |
| fuse-theia-ide | FAILED | whodaniel/SkIDEancer | - | /cloud_runtime.toml | DOCKERFILE | Dockerfile |
| open-audio-deck | SUCCESS | - | - | - | RAILPACK | - |
| openclaw-cloud | FAILED | - | - | cloud_runtime.json | DOCKERFILE | Dockerfile |
| openclaw-oc004 | SUCCESS | - | - | cloud_runtime.json | DOCKERFILE | Dockerfile |
| openclaw-primary | SUCCESS | - | - | cloud_runtime.json | DOCKERFILE | Dockerfile |
| openclaw-sandbox-cloud | SUCCESS | - | - | cloud_runtime.toml | DOCKERFILE | Dockerfile |
| picoclaw-perplexity | FAILED | - | - | - | DOCKERFILE | Dockerfile |
| picoclaw-subject | FAILED | - | - | - | DOCKERFILE | Dockerfile |
| picoclaw-tester | FAILED | - | - | - | DOCKERFILE | Dockerfile |
| picoclaw-tester-v2 | SUCCESS | - | alpine:latest | - | RAILPACK | - |
| relay-server | SUCCESS | - | - | cloud_runtime.toml | DOCKERFILE | Dockerfile |
| searxng | SUCCESS | - | searxng/searxng:latest | - | RAILPACK | - |
| tnf-cloud-sandbox | FAILED | - | - | cloud_runtime.toml | DOCKERFILE | /Dockerfile.cloud_runtime |
| tnf-cloud-sandbox-v2 | SUCCESS | - | - | cloud_runtime.toml | DOCKERFILE | apps/cloud-sandbox/Dockerfile.local |
| zeroclaw-sandbox | SUCCESS | - | - | cloud_runtime.json | DOCKERFILE | Dockerfile |

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
- Service(s): `Postgres`, `Redis`, `openclaw-cloud`, `clawdbot-cloud_runtime-template`
- Signature: short `Deploy failed` with limited logs (platform/image/runtime level)
- Impact: latest deployment failed without actionable in-repo compile trace.

## Changes executed during this session
- Converted `relay-server` into a real deployable service and validated `SUCCESS`.
- Brought `casin8-games` to `SUCCESS` via explicit source-root deploy.
- Added maintenance and deploy workflows:
  - `.github/workflows/cloud_runtime-maintenance-window.yml`
  - `.github/workflows/cloud_runtime-deploy-casin8-games.yml`

## Immediate remediation priority
1. Fix frontend compile conflict (`MessageItem` duplicate symbol) in deployment branch/source currently used by CloudRuntime.
2. Stabilize health endpoints/start commands for `api`, `tnf-cloud-sandbox`, `picoclaw-*`, and `fuse-theia-ide`.
3. Reconcile provider/image services (`Postgres`, `Redis`) with either pinned known-good image revision or platform redeploy policy.
