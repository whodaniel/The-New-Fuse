# Journey Integrity Audit

Generated: 2026-05-17T06:05:01.980Z App Base: https://app.thenewfuse.com API
Base: https://api.thenewfuse.com

## Summary

- Route surface mismatch: catalog-not-in-router=0, router-not-in-catalog=0,
  sidebar-not-in-router=0
- Route HTTP sweep: total=220, 200=218, non-200=2
- Fatal shell markers: react185=0, something-went-wrong=0
- Auth gate shell pages detected=0
- API contract probes: total=9, failed=7, 404=7

## Route Surface Drift (Top)

## API Contract Failures

- App auth compat login: status=404
  url=`https://app.thenewfuse.com/api/auth/login`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T06:04:59.947Z","path":"/api/auth/login","method":"POST","message":"Cannot POST /api/auth/login","error":"Not Found"}`
- App agents list: status=404 url=`https://app.thenewfuse.com/api/agents`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T06:05:00.411Z","path":"/api/agents","method":"GET","message":"Cannot GET /api/agents","error":"Not Found"}`
- App agent template bank: status=404
  url=`https://app.thenewfuse.com/api/agents/bank/templates`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T06:05:00.475Z","path":"/api/agents/bank/templates","method":"GET","message":"Cannot GET /api/agents/bank/templates","error":"Not Found"}`
- API workspaces list: status=404
  url=`https://api.thenewfuse.com/api/workspaces`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T06:05:00.540Z","path":"/api/workspaces","method":"GET","message":"Cannot GET /api/workspaces","error":"Not Found"}`
- API current workspace: status=404
  url=`https://api.thenewfuse.com/api/workspaces/current`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T06:05:00.723Z","path":"/api/workspaces/current","method":"GET","message":"Cannot GET /api/workspaces/current","error":"Not Found"}`
- API resources templates: status=404
  url=`https://api.thenewfuse.com/api/resources/templates`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T06:05:00.794Z","path":"/api/resources/templates","method":"GET","message":"Cannot GET /api/resources/templates","error":"Not Found"}`
- API marketplace catalog: status=404
  url=`https://api.thenewfuse.com/api/marketplace/catalog?status=published`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T06:05:00.869Z","path":"/api/marketplace/catalog?status=published","method":"GET","message":"Cannot GET /api/marketplace/catalog?status=published","error":"Not Found"}`

## Non-200 Routes

- `/api/admin/database` status=404
  final=`https://app.thenewfuse.com/api/admin/database`
- `/api/admin/features` status=404
  final=`https://app.thenewfuse.com/api/admin/features`

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
