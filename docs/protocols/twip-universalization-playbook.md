# TWIP Universalization Playbook (v0.1)

Status: Draft Audience: TNF platform and agent-runtime integrators

## Objective

Make TWIP reusable, transferable, translatable, and wrappable across
heterogeneous agent systems while preserving strong safety defaults.

## 1) Core Invariants (Do Not Break)

1. Canonical identity object remains `twip-identity.schema.json`.
2. Cross-boundary exchange always uses `twip-envelope.schema.json`.
3. Every identity includes tenant scope and provenance.
4. TTL and policy checks are evaluated before state mutation.
5. Unknown fields are ignored, never executed.

## 2) Reusable Adapter Contract

Each environment-specific adapter must implement the same contract:

```ts
interface TwipAdapter {
  adapterId: string;
  runtime: 'kernel' | 'terminal' | 'multiplexer' | 'cloud';
  canDetect(): Promise<boolean> | boolean;
  collectSignals(): Promise<Record<string, unknown>>;
  normalize(signals: Record<string, unknown>): Promise<TwipIdentity>;
}
```

Adapter outputs must include:

1. Stable `twid` derivation inputs (`host_id`, `tenant_id`, tty/session scope).
2. Provenance list with source and confidence.
3. Explicit nulls for unavailable fields to avoid ambiguous inference.

## 3) Transfer Profiles

Use the same TWIP payload with thin transport wrappers:

1. MCP Profile `tool`: `twip_publish_identity`, `twip_resolve_identity`,
   `twip_revoke_identity` `resource`: `tnf://twip/*`, `fuse://twip/*`

2. HTTP/OpenAPI Profile `POST /v0/identity:publish|resolve|revoke`
   `POST /v0/policy:evaluate` Graph Projection: `GET /api/terminals/graph` for
   read-only topology views.

3. Event Bus Profile Envelope body on topic `twip.identity.events` with
   immutable `trace` block.

4. Handoff Profile Embed `twip_ref` (`twid`, integrity hash, correlation id) in
   agent handoff payload.

5. Federation Profile Carry master cumulative lineage object:
   `docs/protocols/schemas/tnf-master-cumulative-id.schema.json`

## 4) Translation Rules

When moving between runtimes:

1. Preserve canonical fields unchanged when already present.
2. Add source-specific metadata under namespaced extension keys (example:
   `x_tmux`).
3. Never overwrite stronger provenance with weaker provenance.
4. If identity confidence drops below threshold, emit `POLICY.DECISION` deny.

ID normalization rules (must be deterministic):

1. `tnf-envelope.traceId` -> `mcid.lineage.trace_id`
2. `twip-envelope.trace.correlation_id` -> `mcid.lineage.correlation_id`
3. `twip-envelope.trace.causation_id` -> `mcid.lineage.causation_id`
4. `handoff.scope.tenantId` -> `mcid.scope.tenant_id`
5. `handoff.scope.sessionKey` -> `mcid.scope.session_key`
6. `handoff.scope.workflowId` -> `mcid.scope.workflow_id`
7. `handoff.scope.channelId` -> `mcid.scope.channel_id`
8. `handoff.id` -> `mcid.lineage.handoff_packet_id`
9. `twip_ref.twid` -> `mcid.lineage.twid`

## 5) Wrappability Rules

Wrappers should be stateless and deterministic:

1. No implicit side effects during `RESOLVE`.
2. All writes include audit record with decision reason.
3. Wrappers return canonical payload first, wrapper metadata second.

## 6) Safety Baseline

Required controls:

1. Tenant scoping required for publish/resolve/revoke.
2. TTL bounded (`<= 3600`; lower defaults recommended).
3. GUI/title metadata redacted by default.
4. Replay resistance using envelope nonce + created timestamp checks.
5. Capability registration separated from identity mutation permissions.

## 7) TNF Operational Pattern

1. Scan terminals -> normalize TWIP identities.
2. Policy-evaluate envelope.
3. Publish to scoped store.
4. Expose inventory as MCP resource.
5. Register TWIP capability in agent registry.
6. Emit audit events for all policy/mutation actions.

## 8) Conformance Kit

Minimum tests for any TWIP implementation:

1. Schema validation pass/fail fixtures.
2. Cross-adapter normalization parity for same terminal session.
3. Policy-deny tests for missing tenant and invalid TTL.
4. Replay-deny tests for stale envelopes.
5. Redaction tests for GUI metadata in default mode.

## 9) Versioning and Evolution

1. Keep `twip/0.x` backward compatible within minor updates.
2. Additive fields only; no required-field removals.
3. Publish migration notes for any signature changes.
4. Maintain bridge mappings for at least one previous minor version.

## 10) Operatorization

1. Operational controls and rollout steps are defined in
   `docs/protocols/twip-operator-runbook.md`.
2. Use `scripts/protocols/twip-sign-envelope.cjs` for deterministic envelope
   signing/verification in CI and automation.
