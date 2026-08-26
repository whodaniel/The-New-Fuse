---
name: tnf-skill-ubiquity-propagation
description: >-
  Make TNF skills and slash-commands reachable across agent runtimes without
  multiplying independent resource authorities. Use when a runtime is missing
  the slash-command family, when adding a runtime root, when reconciling
  agent-definition wrappers, or when asked to make TNF skills available to a
  provider. Compose with the Agent Resource Fabric for shared content identity,
  provenance, dedupe, verification, and safe redirection.
primary_type: protocol
category: engineering/skills
risk_tier: low
harmful_pattern_detection: false
---

# TNF Skill Ubiquity Propagation

TNF historically used a multi-root skill topology so each runtime could see the
same skill family. That compatibility requirement remains, but **multi-root does
not mean multi-authority**.

The target architecture is:

> **One governed reusable resource authority; many verified runtime views.**

`TNF_AGENT_RESOURCE_CONVERGENCE` is the general substrate for content identity,
provenance, dedupe, backups, redirect verification, and later safe reclamation.
This skill owns the provider-specific *reachability/compatibility* procedure for
skills and slash commands. It must not create a second resource registry.

## Current/legacy topology

| Root | Role |
| --- | --- |
| `~/.agents/skills/` | Shared compatibility root used natively by some runtimes |
| `~/.<runtime>/skills/` | Provider-specific view when required by that host |
| `.agent/skills/` | Repo project skills governed with TNF source |
| `~/.tnf/skills/` | TNF runtime view |
| `.agent/skill-bank/` | Discovery/index snapshots, not byte authority |
| `~/.tnf/agent-resources/` | Content-addressed reusable resource authority for eligible machine-local resources |

Do not assume every runtime can read the same directory. The host adapter decides
whether the edge is a symlink, managed pointer, native config path, MCP exposure,
copy-required materialization, or observe-only surface.

## Adding or reconciling a runtime

### 1. Discover before propagating

Use verified provider documentation or empirical host inspection. Record its
skill/resource surfaces in `data/harness/agent-resource-fabric.json`. Unknown
hosts remain `discovery-required`; do not infer one runtime's paths from another.

### 2. Inventory existing TNF capability

Before importing another host's skill set, run the parody/assimilate gap process:

- `.agent/skills/tnf-parody-assimilate-cycle/SKILL.md`
- `node scripts/harness/assimilation-scan.cjs --json`
- `node scripts/harness/agent-resource-converge.cjs plan --json`

A provider copy is not automatically a new TNF skill. Match by responsibility,
content identity, provenance, and current canonical implementation.

### 3. Extend existing skill-bank discovery when needed

If the host exposes a new supported skill root, update
`scripts/skills/skill-bank-sync.cjs` and the existing origin/scan-root logic.
The skill bank indexes what exists; it does not become a competing content store.

### 4. Reconcile provider views

Use `scripts/agents/reconcile-agent-banks.cjs` only where the provider actually
requires a provider-local view. Prefer links/pointers to shared authority over
full independent copies when the host has been proven to tolerate them.

### 5. Frontload separately from skill propagation

Startup instruction injection stays owned by:

- `scripts/install-agent-frontload.cjs`
- `scripts/harness/provision-injection-surfaces.cjs`

A provider's `AGENTS.md`, `SOUL.md`, or equivalent is an onboarding edge, not a
reason to copy the entire TNF skill corpus into that host.

### 6. Import unique reusable bytes into Resource Fabric

For eligible read-mostly resources:

```bash
node scripts/harness/agent-resource-converge.cjs scan --json
node scripts/harness/agent-resource-converge.cjs plan --json
node scripts/harness/agent-resource-converge.cjs import --json
```

Import is non-destructive. Preserve all host/path/publisher/consumer provenance.
Same hash means same bytes, not same trust or semantics.

### 7. Redirect only through a verified host adapter

Do not manually symlink every runtime by default. The earlier ubiquity playbook
used broad symlink loops; those are now a **legacy compatibility technique**, not
the universal policy. A redirect requires the exact Resource Fabric surface to
have a verified strategy and must preserve backup/rollback proof.

A host that requires physical copies may remain `copy-required`, with TNF as the
authority and drift verification maintaining the materialized edge.

### 8. Verify fresh-session reachability

Verification must include both filesystem/resource integrity and the provider
actually loading the skill in a fresh session. Counting directory entries alone
is insufficient.

Recommended checks:

```bash
node scripts/skills/skill-bank-sync.cjs
node scripts/harness/agent-resource-converge.cjs verify
node scripts/harness/assimilation-scan.cjs --json
tnf skill list --json
```

Then run the host-specific fresh-session probe defined by its adapter/evidence.

## Relationship to assimilation

Assimilation decides **what capability is worth retaining and where it belongs**.
This skill propagates retained *skill resources* to provider edges. Agent Resource
Fabric supplies shared static-resource identity and storage. The separation is:

`PARODY/ASSIMILATE → classify retained output → Resource Fabric (if reusable static) → this ubiquity adapter (if many hosts need it) → fresh-session verify`.

Stateful histories/memory do not enter this skill merely because they live under
a provider's home directory; they route to memory/compaction. Secrets remain
private. User-owned durable context routes to the user-context storage mandate.

## Notes / traps

- Symlinks are not `isDirectory()`; walkers must resolve/handle them safely and
  skip broken links without aborting the whole sync.
- Some runtimes read `~/.agents/skills/` natively; others prioritize their own
  root. Verify each host rather than assuming.
- Repo-tracked skills remain subject to TNF skill governance/frontmatter rules.
- Generated indexes/manifests must not be committed from a dirty worktree when
  they would accidentally capture another agent's uncommitted imports.
- **Never create parallel registries.** Extend current skill-bank, provider,
  Resource Fabric, frontload, and reconciliation authorities.
- **Never optimize disk ahead of correctness.** Prune only after verified
  redirection, retention window, and rollback proof.
