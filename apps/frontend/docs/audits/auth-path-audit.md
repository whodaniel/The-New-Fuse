# Auth Path Audit

- Generated: 2026-05-17T04:36:36.352Z
- Public base: https://app.thenewfuse.com
- API base: https://api.thenewfuse.com
- Total checks: 4
- Passed: 3
- Failed: 1

| Check                                         | URL                                            | Status | Expected | Result |
| --------------------------------------------- | ---------------------------------------------- | ------ | -------- | ------ |
| Public /api/auth/login compatibility route    | `https://app.thenewfuse.com/api/auth/login`    | 404    | 400, 401 | FAIL   |
| Public /api/v1/auth/login compatibility route | `https://app.thenewfuse.com/api/v1/auth/login` | 401    | 400, 401 | PASS   |
| Gateway /v1/auth/login canonical route        | `https://api.thenewfuse.com/v1/auth/login`     | 401    | 400, 401 | PASS   |
| Public /health route                          | `https://app.thenewfuse.com/health`            | 200    | 200      | PASS   |

## Failures

- **Public /api/auth/login compatibility route**
  (https://app.thenewfuse.com/api/auth/login) -> status: 404; snippet:
  `{"statusCode":404,"timestamp":"2026-05-17T04:36:36.175Z","path":"/api/auth/login","method":"POST","message":"Cannot POST /api/auth/login","error":"Not Found"}`
