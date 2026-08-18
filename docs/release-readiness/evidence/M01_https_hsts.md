# Evidence: M01 — HTTPS + HSTS

## Probe
```
curl -sSI https://thenewfuse.com
```

## Result (truncated, 2026-06-19T10:11:17Z)

```
HTTP/2 200
date: Fri, 19 Jun 2026 10:11:17 GMT
content-type: text/html; charset=utf-8
server: cloudflare
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
```

## Verdict

- HTTPS reachable: yes (`HTTP/2 200`).
- Cloudflare-managed: yes (`server: cloudflare`).
- `Strict-Transport-Security` header present: **no**, in this response.
- HSTS is already an option at Cloudflare edge; toggle to add it.
- Status in checklist: ⚠ partial (one-click fix).

## Action

Enable HSTS at Cloudflare edge for `thenewfuse.com` with `max-age=63072000; includeSubDomains; preload`. Re-run probe to flip status.
