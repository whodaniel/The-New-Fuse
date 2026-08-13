# Browser Session Auth Bridge

Reuse an already signed-in browser session to authenticate terminal automation
without filling login forms in the terminal.

## Use when

- a site is already logged in in local browser profile
- terminal login flow is blocked by captcha/SSO/magic-link friction
- Playwright automation needs authenticated access quickly

## Canonical skill

Primary implementation lives at:

`/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/skills/browser-session-auth-bridge/`

## Quick commands

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
./scripts/auth/browser_session_to_playwright_state.sh --url "https://target.example/app"
```

Or use the skill-local exporter:

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/skills/browser-session-auth-bridge
./scripts/export_browser_session_state.sh --url "https://target.example/app"
```

## Security

- state files are secrets
- never commit them
- delete when done (`rm -f /tmp/playwright_state_*.json`)
