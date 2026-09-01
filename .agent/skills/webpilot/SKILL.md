---
name: webpilot
category: browser-automation
department: tech
description:
  DEPRECATED alias. Interactive browser work now uses agent-browser; read-only
  public URL extraction uses Crawl4AI. Authenticated session reuse uses
  browser-session-auth-bridge. Do not install or start h17-webpilot for new
  work.
---

# Webpilot Skill (Deprecated)

**Do not use `h17-webpilot` / `webpilot start` for new TNF work.**

That path launches a separate Chrome profile with an unpacked extension and
commonly fails with `Extension not connected` while leaving a blank Dev-mode
browser beside the operator's signed-in Chrome.

## Canonical replacements

| Job                                        | Use                                                           |
| ------------------------------------------ | ------------------------------------------------------------- |
| Read-only public URL / Fit Markdown        | `.agent/skills/crawl4ai` + `pnpm run tnf:start:crawler:local` |
| Click / type / navigate / authenticated UI | `.agent/skills/agent-browser` + `tnf browser ...`             |
| Reuse already-signed-in cookies            | `.agent/skills/browser-session-auth-bridge`                   |

## CLI

```bash
# Interactive (primary)
tnf browser start --profile Default --url https://example.com
tnf browser exec snapshot
tnf browser stop

# Read-only scrape
pnpm run tnf:start:crawler:local
# then MCP scrape_website_crawl4ai or agents web_fetch

# Auth state export for automation
./scripts/auth/browser_session_to_playwright_state.sh --url "https://app.example.com" --skip-playwright
tnf browser start --state /tmp/playwright_state_app.example.com.json --url https://app.example.com
```

## Legacy only

`packages/tnf-browser` extension/WebSocket runtime remains for current Tauri
desktop bridge compatibility via:

```bash
tnf browser legacy-start
tnf browser legacy-exec "go https://example.com"
tnf browser legacy-stop
```

Prefer agent-browser for all new agent orchestration.
