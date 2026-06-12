# Journey Integrity Audit

Generated: 2026-06-11T18:42:15.557Z App Base: https://app.thenewfuse.com API
Base: https://api.thenewfuse.com

## Summary

- Route surface mismatch: catalog-not-in-router=0, router-not-in-catalog=0,
  sidebar-not-in-router=0
- Route HTTP sweep: total=221, 200=221, non-200=0
- Fatal shell markers: react185=0, something-went-wrong=0
- Auth gate shell pages detected=0
- API contract probes: total=9, failed=0, 404=0

## Route Surface Drift (Top)

## API Contract Failures

- none

## Non-200 Routes

- none

## Broken Endpoint Usage Footprint

- `/api/agents`: referenced in 19 frontend files (e.g.
  `apps/frontend/src/__tests__/EnhancedWorkflowBuilder.test.tsx`,
  `apps/frontend/src/components/AgentDiscovery/AgentBrowser.tsx`,
  `apps/frontend/src/components/features/AgentHub.tsx`,
  `apps/frontend/src/components/nft/AgentNFTMarketplace.tsx`,
  `apps/frontend/src/components/nft/AgentNFTRevenueDashboard.tsx`)
- `/api/agents/bank/templates`: referenced in 0 frontend files
- `/workspaces`: referenced in 10 frontend files (e.g.
  `apps/frontend/src/ComprehensiveRouter.tsx`,
  `apps/frontend/src/api/workspace.ts`,
  `apps/frontend/src/config/routeCatalog.ts`,
  `apps/frontend/src/config/sidebarNavigation.ts`,
  `apps/frontend/src/config/sitemap.ts`)
- `/resources/templates`: referenced in 3 frontend files (e.g.
  `apps/frontend/src/ComprehensiveRouter.tsx`,
  `apps/frontend/src/config/routeCatalog.ts`,
  `apps/frontend/src/services/resources.service.ts`)
- `/marketplace/catalog`: referenced in 2 frontend files (e.g.
  `apps/frontend/src/services/marketplace.service.ts`,
  `apps/frontend/src/services/resources.service.ts`)
- `/api/auth/login`: referenced in 0 frontend files
