# Resource Search Protocol Bridge (NestJS)

## Overview

This bridge adds bidirectional translation between:

- canonical HTTP resource search (`POST /resources/search`)
- protocol envelope search (`POST /resources/search/protocol`)

The implementation is intentionally layered:

1. Canonical layer: controller + DTO/OpenAPI contracts.
2. Procedural layer: policy + protocol services.

## Canonical vs Procedural Layers

### Canonical layer

- Endpoint contract and response shape compatibility.
- Swagger/OpenAPI annotations and schema definitions.
- Backward compatibility for legacy array responses.

Main files:

- `apps/api/src/modules/resources/resources.controller.ts`
- `apps/api/src/modules/resources/dto/resource-search.dto.ts`
- `apps/api/src/modules/resources/dto/resource-search-protocol.dto.ts`

### Procedural layer

- Trait-screening policy (narrow/rank/sort/telemetry).
- Protocol envelope decode/encode and validation.

Main files:

- `apps/api/src/modules/resources/resource-search-policy.service.ts`
- `apps/api/src/modules/resources/resource-search-protocol.service.ts`

## Endpoints

### POST /resources/search

Canonical search endpoint.

Request body:

- `ResourceSearchRequest`

Response:

- legacy `Resource[]` (default), or
- `ResourceSearchEnvelope` when `includeTraitMeta=true`

### POST /resources/search/protocol

Protocol bridge endpoint.

Request body accepts either:

- `ResourceSearchProtocolRequestEnvelope` (`type=RESOURCE.SEARCH.REQUEST`), or
- plain `ResourceSearchRequest` object

Response always returns:

- `ResourceSearchProtocolResponseEnvelope` (`type=RESOURCE.SEARCH.RESPONSE`)

## Validation Rules for Protocol Envelope

When protocol mode is used, request MUST include:

- `id` (non-empty string)
- `spec` (non-empty string)
- `type` exactly `RESOURCE.SEARCH.REQUEST`
- `tenant` (non-empty string)
- `resource` (non-empty string)
- `sent_at` (ISO-8601 datetime string)
- `trace.correlation_id` (non-empty string)
- `trace.causation_id` (string or `null`)
- `payload` (object)

Invalid envelopes return HTTP 400 with:

- `message: "Invalid RESOURCE.SEARCH.REQUEST envelope"`
- `errors: string[]`

## Translation Semantics

### Request translation

- Protocol envelope -> decoded filter payload.
- Plain filter -> synthesized request envelope with generated ids/trace.

### Response translation

- Search result payload is embedded as protocol `payload`.
- If `includeTraitMeta=true`, payload is `{ items, traitScreen }`.
- Otherwise payload is legacy `items[]` array.

## Frontend Usage

The frontend service now supports both modes:

- `searchResources(filter)` for canonical endpoint
- `searchResourcesProtocol(filter, envelope?)` for protocol endpoint

Files:

- `apps/frontend/src/services/resources.service.ts`
- `apps/frontend/src/types/resources.ts`

## OpenAPI and Snapshot

The bridge is represented in OpenAPI under:

- `/resources/search/protocol`
- protocol envelope schemas in `components/schemas`

Snapshot workflow:

- `pnpm openapi:snapshot`
- `pnpm openapi:check`

## Unit Tests

Protocol translation and validation behavior is covered in:

- `apps/api/src/modules/resources/resource-search-protocol.service.spec.ts`

Coverage focus:

- plain-filter to envelope synthesis
- valid envelope decoding
- malformed envelope 400 validation path
- response envelope trace causation/correlation correctness
