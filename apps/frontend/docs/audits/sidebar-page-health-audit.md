# Sidebar Page Health Audit

Generated: 2026-05-11T18:04:13.709Z

## Counts

- total: 56
- working: 51
- partial-medium-risk: 1
- partial-high-risk: 4
- broken: 0

## Page Results

- `/admin/layout` -> target `/admin/layout` -> `ComprehensiveRouter.tsx` |
  status: `partial-high-risk` | risk: 68 | hits: fallback_demo:34
- `/user/profile` -> target `/user/profile` ->
  `components/profile/UserProfilePage.tsx` | status: `partial-high-risk` | risk:
  61 | hits: fallback_demo:27, timeout_simulation:5, raw_fetch:2
- `/visualizations` -> target `/visualizations` -> `pages/Visualizations.tsx` |
  status: `partial-high-risk` | risk: 20 | hits: fallback_demo:9,
  timeout_simulation:1, raw_fetch:1
- `/admin/control-panel` -> target `/admin/control-panel` ->
  `pages/Admin/SuperAdminControlPanel.tsx` | status: `partial-high-risk` | risk:
  12 | hits: randomized_behavior:1, raw_fetch:10
- `/admin/user-management` -> target `/admin/user-management` ->
  `pages/Admin/UserManagementFull.tsx` | status: `partial-medium-risk` | risk: 6
  | hits: raw_fetch:6
- `/marketplace` -> target `/marketplace` ->
  `pages/Marketplace/MarketplacePublicPage.tsx` | status: `working` | risk: 4 |
  hits: fallback_demo:2
- `/admin` -> target `/admin` -> `pages/Admin/ComprehensiveAdminDashboard.tsx` |
  status: `working` | risk: 3 | hits: timeout_simulation:3
- `/admin/settings` -> target `/admin/settings` ->
  `pages/Admin/AdminSettings.tsx` | status: `working` | risk: 3 | hits:
  timeout_simulation:1, raw_fetch:2
- `/admin/system-metrics` -> target `/admin/system-metrics` ->
  `pages/Admin/SystemMetricsDashboard.tsx` | status: `working` | risk: 3 | hits:
  fallback_demo:1, raw_fetch:1
- `/admin/workspaces` -> target `/admin/workspaces` ->
  `pages/Admin/WorkspaceManagement.tsx` | status: `working` | risk: 3 | hits:
  raw_fetch:3
- `/admin/agent-management` -> target `/admin/agent-management` ->
  `pages/Admin/AgentManagementFull.tsx` | status: `working` | risk: 2 | hits:
  raw_fetch:2
- `/admin/configuration` -> target `/admin/configuration` ->
  `pages/Admin/ConfigurationManagement.tsx` | status: `working` | risk: 2 |
  hits: raw_fetch:2
- `/admin/port-management` -> target `/admin/port-management` ->
  `pages/Admin/PortManagement.tsx` | status: `working` | risk: 2 | hits:
  raw_fetch:2
- `/ai-portal` -> target `/ai-portal` -> `pages/AIAgentDashboard.tsx` | status:
  `working` | risk: 2 | hits: raw_fetch:2
- `/knowledge-hub` -> target `/knowledge-hub` -> `pages/KnowledgeHub.tsx` |
  status: `working` | risk: 2 | hits: raw_fetch:2
- `/live-view` -> target `/live-view` -> `pages/LiveView.tsx` | status:
  `working` | risk: 2 | hits: randomized_behavior:1
- `/admin/api-analytics` -> target `/admin/api-analytics` ->
  `pages/Admin/APIAnalyticsFull.tsx` | status: `working` | risk: 1 | hits:
  raw_fetch:1
- `/admin/audit-logs` -> target `/admin/audit-logs` ->
  `pages/Admin/AuditLogViewer.tsx` | status: `working` | risk: 1 | hits:
  raw_fetch:1
- `/admin/database` -> target `/admin/database` ->
  `pages/Admin/DatabaseAdminPanel.tsx` | status: `working` | risk: 1 | hits:
  raw_fetch:1
- `/admin/openclaw-security` -> target `/admin/openclaw-security` ->
  `pages/Admin/OpenClawSecurity.tsx` | status: `working` | risk: 1 | hits:
  timeout_simulation:1
- `/dashboard` -> target `/dashboard` ->
  `pages/dashboard/TNFConsoleDashboard.tsx` | status: `working` | risk: 1 |
  hits: raw_fetch:1
- `/workflows` -> target `/workflows` -> `pages/Workflows.tsx` | status:
  `working` | risk: 1 | hits: timeout_simulation:1
- `/admin/agents/skills` -> target `/admin/agents/skills` ->
  `pages/Admin/Agents/skills.tsx` | status: `working` | risk: 0 | hits: none
- `/admin/agents/web-search` -> target `/admin/agents/web-search` ->
  `pages/Admin/Agents/WebSearchSelection/index.tsx` | status: `working` | risk:
  0 | hits: none
- `/admin/backup-restore` -> target `/admin/backup-restore` ->
  `pages/Admin/BackupRestore.tsx` | status: `working` | risk: 0 | hits: none
- `/admin/feature-flags` -> target `/admin/feature-flags` ->
  `pages/Admin/FeatureFlags.tsx` | status: `working` | risk: 0 | hits: none
- `/admin/marketplace` -> target `/admin/marketplace` ->
  `pages/Marketplace/index.tsx` | status: `working` | risk: 0 | hits: none
- `/admin/system-health` -> target `/admin/system-health` ->
  `pages/Admin/SystemHealth.tsx` | status: `working` | risk: 0 | hits: none
- `/admin/users` -> target `/admin/users` -> `pages/Admin/UserManagement.tsx` |
  status: `working` | risk: 0 | hits: none
- `/agents` -> target `/agents` -> `pages/AgentsRevolution.tsx` | status:
  `working` | risk: 0 | hits: none
- `/ai-command-center` -> target `/ai-command-center` ->
  `pages/AICommandCenter/index.tsx` | status: `working` | risk: 0 | hits: none
- `/all-pages` -> target `/all-pages` -> `pages/AllPages.tsx` | status:
  `working` | risk: 0 | hits: none
- `/analytics` -> target `/analytics` -> `pages/dashboard/Analytics.tsx` |
  status: `working` | risk: 0 | hits: none
- `/billing` -> target `/billing` -> `pages/Membership.tsx` | status: `working`
  | risk: 0 | hits: none
- `/build-info` -> target `/build-info` -> `pages/BuildInfo.tsx` | status:
  `working` | risk: 0 | hits: none
- `/chat` -> target `/chat` -> `pages/chat/ChatPage.tsx` | status: `working` |
  risk: 0 | hits: none
- `/command-center` -> target `/command-center` -> `pages/CommandCore.tsx` |
  status: `working` | risk: 0 | hits: none
- `/debug` -> target `/debug` -> `pages/Debug.tsx` | status: `working` | risk: 0
  | hits: none
- `/docs` -> target `/docs` -> `pages/Docs.tsx` | status: `working` | risk: 0 |
  hits: none
- `/general-settings` -> target `/general-settings` ->
  `pages/GeneralSettings/index.tsx` | status: `working` | risk: 0 | hits: none
- `/hub` -> target `/hub` -> `pages/Hub/ModernHub.tsx` | status: `working` |
  risk: 0 | hits: none
- `/mcp-hub` -> target `/mcp-hub` -> `pages/mcp/MCPHub.tsx` | status: `working`
  | risk: 0 | hits: none
- `/nexus` -> target `/nexus` -> `pages/SystemObservatory.tsx` | status:
  `working` | risk: 0 | hits: none
- `/observatory` -> target `/observatory` -> `pages/SystemObservatory.tsx` |
  status: `working` | risk: 0 | hits: none
- `/platform-parity` -> target `/platform-parity` ->
  `pages/Parity/PlatformParityDashboard.tsx` | status: `working` | risk: 0 |
  hits: none
- `/settings` -> target `/settings` -> `pages/Settings.tsx` | status: `working`
  | risk: 0 | hits: none
- `/settings/api` -> target `/settings/api` -> `pages/settings/API.tsx` |
  status: `working` | risk: 0 | hits: none
- `/settings/appearance` -> target `/settings/appearance` ->
  `pages/settings/Appearance.tsx` | status: `working` | risk: 0 | hits: none
- `/settings/notifications` -> target `/settings/notifications` ->
  `pages/settings/Notifications.tsx` | status: `working` | risk: 0 | hits: none
- `/settings/security` -> target `/settings/security` ->
  `pages/settings/Security.tsx` | status: `working` | risk: 0 | hits: none
- `/suggestions` -> target `/suggestions` -> `pages/Suggestions/index.tsx` |
  status: `working` | risk: 0 | hits: none
- `/tasks` -> target `/tasks` -> `pages/Tasks/TasksPage.tsx` | status: `working`
  | risk: 0 | hits: none
- `/timeline` -> target `/timeline` -> `pages/Timeline/index.tsx` | status:
  `working` | risk: 0 | hits: none
- `/visualizations/concordance` -> target `/visualizations/concordance` ->
  `pages/ConcordanceViewer.tsx` | status: `working` | risk: 0 | hits: none
- `/workspace-settings/llm-selection` -> target
  `/workspace-settings/llm-selection` ->
  `pages/WorkspaceSettings/ChatSettings/WorkspaceLLMSelection/index.tsx` |
  status: `working` | risk: 0 | hits: none
- `/workspace/overview` -> target `/workspace/overview` ->
  `pages/workspace/Overview.tsx` | status: `working` | risk: 0 | hits: none
