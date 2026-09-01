---
name: crawl4ai
category: browser-automation
department: tech
description:
  Use for read-only public URL extraction into LLM-optimized Fit Markdown.
  Prefer this over browser automation when the task is to read or scrape a page
  without clicking, logging in, or filling forms.
---

# Crawl4AI Skill

## When to use

- Public documentation, articles, marketing pages, API docs
- Token-efficient markdown for agent context
- Any **read-only** URL fetch

## When NOT to use

- Authenticated dashboards / SSO / logged-in accounts
- Multi-step UI flows (click, type, submit)
- Sites that require a persistent browser session

For those, use `agent-browser` + `browser-session-auth-bridge`.

## Start the local service

```bash
pnpm run tnf:start:crawler:local
# or Docker:
pnpm run tnf:start:crawler
```

Default endpoint: `http://localhost:8000/scrape`  
Override: `CRAWL4AI_SERVICE_URL`

## Agent / MCP usage

- MCP tool: `scrape_website_crawl4ai`
- CLI agent tool: `web_fetch` (prefers Crawl4AI, falls back to direct HTTP)

## Verify

```bash
curl -sS -X POST http://localhost:8000/scrape \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","max_chars":2000}' | head
```
