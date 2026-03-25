# Zo Competitive Parity Workspace

This directory tracks authenticated Zo crawl data and TNF parity execution.

## Data snapshots

- `crawl-2026-03-24/README.md`
- `crawl-2026-03-24/crawl-summary.json`
- `crawl-2026-03-24/page-index.json`

## Re-run authenticated crawl

Prerequisite: target Zo account is already signed in within an open Google Chrome window on this machine.

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
python3 scripts/competitive/zo_signed_session_crawler.py \
  --start-url "https://whodaniel.zo.computer/?chat=new_ftjvdq" \
  --output-dir /tmp/zo-session-crawl-rerun
```

## Parity implementation anchors

- Route parity map: `apps/frontend/src/config/zoParityFeatures.ts`
- Parity dashboard: `apps/frontend/src/pages/Parity/ZoParityDashboard.tsx`
- Route aliases + mapping: `apps/frontend/src/ComprehensiveRouter.tsx`
- Sidebar coverage: `apps/frontend/src/config/sidebarNavigation.ts`
- Execution plan: `TNF_ZO_PARITY_PLAN.md`
