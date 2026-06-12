# All Routes Semantic Audit

Generated: 2026-06-11T20:22:09.874Z Base URL: https://thenewfuse.com

## Summary

- total routes tested: 224
- hard broken (HTTP >= 400): 0
- network broken: 4
- routes with same fingerprint as / (excluding SPA-shell duplicates): 0
- duplicate fingerprint groups: 13

## Hard Broken

- none

## Network Broken

- /workspace/layout -> error=page.evaluate: Target page, context or browser has
  been closed
- /workspace/members -> error=page.goto: Target page, context or browser has
  been closed
- /workspace/overview -> error=page.goto: Target page, context or browser has
  been closed
- /workspace/settings -> error=page.goto: Target page, context or browser has
  been closed

## Same As Root (Potential Soft-Failure)

- none

## Duplicate Fingerprint Groups

- 31517bcc709ed07e0b6449f9440eb6d86c769804: /, /features, /pricing
- 823ebb2a91b2a320032c7881ebf8000ea4510a07: /a2a-control, /admin/marketplace,
  /agency/dashboard, /agency/onboard, /agent-builder, /agent-management,
  /agents, /agents/create, /agents/new, /agents/nft-marketplace,
  /agents/pfp-catalog, /agents/pfp-prompts, /agents/pfp-studio,
  /agents/revenue-dashboard, /agents/unified-creator, /ai-agent-portal,
  /ai-agents, /ai-portal, /ai-portal/pfp-prompts, /ai-portal/pfp-studio,
  /analytics, /app, /auth/login, /chat, /chat-page, /components,
  /components-nav, /config, /cron-jobs, /dashboard, /dashboard/agents,
  /dashboard/agents/new, /dashboard/analytics, /dashboard/architecture,
  /dashboard/calendar, /dashboard/command-center, /dashboard/datasets,
  /dashboard/fairtable, /dashboard/files, /dashboard/launchpad, /dashboard/logs,
  /dashboard/observability, /dashboard/settings, /fairtable, /general-settings,
  /general-settings/community-hub, /general-settings/embedding, /goals,
  /graph-demo, /home, /hosting, /hub, /instances, /knowledge-hub, /landing,
  /landing-page, /macro-timeline, /main, /mcp-hub, /multi-agent-chat, /nodes,
  /observatory, /overview, /plans, /profile, /resources, /resources/skills,
  /resources/templates, /resources/workflows, /sessions, /settings,
  /settings/api, /settings/appearance, /settings/general,
  /settings/notifications, /settings/security, /simple-landing, /space, /spaces,
  /suggestions, /suggestions/new, /tasks, /tasks-page, /tasks/new, /team,
  /timeline, /timeline-demo, /timeline/module, /tnf-hub, /usage, /user/profile,
  /workflows, /workflows-enhanced, /workflows/advanced-builder,
  /workflows/builder, /workflows/builder-enhanced, /workflows/builder-n8n,
  /workflows/console, /workflows/detail, /workflows/execution,
  /workflows/executions, /workflows/nexus, /workflows/templates, /workspace,
  /workspace-chat, /workspace-settings/agent-model,
  /workspace-settings/chat-model, /workspace-settings/llm-selection,
  /workspace/analytics, /workspace/chat
- 4ab19bbfebc904a8010bd0f6d2a24d9c8ca1188a: /about, /brand, /design-system
- a301267e3093107d4e73909e41f6c0474bb447dc: /admin, /admin/agent-management,
  /admin/agents/skills, /admin/agents/web-search, /admin/api-analytics,
  /admin/audit-logs, /admin/backup-restore, /admin/configuration,
  /admin/control-panel, /admin/dashboard, /admin/database,
  /admin/experimental-features, /admin/feature-flags, /admin/layout,
  /admin/openclaw-security, /admin/panel, /admin/port-management,
  /admin/settings, /admin/system-health, /admin/system-metrics,
  /admin/user-management, /admin/users, /admin/workspaces, /ai-command-center,
  /all-pages, /audit-logs, /build-info, /command-center, /components-showcase,
  /debug, /debug-routing, /frontend-showcase, /html/admin, /html/agents,
  /html/chat, /html/dashboard, /html/tasks, /html/workflows, /ide,
  /layout-example, /live-view, /llm-rankings, /logs, /multi-agent-chat-demo,
  /nexus, /package/agents, /package/dashboard, /package/login,
  /package/workflows, /perpetual-status, /platform-parity, /simple-test, /test,
  /unauthorized
- 0fdb296356f6da7940ac08348b6a34dd8ec6ef1a: /auth/forgot-password,
  /forgot-password
- 49e0eea32cb8be47ea51c4f14a0f45b152dfaa82: /billing, /community,
  /help/community, /help/support, /membership, /not-found, /support
- e60a3d706b683adb25e0ad0dc7268635aafa2f54: /capabilities, /marketplace,
  /platform, /product-map
- 261b16762e5c4fa16a6d757ebfb8e3741ea8f5d8: /connect, /integrations
- 7010ea1eda456f60ca76fa9cd61df236deab8ff2: /help/documentation, /help/faq,
  /help/tutorials
- f4b55a22a461a5e4dcf5bedd6c4198026a47e350: /legal/privacy, /privacy
- b1ff828ad2661b87de667c629fef055a4d209305: /legal/terms, /terms
- 992997b562b1f5024e5d7b029a61037ce97ed14c: /terminals,
  /visualizations/terminals
- c65f37b2cb1ae26c89e9b4f26e2ca9e9cde4ae5b: /workspace/layout,
  /workspace/members, /workspace/overview, /workspace/settings
