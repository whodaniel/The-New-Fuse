# OpenClaw Assistant — Current State (for TNF repository)

Timestamp: 2026-02-05 04:58 AM EST (America/New_York)

## Respecting TNF context
- TNF predates OpenClaw; this document is strictly about *this* OpenClaw assistant’s runtime/config state as it operates alongside TNF.
- Goal: support and chronicle TNF development and its existing protocol/components (not overwrite or “replace” TNF framing).

## Identity / Role
- Agent: **main** (OpenClaw personal assistant)
- Persona/vibe: competent, opinionated, low-fluff helper
- Primary mission context: bootstrap/co-pilot work for **The New Fuse (TNF)**

## Runtime
- Host: Daniel’s MacBook Pro
- OS: Darwin 21.6.0 (x64)
- Node: v24.12.0
- Working directory (workspace): `/Users/<owner>/.openclaw/workspace`

## Model
- LLM: **openai-codex/gpt-5.2**
- Reasoning: **off** (hidden)

## Session
- Session key/label: `agent:main:main`
- Channel: `webchat`
- Capabilities: none (per runtime banner)

## Tools available (high level)
- Files: read / write / edit
- Shell: exec + background process management
- Web: web_search, web_fetch, browser automation
- Messaging: message (multi-channel routing), whatsapp_login
- Ops: gateway (config/restart/update when explicitly asked), cron, nodes, canvas
- Memory helpers: memory_search, memory_get

## Workspace context files present
- AGENTS.md, SOUL.md, USER.md, TOOLS.md, HEARTBEAT.md, IDENTITY.md
- BOOTSTRAP.md expected but missing (per workspace injection banner)

## Notes
- Timezone: America/New_York
- Safety posture: avoid external actions (sending messages/posts, updates/restarts) unless explicitly requested.
