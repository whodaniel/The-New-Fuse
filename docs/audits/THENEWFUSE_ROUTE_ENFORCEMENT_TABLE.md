# TheNewFuse Frontend Route-by-Route Enforcement Table

Generated from `apps/frontend/src/ComprehensiveRouter.tsx` on
2026-03-08T18:20:08.174Z

## Principal Levels

- `PUBLIC`: no login required.
- `PUBLIC_WITH_INVITE_OR_TOKEN`: route can render publicly, but server actions
  must enforce invite/registration token checks.
- `AUTHENTICATED_MEMBER`: logged-in user with active membership where
  monetization applies.
- `AGENCY_OWNER|AGENCY_ADMIN|AGENCY_MANAGER`: agency control surfaces.
- `SUPER_ADMIN`: restricted operational/admin control surfaces.

## Enforcement Matrix

| Route                               | Current Guard                                                 | Recommended Principal         | Enforcement Delta            |
| ----------------------------------- | ------------------------------------------------------------- | ----------------------------- | ---------------------------- | --------------- | -------- |
| `*`                                 | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/`                                 | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/404`                              | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/a2a-control`                      | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/admin`                            | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/agent-management`           | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/agents/skills`              | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/agents/web-search`          | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/api-analytics`              | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/audit-logs`                 | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/backup-restore`             | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/configuration`              | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/control-panel`              | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/database`                   | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/feature-flags`              | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/layout`                     | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/marketplace`                | `RequirePermission(ADMIN,SUPER_ADMIN)`                        | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/admin/openclaw-security`          | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/port-management`            | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/settings`                   | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/system-health`              | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/system-metrics`             | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/user-management`            | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/users`                      | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/admin/workspaces`                 | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/agency/dashboard`                 | `RequirePermission(AGENCY_OWNER,AGENCY_ADMIN,AGENCY_MANAGER)` | `AGENCY_OWNER                 | AGENCY_ADMIN                 | AGENCY_MANAGER` | `HARDEN` |
| `/agency/onboard`                   | `RequireAuth`                                                 | `AUTHENTICATED_USER`          | `KEEP`                       |
| `/agent-builder`                    | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/agent-management`                 | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/agents`                           | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/agents/:id`                       | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/agents/:id/identity`              | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/agents/new`                       | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/agents/nft-marketplace`           | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/agents/onboard`                   | `Public`                                                      | `PUBLIC_WITH_INVITE_OR_TOKEN` | `ENFORCE_SERVER_TOKEN_CHECK` |
| `/agents/revenue-dashboard`         | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/ai-agent-portal`                  | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/ai-agents`                        | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/ai-command-center`                | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/ai-portal`                        | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/all-pages`                        | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/analytics`                        | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/api/admin/database`               | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/api/admin/features`               | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/app.html`                         | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth`                             | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/callback`                    | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/forgot-password`             | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/google-callback`             | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/google/callback`             | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/login`                       | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/oauth-callback`              | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/register`                    | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/reset-password`              | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/auth/sso`                         | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/blog`                             | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/brand`                            | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/build-info`                       | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/capabilities`                     | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/chat`                             | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/command-center`                   | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/community`                        | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/components`                       | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/components-showcase`              | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/connect`                          | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/contact`                          | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/dashboard`                        | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/agents`                 | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/agents/:id`             | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/agents/new`             | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/analytics`              | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/architecture`           | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/logs`                   | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/observability`          | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/dashboard/settings`               | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/debug`                            | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/debug-routing`                    | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/design-system`                    | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/docs`                             | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/docs/*`                           | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/features`                         | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/frontend-showcase`                | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/general-settings`                 | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/general-settings/embedding`       | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/goals`                            | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/goals/:id`                        | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/graph-demo`                       | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/home`                             | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/html/admin`                       | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/html/agents`                      | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/html/chat`                        | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/html/dashboard`                   | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/html/tasks`                       | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/html/workflows`                   | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/hub`                              | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/knowledge-hub`                    | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/landing`                          | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/layout-example`                   | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/legal/privacy`                    | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/legal/terms`                      | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/live-view`                        | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/login`                            | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/main`                             | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/marketplace`                      | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/mcp-hub`                          | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/membership`                       | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/multi-agent-chat`                 | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/multi-agent-chat-demo`            | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/not-found`                        | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/observatory`                      | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/onboarding`                       | `Public`                                                      | `PUBLIC_WITH_INVITE_OR_TOKEN` | `ENFORCE_SERVER_TOKEN_CHECK` |
| `/onboarding/ai-agent`              | `Public`                                                      | `PUBLIC_WITH_INVITE_OR_TOKEN` | `ENFORCE_SERVER_TOKEN_CHECK` |
| `/package/agents`                   | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/package/dashboard`                | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/package/login`                    | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/package/workflows`                | `RequirePermission(SUPER_ADMIN)`                              | `SUPER_ADMIN`                 | `KEEP`                       |
| `/plans`                            | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/plans/:id`                        | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/platform`                         | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/preview/onboarding`               | `Public`                                                      | `PUBLIC_WITH_INVITE_OR_TOKEN` | `ENFORCE_SERVER_TOKEN_CHECK` |
| `/pricing`                          | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/product-map`                      | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/profile`                          | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/register`                         | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/resources`                        | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/settings`                         | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/settings/api`                     | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/settings/appearance`              | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/settings/general`                 | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/settings/notifications`           | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/settings/security`                | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/simple-test`                      | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/sophisticated-hub`                | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/suggestions`                      | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/suggestions/:id`                  | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/suggestions/new`                  | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/support`                          | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/tasks`                            | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/tasks/:id`                        | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/tasks/:id/edit`                   | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/tasks/new`                        | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/test`                             | `RequireAuth`                                                 | `SUPER_ADMIN`                 | `HARDEN`                     |
| `/timeline`                         | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/timeline-demo`                    | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/unauthorized`                     | `Public`                                                      | `PUBLIC`                      | `KEEP`                       |
| `/user/profile`                     | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/workflows`                        | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows-enhanced`               | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/:id`                    | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/:id/execution`          | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/advanced-builder`       | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/builder`                | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/console`                | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/detail`                 | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/execution`              | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/executions`             | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workflows/templates`              | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workspace-chat`                   | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/workspace-settings/agent-model`   | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/workspace-settings/chat-model`    | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/workspace-settings/llm-selection` | `RequireAuth`                                                 | `AUTHENTICATED_MEMBER`        | `ADD_MEMBERSHIP_CHECK`       |
| `/workspace/analytics`              | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workspace/members`                | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workspace/overview`               | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |
| `/workspace/settings`               | `RequireMemberAccess`                                         | `AUTHENTICATED_MEMBER`        | `KEEP`                       |

## High-Risk Misplacements To Fix Next

- Enforce paid membership server-side for member-only product surfaces
  (`/resources`, `/workspace/*`, `/agents/*`, `/tasks*`, `/workflows*`).
- Keep onboarding public but require invite/registration tokens on all
  account-creation and agent-registration submissions.
- Keep debug/prototype routes gated to `SUPER_ADMIN` in production builds, or
  remove from router entirely.
