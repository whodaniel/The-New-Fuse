---
name: tnf-parody-assimilate-cycle
description: >-
  Run a PARODY + ASSIMILATE cycle to endow the TNF harness with an external
  agent's distinctive capabilities. Use when asked to "parody", "assimilate", or
  "endow tnf cli agent with what makes X powerful", or when an external CLI's
  feature should become TNF-native without duplicating an existing silo. Covers
  capability inventory, gap matrix, extend-vs-new decision, output
  classification, TNF-native codification, and regression verification.
primary_type: protocol
category: engineering/assimilation
risk_tier: low
harmful_pattern_detection: false
---

# TNF Parody + Assimilate Cycle

TNF's core tenet: parody the best from any agent, assimilate it into TNF-native
capabilities. This is the disciplined loop that does it without breaking
existing features (proven 2026-08-16 assimilating Command Code's todo/task tools
into the tnf CLI agent).

Assimilation is the **capability/evolution intake plane**. It is not a synonym
for copying another host's files. When assimilation discovers concrete reusable
skills, prompts, rules, templates, agent definitions, or other read-mostly
resources, those artifacts route through the Agent Resource Fabric instead of
creating another per-provider resource silo.

## The loop

### 1. ASSIMILATE — inventory the source agent's capabilities

Load authoritative knowledge for the source agent and extract the DISTINCTIVE
capabilities — the ones that make it powerful, not the generic ones. Preserve
provider/version/provenance evidence and distinguish observed behavior from
inference.

For Command Code, prior examples included session checklist (`todo_write`),
durable task ledger (`task_*` with blockedBy), plan mode, headless print mode,
event hooks, sub-agents with isolated context + background runs, memory tiers,
input repair, and progressive skill disclosure.

### 2. Inventory the TNF surface (no duplication)

Check the current TNF surface for each responsibility, not only the external
feature's name. Sources include:

- `packages/tnf-cli/src/command-surface.snapshot.json` — command paths;
- `packages/tnf-cli/src/commands/agents-run.ts` — autonomous-loop toolset;
- `packages/tnf-cli/src/utils/llm-tools.ts` — LLM-advertised tool schemas;
- `packages/tnf-cli/src/services/` — existing services;
- `scripts/` + `data/` — harness/runtime authorities;
- `data/harness/provider-failover-policy.json` — provider routing policy;
- `data/harness/agent-resource-fabric.json` — reusable host-resource surfaces;
- `.agent/skills/` — existing TNF-native procedural/capability codification.

Do NOT re-invent a capability merely because the provider names it differently.

### 3. Build the gap matrix

| external capability | TNF surface | gap | extend-vs-new | retained output class |
| --- | --- | --- | --- | --- |

Mark each as `covered`, `extend existing silo`, `new`, or `unresolved`.
Creating a new abstraction requires a one-line justification for why the
existing TNF surface cannot own the responsibility.

### 4. Codify the capability TNF-native

Prefer extending an existing silo. Runtime tools belong in the existing tool
schema/executor surfaces; CLI commands belong in the command surface; provider
execution belongs in current provider/host routing; reusable procedural
knowledge belongs in skills.

### 5. Classify retained outputs

Every assimilated output must route to the existing TNF plane that owns its
semantics:

- **Reusable read-mostly artifact** (skill/prompt/rule/template/agent definition)
  → `TNF_AGENT_RESOURCE_CONVERGENCE` / Agent Resource Fabric.
- **Provider execution or host binding** → existing provider-failover + host
  injection/adapter authorities. Do not create `.agent/assimilation-routes.json`.
- **Stateful history, trajectory, or learned memory** → TNF memory/compaction
  and freshness layer; never static-file dedupe opaque databases.
- **User-owned durable profile/context** → user-context storage mandate.
- **Secret/credential** → machine-private credential boundary; never Resource
  Fabric.
- **TNF-native capability/code** → existing package/service/protocol/skill that
  owns the responsibility.

This classification is the bridge between *assimilation* and *resource
convergence*: assimilation decides what TNF should retain; the Resource Fabric
stores/distributes eligible reusable bytes without changing their authority.

### 6. Propagate without multiplying copies

If an assimilated skill/resource needs to be available across providers, use
`tnf-skill-ubiquity-propagation` as a compatibility-edge procedure. Its target
state is shared authority plus thin host-specific links/pointers/copies only
when the host requires them. The Agent Resource Fabric is the general substrate
for content identity, provenance, dedupe, backup, redirect verification, and
later safe reclamation.

### 7. Verify — never break existing features

```bash
pnpm --filter @the-new-fuse/tnf-cli run build
(cd packages/tnf-cli && npx tsc -p tsconfig.json --noEmit)
node scripts/protocols/command-surface-gate.cjs --mode=ci
node scripts/protocols/turn-zero-v2-gate.cjs --task "assimilation verification"
node --test scripts/harness/assimilation-scan.test.cjs
node scripts/harness/assimilation-scan.cjs --json
node scripts/harness/verify-harness-completeness.cjs
```

Only report checks actually executed. A newly authored test is not a passing
test until it has run.

## `tnf assimilate` roles

- `tnf assimilate run <provider> ...` — execute a provider under TNF protocol
  authority and write machine-local proof receipts.
- `tnf assimilate link <provider>` — verify the provider against existing TNF
  provider/host/resource authorities and write a machine-local link receipt. It
  does **not** create another canonical routing registry.
- `tnf assimilate scan` — compose the current assimilation skill topology,
  provider policy, and Agent Resource Fabric into one non-destructive intake
  report.

## Guardrails

- **Never invent a parallel registry.** Extend existing provider, resource,
  skill, memory, and host authorities.
- **Same bytes ≠ same semantics or trust.** Resource Fabric dedupe does not
  decide whether a capability should be assimilated.
- **Runtime tools ≠ CLI commands.** Tool additions do not change command
  surface unless `.command()`/`.option()` changes.
- **Skill ubiquity is an adapter, not a second resource authority.** Prefer one
  governed source with verified host edges over independent full copies.
- **Concurrent-agent drift:** refresh current code/PR/workstream ownership before
  overlapping edits and re-verify after concurrent commits.
- **Honest reporting:** if a gap is partial or a host adapter is unverified, say
  so. Never claim a capability assimilated or a resource redirected when only
  planned.
