# TNF Harness Runtime Data

Machine-readable harness inventory and operational artefacts.

| Path                     | Role                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| `harness-config.json`    | UNU 8-layer inventory + evidence (SOT with `docs/protocols/HARNESS_CONFIG.md`) |
| `permission-policy.json` | Permission berm rules                                                          |
| `memory/entries.jsonl`   | Dynamic retain/recall store                                                    |
| `trajectories/*.jsonl`   | Append-only run trajectories                                                   |
| `compaction/*.json`      | Compaction records                                                             |
| `receipts/`              | Berm / sandbox / memory receipts                                               |

Protocol docs: `docs/protocols/HARNESS_*.md`  
Verify: `node scripts/harness/verify-harness-completeness.cjs`
