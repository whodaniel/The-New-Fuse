# Navigation Integrity Report

Generated on: 2026-02-18T12:30:55.172Z

## Summary

- Total routes defined: 316
- Total navigation links: 193
- Broken links: 22
- Orphaned routes: 258

## Broken Links

The following links point to undefined routes:

| Link Target                       | Source File                         |
| --------------------------------- | ----------------------------------- |
| `/forgot-password`                | pages/Login.tsx                     |
| `/docs/getting-started`           | pages/Docs.tsx                      |
| `/docs/api`                       | pages/Docs.tsx                      |
| `/docs/tutorials`                 | pages/Docs.tsx                      |
| `/workspace`                      | pages/workspace/Settings.tsx        |
| `/dashboard/monitoring`           | pages/dashboard/index.tsx           |
| `/workspace`                      | pages/auth/Register/index.tsx       |
| `/ide`                            | pages/Hub/SophisticatedTNFHub.tsx   |
| `/workflows/new`                  | pages/Hub/SophisticatedTNFHub.tsx   |
| `/agents/create`                  | pages/Agents/NFTMarketplacePage.tsx |
| `/docs/ai-agents/getting-started` | pages/AIAgentPortal/index.tsx       |
| `/docs/ai-agents/api-reference`   | pages/AIAgentPortal/index.tsx       |
| `/help/support`                   | layouts/HelpLayout.tsx              |
| `/features`                       | components/layout/LandingFooter.tsx |
| `/integrations`                   | components/layout/LandingFooter.tsx |
| `/legal/privacy-policy`           | components/layout/LandingFooter.tsx |
| `/legal/terms-of-service`         | components/layout/LandingFooter.tsx |
| `/legal/cookies`                  | components/layout/LandingFooter.tsx |
| `/legal/privacy-policy`           | components/layout/Footer.tsx        |
| `/legal/terms-of-service`         | components/layout/Footer.tsx        |
| `/legal/privacy-policy`           | components/layout/Footer/index.tsx  |
| `/legal/terms-of-service`         | components/layout/Footer/index.tsx  |

## Orphaned Routes

The following routes are not linked to from anywhere in the codebase:

| Route                                                           | Component                 | File                    |
| --------------------------------------------------------------- | ------------------------- | ----------------------- |
| `/home`                                                         | <AllPages />              | ComprehensiveRouter.tsx |
| `/ai-agents`                                                    | <AIAgentRegistration />   | ComprehensiveRouter.tsx |
| `/agent-builder`                                                | <UnifiedAgentCreator />   | ComprehensiveRouter.tsx |
| `/agent-management`                                             | <AgentsPage />            | ComprehensiveRouter.tsx |
| `/agents/:id`                                                   | <AgentDetail />           | ComprehensiveRouter.tsx |
| `/agents/:id/identity`                                          | <AgentIdentity />         | ComprehensiveRouter.tsx |
| `/command-center`                                               |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/agents/onboard`                                               |
| <Suspense fallback={<LoadingFallback name="Agent Onboarding" /> | ComprehensiveRouter.tsx   |
| `/agents/revenue-dashboard`                                     | <RevenueDashboardPage />  | ComprehensiveRouter.tsx |
| `/workspace/analytics`                                          | <WorkspaceAnalytics />    | ComprehensiveRouter.tsx |
| `/workspace/settings`                                           | <WorkspaceSettings />     | ComprehensiveRouter.tsx |
| `/workflows/executions`                                         | <WorkflowExecutionPage /> | ComprehensiveRouter.tsx |
| `/workflows/:id`                                                | <WorkflowDetailPage />    | ComprehensiveRouter.tsx |
| `/workflows/:id/execution`                                      | <WorkflowExecutionPage /> | ComprehensiveRouter.tsx |
| `/workflows/console`                                            | <ExecutionConsole />      | ComprehensiveRouter.tsx |
| `/workflows/advanced-builder`                                   | <WorkflowEditorWrapper /> | ComprehensiveRouter.tsx |
| `/workflows-enhanced`                                           | <WorkflowsEnhancedPage /> | ComprehensiveRouter.tsx |
| `/workflows/detail`                                             | <WorkflowDetailPage />    | ComprehensiveRouter.tsx |
| `/workflows/execution`                                          | <WorkflowExecutionPage /> | ComprehensiveRouter.tsx |
| `/admin`                                                        |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/user-management`                                        |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/system-metrics`                                         |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/database`                                               |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/api-analytics`                                          |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/configuration`                                          |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/backup-restore`                                         |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/feature-flags`                                          |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/port-management`                                        |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/workspaces`                                             |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/settings`                                               |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/admin/openclaw-security`                                      |
| <RequirePermission roles={['SUPER_ADMIN']                       | ComprehensiveRouter.tsx   |
| `/a2a-control`                                                  | <A2AControl />            | ComprehensiveRouter.tsx |
| `/settings/general`                                             | <GeneralSettings />       | ComprehensiveRouter.tsx |
| `/timeline-demo`                                                | <TimelineDemo />          | ComprehensiveRouter.tsx |
| `/graph-demo`                                                   | <GraphDemo />             | ComprehensiveRouter.tsx |
| `/frontend-showcase`                                            | <FrontendShowcasePage />  | ComprehensiveRouter.tsx |
| `/debug`                                                        |

                  <RequireAuth>
                    <DebugPageComponent />
                  </RequireAuth>
                 | ComprehensiveRouter.tsx |

| `/build-info` | <BuildInfoPage /> | ComprehensiveRouter.tsx | |
`/debug-routing` | <DebugRoutingComponent /> | ComprehensiveRouter.tsx | |
`/suggestions/:id` | <SuggestionDetailPage /> | ComprehensiveRouter.tsx | |
`/auth` | <AuthIndexPage /> | ComprehensiveRouter.tsx | | `/auth/reset-password`
| <ResetPasswordPage /> | ComprehensiveRouter.tsx | | `/auth/sso` | <SSOPage />
| ComprehensiveRouter.tsx | | `/auth/google-callback` | <GoogleCallbackPage /> |
ComprehensiveRouter.tsx | | `/auth/oauth-callback` | <OAuthCallbackPage /> |
ComprehensiveRouter.tsx | | `/auth/unstoppable-callback` |
<UnstoppableDomainsCallbackPage /> | ComprehensiveRouter.tsx | | `/landing` |
<LandingRevolutionPage /> | ComprehensiveRouter.tsx | | `/contact` |
<SupportPage /> | ComprehensiveRouter.tsx | | `/onboarding` |
<OnboardingFlowPage /> | ComprehensiveRouter.tsx | | `/docs/*` | <DocsPage /> |
ComprehensiveRouter.tsx | | `/brand` | <BrandIdentityPage /> |
ComprehensiveRouter.tsx | | `/design-system` | <BrandIdentityPage /> |
ComprehensiveRouter.tsx | | `/workspace-chat` | <WorkspaceChatPage /> |
ComprehensiveRouter.tsx | | `/tasks/:id` | <TaskDetailPage /> |
ComprehensiveRouter.tsx | | `/tasks/:id/edit` | <TaskEditPage /> |
ComprehensiveRouter.tsx | | `/dashboard/agents/:id` | <AgentDetail /> |
ComprehensiveRouter.tsx | | `/settings/appearance` | <SettingsAppearance /> |
ComprehensiveRouter.tsx | | `/settings/notifications` |
<SettingsNotifications /> | ComprehensiveRouter.tsx | | `/settings/security` |
<SettingsSecurity /> | ComprehensiveRouter.tsx | | `/general-settings` |
<GeneralSettings /> | ComprehensiveRouter.tsx | | `/general-settings/embedding`
| <GeneralSettingsEmbeddingPage /> | ComprehensiveRouter.tsx | | `/simple-test`
| <SimpleTestPage /> | ComprehensiveRouter.tsx | | `/test` | <TestPage /> |
ComprehensiveRouter.tsx | | `/unauthorized` | <UnauthorizedPage /> |
ComprehensiveRouter.tsx | | `/ai-agent-portal` | <AIAgentRegistration /> |
ComprehensiveRouter.tsx | | `/components-showcase` | <ComponentsShowcase /> |
ComprehensiveRouter.tsx | | `/not-found` | <NotFound /> |
ComprehensiveRouter.tsx | | `/preview/onboarding` | <OnboardingPreviewPage /> |
ComprehensiveRouter.tsx | | `/workspace-settings/llm-selection` |
<WorkspaceLLMSelectionPage /> | ComprehensiveRouter.tsx | |
`/workspace-settings/chat-model` | <WorkspaceLLMSelectionPage /> |
ComprehensiveRouter.tsx | | `/workspace-settings/agent-model` |
<AgentModelSelectionPage provider="default" workspace={{ agentModel: 'default' |
ComprehensiveRouter.tsx | | `/admin/agents/skills` | <AdminAgentSkillsPage /> |
ComprehensiveRouter.tsx | | `/admin/agents/web-search` | <Suspense
fallback={<LoadingFallback name="Web Search Selection" /> |
ComprehensiveRouter.tsx | | `/main` | <MainPage /> | ComprehensiveRouter.tsx | |
`/admin/layout` | <LazyPage name="Admin Layout" path="/admin/layout" /> |
ComprehensiveRouter.tsx | | `/multi-agent-chat-demo` | <MultiAgentChat /> |
ComprehensiveRouter.tsx | | `/api/admin/database` |
<LazyPage name="Admin Database API" path="/api/admin/database" /> |
ComprehensiveRouter.tsx | | `/api/admin/features` |
<LazyPage name="Admin Features API" path="/api/admin/features" /> |
ComprehensiveRouter.tsx | | `/package/dashboard` |
<LazyPage name="Package Dashboard" path="/package/dashboard" /> |
ComprehensiveRouter.tsx | | `/package/login` |
<LazyPage name="Package Login" path="/package/login" /> |
ComprehensiveRouter.tsx | | `/package/agents` |
<LazyPage name="Package Agents" path="/package/agents" /> |
ComprehensiveRouter.tsx | | `/package/workflows` |
<LazyPage name="Package Workflows" path="/package/workflows" /> |
ComprehensiveRouter.tsx | | `/html/dashboard` |
<LazyPage name="HTML Dashboard Prototype" path="/html/dashboard" /> |
ComprehensiveRouter.tsx | | `/html/admin` |
<LazyPage name="HTML Admin Prototype" path="/html/admin" /> |
ComprehensiveRouter.tsx | | `/html/agents` |
<LazyPage name="HTML Agents Prototype" path="/html/agents" /> |
ComprehensiveRouter.tsx | | `/html/chat` |
<LazyPage name="HTML Chat Prototype" path="/html/chat" /> |
ComprehensiveRouter.tsx | | `/html/tasks` |
<LazyPage name="HTML Tasks Prototype" path="/html/tasks" /> |
ComprehensiveRouter.tsx | | `/html/workflows` |
<LazyPage name="HTML Workflows Prototype" path="/html/workflows" /> |
ComprehensiveRouter.tsx | | `/404` | <Suspense
fallback={<LoadingFallback name="Page Not Found" /> | ComprehensiveRouter.tsx |
| `*` | <div className="p-8 text-center">
<h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
<p className="text-gray-600 mb-4"> The page you are looking for does not exist.
</p> <Link
                      to="/"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    > Go Home </Link> </div> | ComprehensiveRouter.tsx | | `/` |
<WorkflowsPage /> | routes/WorkflowRoutes.tsx | | `/builder` | <ModernBuilder />
| routes/WorkflowRoutes.tsx | | `/builder/:id` | <ModernBuilder /> |
routes/WorkflowRoutes.tsx | | `/legacy-builder` | <WorkflowBuilder /> |
routes/WorkflowRoutes.tsx | | `/legacy-builder/:id` | <WorkflowBuilder /> |
routes/WorkflowRoutes.tsx | | `/:id` | <WorkflowDetail /> |
routes/WorkflowRoutes.tsx | | `/:id/execution` | <WorkflowExecution /> |
routes/WorkflowRoutes.tsx | | `/executions/:executionId` | <WorkflowExecution />
| routes/WorkflowRoutes.tsx | | `/templates` | <WorkflowTemplates /> |
routes/WorkflowRoutes.tsx | | `/templates/:templateId` | <WorkflowTemplates /> |
routes/WorkflowRoutes.tsx | | `*` | <WorkflowsPage /> |
routes/WorkflowRoutes.tsx | | `/` | Unknown | config/routeCatalog.ts | |
`/dashboard` | Unknown | config/routeCatalog.ts | | `/home` | Unknown |
config/routeCatalog.ts | | `/multi-agent-chat` | Unknown |
config/routeCatalog.ts | | `/ai-portal` | Unknown | config/routeCatalog.ts | |
`/ai-agent-portal` | Unknown | config/routeCatalog.ts | | `/chat` | Unknown |
config/routeCatalog.ts | | `/chat-page` | Unknown | config/routeCatalog.ts | |
`/ai-command-center` | Unknown | config/routeCatalog.ts | | `/live-view` |
Unknown | config/routeCatalog.ts | | `/agents` | Unknown |
config/routeCatalog.ts | | `/agents/new` | Unknown | config/routeCatalog.ts | |
`/agents/:id` | Unknown | config/routeCatalog.ts | | `/agents/nft-marketplace` |
Unknown | config/routeCatalog.ts | | `/agents/revenue-dashboard` | Unknown |
config/routeCatalog.ts | | `/agents/unified-creator` | Unknown |
config/routeCatalog.ts | | `/dashboard/agents` | Unknown |
config/routeCatalog.ts | | `/dashboard/agents/new` | Unknown |
config/routeCatalog.ts | | `/dashboard/agents/:id` | Unknown |
config/routeCatalog.ts | | `/sophisticated-hub` | Unknown |
config/routeCatalog.ts | | `/hub` | Unknown | config/routeCatalog.ts | |
`/a2a-control` | Unknown | config/routeCatalog.ts | | `/knowledge-hub` | Unknown
| config/routeCatalog.ts | | `/mcp-hub` | Unknown | config/routeCatalog.ts | |
`/workspace/overview` | Unknown | config/routeCatalog.ts | |
`/workspace/analytics` | Unknown | config/routeCatalog.ts | |
`/workspace/members` | Unknown | config/routeCatalog.ts | |
`/workspace/settings` | Unknown | config/routeCatalog.ts | | `/workspace-chat` |
Unknown | config/routeCatalog.ts | | `/workspace/chat` | Unknown |
config/routeCatalog.ts | | `/workspace/layout` | Unknown |
config/routeCatalog.ts | | `/tasks` | Unknown | config/routeCatalog.ts | |
`/tasks/new` | Unknown | config/routeCatalog.ts | | `/tasks/:id` | Unknown |
config/routeCatalog.ts | | `/tasks/:id/edit` | Unknown | config/routeCatalog.ts
| | `/tasks-page` | Unknown | config/routeCatalog.ts | | `/workflows` | Unknown
| config/routeCatalog.ts | | `/workflows/builder` | Unknown |
config/routeCatalog.ts | | `/workflows/advanced-builder` | Unknown |
config/routeCatalog.ts | | `/workflows/templates` | Unknown |
config/routeCatalog.ts | | `/workflows/:id` | Unknown | config/routeCatalog.ts |
| `/workflows/:id/execution` | Unknown | config/routeCatalog.ts | |
`/workflows/executions` | Unknown | config/routeCatalog.ts | |
`/workflows-enhanced` | Unknown | config/routeCatalog.ts | | `/suggestions` |
Unknown | config/routeCatalog.ts | | `/suggestions/new` | Unknown |
config/routeCatalog.ts | | `/suggestions/:id` | Unknown | config/routeCatalog.ts
| | `/admin` | Unknown | config/routeCatalog.ts | | `/admin/users` | Unknown |
config/routeCatalog.ts | | `/admin/workspaces` | Unknown |
config/routeCatalog.ts | | `/admin/system-health` | Unknown |
config/routeCatalog.ts | | `/admin/feature-flags` | Unknown |
config/routeCatalog.ts | | `/admin/port-management` | Unknown |
config/routeCatalog.ts | | `/admin/settings` | Unknown | config/routeCatalog.ts
| | `/admin/onboarding` | Unknown | config/routeCatalog.ts | | `/admin/layout` |
Unknown | config/routeCatalog.ts | | `/admin/experimental-features` | Unknown |
config/routeCatalog.ts | | `/admin/agents/skills` | Unknown |
config/routeCatalog.ts | | `/admin/agents/web-search` | Unknown |
config/routeCatalog.ts | | `/dashboard/analytics` | Unknown |
config/routeCatalog.ts | | `/dashboard/settings` | Unknown |
config/routeCatalog.ts | | `/analytics` | Unknown | config/routeCatalog.ts | |
`/settings` | Unknown | config/routeCatalog.ts | | `/settings/general` | Unknown
| config/routeCatalog.ts | | `/settings/appearance` | Unknown |
config/routeCatalog.ts | | `/settings/notifications` | Unknown |
config/routeCatalog.ts | | `/settings/security` | Unknown |
config/routeCatalog.ts | | `/settings/api` | Unknown | config/routeCatalog.ts |
| `/general-settings` | Unknown | config/routeCatalog.ts | |
`/general-settings/embedding` | Unknown | config/routeCatalog.ts | |
`/general-settings/community-hub` | Unknown | config/routeCatalog.ts | |
`/workspace-settings/llm-selection` | Unknown | config/routeCatalog.ts | |
`/workspace-settings/chat-model` | Unknown | config/routeCatalog.ts | |
`/workspace-settings/agent-model` | Unknown | config/routeCatalog.ts | |
`/login` | Unknown | config/routeCatalog.ts | | `/register` | Unknown |
config/routeCatalog.ts | | `/auth/login` | Unknown | config/routeCatalog.ts | |
`/auth/register` | Unknown | config/routeCatalog.ts | | `/auth` | Unknown |
config/routeCatalog.ts | | `/auth/sso` | Unknown | config/routeCatalog.ts | |
`/auth/google-callback` | Unknown | config/routeCatalog.ts | |
`/auth/oauth-callback` | Unknown | config/routeCatalog.ts | |
`/auth/forgot-password` | Unknown | config/routeCatalog.ts | |
`/auth/reset-password` | Unknown | config/routeCatalog.ts | | `/unauthorized` |
Unknown | config/routeCatalog.ts | | `/landing` | Unknown |
config/routeCatalog.ts | | `/landing-page` | Unknown | config/routeCatalog.ts |
| `/simple-landing` | Unknown | config/routeCatalog.ts | | `/onboarding` |
Unknown | config/routeCatalog.ts | | `/preview/onboarding` | Unknown |
config/routeCatalog.ts | | `/legal/privacy` | Unknown | config/routeCatalog.ts |
| `/legal/terms` | Unknown | config/routeCatalog.ts | | `/components` | Unknown
| config/routeCatalog.ts | | `/components-nav` | Unknown |
config/routeCatalog.ts | | `/components-showcase` | Unknown |
config/routeCatalog.ts | | `/timeline-demo` | Unknown | config/routeCatalog.ts |
| `/graph-demo` | Unknown | config/routeCatalog.ts | | `/frontend-showcase` |
Unknown | config/routeCatalog.ts | | `/layout-example` | Unknown |
config/routeCatalog.ts | | `/simple-test` | Unknown | config/routeCatalog.ts | |
`/multi-agent-chat-demo` | Unknown | config/routeCatalog.ts | | `/debug` |
Unknown | config/routeCatalog.ts | | `/build-info` | Unknown |
config/routeCatalog.ts | | `/debug-routing` | Unknown | config/routeCatalog.ts |
| `/all-pages` | Unknown | config/routeCatalog.ts | | `/test` | Unknown |
config/routeCatalog.ts | | `/api/admin/database` | Unknown |
config/routeCatalog.ts | | `/api/admin/features` | Unknown |
config/routeCatalog.ts | | `/api/admin/features/:id/evaluate` | Unknown |
config/routeCatalog.ts | | `/404` | Unknown | config/routeCatalog.ts | |
`/not-found` | Unknown | config/routeCatalog.ts | | `/package/dashboard` |
Unknown | config/routeCatalog.ts | | `/package/login` | Unknown |
config/routeCatalog.ts | | `/package/agents` | Unknown | config/routeCatalog.ts
| | `/package/workflows` | Unknown | config/routeCatalog.ts | | `/user/profile`
| Unknown | config/routeCatalog.ts | | `/html/dashboard` | Unknown |
config/routeCatalog.ts | | `/html/admin` | Unknown | config/routeCatalog.ts | |
`/html/agents` | Unknown | config/routeCatalog.ts | | `/html/chat` | Unknown |
config/routeCatalog.ts | | `/html/tasks` | Unknown | config/routeCatalog.ts | |
`/html/workflows` | Unknown | config/routeCatalog.ts | |
`/admin/agent-management` | Unknown | config/routeCatalog.ts | |
`/admin/api-analytics` | Unknown | config/routeCatalog.ts | |
`/admin/audit-logs` | Unknown | config/routeCatalog.ts | |
`/admin/backup-restore` | Unknown | config/routeCatalog.ts | |
`/admin/configuration` | Unknown | config/routeCatalog.ts | | `/admin/database`
| Unknown | config/routeCatalog.ts | | `/admin/openclaw-security` | Unknown |
config/routeCatalog.ts | | `/admin/system-metrics` | Unknown |
config/routeCatalog.ts | | `/admin/user-management` | Unknown |
config/routeCatalog.ts | | `/agency/dashboard` | Unknown |
config/routeCatalog.ts | | `/agency/onboard` | Unknown | config/routeCatalog.ts
| | `/agent-builder` | Unknown | config/routeCatalog.ts | | `/agent-management`
| Unknown | config/routeCatalog.ts | | `/agents/:id/identity` | Unknown |
config/routeCatalog.ts | | `/agents/onboard` | Unknown | config/routeCatalog.ts
| | `/ai-agents` | Unknown | config/routeCatalog.ts | |
`/auth/unstoppable-callback` | Unknown | config/routeCatalog.ts | | `/blog` |
Unknown | config/routeCatalog.ts | | `/brand` | Unknown | config/routeCatalog.ts
| | `/command-center` | Unknown | config/routeCatalog.ts | | `/community` |
Unknown | config/routeCatalog.ts | | `/contact` | Unknown |
config/routeCatalog.ts | | `/design-system` | Unknown | config/routeCatalog.ts |
| `/docs` | Unknown | config/routeCatalog.ts | | `/docs/*` | Unknown |
config/routeCatalog.ts | | `/main` | Unknown | config/routeCatalog.ts | |
`/observatory` | Unknown | config/routeCatalog.ts | | `/onboarding/ai-agent` |
Unknown | config/routeCatalog.ts | | `/pricing` | Unknown |
config/routeCatalog.ts | | `/profile` | Unknown | config/routeCatalog.ts | |
`/resources` | Unknown | config/routeCatalog.ts | | `/support` | Unknown |
config/routeCatalog.ts | | `/workflows/console` | Unknown |
config/routeCatalog.ts | | `/workflows/detail` | Unknown |
config/routeCatalog.ts | | `/workflows/execution` | Unknown |
config/routeCatalog.ts |

## Navigation Flow Map

```
Navigation Flow:

/ (Unknown)
  ↳ /

/home (Unknown)

/dashboard (Unknown)

/sophisticated-hub (Unknown)

/hub (Unknown)

/resources (Unknown)

/multi-agent-chat (Unknown)

/ai-portal (Unknown)

/chat (Unknown)

/ai-agents (Unknown)

/agent-builder (Unknown)

/agent-management (Unknown)

/agents (Unknown)

/agents/new (Unknown)

/agents/:id (Unknown)

/agents/:id/identity (Unknown)

/observatory (Unknown)

/command-center (Unknown)

/agents/onboard (Unknown)

/agents/nft-marketplace (Unknown)

/agents/revenue-dashboard (Unknown)

/workspace/overview (Unknown)

/workspace/analytics (Unknown)

/workspace/members (Unknown)

/workspace/settings (Unknown)

/tasks (Unknown)

/workflows (Unknown)

/workflows/builder (Unknown)

/workflows/executions (Unknown)

/workflows/:id (Unknown)

/workflows/:id/execution (Unknown)

/workflows/console (Unknown)

/workflows/advanced-builder (Unknown)

/workflows/templates (Unknown)

/workflows-enhanced (Unknown)

/workflows/detail (Unknown)

/workflows/execution (Unknown)

/admin (Unknown)

/admin/user-management (Unknown)

/admin/system-metrics (Unknown)

/admin/control-panel (
                  <RequirePermission roles={['SUPER_ADMIN'])

/admin/agent-management (Unknown)

/admin/database (Unknown)

/admin/api-analytics (Unknown)

/admin/configuration (Unknown)

/admin/audit-logs (Unknown)

/admin/backup-restore (Unknown)

/admin/system-health (Unknown)

/admin/feature-flags (Unknown)

/admin/port-management (Unknown)

/admin/workspaces (Unknown)

/admin/settings (Unknown)

/admin/openclaw-security (Unknown)

/admin/users (Unknown)

/agency/dashboard (Unknown)

/agency/onboard (Unknown)

/mcp-hub (Unknown)

/knowledge-hub (Unknown)

/a2a-control (Unknown)

/settings (Unknown)

/settings/general (Unknown)

/login (Unknown)

/register (Unknown)

/components (Unknown)

/timeline-demo (Unknown)

/graph-demo (Unknown)

/frontend-showcase (Unknown)

/debug (Unknown)

/build-info (Unknown)

/debug-routing (Unknown)

/all-pages (Unknown)

/analytics (Unknown)

/suggestions (Unknown)

/suggestions/new (Unknown)

/suggestions/:id (Unknown)

/auth (Unknown)

/auth/login (Unknown)

/auth/register (Unknown)

/auth/forgot-password (Unknown)

/auth/reset-password (Unknown)

/auth/sso (Unknown)

/auth/google-callback (Unknown)

/auth/oauth-callback (Unknown)

/auth/unstoppable-callback (Unknown)

/landing (Unknown)

/pricing (Unknown)

/community (Unknown)

/support (Unknown)

/contact (Unknown)

/onboarding (Unknown)

/docs (Unknown)

/docs/* (Unknown)

/legal/privacy (Unknown)

/legal/terms (Unknown)

/brand (Unknown)

/design-system (Unknown)

/blog (Unknown)

/onboarding/ai-agent (Unknown)

/workspace-chat (Unknown)

/tasks/new (Unknown)

/tasks/:id (Unknown)

/tasks/:id/edit (Unknown)

/dashboard/agents (Unknown)

/dashboard/agents/new (Unknown)

/dashboard/agents/:id (Unknown)

/settings/appearance (Unknown)

/settings/notifications (Unknown)

/settings/security (Unknown)

/settings/api (Unknown)

/general-settings (Unknown)

/general-settings/embedding (Unknown)

/layout-example (Unknown)

/simple-test (Unknown)

/test (Unknown)

/unauthorized (Unknown)

/ai-agent-portal (Unknown)

/dashboard/analytics (Unknown)

/dashboard/settings (Unknown)

/components-showcase (Unknown)

/not-found (Unknown)

/preview/onboarding (Unknown)

/workspace-settings/llm-selection (Unknown)

/workspace-settings/chat-model (Unknown)

/workspace-settings/agent-model (Unknown)

/admin/agents/skills (Unknown)

/admin/agents/web-search (Unknown)

/main (Unknown)

/live-view (Unknown)

/ai-command-center (Unknown)

/admin/layout (Unknown)

/multi-agent-chat-demo (Unknown)

/api/admin/database (Unknown)

/api/admin/features (Unknown)

/package/dashboard (Unknown)

/package/login (Unknown)

/package/agents (Unknown)

/package/workflows (Unknown)

/profile (Unknown)

/user/profile (Unknown)

/html/dashboard (Unknown)

/html/admin (Unknown)

/html/agents (Unknown)

/html/chat (Unknown)

/html/tasks (Unknown)

/html/workflows (Unknown)

/404 (Unknown)

* (<WorkflowsPage />)

/builder (<ModernBuilder />)

/builder/:id (<ModernBuilder />)

/legacy-builder (<WorkflowBuilder />)

/legacy-builder/:id (<WorkflowBuilder />)

/:id (<WorkflowDetail />)

/:id/execution (<WorkflowExecution />)

/executions/:executionId (<WorkflowExecution />)

/templates (<WorkflowTemplates />)

/templates/:templateId (<WorkflowTemplates />)

/chat-page (Unknown)

/agents/unified-creator (Unknown)

/workspace/chat (Unknown)

/workspace/layout (Unknown)

/tasks-page (Unknown)

/admin/onboarding (Unknown)

/admin/dashboard (Unknown)

/admin/experimental-features (Unknown)

/general-settings/community-hub (Unknown)

/landing-page (Unknown)

/simple-landing (Unknown)

/components-nav (Unknown)

/api/admin/features/:id/evaluate (Unknown)

```

## Recommendations

### Fix Broken Links

- Update the target paths to match defined routes
- Or add the missing routes to your navigation configuration

### Address Orphaned Routes

- Add navigation links to make these routes accessible
- Or remove them if they are no longer needed

### Maintain Navigation Integrity

- Run this validation tool regularly as part of your development process
- Consider adding navigation testing to your test suite
- Document your navigation structure for better team understanding
