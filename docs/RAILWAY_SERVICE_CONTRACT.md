# Railway Service Contract

Updated: 2026-03-09 Environment: `TNF / production`

## Purpose

This document defines which services are public vs internal, expected traffic
flow, and required environment-variable wiring using Railway service references.

## Canonical Flow

1. Browser clients call `api-gateway` for HTTP API.
2. Browser realtime clients connect to `relay-server` for websocket/event relay.
3. `api-gateway` calls internal app services (`api`, `backend`).
4. `api` and `backend` use `Postgres` and `Redis` via internal service
   references.
5. Internal compute services (`core-vector-db`, `tnf-cloud-sandbox`, etc.) do
   not require public domains unless explicitly user-facing.

## Exposure Policy

Public edge services:

- `api-gateway`
- `TheNewFuse`
- `Frontend Application`
- `ai-arcade`
- `relay-server` (required for browser realtime)

Internal-only services:

- `api`
- `backend`
- `backend-jfal`
- `core-vector-db`
- `api-gateway-CtDk`
- `tnf-cloud-sandbox`
- `Postgres`
- `Redis`

Conditional:

- `fuse-theia-ide` should be public only if external users must access IDE
  directly.

## Required Variable References

Backend/data services:

- `api`: `DATABASE_URL=${{Postgres.DATABASE_URL}}`,
  `REDIS_URL=${{Redis.REDIS_URL}}`
- `backend`: `DATABASE_URL=${{Postgres.DATABASE_URL}}`,
  `REDIS_URL=${{Redis.REDIS_URL}}`
- `api-gateway`:
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - `DB_HOST=${{Postgres.PGHOST}}`
  - `DB_PORT=${{Postgres.PGPORT}}`
  - `DB_NAME=${{Postgres.PGDATABASE}}`
  - `DB_USER=${{Postgres.PGUSER}}`
  - `DB_USERNAME=${{Postgres.PGUSER}}`
  - `DB_PASSWORD=${{Postgres.PGPASSWORD}}`
  - `REDIS_URL=${{Redis.REDIS_URL}}`
  - `REDIS_HOST=${{Redis.REDISHOST}}`
  - `REDIS_PORT=${{Redis.REDISPORT}}`
  - `A2A_REDIS_URL=${{Redis.REDIS_URL}}`

Service-to-service URLs:

- `api-gateway`:
  - `API_URL=${{api.RAILWAY_STATIC_URL}}`
  - `BACKEND_URL=${{backend.RAILWAY_STATIC_URL}}`
  - `API_GATEWAY_URL=${{api-gateway.RAILWAY_STATIC_URL}}`

Frontend/API routing:

- `TheNewFuse`:
  - `VITE_API_URL=${{api-gateway.RAILWAY_STATIC_URL}}`
  - `VITE_API_GATEWAY_URL=${{api-gateway.RAILWAY_STATIC_URL}}`
  - `VITE_WS_URL=${{relay-server.RAILWAY_STATIC_URL}}`
- `Frontend Application`:
  - `VITE_API_URL=${{api-gateway.RAILWAY_STATIC_URL}}`
  - `VITE_API_GATEWAY_URL=${{api-gateway.RAILWAY_STATIC_URL}}`
  - `VITE_WS_URL=${{relay-server.RAILWAY_STATIC_URL}}`
- `ai-arcade`:
  - `VITE_API_URL=${{api-gateway.RAILWAY_STATIC_URL}}`
  - `VITE_RELAY_URL=${{relay-server.RAILWAY_STATIC_URL}}`
  - `VITE_WS_URL=${{relay-server.RAILWAY_STATIC_URL}}`

## Domain Hardening Checklist (UI)

Railway CLI supports domain creation, but domain removal/toggling is managed in
Railway UI.

For each internal-only service:

1. Open service `Settings -> Networking`.
2. Remove Railway public domain if present.
3. Ensure only private networking remains enabled.
4. Confirm no frontend env vars point directly to that service.

Priority hardening targets:

1. `fuse-theia-ide` (currently publicly exposed).
2. Any future internal variants (`api-gateway-CtDk`, `backend-jfal`) if public
   domain appears.

## Operations Order

When changing shared wiring:

1. Update vars with `--skip-deploys`.
2. Redeploy order:
   - `backend`, `api`
   - `api-gateway`
   - `TheNewFuse`, `Frontend Application`, `ai-arcade`
3. Validate health and edge endpoints.
