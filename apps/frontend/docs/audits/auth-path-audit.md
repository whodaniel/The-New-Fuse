# Auth Path Audit

- Generated: 2026-06-22T16:09:32.235Z
- Public base: https://thenewfuse.com
- API base: https://api.thenewfuse.com
- Total checks: 4
- Passed: 2
- Failed: 2

| Check                                         | URL                                        | Status | Expected | Result |
| --------------------------------------------- | ------------------------------------------ | ------ | -------- | ------ |
| Public /api/auth/login compatibility route    | `https://thenewfuse.com/api/auth/login`    | 401    | 400, 401 | PASS   |
| Public /api/v1/auth/login compatibility route | `https://thenewfuse.com/api/v1/auth/login` | 404    | 400, 401 | FAIL   |
| Gateway /v1/auth/login canonical route        | `https://api.thenewfuse.com/v1/auth/login` | 404    | 400, 401 | FAIL   |
| Public /health route                          | `https://thenewfuse.com/health`            | 200    | 200      | PASS   |

## Failures

- **Public /api/v1/auth/login compatibility route**
  (https://thenewfuse.com/api/v1/auth/login) -> status: 404; snippet:
  `{"message":"Cannot POST /api/v1/auth/login","error":"Not Found","statusCode":404}`
- **Gateway /v1/auth/login canonical route**
  (https://api.thenewfuse.com/v1/auth/login) -> status: 404; snippet:
  `{"message":"Cannot POST /v1/auth/login","error":"Not Found","statusCode":404}`
