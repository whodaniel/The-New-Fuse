# Sidebar Page Health Audit

Generated: 2026-02-19T10:06:44.426Z

## Counts

- total: 19
- working: 12
- partial-medium-risk: 3
- partial-high-risk: 2
- broken: 2

## Page Results

- `/ai-command-center` -> target `/ai-command-center` -> `<missing>` | status:
  `broken-missing-route-or-file` | risk: 999 | hits: missing_route_or_file:1
- `/hub` -> target `/hub` -> `<missing>` | status:
  `broken-missing-route-or-file` | risk: 999 | hits: missing_route_or_file:1
- `/observatory` -> target `/observatory` -> `pages/SystemObservatory.tsx` |
  status: `partial-high-risk` | risk: 22 | hits: fallback_demo:10, raw_fetch:2
- `/knowledge-hub` -> target `/knowledge-hub` -> `pages/KnowledgeHub.tsx` |
  status: `partial-high-risk` | risk: 17 | hits: mock_data:5, fallback_demo:1
- `/admin` -> target `/admin` -> `pages/Admin/ComprehensiveAdminDashboard.tsx` |
  status: `partial-medium-risk` | risk: 11 | hits: randomized_behavior:1,
  timeout_simulation:4, raw_fetch:5
- `/mcp-hub` -> target `/mcp-hub` -> `pages/mcp/MCPHub.tsx` | status:
  `partial-medium-risk` | risk: 9 | hits: mock_data:3
- `/analytics` -> target `/analytics` -> `pages/dashboard/Analytics.tsx` |
  status: `partial-medium-risk` | risk: 5 | hits: raw_fetch:5
- `/chat` -> target `/chat` -> `pages/chat/ChatPage.tsx` | status: `working` |
  risk: 4 | hits: timeout_simulation:4
- `/admin/audit-logs` -> target `/admin/audit-logs` ->
  `pages/Admin/AuditLogViewer.tsx` | status: `working` | risk: 1 | hits:
  raw_fetch:1
- `/workflows` -> target `/workflows` -> `pages/Workflows.tsx` | status:
  `working` | risk: 1 | hits: timeout_simulation:1
- `/agents` -> target `/agents` -> `pages/AgentsRevolution.tsx` | status:
  `working` | risk: 0 | hits: none
- `/dashboard` -> target `/dashboard` -> `components/Dashboard.tsx` | status:
  `working` | risk: 0 | hits: none
- `/debug` -> target `/debug` -> `pages/Debug.tsx` | status: `working` | risk: 0
  | hits: none
- `/docs` -> target `/docs` -> `pages/Docs.tsx` | status: `working` | risk: 0 |
  hits: none
- `/resources` -> target `/resources` ->
  `pages/Resources/ResourcesDashboard.tsx` | status: `working` | risk: 0 | hits:
  none
- `/settings` -> target `/settings` -> `pages/Settings.tsx` | status: `working`
  | risk: 0 | hits: none
- `/suggestions` -> target `/suggestions` -> `pages/Suggestions/index.tsx` |
  status: `working` | risk: 0 | hits: none
- `/tasks` -> target `/tasks` -> `pages/Tasks/TasksPage.tsx` | status: `working`
  | risk: 0 | hits: none
- `/timeline` -> target `/timeline` -> `pages/Timeline/index.tsx` | status:
  `working` | risk: 0 | hits: none
