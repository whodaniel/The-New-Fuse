# Evidence: M05 — WhatsApp / Telegram forward surface

## Probes

```
ls /tmp/tg_curl_wrapper.sh apps/telegram-mcp/bot_daemon_curl.py
curl -m 2 http://127.0.0.1:3010/health
pgrep -fa "bot_daemon_curl"
```

## Result (2026-06-19T10:14Z)

- `apps/telegram-mcp/bot_daemon_curl.py` exists in repo.
- `/tmp/tg_curl_wrapper.sh` does not exist in this session.
- No `bot_daemon_curl` process is running.
- `127.0.0.1:3010` refused (no listener).

## Verdict

- Source artifact present: ✅.
- Wrapper script: not currently on disk (intermittent/temp).
- Active process: not running.
- Public health endpoint: not exposed on laptop.
- QR pairing: not verified from here.

## Status

⚠ partial — `M05` describes the bridge as reachable from the runtime. On the public release surface this must be a *paired, observable,* and capturable `connected` state, not a paper claim. The Telegram bridge assumes a single-tenant `phone-cloud` model; the WhatsApp story is similar but with QR pairing. Until a real `status: connected` proof point is shown, treat `M05` as not signed-off.

## Action

1. Pair WhatsApp QR before public launch.
2. Expose bridge health endpoint at `https://api.thenewfuse.com/bridges/telegram` and `…/bridges/whatsapp`, both returning 200 JSON with `connected`, `channels`, and `last_seen_ago`.
3. Add to CI probes.
