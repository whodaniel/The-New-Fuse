# thenewfuse.com Full Route Audit

## Summary
- base: https://thenewfuse.com
- routes_discovered_from_bundle: 152
- urls_audited: 152
- with_issues: 152
- http_4xx_5xx: 2
- severity_counts: {'critical': 1, 'high': 4, 'medium': 9, 'low': 138, 'none': 0}
- generated_at_utc: 2026-03-03T02:57:48.884575Z

## Critical/High Findings
- [CRITICAL] https://thenewfuse.com/observatory
  - status=None load_ms=7920 issues=1
  - No HTML captured
- [HIGH] https://thenewfuse.com/api/admin/database
  - status=404 load_ms=822 issues=7
  - HTTP status 404
  - Missing title
  - Missing meta description
  - Missing html[lang]
  - Missing H1
  - Missing viewport meta
  - Console errors (1)
  - console sample: Failed to load resource: the server responded with a status of 404 ()
- [HIGH] https://thenewfuse.com/api/admin/features
  - status=404 load_ms=788 issues=7
  - HTTP status 404
  - Missing title
  - Missing meta description
  - Missing html[lang]
  - Missing H1
  - Missing viewport meta
  - Console errors (1)
  - console sample: Failed to load resource: the server responded with a status of 404 ()
- [HIGH] https://thenewfuse.com/workspace-settings/agent-model
  - status=200 load_ms=2771 issues=3
  - Meta description too long (>160 chars)
  - Multiple H1 (2)
  - Runtime page errors (1)
- [HIGH] https://thenewfuse.com/workspace-settings/chat-model
  - status=200 load_ms=2555 issues=3
  - Meta description too long (>160 chars)
  - Multiple H1 (3)
  - Runtime page errors (1)

## Medium Findings (sample)
- https://thenewfuse.com/profile :: Meta description too long (>160 chars), Multiple H1 (2), Console errors (2)
- https://thenewfuse.com/agents/onboard :: Meta description too long (>160 chars), Multiple H1 (2), Console errors (2)
- https://thenewfuse.com/community :: Meta description too long (>160 chars), Multiple H1 (4), Console errors (2)
- https://thenewfuse.com/main :: Meta description too long (>160 chars), Console errors (2)
- https://thenewfuse.com/ :: Meta description too long (>160 chars), Console errors (1)
- https://thenewfuse.com/brand :: Meta description too long (>160 chars), Console errors (1)
- https://thenewfuse.com/auth/google/callback :: Meta description too long (>160 chars), Console errors (1)
- https://thenewfuse.com/auth/google-callback :: Meta description too long (>160 chars), Console errors (1)
- https://thenewfuse.com/auth/oauth-callback :: Meta description too long (>160 chars), Console errors (1)
