[CLASS:PROTOCOL] [STATUS:CANDIDATE] [DOC_TYPE:sop] [DOMAIN:orchestration]

# TNF Agent Resource Convergence Protocol

**Protocol ID:** TNF_AGENT_RESOURCE_CONVERGENCE  
**Version:** 0.2.0  
**Machine registry:** `data/harness/agent-resource-fabric.json`  
**Engine:** `scripts/harness/agent-resource-converge.cjs`

## 1. Purpose

TNF SHOULD allow many local/cloud-backed agent hosts to share one governed machine-local resource fabric instead of accumulating independent copies of the same skills, prompts, instructions, templates, agent definitions, and tool metadata.

The invariant is:

> **Many host harnesses; one governed reusable resource authority.**

Host-specific adapters remain thin. Reusable resource truth does not fork merely because another CLI or desktop agent was installed.

## 2. Scope boundary

This protocol governs **reusable agent resources**, not every byte a vendor stores locally.

Eligible examples:
- skills and skill support files;
- prompts, rules, templates and bootstrap instructions;
- agent definitions;
- non-secret tool/MCP manifests and reusable metadata;
- other read-only or read-mostly resources explicitly classified by a host adapter.

Not blindly deduplicated:
- access tokens, cookies, credentials, keychains, refresh tokens or `.env` material;
- live databases, caches, indexes and opaque vendor state;
- session histories, raw conversations, trajectories and memory databases;
- mutable user-context stores governed by the user-context storage mandate;
- files whose host write semantics have not been verified.

Stateful "agent brain" material MUST be handled by explicit export/compaction/freshness adapters. File identity alone is not sufficient authority for live memory semantics.

## 3. Lifecycle

`DISCOVER → CLASSIFY → HASH → IMPORT → PLAN → REDIRECT → VERIFY → QUARANTINE → PRUNE → RECEIPT`

### DISCOVER
Map host installations and supported resource surfaces. Do not infer unknown application paths from another provider. Unknown hosts remain `discovery-required`.

### CLASSIFY
Every surface receives at least:
- host/runtime identity;
- resource kind;
- mutability;
- sensitivity;
- centralization policy;
- consumer tags;
- redirect strategy and verification state.

### HASH
Eligible regular files receive SHA-256 identities. The hash identifies content, not authority or publisher trust.

### IMPORT
One content object is stored per hash beneath the machine-local fabric root (default `~/.tnf/agent-resources/objects/sha256`). Provenance records all observed host/path/consumer facets.

Import is non-destructive. Originals remain until a verified adapter permits redirection.

### PLAN
TNF reports duplicate groups, estimated reclaimable bytes, excluded secrets/stateful stores, and host-specific redirect readiness.

### REDIRECT
A host resource may be redirected only when its adapter strategy is explicitly `redirectVerified=true`. Redirection is fail-closed and requires operator-confirming execution flags.

Supported strategy vocabulary:
- `symlink` — host has been proven to safely consume an immutable/shared path;
- `managed-pointer` — host instruction file points to TNF authority rather than copying it;
- `native-config` — host has an official configurable resource path;
- `mcp` — resource is exposed through a supported MCP/provider interface;
- `copy-required` — host requires a materialized copy; TNF remains authority and drift-verifies it;
- `opaque-manual` — no safe automatic redirect is known;
- `observe` — inventory only.

The first engine implementation executes only verified `symlink` redirects. Other strategies are adapter contracts until their host-specific semantics are implemented and tested.

### VERIFY
Post-redirect content must resolve to the expected SHA-256 object and the host must still load the resource successfully. A filesystem link alone is not sufficient proof for a host adapter.

### QUARANTINE / PRUNE
Before a source path is replaced, its previous bytes are preserved under the fabric backup root. Automatic destructive pruning is disabled by default. Reclaiming disk space requires verified redirection plus explicit retention policy.

### RECEIPT
Scan/import/redirect operations produce machine-local receipts. Receipts contain paths, hashes, host IDs and outcomes, never secret contents.

## 4. Content-addressed library layout

Default:

```text
~/.tnf/agent-resources/
  objects/sha256/<hh>/<sha256>
  index/resources.json
  receipts/*.json
  backups/<host>/<timestamp>/...
```

This directory is machine-local operational state. It is not a repository source tree and MUST NOT be committed wholesale.

## 5. Authority and existing TNF contracts

This protocol composes existing systems instead of replacing them:

- **Turn Zero:** `pnpm run tnf:onboard` remains the single onboarding entrypoint.
- **Assimilation:** `.agent/skills/tnf-parody-assimilate-cycle/SKILL.md` remains the capability/evolution intake discipline. Assimilation decides what is worth retaining and which TNF plane owns the result; this protocol owns eligible reusable static artifacts after that classification.
- **Provider routing:** `data/harness/provider-failover-policy.json` and current host/provider adapters remain canonical for execution routing. Do not resurrect `.agent/assimilation-routes.json` as a competing authority.
- **Host injection:** `scripts/install-agent-frontload.cjs` and `scripts/harness/provision-injection-surfaces.cjs` remain authoritative for startup pointers.
- **Skill ubiquity:** `.agent/skills/tnf-skill-ubiquity-propagation/SKILL.md` is a compatibility-edge procedure for making retained skills reachable by runtimes; it is not a second byte store or registry.
- **Skill/MCP trust:** publisher and supply-chain attestation remain independent of file deduplication.
- **Memory:** dynamic memory/compaction/freshness systems govern stateful historical material.
- **User context:** #151/#153 storage contract owns user profile/sources/memory provider semantics.
- **Source governance:** provenance, authority and source identity remain distinct from semantic facets.

A matching SHA-256 means "same bytes," not "same trust," "same publisher," "same semantic role," or "safe for every host."

### 5.1 Assimilation convergence model

The canonical relationship is:

`DISCOVER/PARODY → GAP MATRIX → ASSIMILATE TNF-NATIVE → CLASSIFY RETAINED OUTPUT → {RESOURCE FABRIC | PROVIDER/HOST ADAPTER | MEMORY/COMPACTION | USER-CONTEXT STORAGE | SECRET BOUNDARY} → VERIFY → PROPAGATE → RECEIPT`

Routing rules:

- reusable read-mostly skill/prompt/rule/template/agent-definition → Agent Resource Fabric;
- provider invocation or host binding → existing provider/host authorities;
- learned procedure/capability → TNF-native package/service/protocol/skill after the no-duplication gap matrix;
- stateful session/history/memory → memory/compaction/freshness;
- user-owned durable context → user-context storage mandate;
- secret/credential → machine-private credential boundary.

This separation prevents two failure modes at once: assimilation cannot become an indiscriminate file importer, and Resource Fabric cannot decide semantic/capability authority merely from duplicate bytes.

`tnf assimilate scan` MUST compose the current authorities and Resource Fabric rather than call a private second flywheel or stale routing registry. Machine-local assimilation receipts may prove observations, but they are not canonical routing authority.

## 6. Adaptive host profiles

The machine registry is deliberately host-specific at the edge. Each host profile may expose multiple surfaces with different policies. For example, one host may safely symlink a skill directory but require a private mutable settings database to remain local.

New hosts MUST begin as `discovery-required` unless TNF has verified local/official evidence for their surfaces. ZCode's local discovery requirement has now been satisfied empirically (ZCode 3.8.1 / zcode-cli 0.16.3, persistent `~/.zcode/AGENTS.md`, resource/config surfaces and a fresh-session wire-level probe). Canonical host/frontload assimilation is tracked separately in #170 and detailed Resource Fabric mapping in #168; until those land, the repository profile may still lag the machine receipt.

## 7. Stateful convergence

The long-term target is not only disk deduplication but **semantic memory convergence**:

1. identify host-owned durable session/memory surfaces;
2. export through supported APIs/files only;
3. preserve provenance and timestamps;
4. compact/distill into TNF-owned memory/context contracts;
5. retain or prune vendor raw state according to explicit retention rules;
6. redirect future reusable context through TNF where the host permits it.

Opaque vendor state MUST NOT be surgically modified merely to save disk space.

## 8. Commands

```bash
# Assimilation/capability intake view (no destructive mutation)
tnf assimilate scan
node scripts/harness/assimilation-scan.cjs --json

# Resource Fabric inventory/planning (no mutation)
node scripts/harness/agent-resource-converge.cjs scan
node scripts/harness/agent-resource-converge.cjs plan

# Import eligible bytes once into the content-addressed fabric; originals remain
node scripts/harness/agent-resource-converge.cjs import

# Verify object-store integrity
node scripts/harness/agent-resource-converge.cjs verify

# Redirect only adapter-verified resources; fail closed otherwise
node scripts/harness/agent-resource-converge.cjs redirect \
  --apply --confirm-resource-redirect
```

`TNF_AGENT_RESOURCE_ROOT` or `--root` can relocate the machine-local fabric.

## 9. Safety requirements

1. Never import secrets.
2. Never blindly deduplicate stateful/opaque stores.
3. Never redirect an unverified host surface.
4. Never delete the only usable source copy during import.
5. Backup before redirect.
6. Verify content after redirect and host behavior before prune.
7. Preserve publisher/provenance/consumer tags even when bytes dedupe.
8. Treat filesystem savings as an optimization subordinate to host correctness and user privacy.
9. Do not create a second Turn Zero, assimilation routing registry, provider policy, or user-context provider model.
10. Any host adapter learned from local inspection must be added to the shared registry/protocol with evidence, not kept as chat-only knowledge.
11. Assimilation decides semantic retention; Resource Fabric decides reusable byte identity/storage only after classification.
12. Skill-ubiquity propagation must converge toward shared authority with thin provider views, not multiply independent complete copies by default.

## 10. Product direction

This is intended to become a first-class TNF harness capability: install Claude, Codex, Gemini, Cursor, Kilo, OpenCode, ZCode and future providers while TNF continuously maps resource surfaces, assimilates distinctive capabilities through the no-duplication gap process, absorbs eligible reusable resources into one governed fabric, detects stale duplicates, and keeps only the thin compatibility material each host genuinely needs.
