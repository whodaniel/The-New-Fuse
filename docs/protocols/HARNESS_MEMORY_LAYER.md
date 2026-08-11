[CLASS:PROTOCOL] [STATUS:ACTIVE] [DOC_TYPE:sop] [DOMAIN:memory]

# HARNESS_MEMORY_LAYER.md — Dynamic Retain/Recall (≠ MEMORY.md)

**Protocol ID:** TNF_HARNESS_MEMORY_LAYER  
**Version:** 1.0.0  
**Authority:** HARNESS_CONFIG + industry memory-layer practice (retain/recall
separate from static AGENTS/CLAUDE/MEMORY files)

---

## 1. Separation (mandatory)

| Artefact                            | Role                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `docs/core/MEMORY.md`               | **Static** curated long-term facts (procedural / standing decisions). Manually promoted. |
| Session handoff / Living State      | **Operational batons** for continuity — not automatic preference recall.                 |
| `data/harness/memory/entries.jsonl` | **Dynamic memory layer** — retain during work, recall before next turn.                  |

Static markdown is **not** a memory layer. Do not rewrite aliases that collapse
`brain.md` only into MEMORY.md.

---

## 2. Contract

- **retain** — store a durable fact with tags + scope (`global` \| `project` \|
  `session`)
- **recall** — keyword/tag search; returns top matches for injection
- **pin** — mark critical entries that must survive compaction pruning
- **Integrity** — every write appends an audit line; entries are append-mostly
  with tombstone delete

Optional MCP wrappers may front this store later; the CLI is the SOT.

---

## 3. Commands

```bash
node scripts/harness/memory-layer.cjs retain --text "..." --tags harness,redis --scope project
node scripts/harness/memory-layer.cjs recall --query "redis launchd" --limit 5
node scripts/harness/memory-layer.cjs pin --id <entryId>
node scripts/harness/memory-layer.cjs status
```

Store path: `data/harness/memory/entries.jsonl`  
Receipts: `data/harness/receipts/memory-*.json`

---

## 4. Progressive disclosure

Do not dump the entire memory store into Stage A Turn Zero. Recall only what
matches the current task; promote durable consensus into `MEMORY.md` during
heartbeat / Turn End when appropriate.
