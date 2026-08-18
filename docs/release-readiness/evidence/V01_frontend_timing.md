# Evidence: V01 — Frontend page-load timing

## Probe

```
for i in 1..5; do curl -sS -o /dev/null -w "code=%{http_code} total=%{time_total}s ttfb=%{time_starttransfer}s\n" https://thenewfuse.com; done
```

## Result (2026-06-19T10:14Z)

```
code=200 total=0.154384s ttfb=0.150415s
code=200 total=0.139922s ttfb=0.135797s
code=200 total=0.146201s ttfb=0.140377s
code=200 total=0.146893s ttfb=0.140796s
code=200 total=0.158443s ttfb=0.152451s
```

## Verdict

- All 5 probes: HTTP 200.
- p50 ~146 ms, p95 ~158 ms ≪ 2000 ms gate.
- TTFB consistently below 155 ms ⇒ edge cache is warm.

## Status

✅ clean. Frontend meets ≤ 2 s gate with one order-of-magnitude headroom.
