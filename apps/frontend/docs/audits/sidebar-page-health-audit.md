# Sidebar Page Health Audit

Generated: 2026-02-18T11:33:52.970Z

## Counts

- total: 21
- working: 14
- partial-medium-risk: 2
- partial-high-risk: 5
- broken: 0

## Page Results

- `/channels` -> target `/command-center` -> `pages/TNFCommandCenter.tsx` |
  status: `partial-high-risk` | risk: 34 | hits: fallback_demo:16, raw_fetch:2
- `/command-center` -> target `/command-center` -> `pages/TNFCommandCenter.tsx`
  | status: `partial-high-risk` | risk: 34 | hits: fallback_demo:16, raw_fetch:2
- `/instances` -> target `/observatory` -> `pages/SystemObservatory.tsx` |
  status: `partial-high-risk` | risk: 22 | hits: fallback_demo:10, raw_fetch:2
- `/nodes` -> target `/observatory` -> `pages/SystemObservatory.tsx` | status:
  `partial-high-risk` | risk: 22 | hits: fallback_demo:10, raw_fetch:2
- `/observatory` -> target `/observatory` -> `pages/SystemObservatory.tsx` |
  status: `partial-high-risk` | risk: 22 | hits: fallback_demo:10, raw_fetch:2
- `/admin` -> target `/admin` -> `pages/Admin/ComprehensiveAdminDashboard.tsx` |
  status: `partial-medium-risk` | risk: 11 | hits: randomized_behavior:1,
  timeout_simulation:4, raw_fetch:5
- `/usage` -> target `/analytics` -> `pages/dashboard/Analytics.tsx` | status:
  `partial-medium-risk` | risk: 5 | hits: raw_fetch:5
- `/chat` -> target `/chat` -> `pages/chat/ChatPage.tsx` | status: `working` |
  risk: 4 | hits: timeout_simulation:4
- `/cron-jobs` -> target `/tasks` -> `pages/Tasks/TasksPage.tsx` | status:
  `working` | risk: 1 | hits: timeout_simulation:1
- `/logs` -> target `/admin/audit-logs` -> `pages/Admin/AuditLogViewer.tsx` |
  status: `working` | risk: 1 | hits: raw_fetch:1
- `/tasks` -> target `/tasks` -> `pages/Tasks/TasksPage.tsx` | status: `working`
  | risk: 1 | hits: timeout_simulation:1
- `/workflows` -> target `/workflows` -> `pages/Workflows.tsx` | status:
  `working` | risk: 1 | hits: timeout_simulation:1
- `/agents` -> target `/agents` -> `pages/AgentsRevolution.tsx` | status:
  `working` | risk: 0 | hits: none
- `/config` -> target `/settings` -> `pages/Settings.tsx` | status: `working` |
  risk: 0 | hits: none
- `/debug` -> target `/debug` -> `pages/Debug.tsx` | status: `working` | risk: 0
  | hits: none
- `/docs` -> target `/docs` -> `pages/Docs.tsx` | status: `working` | risk: 0 |
  hits: none
- `/overview` -> target `/dashboard` -> `components/Dashboard.tsx` | status:
  `working` | risk: 0 | hits: none
- `/resources` -> target `/resources` ->
  `pages/Resources/ResourcesDashboard.tsx` | status: `working` | risk: 0 | hits:
  none
- `/sessions` -> target `/multi-agent-chat` -> `components/MultiAgentChat.tsx` |
  status: `working` | risk: 0 | hits: none
- `/settings` -> target `/settings` -> `pages/Settings.tsx` | status: `working`
  | risk: 0 | hits: none
- `/skills` -> target `/resources` -> `pages/Resources/ResourcesDashboard.tsx` |
  status: `working` | risk: 0 | hits: none
