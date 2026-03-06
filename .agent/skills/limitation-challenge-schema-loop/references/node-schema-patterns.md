# Node Schema Patterns

## Purpose

Define stable handoff contracts for node-based workflows so parsed content remains reusable, auditable, and adaptable.

## Contract Envelope

Use this envelope for every node output:

```json
{
  "trace_id": "string",
  "node_id": "string",
  "status": "ok | partial | blocked",
  "confidence": 0.0,
  "payload": {},
  "errors": [],
  "next_action": "string"
}
```

## Naming Rules

- Use `snake_case` for field names.
- Use explicit units in numeric fields (for example `latency_ms`).
- Keep one semantic meaning per key.
- Preserve raw parsed content under `payload.raw`.

## Minimum Node Spec

For each node, specify:
- `id`
- `purpose`
- `input_schema`
- `output_schema`
- `handoff_to`

## Required Meta Fields

At minimum, require these fields in every output schema:
- `trace_id`
- `node_id`
- `status`
- `payload`

## Adaptation Fields

Include these to support dynamic behavior:
- `confidence`
- `errors`
- `next_action`

## Validation Checklist

- Every required output field is consumed by a downstream node or terminal sink.
- Enums are closed and documented.
- Optional fields have fallback behavior.
- Error payload shape is stable across all nodes.
- Example data passes all node boundaries without transformation ambiguity.
