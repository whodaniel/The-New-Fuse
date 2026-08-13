# CORS Wildcard Detection

**Detection Method:** Wildcard CORS (`Access-Control-Allow-Origin: *`) can be
detected by making a `curl` request with an arbitrary `Origin` header and
inspecting the response.

**Command:**

```bash
curl -sI -H "Origin: https://evil-test.com" https://{domain}/
```

**Interpretation:**

- **Critical Finding:** If the response headers contain
  `access-control-allow-origin: *`, it indicates a wildcard CORS configuration,
  which is a severe security vulnerability.
- **Expected Behavior:** The `access-control-allow-origin` header should either
  be absent (if cross-origin requests are not allowed), or explicitly list
  allowed origins (e.g., `https://thenewfuse.com`). If a specific origin is
  allowed, the returned `access-control-allow-origin` header will mirror the
  `Origin` header sent in the request (e.g.,
  `access-control-allow-origin: https://evil-test.com`).
