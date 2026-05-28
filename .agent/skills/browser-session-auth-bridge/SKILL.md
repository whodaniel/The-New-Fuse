---
name: browser-session-auth-bridge
description:
  Reuse an existing signed-in local browser session to authenticate terminal
  automation without interactive login forms. Use when Codex must access a web
  app in Playwright or CLI tools but terminal login is blocked, SSO/captcha is
  difficult, or a user asks for "terminal auth without browser login." Supports
  exporting browser cookies into Playwright storageState for any website/domain.
---

# Browser Session Auth Bridge

## Overview

Export cookies from a user-authenticated browser profile and convert them into a
Playwright `storageState` JSON so terminal/browser automation can run with the
same login state.

## Workflow

1. Confirm the user is already signed in to the target site in a local browser.
2. Run `scripts/export_browser_session_state.sh` with `--url`.
3. Load the output state in Playwright CLI and open the target URL.
4. Verify authenticated access (URL/title/content) and report the result.
5. Treat state files as secrets and clean them up when done.

## Commands

Export state:

```bash
scripts/export_browser_session_state.sh --url "https://example.com/app"
```

Export with explicit browser/domain:

```bash
scripts/export_browser_session_state.sh \
  --url "https://app.example.com/dashboard" \
  --browser chrome \
  --domain example.com
```

Load in Playwright CLI:

```bash
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh open "https://example.com" --browser chrome
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh state-load /tmp/playwright_state_example.com.json
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh goto "https://example.com/app"
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh snapshot
```

## Validation

After loading state, always verify:

- Current URL is still in-app, not redirected to login/signup.
- Page title/content matches an authenticated surface.
- Protected navigation actions succeed.

## Security Rules

- Keep state files outside repositories.
- Set restrictive permissions (`chmod 600`).
- Delete state files after use.
- Never paste cookie values into chat or logs.

## Troubleshooting

Read `references/troubleshooting.md` when cookie extraction returns zero
cookies, browser profile selection fails, or Playwright still redirects to
login.
