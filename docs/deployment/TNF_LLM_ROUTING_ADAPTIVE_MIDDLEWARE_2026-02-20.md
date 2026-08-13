# TNF Centralized LLM Routing + Adaptive Middleware

Date: February 20, 2026 (EST) Environment: `production` (CloudRuntime project `TNF`)

## Objective

Remove hard-wired provider/model assignments and centralize active/fallback LLM
routing for admin-side agents/services from one Super Admin control point.

## What Was Implemented

1. Centralized routing API in admin config controller.

- File: `apps/api/src/controllers/admin-config.controller.ts`
- Endpoints added:
  - `GET /admin/config/llm-routing/options`
  - `GET /admin/config/llm-routing`
  - `PUT /admin/config/llm-routing`
  - `GET /admin/config/llm-routing/effective/:target`
- Routing config key: `TNF_LLM_ROUTING_V1` (stored in `system_configurations`).

2. Adaptive middleware proxy behavior.

- File: `apps/api/src/services/agent-api-grants.service.ts`
- Logic:
  - resolve target routing (global + override),
  - attempt primary provider/model first,
  - automatically fail over to fallback,
  - return routing metadata in `_adaptiveRouting`.

3. Adaptive endpoint and backward compatibility.

- File: `apps/api/src/controllers/agent-proxy.controller.ts`
- Endpoints:
  - `POST /api/agent-proxy/adaptive/:target`
  - Existing `POST /api/agent-proxy/:provider` now supports adaptive path when
    `body.target` is provided.

4. Super Admin UI control panel integration.

- Files:
  - `apps/frontend/src/pages/Admin/components/LlmRoutingControl.tsx`
  - `apps/frontend/src/pages/Admin/SuperAdminControlPanel.tsx`
- Adds one place to assign global and per-target primary/fallback provider-model
  pairs.

5. ZeroClaw sandbox provider crash fix.

- Files:
  - `apps/zeroclaw-sandbox/entrypoint-cloud_runtime.sh`
  - `apps/zeroclaw-sandbox/.env.example`
- Fix:
  - Normalize `kilocode`/`kilo` to `custom:https://api.kilo.ai/api/gateway`
  - Normalize model naming (strip legacy prefixes where needed)
  - Avoid hardcoded model/provider startup values

## Key Import/Build Corrections Applied

To avoid runtime/type export issues in API changes:

- `apps/api/src/controllers/admin-config.controller.ts`
  - import repos from `@the-new-fuse/database/drizzle/repositories`
- `apps/api/src/services/agent-api-grants.service.ts`
  - import `drizzleConfigurationRepository` from
    `@the-new-fuse/database/drizzle/repositories`
  - import `agentApiGrants` from `@the-new-fuse/database/drizzle/schema`
  - null-safe error text handling in usage logging

## CloudRuntime Deployment Status (Captured February 20, 2026)

Latest status query result:

- `zeroclaw-sandbox`
  - Deployment: `890a02bd-6e78-4fe5-8226-bc32365099b6`
  - Status: `SUCCESS`
  - Created: `2026-02-20T11:48:56.443Z`
  - Stopped: `false`
- `api`
  - Deployment: `638f921f-24fd-4287-9707-8f22d961de00`
  - Status: `BUILDING`
  - Created: `2026-02-20T11:55:28.829Z`
  - Stopped: `true` (CloudRuntime metadata while build in progress)

Previously active successful API deployment remains available:

- `f73b6f94-316c-4f97-be22-8fd5721ff59c` (`SUCCESS`)

## Known Current Risk

`api` build process in this repo can surface unrelated TypeScript
warnings/errors in modules outside this routing scope. The latest deployment is
still building, so final production activation of newest API changes should be
confirmed once CloudRuntime marks that deployment `SUCCESS`.

## Immediate Verification Steps

1. Confirm API deployment completion:

- `cloud_runtime status --json | jq ...`

2. Check API runtime logs:

- `cloud_runtime logs -s api --latest -n 120`

3. Verify routing endpoints:

- `GET /admin/config/llm-routing/options`
- `GET /admin/config/llm-routing`
- `POST /api/agent-proxy/adaptive/<target>`

## Adaptive Middleware Answer

Yes. The centralized control layer is an adaptive middleware pattern because
request routing is resolved at runtime from centralized policy (global +
per-target) with automatic fallback behavior, not hardcoded provider/model
bindings.
