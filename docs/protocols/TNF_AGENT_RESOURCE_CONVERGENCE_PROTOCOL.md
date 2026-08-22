[CLASS:PROTOCOL] [STATUS:CANDIDATE] [DOC_TYPE:sop] [DOMAIN:orchestration]

# TNF Agent Resource Convergence Protocol

**Protocol ID:** TNF_AGENT_RESOURCE_CONVERGENCE  
**Version:** 0.1.0  
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
- **Host injection:** `scripts/install-agent-frontload.cjs` and `scripts/harness/provision-injection-surfaces.cjs` remain authoritative for startup pointers.
- **Skill/MCP trust:** publisher and supply-chain attestation remain independent of file deduplication.
- **Memory:** dynamic memory/compaction/freshness systems govern stateful historical material.
- **User context:** #151/#153 storage contract owns user profile/sources/memory provider semantics.
- **Source governance:** provenance, authority and source identity remain distinct from semantic facets.

A matching SHA-256 means "same bytes," not "same trust," "same publisher," or "safe for every host."

## 6. Adaptive host profiles

The machine registry is deliberately host-specific at the edge. Each host profile may expose multiple surfaces with different policies. For example, one host may safely symlink a skill directory but require a private mutable settings database to remain local.

New hosts MUST begin as `discovery-required` unless TNF already has verified local/official evidence for their surfaces. ZCode is intentionally in this state pending issue #165.

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
# No mutation
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
9. Do not create a second Turn Zero or user-context provider model.
10. Any host adapter learned from local inspection must be added to the shared registry/protocol with evidence, not kept as chat-only knowledge.

## 10. Product direction

This is intended to become a first-class TNF harness capability: install Claude, Codex, Gemini, Cursor, Kilo, OpenCode, ZCode and future providers while TNF continuously maps resource surfaces, absorbs reusable resources into one governed fabric, detects stale duplicates, and keeps only the thin compatibility material each host genuinely needs.
