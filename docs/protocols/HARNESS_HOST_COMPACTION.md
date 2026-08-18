`[CLASS:PROTOCOL] [STATUS:ACTIVE] [DOC_TYPE:sop] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

# HARNESS_HOST_COMPACTION.md — Vendor Compaction Boundary

**Protocol ID:** TNF_HARNESS_HOST_COMPACTION  
**Version:** 1.0.0  
**Authority:** `HARNESS_CONFIG.md`, UNU two-stage compaction records  
**Runtime:** `scripts/harness/host-compaction-adapter.cjs` ·
`scripts/harness/compaction-record.cjs`

---

## 1. Doctrine

Host LLMs (Cursor / Claude / Codex / …) may compact or drop context **inside**
their own runtime. TNF does **not** claim ownership of those opaque transcripts.
TNF **does** own:

1. A **control-plane receipt** when a compaction boundary is observed or
   declared (`data/harness/host-compaction/*.json`)
2. A linked **compaction record** (`data/harness/compaction/*.json`)
3. Optional **imported transcript snapshots** with sha256 lineage

This keeps Inspect → Act → Verify honest: we never pretend the harness saw the
vendor's full context window.

---

## 2. Commands

```bash
# Boundary receipt (no transcript)
node scripts/harness/host-compaction-adapter.cjs record --host cursor --summary "…"

# Optional export import (operator-provided path only)
node scripts/harness/host-compaction-adapter.cjs import \
  --host cursor --transcript /path/to/export.jsonl

node scripts/harness/host-compaction-adapter.cjs status
node scripts/harness/host-compaction-adapter.cjs verify
node scripts/harness/host-compaction-adapter.cjs discover --host cursor

# Via dispatcher
node scripts/harness/tnf-harness.cjs host-compaction status
```

---

## 3. Verification

`verify` checks adapter ↔ compaction linkage and transcript hash integrity when
a copy exists. `--strict` also fails if zero receipts exist (forces at least one
boundary record in CI-hardened fleets).

Completeness evidence: this protocol + adapter + compaction directories.

---

## 4. Non-goals

- Scraping private host databases or auto-reading Cursor/Claude session stores
- Replacing vendor compaction algorithms
- Guaranteeing token-budget parity across hosts
