# thenewfuse.com Audit

## Summary
- urls_audited: 157
- with_issues: 157
- http_4xx_5xx: 2
- severity: {'critical': 1, 'high': 5, 'medium': 1, 'low': 150, 'none': 0}
- generated_at_utc: 2026-03-03T08:29:07.826126Z

## Critical/High
- [critical] https://thenewfuse.com/observatory status=None issues=['No HTML captured']
- [high] https://thenewfuse.com/api/admin/database status=404 issues=['HTTP status 404', 'Missing title', 'Missing meta description', 'Missing html[lang]', 'Missing H1', 'Missing viewport meta', 'Console errors (1)']
- [high] https://thenewfuse.com/api/admin/features status=404 issues=['HTTP status 404', 'Missing title', 'Missing meta description', 'Missing html[lang]', 'Missing H1', 'Missing viewport meta', 'Console errors (1)']
- [high] https://thenewfuse.com/workspace-settings/agent-model status=200 issues=['Meta description too long (>160)', 'Multiple H1 (2)', 'Runtime page errors (1)']
- [high] https://thenewfuse.com/workspace-settings/chat-model status=200 issues=['Meta description too long (>160)', 'Multiple H1 (3)', 'Runtime page errors (1)']
- [high] https://thenewfuse.com/workspace-settings/llm-selection status=200 issues=['Meta description too long (>160)', 'Multiple H1 (3)', 'Runtime page errors (1)']
