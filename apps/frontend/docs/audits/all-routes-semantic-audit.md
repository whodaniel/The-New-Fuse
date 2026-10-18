# All Routes Semantic Audit

Generated: 2026-10-18T04:07:19.482Z Base URL: https://app.thenewfuse.com

## Summary

- total routes tested: 260
- hard broken (HTTP >= 400): 0
- network broken: 0
- network unreliable (transport-only failures, audit inconclusive): true
- transport-only failures set aside: 260
- routes with same fingerprint as / (excluding SPA-shell duplicates): 0
- duplicate fingerprint groups: 0

## Hard Broken

- none

## Network Broken

- none

## Network Unreliable (Inconclusive — Not Route Breakage)

These rows failed at the transport layer with no HTTP status: 260 match a known
transport-error signature. That is evidence about this host's network path, not
about the route (PS-005).

- / -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ Call log:
  - navigating to "https://app.thenewfuse.com/", waiting until
    "domcontentloaded"

- /3d-library -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/3d-library Call log:
  - navigating to "https://app.thenewfuse.com/3d-library", waiting until
    "domcontentloaded"

- /404 -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/404 Call log:
  - navigating to "https://app.thenewfuse.com/404", waiting until
    "domcontentloaded"

- /a2a-control -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/a2a-control Call log:
  - navigating to "https://app.thenewfuse.com/a2a-control", waiting until
    "domcontentloaded"

- /about -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/about Call log:
  - navigating to "https://app.thenewfuse.com/about", waiting until
    "domcontentloaded"

- /admin -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin Call log:
  - navigating to "https://app.thenewfuse.com/admin", waiting until
    "domcontentloaded"

- /admin/agent-management -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/agent-management Call log:
  - navigating to "https://app.thenewfuse.com/admin/agent-management", waiting
    until "domcontentloaded"

- /admin/agents/skills -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/agents/skills Call log:
  - navigating to "https://app.thenewfuse.com/admin/agents/skills", waiting
    until "domcontentloaded"

- /admin/agents/web-search -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/agents/web-search Call log:
  - navigating to "https://app.thenewfuse.com/admin/agents/web-search", waiting
    until "domcontentloaded"

- /admin/api-analytics -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/api-analytics Call log:
  - navigating to "https://app.thenewfuse.com/admin/api-analytics", waiting
    until "domcontentloaded"

- /admin/audit-logs -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/audit-logs Call log:
  - navigating to "https://app.thenewfuse.com/admin/audit-logs", waiting until
    "domcontentloaded"

- /admin/backup-restore -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/backup-restore Call log:
  - navigating to "https://app.thenewfuse.com/admin/backup-restore", waiting
    until "domcontentloaded"

- /admin/configuration -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/configuration Call log:
  - navigating to "https://app.thenewfuse.com/admin/configuration", waiting
    until "domcontentloaded"

- /admin/control-panel -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/control-panel Call log:
  - navigating to "https://app.thenewfuse.com/admin/control-panel", waiting
    until "domcontentloaded"

- /admin/dashboard -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/dashboard Call log:
  - navigating to "https://app.thenewfuse.com/admin/dashboard", waiting until
    "domcontentloaded"

- /admin/database -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/database Call log:
  - navigating to "https://app.thenewfuse.com/admin/database", waiting until
    "domcontentloaded"

- /admin/experimental-features -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/experimental-features Call log:
  - navigating to "https://app.thenewfuse.com/admin/experimental-features",
    waiting until "domcontentloaded"

- /admin/feature-flags -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/feature-flags Call log:
  - navigating to "https://app.thenewfuse.com/admin/feature-flags", waiting
    until "domcontentloaded"

- /admin/finops -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/finops Call log:
  - navigating to "https://app.thenewfuse.com/admin/finops", waiting until
    "domcontentloaded"

- /admin/harness-credentials -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/harness-credentials Call log:
  - navigating to "https://app.thenewfuse.com/admin/harness-credentials",
    waiting until "domcontentloaded"

- /admin/layout -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/layout Call log:
  - navigating to "https://app.thenewfuse.com/admin/layout", waiting until
    "domcontentloaded"

- /admin/marketplace -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/marketplace Call log:
  - navigating to "https://app.thenewfuse.com/admin/marketplace", waiting until
    "domcontentloaded"

- /admin/model-observatory -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/model-observatory Call log:
  - navigating to "https://app.thenewfuse.com/admin/model-observatory", waiting
    until "domcontentloaded"

- /admin/onboarding -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/onboarding Call log:
  - navigating to "https://app.thenewfuse.com/admin/onboarding", waiting until
    "domcontentloaded"

- /admin/openclaw-security -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/openclaw-security Call log:
  - navigating to "https://app.thenewfuse.com/admin/openclaw-security", waiting
    until "domcontentloaded"

- /admin/panel -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/panel Call log:
  - navigating to "https://app.thenewfuse.com/admin/panel", waiting until
    "domcontentloaded"

- /admin/port-management -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/port-management Call log:
  - navigating to "https://app.thenewfuse.com/admin/port-management", waiting
    until "domcontentloaded"

- /admin/settings -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/settings Call log:
  - navigating to "https://app.thenewfuse.com/admin/settings", waiting until
    "domcontentloaded"

- /admin/system-health -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/system-health Call log:
  - navigating to "https://app.thenewfuse.com/admin/system-health", waiting
    until "domcontentloaded"

- /admin/system-metrics -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/system-metrics Call log:
  - navigating to "https://app.thenewfuse.com/admin/system-metrics", waiting
    until "domcontentloaded"

- /admin/user-management -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/user-management Call log:
  - navigating to "https://app.thenewfuse.com/admin/user-management", waiting
    until "domcontentloaded"

- /admin/users -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/users Call log:
  - navigating to "https://app.thenewfuse.com/admin/users", waiting until
    "domcontentloaded"

- /admin/workspaces -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/admin/workspaces Call log:
  - navigating to "https://app.thenewfuse.com/admin/workspaces", waiting until
    "domcontentloaded"

- /agency/dashboard -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agency/dashboard Call log:
  - navigating to "https://app.thenewfuse.com/agency/dashboard", waiting until
    "domcontentloaded"

- /agency/onboard -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agency/onboard Call log:
  - navigating to "https://app.thenewfuse.com/agency/onboard", waiting until
    "domcontentloaded"

- /agent-builder -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agent-builder Call log:
  - navigating to "https://app.thenewfuse.com/agent-builder", waiting until
    "domcontentloaded"

- /agent-management -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agent-management Call log:
  - navigating to "https://app.thenewfuse.com/agent-management", waiting until
    "domcontentloaded"

- /agents -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents Call log:
  - navigating to "https://app.thenewfuse.com/agents", waiting until
    "domcontentloaded"

- /agents/create -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/create Call log:
  - navigating to "https://app.thenewfuse.com/agents/create", waiting until
    "domcontentloaded"

- /agents/new -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/new Call log:
  - navigating to "https://app.thenewfuse.com/agents/new", waiting until
    "domcontentloaded"

- /agents/nft-marketplace -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/nft-marketplace Call log:
  - navigating to "https://app.thenewfuse.com/agents/nft-marketplace", waiting
    until "domcontentloaded"

- /agents/onboard -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/onboard Call log:
  - navigating to "https://app.thenewfuse.com/agents/onboard", waiting until
    "domcontentloaded"

- /agents/pfp-catalog -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/pfp-catalog Call log:
  - navigating to "https://app.thenewfuse.com/agents/pfp-catalog", waiting until
    "domcontentloaded"

- /agents/pfp-prompts -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/pfp-prompts Call log:
  - navigating to "https://app.thenewfuse.com/agents/pfp-prompts", waiting until
    "domcontentloaded"

- /agents/pfp-studio -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/pfp-studio Call log:
  - navigating to "https://app.thenewfuse.com/agents/pfp-studio", waiting until
    "domcontentloaded"

- /agents/portal -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/portal Call log:
  - navigating to "https://app.thenewfuse.com/agents/portal", waiting until
    "domcontentloaded"

- /agents/revenue-dashboard -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/revenue-dashboard Call log:
  - navigating to "https://app.thenewfuse.com/agents/revenue-dashboard", waiting
    until "domcontentloaded"

- /agents/unified-creator -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/agents/unified-creator Call log:
  - navigating to "https://app.thenewfuse.com/agents/unified-creator", waiting
    until "domcontentloaded"

- /ai-agent-portal -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ai-agent-portal Call log:
  - navigating to "https://app.thenewfuse.com/ai-agent-portal", waiting until
    "domcontentloaded"

- /ai-agents -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ai-agents Call log:
  - navigating to "https://app.thenewfuse.com/ai-agents", waiting until
    "domcontentloaded"

- /ai-command-center -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ai-command-center Call log:
  - navigating to "https://app.thenewfuse.com/ai-command-center", waiting until
    "domcontentloaded"

- /ai-portal -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ai-portal Call log:
  - navigating to "https://app.thenewfuse.com/ai-portal", waiting until
    "domcontentloaded"

- /ai-portal/pfp-prompts -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ai-portal/pfp-prompts Call log:
  - navigating to "https://app.thenewfuse.com/ai-portal/pfp-prompts", waiting
    until "domcontentloaded"

- /ai-portal/pfp-studio -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ai-portal/pfp-studio Call log:
  - navigating to "https://app.thenewfuse.com/ai-portal/pfp-studio", waiting
    until "domcontentloaded"

- /all-pages -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/all-pages Call log:
  - navigating to "https://app.thenewfuse.com/all-pages", waiting until
    "domcontentloaded"

- /ambassador -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ambassador Call log:
  - navigating to "https://app.thenewfuse.com/ambassador", waiting until
    "domcontentloaded"

- /analytics -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/analytics Call log:
  - navigating to "https://app.thenewfuse.com/analytics", waiting until
    "domcontentloaded"

- /app -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/app Call log:
  - navigating to "https://app.thenewfuse.com/app", waiting until
    "domcontentloaded"

- /audit-logs -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/audit-logs Call log:
  - navigating to "https://app.thenewfuse.com/audit-logs", waiting until
    "domcontentloaded"

- /auth -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth Call log:
  - navigating to "https://app.thenewfuse.com/auth", waiting until
    "domcontentloaded"

- /auth/callback -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/callback Call log:
  - navigating to "https://app.thenewfuse.com/auth/callback", waiting until
    "domcontentloaded"

- /auth/forgot-password -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/forgot-password Call log:
  - navigating to "https://app.thenewfuse.com/auth/forgot-password", waiting
    until "domcontentloaded"

- /auth/google-callback -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/google-callback Call log:
  - navigating to "https://app.thenewfuse.com/auth/google-callback", waiting
    until "domcontentloaded"

- /auth/google/callback -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/google/callback Call log:
  - navigating to "https://app.thenewfuse.com/auth/google/callback", waiting
    until "domcontentloaded"

- /auth/handoff -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/handoff Call log:
  - navigating to "https://app.thenewfuse.com/auth/handoff", waiting until
    "domcontentloaded"

- /auth/login -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/login Call log:
  - navigating to "https://app.thenewfuse.com/auth/login", waiting until
    "domcontentloaded"

- /auth/logout -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/logout Call log:
  - navigating to "https://app.thenewfuse.com/auth/logout", waiting until
    "domcontentloaded"

- /auth/oauth-callback -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/oauth-callback Call log:
  - navigating to "https://app.thenewfuse.com/auth/oauth-callback", waiting
    until "domcontentloaded"

- /auth/register -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/register Call log:
  - navigating to "https://app.thenewfuse.com/auth/register", waiting until
    "domcontentloaded"

- /auth/reset-password -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/reset-password Call log:
  - navigating to "https://app.thenewfuse.com/auth/reset-password", waiting
    until "domcontentloaded"

- /auth/sso -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/auth/sso Call log:
  - navigating to "https://app.thenewfuse.com/auth/sso", waiting until
    "domcontentloaded"

- /automations -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/automations Call log:
  - navigating to "https://app.thenewfuse.com/automations", waiting until
    "domcontentloaded"

- /billing -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/billing Call log:
  - navigating to "https://app.thenewfuse.com/billing", waiting until
    "domcontentloaded"

- /blog -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/blog Call log:
  - navigating to "https://app.thenewfuse.com/blog", waiting until
    "domcontentloaded"

- /bookmarks -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/bookmarks Call log:
  - navigating to "https://app.thenewfuse.com/bookmarks", waiting until
    "domcontentloaded"

- /brand -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/brand Call log:
  - navigating to "https://app.thenewfuse.com/brand", waiting until
    "domcontentloaded"

- /browser -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/browser Call log:
  - navigating to "https://app.thenewfuse.com/browser", waiting until
    "domcontentloaded"

- /build-info -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/build-info Call log:
  - navigating to "https://app.thenewfuse.com/build-info", waiting until
    "domcontentloaded"

- /capabilities -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/capabilities Call log:
  - navigating to "https://app.thenewfuse.com/capabilities", waiting until
    "domcontentloaded"

- /careers -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/careers Call log:
  - navigating to "https://app.thenewfuse.com/careers", waiting until
    "domcontentloaded"

- /channels -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/channels Call log:
  - navigating to "https://app.thenewfuse.com/channels", waiting until
    "domcontentloaded"

- /chat -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/chat Call log:
  - navigating to "https://app.thenewfuse.com/chat", waiting until
    "domcontentloaded"

- /chat-page -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/chat-page Call log:
  - navigating to "https://app.thenewfuse.com/chat-page", waiting until
    "domcontentloaded"

- /chats -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/chats Call log:
  - navigating to "https://app.thenewfuse.com/chats", waiting until
    "domcontentloaded"

- /codebase-map -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/codebase-map Call log:
  - navigating to "https://app.thenewfuse.com/codebase-map", waiting until
    "domcontentloaded"

- /command-center -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/command-center Call log:
  - navigating to "https://app.thenewfuse.com/command-center", waiting until
    "domcontentloaded"

- /community -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/community Call log:
  - navigating to "https://app.thenewfuse.com/community", waiting until
    "domcontentloaded"

- /comparisons -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/comparisons Call log:
  - navigating to "https://app.thenewfuse.com/comparisons", waiting until
    "domcontentloaded"

- /components -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/components Call log:
  - navigating to "https://app.thenewfuse.com/components", waiting until
    "domcontentloaded"

- /components-nav -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/components-nav Call log:
  - navigating to "https://app.thenewfuse.com/components-nav", waiting until
    "domcontentloaded"

- /components-showcase -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/components-showcase Call log:
  - navigating to "https://app.thenewfuse.com/components-showcase", waiting
    until "domcontentloaded"

- /computer-use -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/computer-use Call log:
  - navigating to "https://app.thenewfuse.com/computer-use", waiting until
    "domcontentloaded"

- /config -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/config Call log:
  - navigating to "https://app.thenewfuse.com/config", waiting until
    "domcontentloaded"

- /connect -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/connect Call log:
  - navigating to "https://app.thenewfuse.com/connect", waiting until
    "domcontentloaded"

- /contact -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/contact Call log:
  - navigating to "https://app.thenewfuse.com/contact", waiting until
    "domcontentloaded"

- /cron-jobs -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/cron-jobs Call log:
  - navigating to "https://app.thenewfuse.com/cron-jobs", waiting until
    "domcontentloaded"

- /dashboard -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard Call log:
  - navigating to "https://app.thenewfuse.com/dashboard", waiting until
    "domcontentloaded"

- /dashboard/agents -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/agents Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/agents", waiting until
    "domcontentloaded"

- /dashboard/agents/new -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/agents/new Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/agents/new", waiting
    until "domcontentloaded"

- /dashboard/analytics -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/analytics Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/analytics", waiting
    until "domcontentloaded"

- /dashboard/architecture -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/architecture Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/architecture", waiting
    until "domcontentloaded"

- /dashboard/audit -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/audit Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/audit", waiting until
    "domcontentloaded"

- /dashboard/calendar -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/calendar Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/calendar", waiting until
    "domcontentloaded"

- /dashboard/command-center -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/command-center Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/command-center", waiting
    until "domcontentloaded"

- /dashboard/datasets -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/datasets Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/datasets", waiting until
    "domcontentloaded"

- /dashboard/dynamic-ui -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/dynamic-ui Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/dynamic-ui", waiting
    until "domcontentloaded"

- /dashboard/fairtable -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/fairtable Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/fairtable", waiting
    until "domcontentloaded"

- /dashboard/files -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/files Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/files", waiting until
    "domcontentloaded"

- /dashboard/google-hub -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/google-hub Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/google-hub", waiting
    until "domcontentloaded"

- /dashboard/launchpad -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/launchpad Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/launchpad", waiting
    until "domcontentloaded"

- /dashboard/logs -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/logs Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/logs", waiting until
    "domcontentloaded"

- /dashboard/observability -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/observability Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/observability", waiting
    until "domcontentloaded"

- /dashboard/overview -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/overview Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/overview", waiting until
    "domcontentloaded"

- /dashboard/schedule -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/schedule Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/schedule", waiting until
    "domcontentloaded"

- /dashboard/settings -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/settings Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/settings", waiting until
    "domcontentloaded"

- /dashboard/unified-chat -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dashboard/unified-chat Call log:
  - navigating to "https://app.thenewfuse.com/dashboard/unified-chat", waiting
    until "domcontentloaded"

- /datasets -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/datasets Call log:
  - navigating to "https://app.thenewfuse.com/datasets", waiting until
    "domcontentloaded"

- /debug -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/debug Call log:
  - navigating to "https://app.thenewfuse.com/debug", waiting until
    "domcontentloaded"

- /debug-routing -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/debug-routing Call log:
  - navigating to "https://app.thenewfuse.com/debug-routing", waiting until
    "domcontentloaded"

- /design-system -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/design-system Call log:
  - navigating to "https://app.thenewfuse.com/design-system", waiting until
    "domcontentloaded"

- /docs -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/docs Call log:
  - navigating to "https://app.thenewfuse.com/docs", waiting until
    "domcontentloaded"

- /durable-compute -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/durable-compute Call log:
  - navigating to "https://app.thenewfuse.com/durable-compute", waiting until
    "domcontentloaded"

- /durable-tasks -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/durable-tasks Call log:
  - navigating to "https://app.thenewfuse.com/durable-tasks", waiting until
    "domcontentloaded"

- /dynamic-ui -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/dynamic-ui Call log:
  - navigating to "https://app.thenewfuse.com/dynamic-ui", waiting until
    "domcontentloaded"

- /fairtable -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/fairtable Call log:
  - navigating to "https://app.thenewfuse.com/fairtable", waiting until
    "domcontentloaded"

- /faq -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/faq Call log:
  - navigating to "https://app.thenewfuse.com/faq", waiting until
    "domcontentloaded"

- /features -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/features Call log:
  - navigating to "https://app.thenewfuse.com/features", waiting until
    "domcontentloaded"

- /files -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/files Call log:
  - navigating to "https://app.thenewfuse.com/files", waiting until
    "domcontentloaded"

- /forgot-password -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/forgot-password Call log:
  - navigating to "https://app.thenewfuse.com/forgot-password", waiting until
    "domcontentloaded"

- /frontend-showcase -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/frontend-showcase Call log:
  - navigating to "https://app.thenewfuse.com/frontend-showcase", waiting until
    "domcontentloaded"

- /general-settings -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/general-settings Call log:
  - navigating to "https://app.thenewfuse.com/general-settings", waiting until
    "domcontentloaded"

- /general-settings/community-hub -> error=page.goto: net::ERR_NAME_NOT_RESOLVED
  at https://app.thenewfuse.com/general-settings/community-hub Call log:
  - navigating to "https://app.thenewfuse.com/general-settings/community-hub",
    waiting until "domcontentloaded"

- /general-settings/embedding -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/general-settings/embedding Call log:
  - navigating to "https://app.thenewfuse.com/general-settings/embedding",
    waiting until "domcontentloaded"

- /goals -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/goals Call log:
  - navigating to "https://app.thenewfuse.com/goals", waiting until
    "domcontentloaded"

- /google-hub -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/google-hub Call log:
  - navigating to "https://app.thenewfuse.com/google-hub", waiting until
    "domcontentloaded"

- /graph-demo -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/graph-demo Call log:
  - navigating to "https://app.thenewfuse.com/graph-demo", waiting until
    "domcontentloaded"

- /help/community -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/help/community Call log:
  - navigating to "https://app.thenewfuse.com/help/community", waiting until
    "domcontentloaded"

- /help/documentation -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/help/documentation Call log:
  - navigating to "https://app.thenewfuse.com/help/documentation", waiting until
    "domcontentloaded"

- /help/faq -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/help/faq Call log:
  - navigating to "https://app.thenewfuse.com/help/faq", waiting until
    "domcontentloaded"

- /help/support -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/help/support Call log:
  - navigating to "https://app.thenewfuse.com/help/support", waiting until
    "domcontentloaded"

- /help/tutorials -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/help/tutorials Call log:
  - navigating to "https://app.thenewfuse.com/help/tutorials", waiting until
    "domcontentloaded"

- /home -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/home Call log:
  - navigating to "https://app.thenewfuse.com/home", waiting until
    "domcontentloaded"

- /hosting -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/hosting Call log:
  - navigating to "https://app.thenewfuse.com/hosting", waiting until
    "domcontentloaded"

- /hub -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/hub Call log:
  - navigating to "https://app.thenewfuse.com/hub", waiting until
    "domcontentloaded"

- /ide -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/ide Call log:
  - navigating to "https://app.thenewfuse.com/ide", waiting until
    "domcontentloaded"

- /instances -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/instances Call log:
  - navigating to "https://app.thenewfuse.com/instances", waiting until
    "domcontentloaded"

- /integrations -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/integrations Call log:
  - navigating to "https://app.thenewfuse.com/integrations", waiting until
    "domcontentloaded"

- /knowledge-hub -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/knowledge-hub Call log:
  - navigating to "https://app.thenewfuse.com/knowledge-hub", waiting until
    "domcontentloaded"

- /landing -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/landing Call log:
  - navigating to "https://app.thenewfuse.com/landing", waiting until
    "domcontentloaded"

- /landing-page -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/landing-page Call log:
  - navigating to "https://app.thenewfuse.com/landing-page", waiting until
    "domcontentloaded"

- /layout-example -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/layout-example Call log:
  - navigating to "https://app.thenewfuse.com/layout-example", waiting until
    "domcontentloaded"

- /legal/privacy -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/legal/privacy Call log:
  - navigating to "https://app.thenewfuse.com/legal/privacy", waiting until
    "domcontentloaded"

- /legal/terms -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/legal/terms Call log:
  - navigating to "https://app.thenewfuse.com/legal/terms", waiting until
    "domcontentloaded"

- /live-view -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/live-view Call log:
  - navigating to "https://app.thenewfuse.com/live-view", waiting until
    "domcontentloaded"

- /llm-rankings -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/llm-rankings Call log:
  - navigating to "https://app.thenewfuse.com/llm-rankings", waiting until
    "domcontentloaded"

- /login -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/login Call log:
  - navigating to "https://app.thenewfuse.com/login", waiting until
    "domcontentloaded"

- /logout -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/logout Call log:
  - navigating to "https://app.thenewfuse.com/logout", waiting until
    "domcontentloaded"

- /logs -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/logs Call log:
  - navigating to "https://app.thenewfuse.com/logs", waiting until
    "domcontentloaded"

- /macro-timeline -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/macro-timeline Call log:
  - navigating to "https://app.thenewfuse.com/macro-timeline", waiting until
    "domcontentloaded"

- /main -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/main Call log:
  - navigating to "https://app.thenewfuse.com/main", waiting until
    "domcontentloaded"

- /marketplace -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/marketplace Call log:
  - navigating to "https://app.thenewfuse.com/marketplace", waiting until
    "domcontentloaded"

- /mcp -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/mcp Call log:
  - navigating to "https://app.thenewfuse.com/mcp", waiting until
    "domcontentloaded"

- /mcp-hub -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/mcp-hub Call log:
  - navigating to "https://app.thenewfuse.com/mcp-hub", waiting until
    "domcontentloaded"

- /membership -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/membership Call log:
  - navigating to "https://app.thenewfuse.com/membership", waiting until
    "domcontentloaded"

- /mission -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/mission Call log:
  - navigating to "https://app.thenewfuse.com/mission", waiting until
    "domcontentloaded"

- /models -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/models Call log:
  - navigating to "https://app.thenewfuse.com/models", waiting until
    "domcontentloaded"

- /multi-agent-chat -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/multi-agent-chat Call log:
  - navigating to "https://app.thenewfuse.com/multi-agent-chat", waiting until
    "domcontentloaded"

- /multi-agent-chat-demo -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/multi-agent-chat-demo Call log:
  - navigating to "https://app.thenewfuse.com/multi-agent-chat-demo", waiting
    until "domcontentloaded"

- /nodes -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/nodes Call log:
  - navigating to "https://app.thenewfuse.com/nodes", waiting until
    "domcontentloaded"

- /not-found -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/not-found Call log:
  - navigating to "https://app.thenewfuse.com/not-found", waiting until
    "domcontentloaded"

- /observatory -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/observatory Call log:
  - navigating to "https://app.thenewfuse.com/observatory", waiting until
    "domcontentloaded"

- /onboarding -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/onboarding Call log:
  - navigating to "https://app.thenewfuse.com/onboarding", waiting until
    "domcontentloaded"

- /onboarding/ai-agent -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/onboarding/ai-agent Call log:
  - navigating to "https://app.thenewfuse.com/onboarding/ai-agent", waiting
    until "domcontentloaded"

- /overview -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/overview Call log:
  - navigating to "https://app.thenewfuse.com/overview", waiting until
    "domcontentloaded"

- /patterns -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/patterns Call log:
  - navigating to "https://app.thenewfuse.com/patterns", waiting until
    "domcontentloaded"

- /perpetual-status -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/perpetual-status Call log:
  - navigating to "https://app.thenewfuse.com/perpetual-status", waiting until
    "domcontentloaded"

- /plans -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/plans Call log:
  - navigating to "https://app.thenewfuse.com/plans", waiting until
    "domcontentloaded"

- /platform -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/platform Call log:
  - navigating to "https://app.thenewfuse.com/platform", waiting until
    "domcontentloaded"

- /platform-parity -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/platform-parity Call log:
  - navigating to "https://app.thenewfuse.com/platform-parity", waiting until
    "domcontentloaded"

- /preview/onboarding -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/preview/onboarding Call log:
  - navigating to "https://app.thenewfuse.com/preview/onboarding", waiting until
    "domcontentloaded"

- /pricing -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/pricing Call log:
  - navigating to "https://app.thenewfuse.com/pricing", waiting until
    "domcontentloaded"

- /privacy -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/privacy Call log:
  - navigating to "https://app.thenewfuse.com/privacy", waiting until
    "domcontentloaded"

- /product-map -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/product-map Call log:
  - navigating to "https://app.thenewfuse.com/product-map", waiting until
    "domcontentloaded"

- /profile -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/profile Call log:
  - navigating to "https://app.thenewfuse.com/profile", waiting until
    "domcontentloaded"

- /register -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/register Call log:
  - navigating to "https://app.thenewfuse.com/register", waiting until
    "domcontentloaded"

- /resources -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/resources Call log:
  - navigating to "https://app.thenewfuse.com/resources", waiting until
    "domcontentloaded"

- /resources/skills -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/resources/skills Call log:
  - navigating to "https://app.thenewfuse.com/resources/skills", waiting until
    "domcontentloaded"

- /resources/templates -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/resources/templates Call log:
  - navigating to "https://app.thenewfuse.com/resources/templates", waiting
    until "domcontentloaded"

- /resources/workflows -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/resources/workflows Call log:
  - navigating to "https://app.thenewfuse.com/resources/workflows", waiting
    until "domcontentloaded"

- /runs -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/runs Call log:
  - navigating to "https://app.thenewfuse.com/runs", waiting until
    "domcontentloaded"

- /schedules -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/schedules Call log:
  - navigating to "https://app.thenewfuse.com/schedules", waiting until
    "domcontentloaded"

- /sessions -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/sessions Call log:
  - navigating to "https://app.thenewfuse.com/sessions", waiting until
    "domcontentloaded"

- /settings -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/settings Call log:
  - navigating to "https://app.thenewfuse.com/settings", waiting until
    "domcontentloaded"

- /settings/api -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/settings/api Call log:
  - navigating to "https://app.thenewfuse.com/settings/api", waiting until
    "domcontentloaded"

- /settings/appearance -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/settings/appearance Call log:
  - navigating to "https://app.thenewfuse.com/settings/appearance", waiting
    until "domcontentloaded"

- /settings/credentials -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/settings/credentials Call log:
  - navigating to "https://app.thenewfuse.com/settings/credentials", waiting
    until "domcontentloaded"

- /settings/general -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/settings/general Call log:
  - navigating to "https://app.thenewfuse.com/settings/general", waiting until
    "domcontentloaded"

- /settings/notifications -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/settings/notifications Call log:
  - navigating to "https://app.thenewfuse.com/settings/notifications", waiting
    until "domcontentloaded"

- /settings/security -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/settings/security Call log:
  - navigating to "https://app.thenewfuse.com/settings/security", waiting until
    "domcontentloaded"

- /simple-landing -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/simple-landing Call log:
  - navigating to "https://app.thenewfuse.com/simple-landing", waiting until
    "domcontentloaded"

- /simple-test -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/simple-test Call log:
  - navigating to "https://app.thenewfuse.com/simple-test", waiting until
    "domcontentloaded"

- /skills -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/skills Call log:
  - navigating to "https://app.thenewfuse.com/skills", waiting until
    "domcontentloaded"

- /space -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/space Call log:
  - navigating to "https://app.thenewfuse.com/space", waiting until
    "domcontentloaded"

- /spaces -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/spaces Call log:
  - navigating to "https://app.thenewfuse.com/spaces", waiting until
    "domcontentloaded"

- /status -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/status Call log:
  - navigating to "https://app.thenewfuse.com/status", waiting until
    "domcontentloaded"

- /suggestions -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/suggestions Call log:
  - navigating to "https://app.thenewfuse.com/suggestions", waiting until
    "domcontentloaded"

- /suggestions/new -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/suggestions/new Call log:
  - navigating to "https://app.thenewfuse.com/suggestions/new", waiting until
    "domcontentloaded"

- /support -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/support Call log:
  - navigating to "https://app.thenewfuse.com/support", waiting until
    "domcontentloaded"

- /system -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/system Call log:
  - navigating to "https://app.thenewfuse.com/system", waiting until
    "domcontentloaded"

- /system-status -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/system-status Call log:
  - navigating to "https://app.thenewfuse.com/system-status", waiting until
    "domcontentloaded"

- /tasks -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/tasks Call log:
  - navigating to "https://app.thenewfuse.com/tasks", waiting until
    "domcontentloaded"

- /tasks-page -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/tasks-page Call log:
  - navigating to "https://app.thenewfuse.com/tasks-page", waiting until
    "domcontentloaded"

- /tasks/new -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/tasks/new Call log:
  - navigating to "https://app.thenewfuse.com/tasks/new", waiting until
    "domcontentloaded"

- /team -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/team Call log:
  - navigating to "https://app.thenewfuse.com/team", waiting until
    "domcontentloaded"

- /telemetry -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/telemetry Call log:
  - navigating to "https://app.thenewfuse.com/telemetry", waiting until
    "domcontentloaded"

- /terminal -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/terminal Call log:
  - navigating to "https://app.thenewfuse.com/terminal", waiting until
    "domcontentloaded"

- /terminals -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/terminals Call log:
  - navigating to "https://app.thenewfuse.com/terminals", waiting until
    "domcontentloaded"

- /terminals/mirror -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/terminals/mirror Call log:
  - navigating to "https://app.thenewfuse.com/terminals/mirror", waiting until
    "domcontentloaded"

- /terms -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/terms Call log:
  - navigating to "https://app.thenewfuse.com/terms", waiting until
    "domcontentloaded"

- /test -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/test Call log:
  - navigating to "https://app.thenewfuse.com/test", waiting until
    "domcontentloaded"

- /testimonials -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/testimonials Call log:
  - navigating to "https://app.thenewfuse.com/testimonials", waiting until
    "domcontentloaded"

- /timeline -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/timeline Call log:
  - navigating to "https://app.thenewfuse.com/timeline", waiting until
    "domcontentloaded"

- /timeline-demo -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/timeline-demo Call log:
  - navigating to "https://app.thenewfuse.com/timeline-demo", waiting until
    "domcontentloaded"

- /timeline/module -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/timeline/module Call log:
  - navigating to "https://app.thenewfuse.com/timeline/module", waiting until
    "domcontentloaded"

- /tnf-hub -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/tnf-hub Call log:
  - navigating to "https://app.thenewfuse.com/tnf-hub", waiting until
    "domcontentloaded"

- /tools -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/tools Call log:
  - navigating to "https://app.thenewfuse.com/tools", waiting until
    "domcontentloaded"

- /truth-attribution -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/truth-attribution Call log:
  - navigating to "https://app.thenewfuse.com/truth-attribution", waiting until
    "domcontentloaded"

- /unauthorized -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/unauthorized Call log:
  - navigating to "https://app.thenewfuse.com/unauthorized", waiting until
    "domcontentloaded"

- /usage -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/usage Call log:
  - navigating to "https://app.thenewfuse.com/usage", waiting until
    "domcontentloaded"

- /user/profile -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/user/profile Call log:
  - navigating to "https://app.thenewfuse.com/user/profile", waiting until
    "domcontentloaded"

- /visualizations -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/visualizations Call log:
  - navigating to "https://app.thenewfuse.com/visualizations", waiting until
    "domcontentloaded"

- /visualizations/concordance -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/visualizations/concordance Call log:
  - navigating to "https://app.thenewfuse.com/visualizations/concordance",
    waiting until "domcontentloaded"

- /visualizations/master-graph -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/visualizations/master-graph Call log:
  - navigating to "https://app.thenewfuse.com/visualizations/master-graph",
    waiting until "domcontentloaded"

- /visualizations/surface -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/visualizations/surface Call log:
  - navigating to "https://app.thenewfuse.com/visualizations/surface", waiting
    until "domcontentloaded"

- /visualizations/telemetry -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/visualizations/telemetry Call log:
  - navigating to "https://app.thenewfuse.com/visualizations/telemetry", waiting
    until "domcontentloaded"

- /visualizations/terminals -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/visualizations/terminals Call log:
  - navigating to "https://app.thenewfuse.com/visualizations/terminals", waiting
    until "domcontentloaded"

- /watch-together -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/watch-together Call log:
  - navigating to "https://app.thenewfuse.com/watch-together", waiting until
    "domcontentloaded"

- /workflows -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows Call log:
  - navigating to "https://app.thenewfuse.com/workflows", waiting until
    "domcontentloaded"

- /workflows-enhanced -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows-enhanced Call log:
  - navigating to "https://app.thenewfuse.com/workflows-enhanced", waiting until
    "domcontentloaded"

- /workflows/advanced-builder -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/advanced-builder Call log:
  - navigating to "https://app.thenewfuse.com/workflows/advanced-builder",
    waiting until "domcontentloaded"

- /workflows/builder -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/builder Call log:
  - navigating to "https://app.thenewfuse.com/workflows/builder", waiting until
    "domcontentloaded"

- /workflows/builder-enhanced -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/builder-enhanced Call log:
  - navigating to "https://app.thenewfuse.com/workflows/builder-enhanced",
    waiting until "domcontentloaded"

- /workflows/builder-n8n -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/builder-n8n Call log:
  - navigating to "https://app.thenewfuse.com/workflows/builder-n8n", waiting
    until "domcontentloaded"

- /workflows/console -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/console Call log:
  - navigating to "https://app.thenewfuse.com/workflows/console", waiting until
    "domcontentloaded"

- /workflows/detail -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/detail Call log:
  - navigating to "https://app.thenewfuse.com/workflows/detail", waiting until
    "domcontentloaded"

- /workflows/execution -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/execution Call log:
  - navigating to "https://app.thenewfuse.com/workflows/execution", waiting
    until "domcontentloaded"

- /workflows/executions -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/executions Call log:
  - navigating to "https://app.thenewfuse.com/workflows/executions", waiting
    until "domcontentloaded"

- /workflows/templates -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workflows/templates Call log:
  - navigating to "https://app.thenewfuse.com/workflows/templates", waiting
    until "domcontentloaded"

- /workspace -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace Call log:
  - navigating to "https://app.thenewfuse.com/workspace", waiting until
    "domcontentloaded"

- /workspace-chat -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace-chat Call log:
  - navigating to "https://app.thenewfuse.com/workspace-chat", waiting until
    "domcontentloaded"

- /workspace-settings/agent-model -> error=page.goto: net::ERR_NAME_NOT_RESOLVED
  at https://app.thenewfuse.com/workspace-settings/agent-model Call log:
  - navigating to "https://app.thenewfuse.com/workspace-settings/agent-model",
    waiting until "domcontentloaded"

- /workspace-settings/chat-model -> error=page.goto: net::ERR_NAME_NOT_RESOLVED
  at https://app.thenewfuse.com/workspace-settings/chat-model Call log:
  - navigating to "https://app.thenewfuse.com/workspace-settings/chat-model",
    waiting until "domcontentloaded"

- /workspace-settings/llm-selection -> error=page.goto:
  net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace-settings/llm-selection Call log:
  - navigating to "https://app.thenewfuse.com/workspace-settings/llm-selection",
    waiting until "domcontentloaded"

- /workspace/analytics -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace/analytics Call log:
  - navigating to "https://app.thenewfuse.com/workspace/analytics", waiting
    until "domcontentloaded"

- /workspace/chat -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace/chat Call log:
  - navigating to "https://app.thenewfuse.com/workspace/chat", waiting until
    "domcontentloaded"

- /workspace/layout -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace/layout Call log:
  - navigating to "https://app.thenewfuse.com/workspace/layout", waiting until
    "domcontentloaded"

- /workspace/members -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace/members Call log:
  - navigating to "https://app.thenewfuse.com/workspace/members", waiting until
    "domcontentloaded"

- /workspace/overview -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace/overview Call log:
  - navigating to "https://app.thenewfuse.com/workspace/overview", waiting until
    "domcontentloaded"

- /workspace/projects -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace/projects Call log:
  - navigating to "https://app.thenewfuse.com/workspace/projects", waiting until
    "domcontentloaded"

- /workspace/settings -> error=page.goto: net::ERR_NAME_NOT_RESOLVED at
  https://app.thenewfuse.com/workspace/settings Call log:
  - navigating to "https://app.thenewfuse.com/workspace/settings", waiting until
    "domcontentloaded"

## Same As Root (Potential Soft-Failure)

- none

## Duplicate Fingerprint Groups

- none
