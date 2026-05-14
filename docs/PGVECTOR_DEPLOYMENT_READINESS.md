# PgVector Deployment Readiness

## Status: READY FOR DEPLOYMENT

The `core-vector-db` service has been fully configured for deployment on
CloudRuntime, utilizing the `pgvector` driver.

## Changes Implemented

### 1. Deployment Configuration (`cloud_runtime.toml`)

- Added `[services.core-vector-db]` definition.
- Configured to build from `packages/` directory using new
  `SERVICE_ROOT=packages` argument.
- Enabled automatic health checks on `/health`.

### 2. Docker Build Support (`Dockerfile.cloud_runtime`)

- **Upgrade**: Modified Dockerfile to support building services located in
  `packages/` (previously restricted to `apps/`).
- **Mechanism**: Added `ARG SERVICE_ROOT=apps` (default) to maintain backward
  compatibility while allowing override.

### 3. Application Updates (`packages/core-vector-db`)

- **Hybrid Architecture**: Converted the gRPC microservice into a **Hybrid
  Application** (HTTP + gRPC).
  - **Why**: CloudRuntime and many PaaS providers rely on HTTP health checks. Pure
    gRPC services can be difficult to monitor.
  - **Result**: The service now listens on `$PORT` (HTTP) and `$GRPC_URL`
    (gRPC).
- **Health Check**: Implemented `HealthController` serving `GET /health` ->
  `{"status":"ok", "service":"vector-db"}`.
- **Database Connectivity**: Updated `main.ts` to natively accept
  `DATABASE_URL`.
  - **Integration**: The service now automatically uses the CloudRuntime-provided
    Postgres connection string without manual variable mapping.
  - **Driver**: The `pgvector` driver automatically enables the `vector`
    extension if permissions allow.

## Environment Variables

The service is configured to auto-detect the following variables (standard in
CloudRuntime):

- `DATABASE_URL`: Connection string for Postgres (Primary).
- `PORT`: HTTP port for health checks (Primary).
- `GRPC_URL`: gRPC endpoint (Default: 0.0.0.0:50051).

## Verification Steps (Post-Deployment)

1. **Check Deploy Logs**: Ensure `HealthController` is registered and
   `HTTP server listening` message appears.
2. **Health Check**: Visit
   `https://core-vector-db-production.thenewfuse.com/health` (or your specific
   URL) and expect JSON response.
3. **Database**: Check logs for `pgvector extension initialized`.
