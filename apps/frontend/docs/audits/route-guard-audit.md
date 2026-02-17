# Route Guard Audit

Generated: 2026-02-17T20:51:51.515Z

## Counts

- sidebar paths: 21
- missing routes: 0
- admin unguarded risk: 0
- other unguarded review routes: 0

## Sidebar Guard Report

- `/admin` | access: `authenticated` | status: `ok` | guard: `RequirePermission`
  | redirect: `false`
- `/agents` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
- `/channels` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/chat` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
- `/command-center` | access: `authenticated` | status: `ok` | guard:
  `RequireAuth` | redirect: `false`
- `/config` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/cron-jobs` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/debug` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
- `/docs` | access: `public` | status: `ok` | guard: `none` | redirect: `false`
- `/instances` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/logs` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/nodes` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/observatory` | access: `authenticated` | status: `ok` | guard: `RequireAuth`
  | redirect: `false`
- `/overview` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/resources` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
- `/sessions` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/settings` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
- `/skills` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/tasks` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
- `/usage` | access: `authenticated` | status: `ok` | guard: `redirect` |
  redirect: `true`
- `/workflows` | access: `authenticated` | status: `ok` | guard: `RequireAuth` |
  redirect: `false`
