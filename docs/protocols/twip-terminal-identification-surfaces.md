# TWIP Terminal Identification Surfaces (v0.1)

Status: Draft  
Audience: TNF platform, agent-runtime adapters, relay/backend maintainers

## Objective

Provide a complete, implementation-ready map of how an individual terminal
window/session can be identified across local and remote environments, then
normalize those signals into TWIP.

## 1) Identification Surfaces

1. Kernel PTY surface
   - Signal examples: `/dev/ttys004`, `/dev/pts/7`
   - Strength: strongest local anchor for an interactive terminal endpoint
   - TWIP target: `pty.path`, `scope.session_key`

2. Process tree surface
   - Signal examples: `shell_pid`, `ppid`, `pgid`, `sess/sid`
   - Strength: stable during a session, useful for lineage and lifecycle
   - TWIP target: `process.shell_pid`, `process.pgid`, `process.sid`

3. Multiplexer surface
   - Signal examples: tmux `session_id/window_id/pane_id`, screen window ids
   - Strength: disambiguates panes sharing a host/session
   - TWIP target: `multiplexer.*`, `scope.pane_id`, `scope.window_id`

4. Emulator/windowing surface
   - Signal examples: emulator process metadata, tab/window ids, titles
   - Strength: useful for operator UX, weaker for security identity
   - TWIP target: `scope.emulator_id`, optional extension fields
   - Safety: redact GUI/title by default

5. Remote transport surface
   - Signal examples: SSH connection tuple, remote tty, bastion hop markers
   - Strength: required for cross-host traceability
   - TWIP target: provenance entries and namespaced extension metadata

6. Container/orchestrator surface
   - Signal examples: container id, pod name, namespace, node id
   - Strength: required for cloud-native terminal sessions
   - TWIP target: `scope.host_id` plus extension metadata (`x_container`, `x_k8s`)

7. Workspace/runtime surface
   - Signal examples: repo root fingerprint, tenant, runtime instance id
   - Strength: critical for multi-tenant agent safety
   - TWIP target: `scope.tenant_id`, provenance

8. Tooling/session surface
   - Signal examples: Codex/OpenClaw/session correlation ids
   - Strength: strongest for cross-agent handoff integrity
   - TWIP target: envelope `trace` and handoff `twip_ref`

## 2) Normalization Priority

Use these precedence rules when signals conflict:

1. Kernel PTY > multiplexer > process > emulator metadata.
2. Stronger provenance confidence never overwritten by weaker confidence.
3. Unknown fields are preserved as extensions, never executed.

## 3) Universal TWIP Mapping Contract

Every adapter must output:

1. Deterministic `twid` inputs: `tenant_id + host_id + tty/session scope`.
2. `provenance[]` entries containing source, confidence, observed timestamp.
3. Explicit nulls for unavailable fields (not omitted ambiguity).
4. Tenant-scoped identity only.

## 4) Safety Baseline

1. Require tenant scope for publish/resolve/revoke.
2. Enforce TTL bounds (`1..3600` seconds).
3. Block remote propagation by default.
4. Redact GUI/window-title metadata by default.
5. Require signature + replay checks for production.

## 5) TNF Implementation Anchors

Current TNF references:

1. Relay scan tool: `twip_scan_terminals`
2. Relay resource: `tnf://twip/inventory`
3. Backend mirror: `fuse://twip/inventory`
4. Schemas: `docs/protocols/schemas/twip-*.schema.json`
5. Runbooks:
   - `docs/protocols/twip-universalization-playbook.md`
   - `docs/protocols/twip-operator-runbook.md`
6. Graph API/UI:
   - `GET /api/terminals/graph`
   - `/visualizations/terminals`
   - `/terminals`
