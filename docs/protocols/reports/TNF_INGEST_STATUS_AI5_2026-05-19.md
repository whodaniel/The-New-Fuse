# TNF AI 5 Ingestion Status - 2026-05-19

## As-Of

- UTC: 2026-05-19T05:26:14.655787Z
- Local (America/New_York): 2026-05-19T01:26:14.655787-04:00

## Live Retrieval

- Playlist ID: `PLSdNsZjFbYrUocyjWmVB75W8cZbI0ZmvS`
- Retrieval mode used: fallback authenticated browser scrape (Playwright
  persistent profile)
- Live snapshot file: `data/ai-5-playlist.live-2026-05-19.json`
- Live playlist count: 35
- Snapshot validation:
  - count > 0: `true`
  - all `videoId` non-empty: `true`
  - duplicate `videoId`: `0`

## Manifest Status

- Manifest path: `data/ingestion-runs/ai5-new-may-2026-manifest.json`
- Ingested AI 5 count before action: 31
- Ingested AI 5 count after action: 35

## Delta Before Action

- File: `data/ingestion-runs/ai5-delta-2026-05-19.json`
- missing_in_manifest (4): ["725QE_LNXT4", "9rXH2ssCe9E", "PIdETjcXNIk",
  "VTVRTN8nkxM"]
- extra_in_manifest (0): []

## Action Taken

- Decision: ingest missing AI 5 items.
- Refreshed `data/ai-5-playlist.json` from live snapshot.
- Ran:

```bash
python3 scripts/autonomy/ingest_ai5_and_new_may_notes.py --playlist-json data/ai-5-playlist.json --manifest-path data/ingestion-runs/ai5-new-may-2026-manifest.json --scout-queue-path data/ingestion-runs/ai5-new-may-2026-scout-queue.json --skip-existing
```

- Command result: `attempted=6`, `succeeded=6`, `failed=0`.
- AI 5 videos added this run: 4
- Added AI 5 video IDs: ["725QE_LNXT4", "9rXH2ssCe9E", "PIdETjcXNIk",
  "VTVRTN8nkxM"]

## Verification of Newly Missing IDs

| Video ID      | Present in Manifest | ok   | artifact_id            | stderr |
| ------------- | ------------------- | ---- | ---------------------- | ------ |
| `725QE_LNXT4` | True                | True | `eia-873d57f0974106b9` | ``     |
| `9rXH2ssCe9E` | True                | True | `eia-adc99f01b8e8fe58` | ``     |
| `PIdETjcXNIk` | True                | True | `eia-77f34a86e160d2e2` | ``     |
| `VTVRTN8nkxM` | True                | True | `eia-3741b2651ad71de0` | ``     |

## Delta After Action

- File: `data/ingestion-runs/ai5-delta-2026-05-19-after.json`
- missing_in_manifest (0): []
- extra_in_manifest (0): []

## Failures / Blockers Encountered

- Preferred YouTube API path could not be completed due OAuth client credential
  file missing at:
  - `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/tauri-desktop/src-tauri/credentials/client_secret.json`
- API probe with available token/client pair returned exact error:
  - `invalid_grant`
  - response: `{"error":"invalid_grant","error_description":"Bad Request"}`
- Direct bearer-token probe returned exact error:
  - `401 UNAUTHENTICATED`
  - `Request had invalid authentication credentials` / `Invalid Credentials`

## Exact File Paths Touched

- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ai-5-playlist.live-2026-05-19.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ai-5-playlist.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-delta-2026-05-19.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-new-may-2026-manifest.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-new-may-2026-scout-queue.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-delta-2026-05-19-after.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-25e80879e9d6360a.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-25e80879e9d6360a.md`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-3741b2651ad71de0.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-3741b2651ad71de0.md`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-77f34a86e160d2e2.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-77f34a86e160d2e2.md`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-873d57f0974106b9.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-873d57f0974106b9.md`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-adc99f01b8e8fe58.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-adc99f01b8e8fe58.md`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-da3737b6ae0238dd.json`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/intelligence-artifacts/eia-da3737b6ae0238dd.md`
- `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/protocols/reports/TNF_INGEST_STATUS_AI5_2026-05-19.md`
