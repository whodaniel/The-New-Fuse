# Route Surface Matrix

Generated: 2026-03-25T00:29:45.447Z
Parity snapshot: 2026-03-25T00:29:44.401Z

## Summary
- Total paths: 231
- Dynamic paths: 14
- Primary navigation paths: 80
- Hidden routed paths: 90
- Catalog-only paths: 0
- Legacy aliases: 45
- High risk paths: 0
- Unknown exposure paths: 0

## Parity Gate Snapshot
- noSidebarOrphans: true
- noCatalogOrphans: true
- highRiskRoutesCount: 0
- hiddenRoutesCount: 77

## Exposure Counts
- `hidden-route`: 90
- `primary-nav`: 80
- `legacy-alias`: 44
- `redirect-target-only`: 17

## Risk Counts
- `low`: 124
- `medium`: 107

## High Risk Paths
- none

## Matrix
| Path | Exposure | Risk | Router | Sidebar | Catalog | Legacy | Sidebar Labels | Catalog Labels |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `*` `hidden-route` `medium` yes no no - - - |
| `/` `hidden-route` `medium` yes no yes - - Home |
| `/404` `hidden-route` `medium` yes no yes - - 404 Page |
| `/a2a-control` `primary-nav` `low` yes yes yes - A2A Control A2A Control |
| `/about` `hidden-route` `medium` yes no no - - - |
| `/admin` `primary-nav` `low` yes yes yes target Admin Dashboard Admin Panel |
| `/admin/agent-management` `primary-nav` `low` yes yes yes - Agent Management Admin Agent Management |
| `/admin/agents/skills` `primary-nav` `low` yes yes yes - Agent Skills Agent Skills Admin |
| `/admin/agents/web-search` `primary-nav` `low` yes yes yes - Web Search Providers Web Search Selection |
| `/admin/api-analytics` `primary-nav` `low` yes yes yes - API Analytics Admin API Analytics |
| `/admin/audit-logs` `primary-nav` `low` yes yes yes target Audit Logs Admin Audit Logs |
| `/admin/backup-restore` `primary-nav` `low` yes yes yes - Backup & Restore Admin Backup Restore |
| `/admin/configuration` `primary-nav` `low` yes yes yes - Configuration Admin Configuration |
| `/admin/control-panel` `primary-nav` `low` yes yes no - Super Admin Panel - |
| `/admin/dashboard` `legacy-alias` `low` no no yes alias -> /admin - Admin Dashboard |
| `/admin/database` `primary-nav` `low` yes yes yes - Database Admin Database |
| `/admin/experimental-features` `legacy-alias` `low` no no yes alias -> /admin/feature-flags - Experimental Features |
| `/admin/feature-flags` `primary-nav` `low` yes yes yes target Feature Flags Feature Flags |
| `/admin/layout` `primary-nav` `low` yes yes yes - Admin Layout Admin Layout |
| `/admin/marketplace` `primary-nav` `low` yes yes no - Admin Marketplace - |
| `/admin/onboarding` `legacy-alias` `low` no no yes alias -> /admin - Admin Onboarding |
| `/admin/openclaw-security` `primary-nav` `low` yes yes yes - OpenClaw Security Admin OpenClaw Security |
| `/admin/panel` `legacy-alias` `low` no no no alias -> /admin - - |
| `/admin/port-management` `primary-nav` `low` yes yes yes - Port Management Port Management |
| `/admin/settings` `primary-nav` `low` yes yes yes - Admin Settings Admin Settings |
| `/admin/system-health` `primary-nav` `low` yes yes yes - System Health System Health |
| `/admin/system-metrics` `primary-nav` `low` yes yes yes - System Metrics Admin System Metrics |
| `/admin/user-management` `primary-nav` `low` yes yes yes - User Management (Full) Admin User Management |
| `/admin/users` `primary-nav` `low` yes yes yes - Users User Management |
| `/admin/workspaces` `primary-nav` `low` yes yes yes - Workspaces Workspace Management |
| `/agency/dashboard` `hidden-route` `medium` yes no yes - - Agency Dashboard |
| `/agency/onboard` `hidden-route` `medium` yes no yes - - Agency Onboard |
| `/agent-builder` `hidden-route` `medium` yes no yes - - Agent Builder |
| `/agent-management` `hidden-route` `medium` yes no yes - - Agent Management |
| `/agents` `primary-nav` `low` yes yes yes - Agent Fleet, Build All Agents |
| `/agents/:id` `hidden-route` `medium` yes no yes - - Agent Detail |
| `/agents/:id/identity` `hidden-route` `medium` yes no yes - - Agent Identity |
| `/agents/new` `redirect-target-only` `medium` yes no yes target - New Agent |
| `/agents/nft-marketplace` `primary-nav` `low` yes yes yes - NFT Marketplace NFT Marketplace |
| `/agents/onboard` `primary-nav` `low` yes yes yes - Agent Onboarding Agent Onboard |
| `/agents/pfp-prompts` `primary-nav` `low` yes yes no - Legacy Prompt Catalog - |
| `/agents/pfp-studio` `primary-nav` `low` yes yes no - Legacy PFP Studio - |
| `/agents/profiles` `primary-nav` `low` yes yes no - Agent Profiles - |
| `/agents/profiles/:slug` `hidden-route` `medium` yes no no - - - |
| `/agents/revenue-dashboard` `primary-nav` `low` yes yes yes - Revenue Dashboard Revenue Dashboard |
| `/agents/unified-creator` `legacy-alias` `low` no no yes alias -> /agents/new - Unified Agent Creator |
| `/ai-agent-portal` `hidden-route` `medium` yes no yes - - AI Agent Portal Index |
| `/ai-agents` `hidden-route` `medium` yes no yes - - AI Agents Portal Alias |
| `/ai-command-center` `primary-nav` `low` yes yes yes - AI Command Center AI Command Center |
| `/ai-portal` `primary-nav` `low` yes yes yes - AI Portal AI Agent Portal |
| `/ai-portal/pfp-prompts` `primary-nav` `low` yes yes yes - Prompt Catalog AI Portal Prompt Catalog |
| `/ai-portal/pfp-studio` `primary-nav` `low` yes yes yes - PFP Studio AI Portal PFP Studio |
| `/all-pages` `primary-nav` `low` yes yes yes - Surface Map All Pages List |
| `/analytics` `primary-nav` `low` yes yes yes target Analytics Analytics |
| `/api/admin/database` `hidden-route` `medium` yes no yes - - Admin Database API |
| `/api/admin/features` `redirect-target-only` `medium` yes no yes target - Admin Features API |
| `/api/admin/features/:id/evaluate` `legacy-alias` `low` no no yes alias -> /api/admin/features - Feature Evaluation API |
| `/api/docs` `legacy-alias` `low` no no no alias -> /docs - - |
| `/app.html` `hidden-route` `medium` yes no no - - - |
| `/audit-logs` `legacy-alias` `low` no no no alias -> /admin/audit-logs - - |
| `/auth` `hidden-route` `medium` yes no yes - - Auth Index |
| `/auth/callback` `legacy-alias` `low` yes no no alias -> /auth/oauth-callback - - |
| `/auth/forgot-password` `redirect-target-only` `medium` yes no yes target - Forgot Password |
| `/auth/google-callback` `redirect-target-only` `medium` yes no yes target - Google OAuth Callback |
| `/auth/google/callback` `legacy-alias` `low` yes no no alias -> /auth/google-callback - - |
| `/auth/login` `redirect-target-only` `medium` yes no yes target - Auth Login |
| `/auth/oauth-callback` `redirect-target-only` `medium` yes no yes target - OAuth Callback |
| `/auth/register` `redirect-target-only` `medium` yes no yes target - Auth Register |
| `/auth/reset-password` `hidden-route` `medium` yes no yes - - Reset Password |
| `/auth/sso` `hidden-route` `medium` yes no yes - - SSO Authentication |
| `/automations` `primary-nav` `low` yes yes yes - Automations Automations Alias |
| `/billing` `primary-nav` `low` yes yes yes - Billing Billing Alias |
| `/blog` `hidden-route` `medium` yes no yes - - Blog |
| `/bookmarks` `primary-nav` `low` yes yes yes - Bookmarks Bookmarks |
| `/brand` `hidden-route` `medium` yes no yes - - Brand |
| `/build-info` `primary-nav` `low` yes yes yes - Build Info Build Info |
| `/capabilities` `hidden-route` `medium` yes no no - - - |
| `/channels` `legacy-alias` `low` no no no alias -> /command-center - - |
| `/chat` `primary-nav` `low` yes yes yes target Chat Chat |
| `/chat-page` `legacy-alias` `low` no no yes alias -> /chat - Chat Page |
| `/chats` `hidden-route` `medium` yes no yes - - Chats Alias |
| `/command-center` `primary-nav` `low` yes yes yes target Command Center, Control Center Command Center |
| `/community` `redirect-target-only` `medium` yes no yes target - Community |
| `/components` `redirect-target-only` `medium` yes no yes target - UI Components |
| `/components-nav` `legacy-alias` `low` no no yes alias -> /components - Components Navigation |
| `/components-showcase` `hidden-route` `medium` yes no yes - - Components Showcase |
| `/config` `legacy-alias` `low` no no no alias -> /settings - - |
| `/connect` `redirect-target-only` `medium` yes no no target - - |
| `/contact` `hidden-route` `medium` yes no yes - - Contact |
| `/cron-jobs` `legacy-alias` `low` no no no alias -> /tasks - - |
| `/dashboard` `primary-nav` `low` yes yes yes target Overview, Workspace Dashboard |
| `/dashboard/agents` `primary-nav` `low` yes yes yes - Dashboard Agents Agent Dashboard |
| `/dashboard/agents/:id` `hidden-route` `medium` yes no yes - - Agent Detail Dashboard |
| `/dashboard/agents/new` `primary-nav` `low` yes yes yes - Create Dashboard Agent Create Agent |
| `/dashboard/analytics` `primary-nav` `low` yes yes yes - Dashboard Analytics Dashboard Analytics |
| `/dashboard/architecture` `primary-nav` `low` yes yes no - Dashboard Architecture - |
| `/dashboard/logs` `primary-nav` `low` yes yes no - Dashboard Logs - |
| `/dashboard/observability` `primary-nav` `low` yes yes no - Dashboard Observability - |
| `/dashboard/settings` `primary-nav` `low` yes yes yes - Dashboard Settings Dashboard Settings |
| `/datasets` `primary-nav` `low` yes yes yes - Datasets Datasets Workbench |
| `/debug` `primary-nav` `low` yes yes yes - Debug Debug Info |
| `/debug-routing` `hidden-route` `medium` yes no yes - - Debug Routing |
| `/design-system` `hidden-route` `medium` yes no yes - - Design System |
| `/docs` `primary-nav` `low` yes yes yes target Docs Docs |
| `/docs/*` `hidden-route` `medium` yes no yes - - Docs Wildcard |
| `/features` `hidden-route` `medium` yes no no - - - |
| `/files` `primary-nav` `low` yes yes yes - Files Files Workspace |
| `/forgot-password` `legacy-alias` `low` no no no alias -> /auth/forgot-password - - |
| `/frontend-showcase` `hidden-route` `medium` yes no yes - - Frontend Showcase |
| `/general-settings` `redirect-target-only` `medium` yes no yes target - General Settings Alt |
| `/general-settings/community-hub` `legacy-alias` `low` no no yes alias -> /general-settings - Community Hub |
| `/general-settings/embedding` `hidden-route` `medium` yes no yes - - Embedding Preferences |
| `/goals` `hidden-route` `medium` yes no no - - - |
| `/goals/:id` `hidden-route` `medium` yes no no - - - |
| `/graph-demo` `hidden-route` `medium` yes no yes - - Graph Demo |
| `/help/community` `legacy-alias` `low` no no no alias -> /community - - |
| `/help/documentation` `legacy-alias` `low` no no no alias -> /docs - - |
| `/help/faq` `legacy-alias` `low` no no no alias -> /docs - - |
| `/help/support` `legacy-alias` `low` no no no alias -> /support - - |
| `/help/tutorials` `legacy-alias` `low` no no no alias -> /docs - - |
| `/home` `hidden-route` `medium` yes no yes - - Home Alt aka Dev Index |
| `/hosting` `primary-nav` `low` yes yes yes - Hosting Hosting Control Center |
| `/html/admin` `hidden-route` `medium` yes no yes - - HTML Admin |
| `/html/agents` `hidden-route` `medium` yes no yes - - HTML Agents |
| `/html/chat` `hidden-route` `medium` yes no yes - - HTML Chat |
| `/html/dashboard` `hidden-route` `medium` yes no yes - - HTML Dashboard |
| `/html/tasks` `hidden-route` `medium` yes no yes - - HTML Tasks |
| `/html/workflows` `hidden-route` `medium` yes no yes - - HTML Workflows |
| `/hub` `primary-nav` `low` yes yes yes target Knowledge, TNF Hub Modern Hub |
| `/ide` `legacy-alias` `low` no no no alias -> /command-center - - |
| `/instances` `legacy-alias` `low` no no no alias -> /observatory - - |
| `/integrations` `legacy-alias` `low` no no no alias -> /connect - - |
| `/knowledge-hub` `primary-nav` `low` yes yes yes - Knowledge Hub Knowledge Hub |
| `/landing` `redirect-target-only` `medium` yes no yes target - Landing Page |
| `/landing-page` `legacy-alias` `low` no no yes alias -> /landing - Landing Page Alt |
| `/launchpad` `hidden-route` `medium` yes no no - - - |
| `/layout-example` `hidden-route` `medium` yes no yes - - Layout Example |
| `/legal/privacy` `redirect-target-only` `medium` yes no yes target - Privacy Policy |
| `/legal/terms` `redirect-target-only` `medium` yes no yes target - Terms of Service |
| `/live-view` `primary-nav` `low` yes yes yes - Live View Live View |
| `/login` `legacy-alias` `low` yes no yes alias -> /auth/login - Login |
| `/logs` `legacy-alias` `low` no no no alias -> /admin/audit-logs - - |
| `/macro-timeline` `hidden-route` `medium` yes no no - - - |
| `/main` `hidden-route` `medium` yes no yes - - Main Workspace |
| `/marketplace` `primary-nav` `low` yes yes yes - Marketplace Platform Overview |
| `/mcp-hub` `primary-nav` `low` yes yes yes - MCP Hub MCP Hub |
| `/membership` `hidden-route` `medium` yes no no - - - |
| `/multi-agent-chat` `redirect-target-only` `medium` yes no yes target - Multi-Agent Chat |
| `/multi-agent-chat-demo` `hidden-route` `medium` yes no yes - - Multi Agent Chat Demo |
| `/nexus` `primary-nav` `low` yes yes no - Nexus 3D - |
| `/nodes` `legacy-alias` `low` no no no alias -> /observatory - - |
| `/not-found` `hidden-route` `medium` yes no yes - - Not Found |
| `/observatory` `primary-nav` `low` yes yes yes target Observatory Observatory |
| `/onboarding` `hidden-route` `medium` yes no yes - - Onboarding Flow |
| `/onboarding/ai-agent` `hidden-route` `medium` yes no yes - - AI Agent Onboarding |
| `/overview` `legacy-alias` `low` no no no alias -> /dashboard - - |
| `/package/agents` `hidden-route` `medium` yes no yes - - Package Agents |
| `/package/dashboard` `hidden-route` `medium` yes no yes - - Package Dashboard |
| `/package/login` `hidden-route` `medium` yes no yes - - Package Login |
| `/package/workflows` `hidden-route` `medium` yes no yes - - Package Workflows |
| `/perpetual-status` `hidden-route` `medium` yes no no - - - |
| `/plans` `hidden-route` `medium` yes no no - - - |
| `/plans/:id` `hidden-route` `medium` yes no no - - - |
| `/platform` `hidden-route` `medium` yes no no - - - |
| `/preview/onboarding` `hidden-route` `medium` yes no yes - - Onboarding Preview |
| `/pricing` `hidden-route` `medium` yes no yes - - Pricing |
| `/privacy` `legacy-alias` `low` no no no alias -> /legal/privacy - - |
| `/product-map` `hidden-route` `medium` yes no no - - - |
| `/profile` `hidden-route` `medium` yes no yes - - Profile Alias |
| `/register` `legacy-alias` `low` yes no yes alias -> /auth/register - Register |
| `/resources` `primary-nav` `low` yes yes yes target Resources Resources |
| `/sessions` `legacy-alias` `low` no no no alias -> /multi-agent-chat - - |
| `/settings` `primary-nav` `low` yes yes yes target General, Settings Settings |
| `/settings/api` `hidden-route` `medium` yes no yes - - API Settings |
| `/settings/appearance` `hidden-route` `medium` yes no yes - - Appearance Settings |
| `/settings/general` `hidden-route` `medium` yes no yes - - General Settings |
| `/settings/notifications` `hidden-route` `medium` yes no yes - - Notification Settings |
| `/settings/security` `hidden-route` `medium` yes no yes - - Security Settings |
| `/simple-landing` `legacy-alias` `low` no no yes alias -> /landing - Simple Landing |
| `/simple-test` `hidden-route` `medium` yes no yes - - Simple Test |
| `/skills` `primary-nav` `low` yes yes yes alias -> /resources Skills Skills Alias |
| `/sophisticated-hub` `hidden-route` `medium` yes no yes - - Sophisticated Hub |
| `/space` `hidden-route` `medium` yes no yes - - Space Alias |
| `/spaces` `primary-nav` `low` yes yes no - Spaces - |
| `/suggestions` `primary-nav` `low` yes yes yes - Suggestions Suggestions |
| `/suggestions/:id` `hidden-route` `medium` yes no yes - - Suggestion Detail |
| `/suggestions/new` `hidden-route` `medium` yes no yes - - New Suggestion |
| `/support` `redirect-target-only` `medium` yes no yes target - Support |
| `/system` `hidden-route` `medium` yes no yes - - System Alias |
| `/tasks` `primary-nav` `low` yes yes yes target Tasks All Tasks |
| `/tasks-page` `legacy-alias` `low` no no yes alias -> /tasks - Tasks Page |
| `/tasks/:id` `hidden-route` `medium` yes no yes - - Task Detail |
| `/tasks/:id/edit` `hidden-route` `medium` yes no yes - - Edit Task |
| `/tasks/new` `hidden-route` `medium` yes no yes - - New Task |
| `/team` `legacy-alias` `low` no no no alias -> /workspace/members - - |
| `/terminal` `hidden-route` `medium` yes no yes - - Terminal Alias |
| `/terminals` `primary-nav` `low` yes yes no - Terminal Graph - |
| `/terms` `legacy-alias` `low` no no no alias -> /legal/terms - - |
| `/test` `hidden-route` `medium` yes no yes - - Test Page |
| `/timeline` `primary-nav` `low` yes yes no - Timeline - |
| `/timeline-demo` `hidden-route` `medium` yes no yes - - Timeline Demo |
| `/timeline/module` `hidden-route` `medium` yes no no - - - |
| `/tnf-hub` `legacy-alias` `low` no no no alias -> /hub - - |
| `/unauthorized` `hidden-route` `medium` yes no yes - - Unauthorized |
| `/usage` `legacy-alias` `low` no no no alias -> /analytics - - |
| `/user/profile` `hidden-route` `medium` yes no yes - - User Profile |
| `/visualizations` `primary-nav` `low` yes yes no - Viz Hub - |
| `/visualizations/terminals` `hidden-route` `medium` yes no no - - - |
| `/workflows` `primary-nav` `low` yes yes yes target Workflows Workflows |
| `/workflows-enhanced` `hidden-route` `medium` yes no yes - - Enhanced Workflows |
| `/workflows/:id` `hidden-route` `medium` yes no yes - - Workflow Detail |
| `/workflows/:id/execution` `hidden-route` `medium` yes no yes - - Workflow Execution |
| `/workflows/advanced-builder` `primary-nav` `low` yes yes yes - Advanced Builder Advanced Builder |
| `/workflows/builder` `primary-nav` `low` yes yes yes - Workflow Builder Workflow Builder |
| `/workflows/console` `primary-nav` `low` yes yes yes - Execution Console Workflow Console |
| `/workflows/detail` `legacy-alias` `low` yes no yes alias -> /workflows - Workflow Detail Alias |
| `/workflows/execution` `legacy-alias` `low` yes no yes alias -> /workflows/executions - Workflow Execution Alias |
| `/workflows/executions` `primary-nav` `low` yes yes yes target Workflow Runs Execution Monitor |
| `/workflows/templates` `primary-nav` `low` yes yes yes - Workflow Templates Workflow Templates |
| `/workspace` `legacy-alias` `low` no no no alias -> /workspace/overview - - |
| `/workspace-chat` `redirect-target-only` `medium` yes no yes target - Workspace Chat |
| `/workspace-settings/agent-model` `hidden-route` `medium` yes no yes - - Agent Model Selection |
| `/workspace-settings/chat-model` `hidden-route` `medium` yes no yes - - Chat Model Selection |
| `/workspace-settings/llm-selection` `hidden-route` `medium` yes no yes - - Workspace LLM Selection |
| `/workspace/analytics` `hidden-route` `medium` yes no yes - - Workspace Analytics |
| `/workspace/chat` `legacy-alias` `low` no no yes alias -> /workspace-chat - Workspace Chat Index |
| `/workspace/layout` `legacy-alias` `low` no no yes alias -> /workspace/overview - Workspace Layout |
| `/workspace/members` `primary-nav` `low` yes yes yes target Members Workspace Members |
| `/workspace/overview` `primary-nav` `low` yes yes yes target Workspace Home Workspace Overview |
| `/workspace/settings` `primary-nav` `low` yes yes yes - Workspace Settings Workspace Settings |
| `/zo-parity` `primary-nav` `low` yes yes yes - Zo Parity Zo Parity Dashboard |
