# thenewfuse.com Prioritized Remediation Plan

## P0 (Fix Immediately)
- https://thenewfuse.com/observatory
  - issues: ['No HTML captured']
- https://thenewfuse.com/workspace-settings/chat-model
  - issues: ['Meta description too long (>160)', 'Multiple H1 (3)', 'Runtime page errors (1)']
  - runtime sample: System is not defined
- https://thenewfuse.com/workspace-settings/llm-selection
  - issues: ['Meta description too long (>160)', 'Multiple H1 (3)', 'Runtime page errors (1)']
  - runtime sample: System is not defined

## P1 (Stability/Integration)
- https://thenewfuse.com/agents/onboard
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
  - console sample: Failed to load resource: the server responded with a status of 401 ()
- https://thenewfuse.com/api/admin/database
  - issues: ['HTTP status 404', 'Missing title', 'Missing meta description', 'Missing H1']
  - console sample: Failed to load resource: the server responded with a status of 404 ()
- https://thenewfuse.com/api/admin/features
  - issues: ['HTTP status 404', 'Missing title', 'Missing meta description', 'Missing H1']
  - console sample: Failed to load resource: the server responded with a status of 404 ()
- https://thenewfuse.com/auth/google-callback
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (1)']
  - console sample: Authentication error: null
- https://thenewfuse.com/auth/google/callback
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (1)']
  - console sample: Authentication error: null
- https://thenewfuse.com/community
  - issues: ['Meta description too long (>160)', 'Console errors (1)']
  - console sample: TypeError: Cannot read properties of undefined (reading 'map')
    at https://thenewfuse.com/assets/js/CommunityHub.BhPofyda.js:1:10346
    at Array.map (<anonymous>)
    at re (ht
- https://thenewfuse.com/main
  - issues: ['Meta description too long (>160)', 'Console errors (2)']
  - console sample: Connecting to 'ws://localhost:3001/' violates the following Content Security Policy directive: "connect-src 'self' https: wss:". The action has been blocked.
- https://thenewfuse.com/profile
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
  - console sample: Failed to load resource: the server responded with a status of 404 ()
- https://thenewfuse.com/user/profile
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
  - console sample: Failed to load resource: the server responded with a status of 404 ()

## P2 (SEO/Content Hygiene)
- Meta description too long (>160 chars) on 154 pages.
- Multiple H1 on 145 pages.
- Standardize one H1/page and route-specific meta descriptions.

## Recommended Implementation Order
1. Fix runtime crashers (`System is not defined`, `CardHeader is not defined`, undefined `.map`).
2. Resolve route/network failures (`/observatory` timeout, bad route exposure returning 404).
3. Prevent localhost WS calls in production bundles and gate dev-only features.
4. Apply SEO template policy per route (title/meta/H1 governance).
