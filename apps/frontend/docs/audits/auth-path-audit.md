# Auth Path Audit

- Generated: 2026-03-27T19:14:27.759Z
- Public base: https://thenewfuse.com
- API base: https://api.thenewfuse.com
- Total checks: 4
- Passed: 4
- Failed: 0

| Check                                         | URL                                        | Status | Expected | Result |
| --------------------------------------------- | ------------------------------------------ | ------ | -------- | ------ |
| Public /api/auth/login compatibility route    | `https://thenewfuse.com/api/auth/login`    | 401    | 400, 401 | PASS   |
| Public /api/v1/auth/login compatibility route | `https://thenewfuse.com/api/v1/auth/login` | 401    | 400, 401 | PASS   |
| Gateway /v1/auth/login canonical route        | `https://api.thenewfuse.com/v1/auth/login` | 401    | 400, 401 | PASS   |
| Public /health route                          | `https://thenewfuse.com/health`            | 200    | 200      | PASS   |
