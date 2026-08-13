# TNF Dual-Track Sprint Proof — 2026-08-09

Evidence captured during dual-track cohesion + intake execution.

## Track A — Cohesion

| Probe                         | Result      | Notes                                                                                                            |
| ----------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `@the-new-fuse/tnf-cli` build | PASS        | `pnpm --filter @the-new-fuse/tnf-cli build`                                                                      |
| `tnf --version`               | PASS        | reports `1.0.0`                                                                                                  |
| OSS app boundary              | PASS        | `node scripts/packaging/check-oss-app-boundary.cjs` (9 regular OSS apps classified)                              |
| Full-auto soft-fail           | CODE LANDED | `--soft-fail-audits` + `--skip-strict-status` implies soft FAIL*ON*\* so live-link findings do not kill the loop |
| Full-auto once (lightweight)  | PASS        | `ok: true`, duration ~9.3s after escalation clear; state idle                                                    |
| Full-auto state               | RESET       | stale `running`/dead pid cleared; mode `idle` after successful once                                              |
| Supabase DB rotation          | OPERATOR    | Reported already rotated (2026-08-09) — still verify Cloud Run env matches new password before public splash     |

## Track B — Intake

| Probe                       | Result        | Notes                                                                                                                                                                       |
| --------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple Notes delta inventory | PASS          | 77 missing note PKs in `NEW- May-2026` vs prior manifest → `data/ingestion-runs/apple-notes-delta-2026-08-09.json`                                                          |
| Delta ingest                | PASS          | 74 newly ingested this session; manifest `trackedTotal=245`, `failedThisRun=0`                                                                                              |
| Notes activation            | RAN           | `activate_intelligence_actions.py --source-prefixes apple-notes-new-may-2026-` → action queue written; `executionCandidates: []` (dispatch gate still the known bottleneck) |
| Pipeline                    | EXISTING      | `ingest_ai5_and_new_may_notes.py` extended with `--skip-videos`, `--skip-notes`, `--notes-modified-after`                                                                   |
| AI5 videos                  | DEFERRED NEXT | playlist still 37; next wave should extend playlist JSON then re-run with transcripts                                                                                       |

## Hard remaining gates (not closed this session)

1. Clean-machine **rc.2** first-run install retag (historical freeze/build
   failure on rc.1).
2. Confirm Cloud Run `DATABASE_URL` on all four services after rotation.
3. Procedural extraction quality → dispatch-eligible tasks (activation
   bottleneck remains).
4. Keep repo private until git-history secret strategy decided.
