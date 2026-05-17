---
name: pi-coding-agent
description: "MUST BE USED for coding tasks requiring autonomous file editing, bash execution, and multi-provider LLM inference. Pi is a TUI-based AI coding agent with read/bash/edit/write tools, multi-provider support (Google, Anthropic, OpenAI, OpenRouter, NVIDIA, DeepSeek, etc.), skills, extensions, sessions, and plan-mode capabilities. Ingested from @earendil-works/pi-coding-agent v0.74.1."
tools: [Read, Write, Edit, Bash, Grep, Find, Ls]
color: Cyan
provider: multi
config_dir: ~/.pi/agent
cli: pi
version: 0.74.1
package: "@earendil-works/pi-coding-agent"
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
tags:
  - coding
  - autonomous
  - multi-provider
  - tui
  - skills
  - extensions
  - sessions
  - read-write-edit-bash
---

# Pi Coding Agent

## Purpose
Autonomous AI coding agent with a TUI interface, capable of reading, editing, writing files and executing bash commands. Supports multi-provider LLM routing with model cycling, thinking levels, and session persistence.

## Core Responsibilities
- Autonomous code editing with read/write/edit tools
- Bash command execution within project context
- Multi-provider LLM inference (Google, Anthropic, OpenAI, OpenRouter, NVIDIA, DeepSeek, etc.)
- Skill-based capability extension (loads from `~/.pi/agent/skills/` and `~/.agents/skills/`)
- Extension system for adding new tools and CLI flags
- Session persistence and resumption (`--continue`, `--resume`, `--session`)
- Plan-mode for structured task decomposition
- Thinking level control (off, minimal, low, medium, high, xhigh)
- Model cycling with Ctrl+P during sessions

## TNF Integration Points

### Existing Bridges
- **Concordance skill**: Already symlinked at `~/.pi/agent/skills/` via `~/.agents/skills/concordance`
- **Terminal Director Bridge**: Already present in `~/.agents/skills/terminal-director-bridge`
- **Supabase skills**: Symlinked from `~/.agents/skills/supabase*`

### Bridge Requirements (To Implement)
1. **Synaptic Bus Bridge**: Connect Pi sessions to TNF Redis Synaptic Bus for A2A communication
2. **Handoff Protocol**: Export Pi session context to TNF handoff packet format
3. **Director Integration**: Register Pi as a callable worker in the TNF Director pool
4. **Model Health**: Feed Pi provider failures to TNF model-watchdog for failover coordination
5. **Validation Pipeline**: Integrate Pi code edits with TNF pre/post-implementation validators

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
- **Pipeline**: Pi as a coding stage in multi-agent pipelines (receive spec, emit code)
- **Swarm**: Parallel Pi instances with different models for perspective diversity
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
```
