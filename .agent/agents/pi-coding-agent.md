---
name: pi-coding-agent
description:
  'MUST BE USED for coding tasks requiring autonomous file editing, bash
  execution, and multi-provider LLM inference. Pi is a TUI-based AI coding agent
  with read/bash/edit/write tools, multi-provider support (Google, Anthropic,
  OpenAI, OpenRouter, NVIDIA, DeepSeek, etc.), skills, extensions, sessions, and
  plan-mode capabilities. Ingested from @earendil-works/pi-coding-agent v0.74.1.'
tools: [Read, Write, Edit, Bash, Grep, Find, Ls]
color: Cyan
provider: multi
config_dir: ~/.pi/agent
cli: pi
version: 0.74.1
package: '@earendil-works/pi-coding-agent'
capabilities:
  - autonomous-code-editing
  - multi-provider-llm
  - skill-loading
  - extension-system
  - session-persistence
  - plan-mode
  - thinking-levels
  - model-cycling
  - non-interactive-mode
  - session-export
  - context-file-discovery
  - prompt-templates
  - theming
  - web-browsing
  - web-search
  - url-scraping
tags:
  - coding
  - autonomous
  - multi-provider
  - tui
  - skills
  - extensions
  - sessions
  - read-write-edit-bash
  - web
---

# Pi Coding Agent

## Purpose

Autonomous AI coding agent with a TUI interface, capable of reading, editing,
writing files and executing bash commands. Supports multi-provider LLM routing
with model cycling, thinking levels, and session persistence.

## Core Responsibilities

- Autonomous code editing with read/write/edit tools
- Bash command execution within project context
- Multi-provider LLM inference (Google, Anthropic, OpenAI, OpenRouter, NVIDIA,
  DeepSeek, etc.)
- Skill-based capability extension (loads from `~/.pi/agent/skills/` and
  `~/.agents/skills/`)
- Extension system for adding new tools and CLI flags
- Session persistence and resumption (`--continue`, `--resume`, `--session`)
- Plan-mode for structured task decomposition
- Thinking level control (off, minimal, low, medium, high, xhigh)
- Model cycling with Ctrl+P during sessions

## TNF Integration Points

### Existing Bridges

- **Concordance skill**: Available at `~/.agents/skills/codebase-concordance`
- **Terminal Director Bridge**: Model-watchdog integration via scripts
- **Web Browsing/Search skills**: Linked at `~/.pi/agent/skills/`:
  - `agent-browser` - Interactive browser automation (click, type, navigate)
  - `crawl4ai` - Read-only public URL extraction to Fit Markdown
  - `browser-session-auth-bridge` - Authenticated session reuse
  - `brave-search` - AI-optimized web search via Brave Search API

### Bridge Requirements (To Implement)

1. **Synaptic Bus Bridge**: Connect Pi sessions to TNF Redis Synaptic Bus for
   A2A communication
2. **Handoff Protocol**: Export Pi session context to TNF handoff packet format
   (_scripts/pi-session-handoff.cjs available_)
3. **Director Integration**: Register Pi as a callable worker in the TNF
   Director pool
4. **Model Health**: Feed Pi provider failures to TNF model-watchdog for
   failover coordination
5. **Validation Pipeline**: Integrate Pi code edits with TNF
   pre/post-implementation validators

## Web Browsing & Search Usage

### Web Search (Brave Search)

```bash
node {baseDir}/scripts/search.mjs "query"              # Basic search (5 results)
node {baseDir}/scripts/search.mjs "query" -n 10         # More results
node {baseDir}/scripts/search.mjs "query" --content     # Include page content
```

### Browser Automation (agent-browser)

```bash
agent-browser open <url>
agent-browser snapshot -i
agent-browser click @e1
agent-browser fill @e2 "text"
agent-browser close
```

### Read-Only URL Extraction (Crawl4AI)

```bash
pnpm run tnf:start:crawler:local  # Start service
curl -X POST http://localhost:8000/scrape -H 'Content-Type: application/json' -d '{"url":"https://example.com"}'
```

### Environment Variables for Web Operations

- `BRAVE_API_KEY` — Required for brave-search skill
- `PI_WEB_SEARCH_ENABLED` — Set to "true" to enable web search by default

## CLI Interface

```
pi [options] [@files...] [messages...]

Key flags:
  --provider <name>     Provider name (default: google)
  --model <pattern>     Model pattern or ID (supports "provider/id" and ":<thinking>")
  --thinking <level>    off, minimal, low, medium, high, xhigh
  --skill <path>        Load a skill file or directory
  --extension <path>    Load an extension file
  --mode <mode>         text (default), json, or rpc
  --print, -p           Non-interactive mode
  --continue, -c        Continue previous session
  --tools <tools>       Comma-separated allowlist of tool names
```

## Environment Variables

- `GEMINI_API_KEY` — Google Gemini (default provider)
- `ANTHROPIC_API_KEY` — Claude models
- `OPENAI_API_KEY` — GPT models
- `OPENROUTER_API_KEY` — OpenRouter gateway
- `NVIDIA_API_KEY` — NVIDIA NIM endpoints (via OpenRouter or direct)
- `PI_CODING_AGENT_DIR` — Config directory (default: ~/.pi/agent)
- `PI_OFFLINE` — Disable startup network operations

## Coordination Patterns

- **Pipeline**: Pi as a coding stage in multi-agent pipelines (receive spec,
  emit code)
- **Swarm**: Parallel Pi instances with different models for perspective
  diversity
- **Map-Reduce**: Pi workers for distributed code generation tasks
- **Consensus**: Multiple Pi runs with different providers for code review

## Spawn Protocol (from Hermes)

```bash
# Non-interactive coding task
pi -p --provider google --model gemini-2.5-flash "Refactor src/auth.ts to use JWT"

# With TNF skills loaded
pi --skill ~/.hermes/skills/tnf-continuous-correction-flywheel -p "Audit the API layer"

# Session for review and continuation
pi --session tnf-review-$(date +%s) --continue

# Web search example
BRAVE_API_KEY=xxx node scripts/search.mjs "latest ai coding practices 2026" -n 5 --content

# Browser automation example
pi -p --skill .agent/skills/agent-browser "Open example.com, fill form, submit"
```
