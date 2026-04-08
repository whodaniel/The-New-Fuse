# Cloud Infrastructure Migration Blueprint (Railway -> GCP/Cloudflare Stack)

Based on the verified Railway configuration, here is exactly how the services
must be configured on the new infrastructure stack.

## 1. Supabase (PostgreSQL)

Your new Supabase instance must replace the Railway Postgres service.

- **Old URL**:
  `postgresql://postgres:...@postgres.railway.internal:5432/railway`
- **New URL (`DATABASE_URL`)**:
  `postgresql://postgres.wslydgtgindrywldatbv:pFhgQGRK38GfHWk4@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=disable`
- **Required across**: `api-gateway`, `backend-jfal`, `relay-server`

## 2. Upstash (Redis)

Your new Upstash instance must replace the Railway Redis service.

- **Old URL**: `redis://default:...@redis.railway.internal:6379`
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
  - `JWT_SECRET`: (Migrate from Railway: `d8k86eilz2jf3h513hoy20mvdiqkuzok`)
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

This represents the `Frontend Application` from Railway.

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
  - Firebase and Supabase client keys from the original Railway config.

### B. The Landing Page (`thenewfuse.com`)

This represents `TheNewFuse` from Railway.

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
