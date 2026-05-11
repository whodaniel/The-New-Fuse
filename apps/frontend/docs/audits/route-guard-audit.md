# Route Guard Audit

Generated: 2026-05-11T18:04:11.878Z

## Counts

- sidebar paths: 56
- missing routes: 0
- admin unguarded risk: 0
- other unguarded review routes: 22

## Sidebar Guard Report

- `/admin` | access: `authenticated` | status: `ok` | guard: `RequirePermission`
  | redirect: `false`
- `/admin/agent-management` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/agents/skills` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/agents/web-search` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/api-analytics` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/audit-logs` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/backup-restore` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/configuration` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/control-panel` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/database` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/feature-flags` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/layout` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/marketplace` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/openclaw-security` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/port-management` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/settings` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/system-health` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/system-metrics` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/user-management` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/users` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/admin/workspaces` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/agents` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/ai-command-center` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/ai-portal` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/all-pages` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/analytics` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/billing` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
- `/build-info` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/chat` | access: `authenticated` | status: `review-unguarded` | guard: `none`
  | redirect: `false`
- `/command-center` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/dashboard` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/debug` | access: `authenticated` | status: `ok` | guard: `RequirePermission`
  | redirect: `false`
- `/docs` | access: `public` | status: `ok` | guard: `none` | redirect: `false`
- `/general-settings` | access: `authenticated` | status: `review-unguarded` |
  guard: `none` | redirect: `false`
- `/hub` | access: `authenticated` | status: `review-unguarded` | guard: `none`
  | redirect: `false`
- `/knowledge-hub` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/live-view` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/marketplace` | access: `public` | status: `ok` | guard: `none` | redirect:
  `false`
- `/mcp-hub` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/nexus` | access: `authenticated` | status: `ok` | guard: `RequirePermission`
  | redirect: `false`
- `/observatory` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/platform-parity` | access: `authenticated` | status: `ok` | guard:
  `RequirePermission` | redirect: `false`
- `/settings` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/settings/api` | access: `authenticated` | status: `review-unguarded` |
  guard: `none` | redirect: `false`
- `/settings/appearance` | access: `authenticated` | status: `review-unguarded`
  | guard: `none` | redirect: `false`
- `/settings/notifications` | access: `authenticated` | status:
  `review-unguarded` | guard: `none` | redirect: `false`
- `/settings/security` | access: `authenticated` | status: `review-unguarded` |
  guard: `none` | redirect: `false`
- `/suggestions` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/tasks` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/timeline` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/user/profile` | access: `authenticated` | status: `review-unguarded` |
  guard: `none` | redirect: `false`
- `/visualizations` | access: `authenticated` | status: `review-unguarded` |
  guard: `none` | redirect: `false`
- `/visualizations/concordance` | access: `authenticated` | status:
  `review-unguarded` | guard: `none` | redirect: `false`
- `/workflows` | access: `authenticated` | status: `review-unguarded` | guard:
  `none` | redirect: `false`
- `/workspace-settings/llm-selection` | access: `authenticated` | status:
  `review-unguarded` | guard: `none` | redirect: `false`
- `/workspace/overview` | access: `authenticated` | status: `review-unguarded` |
  guard: `none` | redirect: `false`
