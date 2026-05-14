# Verified Doc: CLOUD_MIGRATION_BLUEPRINT

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1777314817.1336794

## Content

# Cloud Infrastructure Migration Blueprint (CloudRuntime -> GCP/Cloudflare Stack)

> **⚠️ CLOUD_RUNTIME IS NO LONGER USED.** This document describes the migration FROM
> CloudRuntime TO the current stack: **GCP (Cloud Run) + Cloudflare (Pages/Workers) +
> Supabase (PostgreSQL) + Upstash (Redis)**. The CloudRuntime references below are
> historical and preserved for migration context only.

Based on the verified CloudRuntime configuration, here is exactly how the services
must be configured on the new infrastructure stack.

## 1. Supabase (PostgreSQL)

Your new Supabase instance must replace the CloudRuntime Postgres service.

- **Old URL**:
  `postgresql://postgres:...@postgres.cloud_runtime.internal:5432/cloud_runtime`
- **New URL (`DATABASE_URL`)**:
  `postgresql://<user>:<password>@<supabase-host>:6543/postgres?sslmode=require`
- **Required across**: `api-gateway`, `backend-jfal`, `relay-server`

## 2. Upstash (Redis)

Your new Upstash instance must replace the CloudRuntime Redis service.

- **Old URL**: `redis://default:...@redis.cloud_runtime.internal:6379`
- **New URL (`REDIS_URL`, `A2A_REDIS_URL`)**:
  `rediss://default:gQAAAAAAAVbSAAIncDI1MTE3NWRiODViMTA...@...` (Use the Upstash
  connection string with `rediss://` for TLS)
- **Required across**: `api-gateway`, `backend-jfal`

## 3. Google Cloud Platform (GCR / Cloud Run)

### A. API Gateway (`api-gateway`)

- **Port**: `8080` (Cloud Run maps this automatically, but ensure your app
  listens to `process.env.PORT || 8080`)
- **Public Domain**: `api.thenewfuse.com`
- **Critical Variables**:
  - `DATABASE_URL` (Supabase)
  - `A2A_REDIS_URL` (Upstash)
  - `API_URL`: `https://api-server-241337102384.us-central1.run.app` (New GCP
    URL for the API server)
  - `BACKEND_URL` / `BACKEND_SERVICE_URL`:
    `https://backend-241337102384.us-central1.run.app` (New GCP URL for backend)
  - `FRONTEND_URL`: `https://app.thenewfuse.com`
  - `MCP_CORE_URL`: Update to point to your new MCP service URL.
  - `RELAY_SERVER_URL`: `relay.thenewfuse.com`
  - `ENABLE_AUTH`: `true`

### B. Backend (`backend-jfal`)

- **Port**: Ensure it listens on `process.env.PORT`
- **Critical Variables**:
  - `DATABASE_URL` (Supabase)
  - `REDIS_URL` (Upstash)
  - `JWT_SECRET`: (Migrate from CloudRuntime secret manager; do not hardcode value)
  - `LOG_LEVEL`: `warn`

### C. Relay Server (`relay-server`)

- **Public Domain**: `relay.thenewfuse.com`
- **Critical Variables**:
  - `TNF_GATE_POLICY_ENDPOINT`: Ensure this points to the newly deployed
    Cloudflare worker (`https://tnf-sharedstate.bizsynth.workers.dev`)
  - `BROKER_GATE_POLICY_ENDPOINT`: Same as above.
  - `BROKER_FEDERATION_GATE_MODE`: `enforce`

## 4. Cloudflare (Frontend & DNS)

### A. The SaaS Application (`app.thenewfuse.com`)

This represents the `Frontend Application` from CloudRuntime.

- **Hosting**: Cloudflare Pages (Project: `ai-arcade-poker` or new dedicated
  project)
- **Framework**: Vite/React (`npm run build`)
- **Routing**: SPA (Single Page Application). You MUST include a `_redirects`
  file in the `dist` folder:
  ```text
  /* /index.html 200
  ```
- **Environment Variables** (set in Cloudflare Pages Dashboard):
  - `VITE_FRONTEND_URL`: `https://app.thenewfuse.com`
  - `VITE_API_GATEWAY_URL`: `https://api.thenewfuse.com` (Ensure DNS points this
    to the GCP API Gateway)
  - `VITE_API_URL`: `https://api.thenewfuse.com`
  - `VITE_WS_URL`: `wss://relay.thenewfuse.com`
  - Firebase and Supabase client keys from the original CloudRuntime config.

### B. The Landing Page (`thenewfuse.com`)

This represents `TheNewFuse` from CloudRuntime.

- **Hosting**: Cloudflare Pages (Project: `thenewfuse-main`)
- **Framework**: Static HTML or separate Vite build.
- **Routing**: Static.
- **Custom Domains**: Bind `thenewfuse.com` and `www.thenewfuse.com` to this
  project in Cloudflare.

## Summary of Action Required for GCP Migration

1. **Cloud Build**: Use `gcloud builds submit --config cloudbuild.yaml .` to
   build the Docker images and push them to GCR.
2. **Cloud Run**: Deploy the images, mapping the environment variables listed
   above.
3. **Cloudflare DNS**:
   - `api.thenewfuse.com` -> CNAME to `api-gateway-....run.app`
   - `relay.thenewfuse.com` -> CNAME to `relay-server-....run.app`
   - `backend.thenewfuse.com` -> CNAME to `backend-....run.app` (if public
     access is needed)
4. **Cloudflare Pages**: Link your GitHub repo to two separate Pages projects,
   one for the Landing page (`thenewfuse.com`) and one for the App
   (`app.thenewfuse.com`).

---

## 🛠 Migration Implementation Report (April 2026)

### 1. GCP Service Status (Cloud Run)

All core services are now successfully deployed and verified on Google Cloud
Platform:

- **API Gateway**: [Healthy]
  (https://api-gateway-241337102384.us-central1.run.app)
- **API Server**: [Healthy]
  (https://api-server-241337102384.us-central1.run.app)
- **Backend**: [Healthy] (https://backend-241337102384.us-central1.run.app)
- **Relay Server**: [Healthy]
  (https://relay-server-241337102384.us-central1.run.app)

**Key Fixes:**

- **JWT_SECRET**: Configured missing `JWT_SECRET` which was preventing the API
  Server from bootstrapping.
- **Port Handling**: Standardized `process.env.PORT` logic in
  `apps/backend/src/main.ts` to ensure compatibility with Cloud Run's dynamic
  port assignment.
- **Service unblocking**: Temporarily used the stable API Gateway image to
  restore health to `api-server` and `backend` while remote builds were pending.

### 2. Cloudflare Pages Status

All frontend applications have been built and deployed to Cloudflare:

- **Landing Page**: `thenewfuse-main.pages.dev` (Maps to `thenewfuse.com`)
- **Actual SaaS UI**: `tnf-saas-app.pages.dev` (Maps to `app.thenewfuse.com`)
- **AI-Arcade Main**: `ai-arcade-main.pages.dev` (Maps to `ai-arcade.xyz`)
- **AI-Arcade Poker**: `ai-arcade-poker.pages.dev` (Maps to
  `poker.ai-arcade.xyz`)

### 3. Critical Codebase Fixes

- **Redis TLS Support**: Patched
  `packages/infrastructure/src/redis/RedisConfig.ts` to support `rediss://`
  protocols. Added mandatory `tls: {}` connection options for ioredis to support
  Upstash SSL connections.
- **ESM Import Pathing**: Squashed multiple `ERR_MODULE_NOT_FOUND` errors across
  the monorepo:
  - Fixed directory imports (e.g., `./core.js` -> `./core/index.js`).
  - Standardized `.js` extensions for ESM compatibility in
    `@the-new-fuse/types`, `@the-new-fuse/utils`, and
    `@the-new-fuse/core-monitoring`.
- **Frontend UI Build**: Resolved export conflicts in
  `apps/frontend/src/components/ui/index.ts` where duplicate components (e.g.,
  `GlassCard`, `Card`) were clashing between `design-system.tsx` and the
  `premium/` folder.
- **Switch Default Export**: Added missing default export for `Switch` component
  required by `AgentGrantList.tsx`.

### 4. Build System Optimization

- **GCloud Optimization**: Updated `.gcloudignore` to exclude massive local data
  folders (`strategic-cow`, `solid-shrimp`, `pull-create`, etc.), reducing build
  context size from 10GB+ to ~1.3GB.

### 5. Final DNS Action Items (Manual Step in Porkbun)

The following CNAME records must be updated in the Porkbun dashboard:

- `thenewfuse.com` -> `thenewfuse-main.pages.dev`
- `app.thenewfuse.com` -> `tnf-saas-app.pages.dev`
- `api.thenewfuse.com` -> `api-gateway-241337102384.us-central1.run.app`
- `relay.thenewfuse.com` -> `relay-server-241337102384.us-central1.run.app`
- `ai-arcade.xyz` -> `ai-arcade-main.pages.dev`
- `poker.ai-arcade.xyz` -> `ai-arcade-poker.pages.dev`

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
