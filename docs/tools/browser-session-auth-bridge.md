# Browser Session Auth Bridge

Status: ACTIVE companion to `.agent/skills/browser-session-auth-bridge`

## Purpose

Export cookies from an already signed-in local browser profile into a
Playwright-compatible `storageState` JSON, then load that state into
**agent-browser** / `tnf browser` so agents can use authenticated sites without
driving the operator's live Default Chrome via Dev-mode extension flags.

## When to use

- Target site is already logged in in Chrome (or Chromium/Brave/Edge/Firefox)
- Terminal/agent login is blocked by captcha, SSO, or magic-link friction
- Interactive automation needs cookies/session, not a blank profile

## Export

From the TNF repo root:

```bash
./scripts/auth/browser_session_to_playwright_state.sh \
  --url "https://app.example.com/dashboard" \
  --skip-playwright
```

Or the skill-local exporter:

```bash
./.agent/skills/browser-session-auth-bridge/scripts/export_browser_session_state.sh \
  --url "https://app.example.com/dashboard"
```

Default output: `/tmp/playwright_state_<domain>.json` (mode `600`).

## Load into TNF agent-browser

```bash
tnf browser start \
  --state /tmp/playwright_state_app.example.com.json \
  --url https://app.example.com/dashboard

# equivalent:
agent-browser --state /tmp/playwright_state_app.example.com.json \
  open https://app.example.com/dashboard --headed
```

Agents can also pass `stateFile` to the `browser_interact` tool.

## Prefer over

- `h17-webpilot` / `webpilot start`
- `tnf browser legacy-*` (extension + `:7331` WebSocket)

Those paths launch an isolated Dev-mode profile and commonly fail with
`Extension not connected`.

## Security

- State files contain session tokens — never commit them
- Delete when done: `rm -f /tmp/playwright_state_*.json`
- See also: `docs/tools/BROWSER_STACK_MIGRATION.md`
