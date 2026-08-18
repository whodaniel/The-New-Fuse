[CLASS:PROTOCOL] [STATUS:ACTIVE] [DOC_TYPE:sop] [DOMAIN:observability]

# HARNESS_TRAJECTORY.md — Trajectory Retention + Compaction Records

**Protocol ID:** TNF_HARNESS_TRAJECTORY  
**Version:** 1.0.0  
**Authority:** UNU harness patterns (persist trajectories; compaction outputs as
records)

---

## 1. Purpose

Trajectories are ordered sequences of model responses, tool calls, and tool
results for a run. They are debugging artefacts, audit logs, and (where
consented) training signal. **Persistence is a design choice**, not a side
effect.

Compaction summaries are **operational records**, not disposable working memory.
When the host LLM (Cursor/Claude) performs opaque vendor compaction, TNF still
records a **TNF-side compaction receipt** documenting what was dropped or
summarized at the control-plane boundary.

---

## 2. Storage

| Path                                      | Contents                                          |
| ----------------------------------------- | ------------------------------------------------- |
| `data/harness/trajectories/<runId>.jsonl` | Append-only trajectory events                     |
| `data/harness/compaction/<recordId>.json` | Compaction record (cheap pass / LLM summary meta) |
| `docs/operations/tnf-harness-cycle.jsonl` | Existing harness master-cycle receipts            |

---

## 3. Commands

```bash
node scripts/harness/trajectory.cjs start --task "..."
node scripts/harness/trajectory.cjs append --run <runId> --type tool_call --payload '{"name":"..."}'
node scripts/harness/trajectory.cjs end --run <runId> --status ok
node scripts/harness/trajectory.cjs list

node scripts/harness/compaction-record.cjs write \
  --run <runId> --stage cheap_clearance \
  --summary "Dropped stale tool outputs above 8k chars"
```

---

## 4. Opacity risk (honest)

TNF does **not** claim ownership of Cursor/Claude internal transcript
compaction. Layer status stays `partial` in `harness-config.json` until a host
adapter exports full transcripts. What TNF _does_ own: handoff batons, harness
cycle logs, memory-layer entries, and explicit compaction **records** written by
operators/agents at the control plane.
