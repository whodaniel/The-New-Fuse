The /api/auth endpoints are returning 404. The root cause is a URI versioning
mismatch. The AuthModule is registered at /api/v1/auth/_, but clients are
calling /api/auth/_.

Fix applied:

1. Added middleware to main.ts that rewrites /api/auth to /api/v1/auth using
   anchored regex to prevent overly broad replacement
2. Updated RegistrationForm.tsx: `export const API_BASE_URL = '/api/v1'`
3. Updated e2e/fixtures/test-data.ts: `export const API_BASE_URL = '/api/v1'`
4. Updated cloudflare-worker-auth-proxy.js: replaced placeholder URL with env
   variable, fixed double /auth/v1 path construction, added apikey header
   forwarding

Verify: curl -s -X POST https://api.thenewfuse.com/api/auth/register -H
"Content-Type: application/json" -d
'{"email":"test@test.com","password":"testpassword"}' Expected: 200 instead of
404
