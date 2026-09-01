# TNF Document Tagging Protocol

`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

## Purpose

Eliminate ambiguity between document families (for example, manuscripts vs.
technical dossiers) by enforcing deterministic header tags and validation.

## Mandatory Header Tags

Every governed markdown unit must include:

> **Note:** A "governed markdown unit" is explicitly defined as the files in the
> `STRICT_FILES` allowlist (e.g. this protocol, the vetting procedure, etc.) and
> any markdown files inside the `docs/library/` directory, as enforced by
> `validate-doc-tagging.cjs`. This does not apply to all markdown files in the
> repository.

- `[CLASS:<value>]`
- `[STATUS:<value>]`
- `[DOC_TYPE:<value>]`
- `[VISIBILITY:<value>]`
- `[CLUSTER_BINDING:<value>]` (Optional: used for JIT Context Injection)

Ownership requirement:

- If `VISIBILITY` is `PRIVATE` or `AGENT_SCOPE`, `[OWNER:<principal>]` is
  mandatory.

## Allowed Values

### CLASS

- `PRIME`
- `INTEL`
- `RAW`
- `SRC`
- `HYBRID`

### STATUS

- `LOCKED`
- `VETTED`
- `PENDING`
- `LEGACY`
- `PURGE`
- `SYNCHRONIZED`

### DOC_TYPE

- `PROTOCOL_STANDARD`
- `PROTOCOL_RUNBOOK`
- `TECHNICAL_DOSSIER`
- `SESSION_SUMMARY`
- `INDEX`
- `BOOK_MANUSCRIPT`
- `STORY_OUTLINE`
- `STORY_CHAPTER`
- `STORY_NOTE`
- `SOURCE_VERBATIM`
- `DATA_SCHEMA`

### VISIBILITY

- `PRIVATE`
- `AGENT_SCOPE`
- `COLLECTIVE`
- `PUBLIC`

## Manuscript-Specific Rule

If `DOC_TYPE` is one of:

- `BOOK_MANUSCRIPT`
- `STORY_OUTLINE`
- `STORY_CHAPTER`
- `STORY_NOTE`

Then `[WORK_ID:<stable_slug>]` is mandatory.

## Canonical Manuscript Registry

- Registry file: `docs/library/REGISTRY.md`
- This registry tracks discoverability and location status even when content is
  intentionally private and not committed.

## Validation Gate

Run:

```bash
pnpm run validate:doc-tagging
```

The validator enforces:

1. Mandatory tags exist.
2. Tag values are valid enums.
3. Owner constraints for private/agent-scoped docs.
4. `WORK_ID` requirement for manuscript doc types.

### CLUSTER_BINDING

Defines which agent clusters (Assembly Line stages) require this document
dynamically injected into their context window at boot.

- `ALL`: Injected globally for all agents.
- `INTAKE`: Cluster 1 (Scouting, Ingestion).
- `SYNTHESIS`: Cluster 2 (Logic, Processing, Engine).
- `MEMORY`: Cluster 4 (Pruning, Archival).
- `NONE` (or omitted): Document is only retrieved via explicit tool search.
