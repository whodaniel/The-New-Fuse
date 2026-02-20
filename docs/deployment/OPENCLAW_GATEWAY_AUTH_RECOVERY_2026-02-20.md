# OpenClaw Local Gateway Auth Recovery Runbook (2026-02-20)

## Symptom

Control UI showed:

- `disconnected (1008): unauthorized: device token mismatch`
- then `disconnected (1008): unauthorized: gateway token mismatch`

## Root Cause

Not caused by TNF LLM provider middleware.  
This was a local OpenClaw gateway auth/session state issue with service
lifecycle drift:

- stale/competing gateway process state
- Control UI using token state that did not match active gateway token
- launch agent needed clean re-registration

## Recovery Steps That Worked

1. Verify token source of truth:

```bash
jq -r '.gateway.auth.token, .gateway.auth.mode' ~/.openclaw/openclaw.json
plutil -p ~/Library/LaunchAgents/ai.openclaw.gateway.plist | rg OPENCLAW_GATEWAY_TOKEN
```

2. Reinstall gateway launch agent with official CLI flow:

```bash
openclaw gateway install
```

3. Start/restart gateway service:

```bash
openclaw gateway start
```

Expected output includes:

- `Restarted LaunchAgent: gui/501/ai.openclaw.gateway`

4. Open dashboard using CLI-authenticated URL (critical):

```bash
openclaw dashboard
```

This opened:

- `http://127.0.0.1:18789/#token=<url-encoded-token>`

Using this URL avoids manual token mismatch in Control UI.

## Token Used During Recovery

Gateway token in use during successful recovery:

- `[REDACTED_ROTATED_TOKEN]`

## Operator Procedure (If It Happens Again)

1. Close all OpenClaw dashboard tabs.
2. Run:

```bash
openclaw gateway install
openclaw gateway start
openclaw dashboard
```

3. Keep only the newly opened tokenized dashboard tab.
4. Click `Connect` once.

## Notes

- `openclaw status` can hang in some environments due plugin/provider checks;
  use gateway install/start/dashboard as primary recovery path.
- Existing warning about Telegram `allowFrom` non-numeric entries is unrelated
  to gateway token auth.
