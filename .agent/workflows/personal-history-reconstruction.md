# Personal History Reconstruction Workflow

## Phase 1: Source Inventory

Collect candidate sources in this order:

1. current repo and git history
2. predecessor repos and project roots
3. exported notes and text artifacts
4. screenshots and videos
5. Apple Notes MCP content when available

## Phase 2: Privacy Gate

Before summarizing:

1. suppress secret-bearing paths
2. suppress files with likely secrets or personal identifiers
3. prefer metadata over content for code and media

## Phase 3: Extraction

Run one of:

- `pnpm tnf:journey:extract`
- `pnpm tnf:journey:extract:local`
- `pnpm tnf:journey:extract:all`

## Phase 4: Clustering

Group evidence into:

- predecessor concepts
- early experiments
- restarts and retools
- naming shifts
- proof points
- convergence into TNF

## Phase 5: Output

Produce:

1. evidence ledger JSON
2. TNF `historical_event` batch JSON
3. markdown summary
4. optional era clustering report

## Phase 6: Validation

Run:

- `node --test scripts/timeline/extract-development-journey-evidence.test.mjs`

Confirm:

- privacy skips are reported
- no sensitive excerpts are emitted
- event counts increase only when broader modes are enabled
