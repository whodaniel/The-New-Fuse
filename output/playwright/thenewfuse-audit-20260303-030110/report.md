# thenewfuse.com Audit

## Summary
- urls_audited: 157
- with_issues: 157
- http_4xx_5xx: 2
- severity: {'critical': 1, 'high': 4, 'medium': 7, 'low': 145, 'none': 0}

## Critical/High
- [critical] https://thenewfuse.com/observatory status=None issues=['No HTML captured']
- [high] https://thenewfuse.com/api/admin/database status=404 issues=['HTTP status 404', 'Missing title', 'Missing meta description', 'Missing H1', 'Console errors (1)']
- [high] https://thenewfuse.com/api/admin/features status=404 issues=['HTTP status 404', 'Missing title', 'Missing meta description', 'Missing H1', 'Console errors (1)']
- [high] https://thenewfuse.com/workspace-settings/llm-selection status=200 issues=['Meta description too long (>160)', 'Multiple H1 (3)', 'Runtime page errors (1)']
- [high] https://thenewfuse.com/workspace-settings/chat-model status=200 issues=['Meta description too long (>160)', 'Multiple H1 (3)', 'Runtime page errors (1)']

## Medium sample
- https://thenewfuse.com/profile issues=['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
- https://thenewfuse.com/user/profile issues=['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
- https://thenewfuse.com/auth/google/callback issues=['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (1)']
- https://thenewfuse.com/agents/onboard issues=['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (2)']
- https://thenewfuse.com/auth/google-callback issues=['Meta description too long (>160)', 'Multiple H1 (2)', 'Console errors (1)']
- https://thenewfuse.com/community issues=['Meta description too long (>160)', 'Console errors (1)']
- https://thenewfuse.com/main issues=['Meta description too long (>160)', 'Console errors (2)']
