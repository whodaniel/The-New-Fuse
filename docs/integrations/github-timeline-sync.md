# GitHub Timeline Sync

This sync imports a GitHub narrative report into owner-scoped TNF timeline events (`source: github-history-import`).
It now also carries narrative connection edges into imported event payloads for graph-style timeline composition.

## API Endpoint

- `POST /api/timeline/github/import`
- Auth: JWT bearer token (same as TNF app login)
- Body:

```json
{
  "reportPath": "/absolute/path/to/whodaniel-github-history-narrative.json",
  "replaceExisting": false,
  "actor": "github-sync-agent"
}
```

- `GET /api/timeline/github/graph`
- Auth: JWT bearer token (same as TNF app login)
- Query params:
  - `ownerId` (optional)
  - `timelineTrack` (optional)
- Response includes owner-scoped graph summary:
  - `eventCount`, `nodeCount`, `edgeCount`, `generatedAt`, `nodes[]`, `edges[]`

Notes:
- `reportPath` is optional. If omitted, API resolves from:
  - `GITHUB_HISTORY_NARRATIVE_PATH`
  - `${cwd}/github-history/whodaniel-github-history-narrative.json`
  - `${cwd}/../github-history/whodaniel-github-history-narrative.json`
  - `${HOME}/github-history/whodaniel-github-history-narrative.json`
- `replaceExisting=true` removes previously imported `github-history-import` events for the authenticated owner before reimport.

## Local Automation Script

Script:
- `scripts/timeline/import-github-history-to-timeline.mjs`
- `scripts/timeline/generate-github-history-narrative.mjs`

Required env:
- `TNF_AUTH_TOKEN` (or `AUTH_TOKEN`)

Optional env:
- `TNF_TIMELINE_IMPORT_URL` (default `http://127.0.0.1:4000/api/timeline/github/import`)
- `GITHUB_HISTORY_NARRATIVE_PATH`
- `GITHUB_HISTORY_OUTPUT_DIR`
- `GITHUB_HISTORY_LOGIN`

Examples:

```bash
node scripts/timeline/generate-github-history-narrative.mjs
node scripts/timeline/generate-github-history-narrative.mjs --login whodaniel --output-dir /Users/<owner>/github-history
node scripts/timeline/import-github-history-to-timeline.mjs
node scripts/timeline/import-github-history-to-timeline.mjs --report-path /Users/<owner>/github-history/whodaniel-github-history-narrative.json
node scripts/timeline/import-github-history-to-timeline.mjs --replace-existing
node scripts/timeline/import-github-history-to-timeline.mjs --use-home-default
```

## Scheduled GitHub Action

Workflow:
- `.github/workflows/github-history-timeline-sync.yml`

Required repository secrets:
- `TNF_API_URL` (example: `https://api.thenewfuse.com`)
- `TNF_AUTH_TOKEN`

Optional secret:
- `GITHUB_HISTORY_NARRATIVE_PATH` (if API cannot resolve a default report path)
