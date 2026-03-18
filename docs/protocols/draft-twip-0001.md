# RFC DRAFT-TWIP-0001: Terminal Window Identity Protocol (TWIP) v0.1

- Status: Draft, Experimental
- Intended Audience: TNF platform, relay, MCP, orchestrator, and agent-runtime
  implementers
- Authoring Date: 2026-03-18

## 1. Abstract

TWIP defines a portable identity and provenance layer for terminal
windows/tabs/panes and their execution context. It standardizes how runtime
identity is discovered, translated, wrapped, and transferred across TNF
components (CLI, relay, MCP, orchestrator, and handoff systems) with explicit
safety controls.

## 2. Conformance

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` are
interpreted as in RFC 2119.

## 3. Problem Statement

TNF currently has strong messaging and MCP infrastructure, but terminal identity
is fragmented across:

1. kernel PTY/TTY fields (`tty`, inode)
2. process/session fields (`pid`, `pgid`, `sid`)
3. emulator environment signals (`TERM_SESSION_ID`, `ITERM_SESSION_ID`,
   `WINDOWID`)
4. multiplexer signals (`TMUX_PANE`, `screen` window)

Without normalization, identity is hard to transfer safely between tools,
difficult to audit, and expensive to reuse across agent frameworks.

## 4. Goals

1. Define one canonical terminal identity object (`twid`).
2. Make identity transferable between TNF components as a signed envelope.
3. Make identity translatable by adapters (terminal-specific to canonical).
4. Make identity wrappable into MCP, handoff packets, and orchestrator events.
5. Enforce privacy, provenance, and replay protections by default.

## 5. Non-Goals

1. Replacing kernel process or PTY semantics.
2. Standardizing terminal rendering/UI behavior.
3. Exposing GUI metadata by default.

## 6. Core Model

### 6.1 Canonical Identity

TWIP identity fields are defined in:

- `docs/protocols/schemas/twip-identity.schema.json`

Required fields:

1. `twid` (UUIDv7)
2. `spec` (`twip/0.1`)
3. `created_at`
4. `scope` (`tenant_id`, `host_id`, `emulator_id`, optional `window_id`,
   `tab_id`, `pane_id`)
5. `provenance` (source list, confidence, observed timestamps)

### 6.2 Envelope Contract

All transport messages MUST use the TWIP envelope schema:

- `docs/protocols/schemas/twip-envelope.schema.json`

Message types:

1. `IDENTITY.PUBLISH`
2. `IDENTITY.RESOLVE`
3. `IDENTITY.RESOLVE.RESULT`
4. `IDENTITY.REVOKE`
5. `CAPABILITY.REGISTER`
6. `POLICY.DECISION`
7. `ERROR`

## 7. Reusable Translation Layer

Every adapter MUST output the same canonical identity contract.

### 7.1 Adapter Interface

```ts
interface TwipAdapter {
  adapterId: string; // e.g., "iterm2", "wezterm", "tmux"
  canDetect(): boolean;
  collectSignals(): Promise<Record<string, unknown>>;
  normalize(signals: Record<string, unknown>): Promise<TwipIdentity>;
}
```

### 7.2 Recommended Adapters

1. `kernel-pty-adapter`
2. `process-session-adapter`
3. `iterm2-adapter`
4. `wezterm-adapter`
5. `tmux-adapter`
6. `screen-adapter`

### 7.3 Provenance Requirement

Normalized output MUST keep raw-to-canonical provenance entries (`key`,
`source`, `confidence`, `observed_at`) for auditability.

## 8. Transferable Wrapper Profiles

TWIP is reusable by wrapping it into TNF-native protocol surfaces.

### 8.1 MCP Wrapper Profile

- Resource URI: `fuse://twip/identity/{twid}`
- Tools:
  - `twip_publish_identity`
  - `twip_resolve_identity`
  - `twip_revoke_identity`
  - `twip_capability_register`

### 8.2 Handoff Wrapper Profile

Embed a `twip_ref` in `HandoffPacket.payload`:

```json
{
  "twip_ref": {
    "twid": "019cffae-e4f8-710c-9f94-0fcc73567e42",
    "trace_id": "...",
    "integrity": "sha256:..."
  }
}
```

### 8.3 Orchestrator Wrapper Profile

Orchestrators SHOULD correlate task execution with terminal identity via:

1. `twid`
2. `trace.correlation_id`
3. `scope.session_key`

## 9. Universal Safety Model

### 9.1 Threats

1. Identity spoofing
2. Replay of old identities
3. Cross-tenant leakage
4. Metadata overexposure (GUI/title)
5. Unauthorized capability escalation

### 9.2 Controls

1. Envelope signatures SHOULD be required across trust boundaries.
2. `ttl_seconds` MUST be bounded (recommended <= 300 for live signals).
3. Tenant scoping (`scope.tenant_id`) MUST be present for
   publish/resolve/revoke.
4. GUI fields MUST be opt-in and redaction-capable.
5. Policy decisions MUST emit audit events with decision + reason.

### 9.3 Safe Defaults

1. No remote propagation unless explicitly enabled.
2. `host_id` SHOULD be pseudonymous.
3. Unknown fields MUST be ignored, not executed.

## 10. TNF Integration Points

### 10.1 Immediate Integration Targets

1. `apps/relay-server/src/mcp-server.js`

- add TWIP tools and resources

2. `apps/mcp-servers/tnf-network-mcp/src/index.ts`

- add identity publish/resolve broadcast utilities

3. `apps/backend/src/modules/mcp/mcp-server.service.ts`

- register `fuse://twip/*` resources

4. `data/mcp_config.json`

- register a dedicated TWIP adapter server once implemented

### 10.2 Capability Catalog Link

Treat TWIP as a capability entry in interoperability inventory with:

1. `name`: `twip-identity`
2. `version`: `0.1`
3. `input_schema`: `twip-envelope.schema.json`
4. `output_schema`: `twip-identity.schema.json`

## 11. Bridge Contracts (TNF Skill Bridging)

Bridge specs are provided:

1. `docs/protocols/bridges/twip-to-agent-handoff.yml`
2. `docs/protocols/bridges/twip-to-capability-catalog.yml`

These define deterministic handoff contracts, validation checks, and fallback
behavior.

## 12. OpenAPI Stub

HTTP binding stub:

- `docs/protocols/openapi/twip-v0.1-stub.yaml`

Proposed endpoints:

1. `POST /v0/identity:publish`
2. `POST /v0/identity:resolve`
3. `POST /v0/identity:revoke`
4. `POST /v0/capability:register`
5. `POST /v0/policy:evaluate`

## 13. Rollout Plan (Pragmatic)

1. Phase 0: publish schema + bridge contracts + draft docs.
2. Phase 1: wire read-only TWIP resources into MCP server.
3. Phase 2: wire signed publish/resolve/revoke flow in relay/backend.
4. Phase 3: enforce policy gate and audit trails in production.
5. Phase 4: expose SDK wrappers (`TS`, `Python`, CLI) for external adopters.

## 14. Adoption Checklist

1. Schema validation in CI for all TWIP envelopes.
2. Tenant + TTL enforcement at ingress.
3. Audit log presence for every publish/resolve/revoke decision.
4. Backward-compatible versioning for `twip/0.x`.
5. Conformance tests for adapter normalization parity.

## 15. References

1. `docs/protocols/draft-sgp-0001.md`
2. `docs/protocols/UTP_SPEC_v1.0.md`
3. `docs/protocols/AGENT_TARGETED_HANDOFF_V1.md`
4. `/Users/<owner>/TWIP-v0.1.md`
5. `/Users/<owner>/draft-twip-00.xml`
6. `docs/protocols/twip-universalization-playbook.md`
7. `docs/protocols/twip-operator-runbook.md`
