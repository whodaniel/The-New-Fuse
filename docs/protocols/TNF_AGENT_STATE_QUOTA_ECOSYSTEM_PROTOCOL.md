`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

# TNF Agent State, Quota, and Ecosystem Boot Protocol

**Protocol ID:** `TNF_AGENT_STATE_QUOTA_ECOSYSTEM`  
**Spec:** `tnf/agent-state-quota-ecosystem/0.2`  
**Related:** `TNF_ARTIFACTS_LIFECYCLE`, `TNF_USER_CONTEXT_STORAGE`, `TNF_TURN_ZERO_CANONICAL`

## Purpose

TNF control surfaces must boot with an authenticated user's **cheap orientation**
snapshot, while onboarded agent observations remain historically auditable without
unbounded disk growth. Delegation composes capability + authority + availability +
quota — **quota never overrides authority**.

## Path classification (this feature set)

| Path | Destination |
| ---- | ----------- |
| `packages/tnf-cli/**` (profile/agent/ecosystem/quota services + commands) | `oss_runtime` |
| `scripts/runtime/agent-state-quota-ecosystem*.cjs` + hydrate bridge | `oss_runtime` |
| `scripts/protocols/check-artifacts-lifecycle.cjs` retention rows | `oss_runtime` |
| `scripts/operations/swarm-disk-retention.sh` | `oss_runtime` |
| `docs/protocols/TNF_AGENT_STATE_QUOTA_ECOSYSTEM_PROTOCOL.md` | `public_contract` |
| `apps/frontend/src/services/ecosystemSnapshot.ts` | `public_contract` |
| `apps/tauri-desktop/**` boot orient / get_ecosystem_snapshot | `oss_runtime` |
| Hosted billing/entitlement/director policy | **not in this PR** (`private_control_plane`) — OSS degrades when absent |

## Agent-state layout — NOT a canonical silo

```text
~/.tnf/agent-state/<profile>/
  latest.json              # observation projection cache (persistent anchor)
  orient-latest.json       # cheap boot orientation
  ecosystem-latest.json    # task-scoped hydrate mirror
  history/*.json           # transient observation history
  history.jsonl            # transient append-only summary
```

**Kind:** `observation-history` / projection cache.  
**Authority field:** always `not-authoritative`.

Canonical surfaces remain:

| Concern | Surface |
| ------- | ------- |
| Roles / mutation authority | `~/.tnf/authority/roles.json` + elevation broker |
| Open tasks | `handoff-current.json` `IMMEDIATE_TASKS` / `next_actions` |
| Operator narrative | `docs/protocols/AGENT_STATUS_LEDGER.md` |

Retention follows `TNF_ARTIFACTS_LIFECYCLE` (300 files / 14d; JSONL 1000 lines).
`latest.json` is never pruned.

## Quotas

```json
{
  "agentId": "...",
  "provider": "claude",
  "dimension": "tokens",
  "used": 100,
  "limit": 1000,
  "remaining": 900,
  "remainingFraction": 0.9,
  "observedAt": "...",
  "resetAt": null,
  "freshnessTtlSec": 300,
  "source": "local-config+metrics",
  "confidence": "reported"
}
```

`confidence: unknown` ⇒ `remaining`/`limit` are **null** (never invent 0 or unlimited).

Delegation ranking composes: capability (incl. `tnf-agent-match`) + authority
(hard gate) + privacy + availability + quota + latency + context + reliability.
Authority-ineligible agents never win.

## Profile authentication ≠ authorization

- `tnf profile login` authenticates a local profile session only.
- `tnf profile whoami` exposes identity / authentication / capability / authority.
- Mutation (`refresh-context`, `agent state --refresh`, observation bootstrap)
  requires `requireMutationAuthority` against `~/.tnf/authority`.

## Ecosystem boot

- **orient** (default boot): enlisted providers, runtime health anchors, authority
  refs, quota freshness summary, communication surfaces.
- **hydrate** (explicit/task-scoped): lazy sources/projects/tasks — fail-soft when
  unavailable. Hosted control plane absence degrades cleanly.

## CLI

- `tnf profile list|whoami|login|logout|switch`
- `tnf agent state [--refresh]|state-history|quotas [--rank]`
- `tnf ecosystem orient|show`
