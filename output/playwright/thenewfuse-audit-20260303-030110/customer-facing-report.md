# thenewfuse.com Customer-Facing Readiness

## Summary
- customer_urls_audited: 105
- customer_with_issues: 105
- customer_http_4xx_5xx: 0
- customer_severity_counts: {'low': 97, 'medium': 7, 'critical': 1}
- top_issues: [('Meta description too long (>160)', 104), ('Multiple H1 (2)', 76), ('Multiple H1 (3)', 10), ('Multiple H1 (4)', 9), ('Console errors (2)', 4), ('Console errors (1)', 3), ('No HTML captured', 1)]

## Highest Priority Customer-Facing Issues
- [CRITICAL] https://thenewfuse.com/observatory (status=None)
  - issues: ['No HTML captured']
- [MEDIUM] https://thenewfuse.com/agents/onboard (status=200)
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
  - console: Failed to load resource: the server responded with a status of 401 ()
- [MEDIUM] https://thenewfuse.com/auth/google-callback (status=200)
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (1)']
  - console: Authentication error: null
- [MEDIUM] https://thenewfuse.com/auth/google/callback (status=200)
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (1)']
  - console: Authentication error: null
- [MEDIUM] https://thenewfuse.com/profile (status=200)
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
  - console: Failed to load resource: the server responded with a status of 404 ()
- [MEDIUM] https://thenewfuse.com/user/profile (status=200)
  - issues: ['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
  - console: Failed to load resource: the server responded with a status of 404 ()
- [MEDIUM] https://thenewfuse.com/community (status=200)
  - issues: ['Meta description too long (>160)', 'Console errors (1)']
  - console: TypeError: Cannot read properties of undefined (reading 'map')
    at https://thenewfuse.com/assets/js/CommunityHub.BhPofyda.js:1:10346
    at Array.map (<anonymous>)
    at re (https://thenewfuse.com/assets/js/Community
- [MEDIUM] https://thenewfuse.com/main (status=200)
  - issues: ['Meta description too long (>160)', 'Console errors (2)']
  - console: Connecting to 'ws://localhost:3001/' violates the following Content Security Policy directive: "connect-src 'self' https: wss:". The action has been blocked.
