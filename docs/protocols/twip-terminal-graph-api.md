# TWIP Terminal Graph API (v0.1)

Status: Draft  
Audience: TNF frontend, orchestration agents, and operators

## Endpoint

`GET /api/terminals/graph`

## Purpose

Expose a read-only, tenant-aware graph projection of TWIP terminal identities so
agents and UI surfaces can reason over available terminals holistically.

## Query Parameters

1. `tenantId` (optional): filter to one tenant scope.
2. `limit` (optional): max terminals returned (`1..1000`, default `200`).
3. `includeProcessNodes` (optional): include process nodes in graph (`true` by default).
4. `includeCommands` (optional): include sampled commands (`false` by default).

## Authorization

1. Endpoint requires authenticated user access.
2. `includeCommands=true` requires admin/system authorization level.

## Response Shape (high-level)

1. `available`: whether snapshot source is available.
2. `source`: snapshot path and mirror metadata.
3. `safety`: redaction and tenant filter metadata.
4. `summary`: returned terminals plus node/edge counts.
5. `graph`: `nodes[]` and `edges[]`.
6. `terminals[]`: sanitized terminal identities with optional ownership hints.
7. `registryContext`: agent registry index metadata.

## UI Consumers

1. `/visualizations/terminals`
2. `/terminals`

