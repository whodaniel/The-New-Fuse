# TNF Limitation Challenge Schema Loop

This is the limitation I ran up against. So, this is the challenge we will
overcome! Map out the specific data schemas these nodes will use to pass the
parsed content back and forth.

## Limitation and Challenge

- Limitation: Self-improvement runs can drift when large OAuth provider matrices
  and intermittent CLI stalls create ambiguous handoffs between audit, auth
  validation, and remediation steps.
- Challenge: Create a resilient TNF self-improvement workflow with
  schema-validated node handoffs, explicit fallback routes, and deterministic
  artifact validation.

## Node Responsibilities

1. `ingest_context`: collect run context, target URLs, and prior artifact state.
2. `classify_limitation`: normalize blocker category and confidence.
3. `map_audits`: map limitation class to audit plan and strict flags.
4. `run_deterministic_audits`: execute build + link + semantic + auth +
   scorecard.
5. `score_and_route`: evaluate pass/fail and choose remediation branch.
6. `remediate`: apply smallest-scope additive fix.
7. `rerun_and_verify`: rerun affected audits, then full scorecard.
8. `publish_evidence`: write docs/audit artifacts and run-log note.

## Per-Edge Schema Contract

Every node boundary uses this envelope.

```json
{
  "trace_id": "string",
  "node_id": "string",
  "status": "ok | partial | blocked",
  "confidence": 0.0,
  "payload": {
    "raw": {},
    "normalized": {},
    "signals": []
  },
  "errors": [
    {
      "code": "string",
      "message": "string",
      "retryable": true
    }
  ],
  "next_action": "string"
}
```

Input schema for each edge:

```json
{
  "type": "object",
  "required": ["trace_id", "payload"],
  "properties": {
    "trace_id": { "type": "string" },
    "payload": { "type": "object" },
    "context": { "type": "object" }
  },
  "additionalProperties": true
}
```

Edge topology:

1. `ingest-context` -> `classify-limitation`
2. `classify-limitation` -> `map-audits`
3. `map-audits` -> `run-deterministic-audits`
4. `run-deterministic-audits` -> `score-and-route`
5. `score-and-route` -> `remediate`
6. `remediate` -> `rerun-and-verify`
7. `rerun-and-verify` -> `publish-evidence`

## End-to-End Example Payload

```json
{
  "trace_id": "trace-tnf-20260326-1252",
  "node_id": "run-deterministic-audits",
  "status": "ok",
  "confidence": 0.98,
  "payload": {
    "raw": {
      "base_url": "https://thenewfuse.com",
      "api_url": "https://api.thenewfuse.com"
    },
    "normalized": {
      "live_total_broken": 0,
      "semantic_hard_broken": 0,
      "auth_failed": 0,
      "scorecard_passed": true
    },
    "signals": ["audits-complete", "artifacts-written", "ready-for-publish"]
  },
  "errors": [],
  "next_action": "publish_evidence"
}
```

## Adaptation Logic

- If `confidence >= 0.9` and `status=ok`: continue to next node.
- If `0.6 <= confidence < 0.9` or `status=partial`: reroute to `map_audits` with
  tighter scope.
- If `confidence < 0.6` or `status=blocked`: route to `remediate` with non-empty
  `errors[]`, then `rerun_and_verify`.
- Preserve original parsed output under `payload.raw` across all retries.

## Artifacts

- Contract JSON: `docs/operations/tnf-self-improvement-workflow-contract.json`
- Run cycle doc: `docs/operations/tnf-self-improvement-cycle.md`
