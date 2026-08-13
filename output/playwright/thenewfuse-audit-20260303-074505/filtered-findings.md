# thenewfuse.com Filtered Audit Findings

## UI
- urls: 146
- severity: {'critical': 0, 'high': 0, 'medium': 3, 'low': 143, 'none': 0}

- [medium] https://thenewfuse.com/agents/onboard (status=200)
  issues: Meta description too long (>160), Multiple H1 (2), Console errors (2)
  console: Failed to load resource: the server responded with a status of 401 ()
- [medium] https://thenewfuse.com/profile (status=200)
  issues: Meta description too long (>160), Multiple H1 (2), Console errors (2)
  console: Failed to load resource: the server responded with a status of 404 ()
- [medium] https://thenewfuse.com/user/profile (status=200)
  issues: Meta description too long (>160), Multiple H1 (2), Console errors (2)
  console: Failed to load resource: the server responded with a status of 404 ()

## AUTH
- urls: 9
- severity: {'critical': 0, 'high': 0, 'medium': 2, 'low': 7, 'none': 0}

- [medium] https://thenewfuse.com/auth/google-callback (status=200)
  issues: Meta description too long (>160), Multiple H1 (2), Console errors (1)
  console: Authentication error: null
- [medium] https://thenewfuse.com/auth/google/callback (status=200)
  issues: Meta description too long (>160), Multiple H1 (2), Console errors (1)
  console: Authentication error: null

## API
- urls: 2
- severity: {'critical': 0, 'high': 2, 'medium': 0, 'low': 0, 'none': 0}

- [high] https://thenewfuse.com/api/admin/database (status=404)
  issues: HTTP status 404, Missing title, Missing meta description, Missing html[lang], Missing H1, Missing viewport meta
  console: Failed to load resource: the server responded with a status of 404 ()
- [high] https://thenewfuse.com/api/admin/features (status=404)
  issues: HTTP status 404, Missing title, Missing meta description, Missing html[lang], Missing H1, Missing viewport meta
  console: Failed to load resource: the server responded with a status of 404 ()

