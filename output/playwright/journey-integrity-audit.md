# Journey Integrity Audit

Generated: 2026-05-17T04:45:27.131Z App Base: https://app.thenewfuse.com API
Base: https://api.thenewfuse.com

## Summary

- Route surface mismatch: catalog-not-in-router=30, router-not-in-catalog=51,
  sidebar-not-in-router=3
- Route HTTP sweep: total=174, 200=172, non-200=2
- Fatal shell markers: react185=0, something-went-wrong=0
- Auth gate shell pages detected=0
- API contract probes: total=9, failed=7, 404=7

## Route Surface Drift (Top)

- Sidebar not in router: `/workflows/nexus?layer=lexicon`
- Sidebar not in router: `/workflows/nexus?layer=memory`
- Sidebar not in router: `/workflows/nexus?layer=topology&from=observatory`
- Catalog not in router: `/admin/dashboard`
- Catalog not in router: `/admin/experimental-features`
- Catalog not in router: `/admin/onboarding`
- Catalog not in router: `/agents/unified-creator`
- Catalog not in router: `/ambassador`
- Catalog not in router: `/api/admin/features/:id/evaluate`
- Catalog not in router: `/automations`
- Catalog not in router: `/bookmarks`
- Catalog not in router: `/careers`
- Catalog not in router: `/channels`
- Catalog not in router: `/chat-page`
- Catalog not in router: `/chats`
- Catalog not in router: `/comparisons`
- Catalog not in router: `/components-nav`
- Catalog not in router: `/datasets`
- Catalog not in router: `/faq`
- Catalog not in router: `/files`
- Catalog not in router: `/general-settings/community-hub`
- Catalog not in router: `/integrations`
- Catalog not in router: `/landing-page`
- Router not in catalog: `*`
- Router not in catalog: `/3d-library`
- Router not in catalog: `/about`
- Router not in catalog: `/admin/control-panel`
- Router not in catalog: `/admin/marketplace`
- Router not in catalog: `/agents/catalog/:id`
- Router not in catalog: `/agents/create`
- Router not in catalog: `/agents/pfp-catalog`
- Router not in catalog: `/agents/pfp-prompts`
- Router not in catalog: `/agents/pfp-studio`
- Router not in catalog: `/app`
- Router not in catalog: `/auth/callback`
- Router not in catalog: `/auth/google/callback`
- Router not in catalog: `/capabilities`
- Router not in catalog: `/codebase-map`
- Router not in catalog: `/dashboard/architecture`
- Router not in catalog: `/dashboard/calendar`
- Router not in catalog: `/dashboard/command-center`
- Router not in catalog: `/dashboard/datasets`
- Router not in catalog: `/dashboard/fairtable`

## API Contract Failures

- App auth compat login: status=404
  url=`https://app.thenewfuse.com/api/auth/login`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T04:45:24.670Z","path":"/api/auth/login","method":"POST","message":"Cannot POST /api/auth/login","error":"Not Found"}`
- App agents list: status=404 url=`https://app.thenewfuse.com/api/agents`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T04:45:25.133Z","path":"/api/agents","method":"GET","message":"Cannot GET /api/agents","error":"Not Found"}`
- App agent template bank: status=404
  url=`https://app.thenewfuse.com/api/agents/bank/templates`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T04:45:25.216Z","path":"/api/agents/bank/templates","method":"GET","message":"Cannot GET /api/agents/bank/templates","error":"Not Found"}`
- API workspaces list: status=404 url=`https://api.thenewfuse.com/workspaces`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T04:45:25.299Z","path":"/workspaces","method":"GET","message":"Cannot GET /workspaces","error":"Not Found"}`
- API current workspace: status=404
  url=`https://api.thenewfuse.com/workspaces/current`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T04:45:25.479Z","path":"/workspaces/current","method":"GET","message":"Cannot GET /workspaces/current","error":"Not Found"}`
- API resources templates: status=404
  url=`https://api.thenewfuse.com/resources/templates`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T04:45:25.551Z","path":"/resources/templates","method":"GET","message":"Cannot GET /resources/templates","error":"Not Found"}`
- API marketplace catalog: status=404
  url=`https://api.thenewfuse.com/marketplace/catalog?status=published`
  snippet=`{"statusCode":404,"timestamp":"2026-05-17T04:45:25.624Z","path":"/marketplace/catalog?status=published","method":"GET","message":"Cannot GET /marketplace/catalog?status=published","error":"Not Found"}`

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
- `/resources/templates`: referenced in 2 frontend files (e.g.
  `apps/frontend/src/ComprehensiveRouter.tsx`,
  `apps/frontend/src/services/resources.service.ts`)
- `/marketplace/catalog`: referenced in 2 frontend files (e.g.
  `apps/frontend/src/services/marketplace.service.ts`,
  `apps/frontend/src/services/resources.service.ts`)
- `/api/auth/login`: referenced in 0 frontend files
