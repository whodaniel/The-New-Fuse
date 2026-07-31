# TNF Browser Stack Migration

Status: ACTIVE (2026-07-31)

## Decision

TNF keeps **two** web capabilities and stops preferring Hugo Palma /
`h17-webpilot` Dev-mode Chrome for agent work:

1. **Crawl4AI** — read-only public scrape → Fit Markdown
2. **agent-browser** — interactive / authenticated browser control

Authenticated cookies are imported through the existing
**browser-session-auth-bridge** (Playwright storageState), not by attaching to
the operator's live Default Chrome process via unpacked extension flags.

## Why

`packages/tnf-browser` (assimilated Webpilot fork) and `h17-webpilot` launch a
separate profile with `--load-extension`. On branded Google Chrome this often
times out (`Extension not connected`) and produces a blank automation window
while the operator's signed-in Chrome remains separate.

TNF already had better pieces:

- `.agent/skills/agent-browser`
- `.agent/skills/browser-session-auth-bridge`
- `packages/web-scraping` Crawl4AI service
- GoalPlanner already preferred agent-browser for many browser goals

## Routing

```
scrape / read public URL  → Crawl4AI (web_fetch / scrape_website_crawl4ai)
interact / auth UI        → agent-browser (tnf browser / browser_interact)
reuse signed-in cookies   → browser-session-auth-bridge → --state / state load
Tauri legacy panel only   → tnf browser legacy-*
```

## Operator commands

```bash
# Interactive headed session using a Chrome profile snapshot
tnf browser start --profile Default --url https://example.com

# Or dedicated persistent agent profile
tnf browser start --profile ~/.tnf/agent-chrome-profile --url https://example.com

# Auth bridge
./scripts/auth/browser_session_to_playwright_state.sh \
  --url "https://app.example.com" --skip-playwright
tnf browser start --state /tmp/playwright_state_app.example.com.json \
  --url https://app.example.com
```

## Compatibility

- `tnf browser legacy-start|legacy-exec|legacy-stop` still wraps
  `packages/tnf-browser` for Tauri desktop bridge consumers.
- `.agent/skills/webpilot` is retained as a **deprecated redirect** so old
  prompts do not resurrect `h17-webpilot`.

## Docs

- `docs/tools/CRAWL4AI_INTEGRATION.md`
- `docs/tools/browser-session-auth-bridge.md`
- Skills:
  `.agent/skills/{agent-browser,crawl4ai,browser-session-auth-bridge,webpilot}`
