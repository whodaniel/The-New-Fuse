# RFC DRAFT-SGP-0001: Spreadsheet Graph Protocol (SGP) v0.1

- Status: Draft, Experimental
- Intended Audience: Data platform and tooling implementers
- Authoring Date: 2026-03-18

## 1. Abstract

Spreadsheet Graph Protocol (SGP) defines an interoperability layer that treats
spreadsheets as typed, governed, linkable data resources rather than isolated
files. It standardizes resource identity, discovery, schema contracts, federated
query requests, change events, and policy-aware access patterns across
spreadsheet systems.

## 2. Conformance

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` are to be
interpreted as described in RFC 2119.

## 3. Goals

1. Provide stable resource identity for workbook, sheet, table, and column
   nodes.
2. Publish machine-readable manifest and schema contracts.
3. Enable cross-resource discovery and query.
4. Support incremental change streams with replay offsets.
5. Enforce tenant boundaries and auditable access decisions.

## 4. Non-Goals

1. Replacing spreadsheet user interfaces.
2. Standardizing formula language interoperability.
3. Mandating a single execution engine.

## 5. Resource Model

### 5.1 Entities

- `tenant`: Security and namespace boundary.
- `workbook`: Top-level spreadsheet container.
- `sheet`: Tab-level container.
- `table`: Structured range with header contract.
- `column`: Typed field in a table schema.

### 5.2 Resource URI

Canonical table URI format:

```text
sgp://{tenant}/{workbook}/{sheet}/{table}
```

Column references append `#column:{column_name}`.

## 6. Protocol Envelope

All protocol messages MUST use a common envelope:

```json
{
  "id": "018f3a76-03a7-7a4f-a4f2-0f1f2a22d4f2",
  "spec": "sgp/0.1",
  "type": "QUERY.REQUEST",
  "tenant": "acme",
  "resource": "sgp://acme/wb_sales/q1/orders",
  "sent_at": "2026-03-18T21:00:00Z",
  "actor": {
    "id": "user_123",
    "roles": ["analyst"]
  },
  "trace": {
    "correlation_id": "018f3a76-03a7-7a4f-a4f2-0f1f2a22d4f2",
    "causation_id": null
  },
  "payload": {},
  "sig": "base64url-signature-optional"
}
```

## 7. Message Types

### 7.1 Discovery

- `DISCOVER.REQUEST`: Search resources by metadata filters.
- `DISCOVER.RESPONSE`: Return matching resources and pagination cursor.

### 7.2 Control Plane

- `MANIFEST.PUBLISH`: Publish metadata (owner, tags, timezone, entry tables).
- `SCHEMA.PUBLISH`: Publish versioned schema contracts with compatibility mode.

### 7.3 Data Plane

- `QUERY.REQUEST`: Typed read query (select, where, order_by, limit, cursor).
- `QUERY.RESPONSE`: Rows, resulting schema, pagination, and execution stats.

### 7.4 Streaming

- `SUBSCRIBE.REQUEST`: Subscribe to ordered change events from an offset.
- `CHANGE.EVENT`: Insert/update/delete/upsert with PK, before/after, lineage.

### 7.5 Faults

- `ERROR`: Structured error response with machine-parseable error code.

## 8. Error Model

Initial error codes:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `INVALID_REQUEST`
- `SCHEMA_MISMATCH`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL`

Error payload shape:

```json
{
  "code": "SCHEMA_MISMATCH",
  "message": "Column amount_usd expects decimal(18,2)",
  "retryable": false,
  "details": {}
}
```

## 9. Security Requirements

1. Tenant isolation MUST be enforced for every message.
2. Actor identity MUST be authenticated before processing.
3. Authorization SHOULD evaluate table/column/row policy at query time.
4. Audit logs SHOULD capture actor, resource, type, decision, and timestamp.

## 10. Transport Binding

1. HTTP/JSON SHOULD be used for request/response operations.
2. WebSocket or SSE SHOULD be used for streaming subscriptions.
3. Idempotency keys SHOULD be supported for publish operations.

## 11. Reference Implementation Plan

1. Phase 0 (1 week): publish JSON Schemas and conformance tests.
2. Phase 1 (2 weeks): build registry service and policy-filtered discovery.
3. Phase 2 (2-3 weeks): implement connectors (Google Sheets, Excel, CSV).
4. Phase 3 (2 weeks): implement query service with schema validation.
5. Phase 4 (2 weeks): implement ordered resumable change stream.
6. Phase 5 (2 weeks): add lineage, drift checks, and governance auditing.
7. Phase 6 (1-2 weeks): publish SDKs (TypeScript, Python) and CLI examples.

## Appendix A: Normative JSON Schemas

Normative schema files:

- `docs/protocols/schemas/sgp-envelope.schema.json`
- `docs/protocols/schemas/sgp-payloads.schema.json`

### A.1 Envelope Schema (Normative)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tnf.local/spec/sgp/0.1/envelope.schema.json",
  "title": "SGP Message Envelope",
  "type": "object",
  "required": [
    "id",
    "spec",
    "type",
    "tenant",
    "resource",
    "sent_at",
    "actor",
    "trace",
    "payload"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "spec": {
      "const": "sgp/0.1"
    },
    "type": {
      "type": "string",
      "enum": [
        "DISCOVER.REQUEST",
        "DISCOVER.RESPONSE",
        "MANIFEST.PUBLISH",
        "SCHEMA.PUBLISH",
        "QUERY.REQUEST",
        "QUERY.RESPONSE",
        "SUBSCRIBE.REQUEST",
        "CHANGE.EVENT",
        "ERROR"
      ]
    },
    "tenant": {
      "type": "string",
      "minLength": 1
    },
    "resource": {
      "type": "string",
      "pattern": "^sgp://[^/]+/[^/]+/[^/]+/[^/]+$"
    },
    "sent_at": {
      "type": "string",
      "format": "date-time"
    },
    "actor": {
      "type": "object",
      "required": ["id", "roles"],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "roles": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "trace": {
      "type": "object",
      "required": ["correlation_id", "causation_id"],
      "properties": {
        "correlation_id": {
          "type": "string",
          "format": "uuid"
        },
        "causation_id": {
          "type": ["string", "null"],
          "format": "uuid"
        }
      },
      "additionalProperties": false
    },
    "payload": {
      "type": "object"
    },
    "sig": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

### A.2 Payload Schema Set (Normative)

See `docs/protocols/schemas/sgp-payloads.schema.json` for full payload
definitions by `type`. The envelope schema enforces `type` -> `payload`
compatibility via conditional validation rules (`if`/`then`) in
`docs/protocols/schemas/sgp-envelope.schema.json`.

## Appendix B: OpenAPI Stubs

Stub endpoint file:

- `docs/protocols/openapi/sgp-v0.1-stub.yaml`

The OpenAPI stub defines minimal HTTP bindings for:

- `POST /v0/discover`
- `POST /v0/manifest:publish`
- `POST /v0/schema:publish`
- `POST /v0/query`
- `POST /v0/subscribe`

## Appendix C: Conformance Smoke Test Command

Run:

```bash
pnpm run validate:sgp:schemas
```

This command compiles the normative schemas and validates one positive and one
negative envelope fixture.

## Appendix D: NestJS Translation Bridge (Reference)

To support interoperability with NestJS microservice packet conventions, the
reference gateway exposes:

- `POST /api/v1/sgp/translate/to-nest`
- `POST /api/v1/sgp/translate/from-nest`

### D.1 Forward Mapping: SGP -> NestJS ReadPacket

- `envelope.type` -> `packet.pattern` via lowercase mapping:
  - `QUERY.REQUEST` -> `sgp.query.request`
  - `DISCOVER.RESPONSE` -> `sgp.discover.response`
- `envelope.payload` -> `packet.data`
- `envelope.id` -> `packet.id`
- Remaining envelope metadata -> `packet.meta`

### D.2 Reverse Mapping: NestJS ReadPacket -> SGP

- `packet.pattern` (or `packet.meta.sgp_type`) -> `envelope.type`
- `packet.data` -> `envelope.payload`
- `packet.id` (or generated UUID) -> `envelope.id`
- `tenant/resource/actor/trace` resolved from:
  - request defaults first
  - packet metadata second
  - deterministic fallback where needed

The bridge MUST reject packets that cannot be mapped to a supported SGP message
type.
