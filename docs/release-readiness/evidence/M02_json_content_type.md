# Evidence: M02 — JSON content type, no HTML stubs

## Probes
```
curl -sSI https://api.thenewfuse.com/health
curl -sSI https://api.thenewfuse.com/docs
curl -sSI https://api.thenewfuse.com/pricing
curl -sSI https://api.thenewfuse.com/features
```

## Result (truncated, 2026-06-19T10:11Z)

```
/health    → HTTP/2 200, content-type: application/json
/docs      → HTTP/2 404, content-type: application/json
/pricing   → HTTP/2 404, content-type: application/json
/features  → HTTP/2 404, content-type: application/json
```

All four endpoints serve JSON, not HTML. 404 on `/docs`, `/pricing`, `/features` is a documented gap (no OpenAPI/swagger/specs endpoint yet).

## Verdict

- No HTML override stubs detected: ✅.
- All `Content-Type: application/json` on 2xx/or-404 paths: ✅.
- Missing endpoints return clean JSON 404, not HTML or 500: ✅ partial.
- Hard 404 of `/docs` and `/pricing` against the public marketing language ("Stop duct-taping APIs. Start orchestrating intelligence.") creates a paradox between product surface and operational reality. Fix deliverable: a JSON OpenAPI/swagger emitted at `/docs`; a JSON product-spec at `/pricing`; same for `/features`.

## Action

API team to ship three endpoints that return 200 with JSON spec bodies. Until then, public release can be defended only with explicit caveats about non-functional documentation endpoints.
