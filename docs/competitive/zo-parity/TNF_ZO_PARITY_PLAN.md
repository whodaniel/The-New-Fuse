# TNF <> Zo Feature Parity Plan

Captured from Playwright crawl corpus on **March 25, 2026**.

## What was extracted

- 131 captured pages from `https://whodaniel.zo.computer/?chat=new_ftjvdq`
- 128 unique Zo route paths discovered during crawl traversal
- Core Zo modules discovered: `home`, `channels`, `files`, `skills`, `tools`, `integrations`, `automations`, `space`, `hosting`, `datasets`, `system`, `terminal`, `billing`, `bookmarks`, `settings`
- Crawl artifact index: `docs/competitive/zo-playwright-crawl-20260325/crawl-summary.json`

## TNF parity routing activated

- `/files` -> TNF resources/files surface
- `/channels` -> TNF chat surface alias
- `/chats` -> TNF chat surface
- `/automations` -> TNF workflows
- `/space` -> TNF spaces
- `/skills` -> TNF skills marketplace
- `/tools` -> TNF resources catalog alias
- `/integrations` -> TNF resources catalog alias
- `/models` -> TNF model/API settings alias
- `/hosting` -> TNF spaces/hosting control surface
- `/datasets` -> TNF resource/dataset surface
- `/system` -> TNF system health
- `/terminal` -> TNF terminal visualization
- `/billing` -> TNF membership/billing
- `/bookmarks` -> TNF bookmark management
- `/zo-parity` -> parity status dashboard

## Implementation state

The canonical parity state now lives in:

- `apps/frontend/src/config/zoParityFeatures.ts`
- `apps/frontend/src/pages/Parity/ZoParityDashboard.tsx`

Statuses:

- `implemented`: feature reachable and integrated into navigation/route map
- `partial`: route in place, deeper UX/data parity still required
- `planned`: not yet implemented (none currently marked planned)

## Remaining work for full behavioral parity

1. Add route-level integration tests for Zo alias routes (`/channels`, `/tools`, `/integrations`, `/models`) to prevent regression.
2. Expand Files Workspace into multi-pane file ops (bulk actions + deeper metadata inspection).
3. Expand Datasets Workbench into schema/table authoring and dataset lifecycle actions.
4. Build parity assertion job that compares crawl-discovered top-level Zo routes with TNF alias coverage.
