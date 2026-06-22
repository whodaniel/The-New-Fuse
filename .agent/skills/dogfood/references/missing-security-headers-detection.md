# Missing Security Headers Detection

**Detection Method:** Missing security headers can be identified by performing a
`HEAD` request (or `GET` with `-I`) using `curl` and inspecting the response
headers.

**Command:**

```bash
curl -sI --max-time 5 https://{domain}/
```

**Headers to Check (and their implications if missing):**

- **`Strict-Transport-Security` (HSTS):** (Medium) Absence allows downgrade
  attacks and cookie hijacking over insecure connections.
- **`Content-Security-Policy` (CSP):** (Medium) Absence leaves the application
  vulnerable to XSS and data injection.
- **`X-Frame-Options`:** (Critical) Absence allows clickjacking attacks. Should
  be `DENY` or `SAMEORIGIN`.
- **`X-Content-Type-Options`:** (Critical) Absence can lead to MIME type
  sniffing vulnerabilities. Should be `nosniff`.
- **`Referrer-Policy`:** (Low) Absence can lead to leakage of referrer
  information.
- **`Permissions-Policy`:** (Low) Absence allows all features to be used in
  third-party contexts by default.
- **`X-Powered-By`:** (Medium - Information Disclosure) Presence reveals
  technology stack. Should be disabled.

**Interpretation:** For each header, if it is completely absent from the `curl`
output, it is considered missing. The severity level is indicated in
parentheses.
