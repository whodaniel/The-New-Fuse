# Harness Effectiveness Backlog — 2026-08-31

This register separates implemented harness repairs from evidence-backed gaps.
It is not a claim that planned work has shipped.

## Implemented in the current work unit

- Managed MCP runtime: exact packages, immutable releases, Keychain-backed Exa
  secret injection, host adapters, rollback receipts, direct transport probes,
  and removal of runtime `npx` startup dependencies.
- Progressive skill disclosure: imported agent packs were reversibly moved from
  active global roots to inactive vaults. The runtime publisher now targets
  inactive roots and harness injection verifies context-budget health.
- New progressive skills: `tnf-managed-mcp-runtime`,
  `tnf-video-intelligence-completion`, and `tnf-development-workcycle-closure`.

## Verified operational state from Pi

- Full-auto daemon was rechecked live on 2026-08-31: mode `running`, PID 97004,
  interval 30 minutes, unbounded cycles, last observed cycle 4 `ok=true`.
- The native local waiver `TNF_REQUIRE_CLOUD_DB=0` remains inherited by the
  daemon; no database-policy code was weakened.
- Broadcast remains soft-degraded while `TNF_GATE_POLICY_TOKEN` is absent.
- `TNF_SUPER_ADMIN_INPUT_TOKEN` remains absent from the reporting shell.
- API gateway health-route CORS omission is root-caused and deferred to a
  dedicated tested `HealthController` work unit; marketplace 401 is expected and
  its curator workflow must authenticate for a Bearer JWT.
- Extreamix return-to-service and fleet parity gaps remain monitoring items.

## P0 — Video intelligence is not end-to-end

Observed evidence:

- `data/ingestion-runs/ai6-new-may-2026-manifest.json` reports 267 successful
  items, but every item is an Apple Note and zero are videos.
- `data/ai-6-playlist-detected.json` identifies the AI 6 playlist but contains
  zero video rows.
- `data/ingestion-runs/ai6-new-may-2026-action-queue.json` reports
  `sources_seen=0`, `artifacts_resolved=0`, and `tasks_generated=0`.

Required follow-up:

1. Refresh the live AI 6 playlist by durable video ID and collect additions not
   present in the prior snapshot.
2. Acquire timestamped transcripts without deleting the only raw copy.
3. Run the explicit visual/audio/external-evidence gap pass.
4. Recover material gaps or retain explicit unresolved records.
5. Emit atomic actionable factoids and implementation plans.
6. Reconcile every video to an action task or an explicit non-actionable state;
   fail the run if downstream source accounting is zero.

## P0 — The handoff emitter silently truncates its own receipts

`scripts/protocols/emit-session-handoff.cjs` parses `--summary`,
`--next-actions`, and `--resume-checklist` by **assignment**, splitting one
value on a `||` delimiter. Passing any of them repeatedly — which prior Pi and
Codex sessions did — keeps only the LAST occurrence and silently discards the
rest. `--verification-notes` is not a flag at all; it is read only from
`TNF_HANDOFF_VERIFICATION_NOTES`, so every repeated-flag invocation also emitted
empty verification notes. `--help` is unhandled and falls through to a normal
emit, writing an EMPTY handoff over `SESSION_HANDOFF_LATEST.*` and re-syncing
`LIVING_STATE.md`.

Because the _last_ next-action becomes the Current Directive, this also silently
inverted directive priority for those sessions.

Required: accumulate on repeat, add a real `--verification-notes` flag, and make
`--help` print usage and exit without emitting.

## P1 — Scout and agent-run receipts must not fabricate success

Fixed in this work unit, but the shape recurs: `staff-scout-missions.cjs`
computed `ok` from the queue build alone and read only `spawnSync`'s `status`,
never `signal`. A timeout kill (`status:null`, `signal:'SIGTERM'`) therefore
reported `ok=true`, exit 0, with zero agent output. Its 180000ms default budget
was also below `tnf agents run`'s own 600000ms per-call LLM timeout, so every
run was killed mid-first-request. Any wrapper that spawns an agent must surface
`signal`/`error`, fold the child outcome into `ok`, and hold a budget larger
than the child's own timeout.

## P1 — Development workcycle closure

Add an executable closure receipt and doctor check for agent-created worktrees:
owned diff → tests → commit → push → PR → review/CI resolution → merge proof →
safe worktree/branch cleanup. When authorization or credentials prevent a step,
require a precise durable handoff rather than an orphaned worktree.

Candidate implementation skill: `tnf-development-workcycle-closure` (created).

## P1 — Project stack and package resource inventory

Create a machine-readable, project-scoped inventory that correlates lockfiles,
package-manager stores, installed dependency trees, container services, local
databases, background daemons, ports, build caches, and worktree duplication.
Use it to estimate disk/RAM/process cost before provisioning and to identify
recoverable caches without deleting shared active dependencies.

Candidate future skill: `tnf-project-runtime-inventory`. It should extend the
existing host/resource fabric rather than create a competing package registry.

## P1 — Visualization-to-code concordance

Audit from the visualizer/frontend outward: extract displayed role names,
statuses, topology labels, metrics, and taxonomy terms; map them to current code
enums, schemas, registries, protocols, and API payloads; classify each mismatch
as stale presentation, compatibility alias, code drift, missing migration, or
unresolved authority.

Candidate future skill: `tnf-visualization-concordance`, composed from
`tnf-source-concordance`, `codebase-concordance`, and the semantic graph. The
first implementation should use agent-role naming as the acceptance fixture.
