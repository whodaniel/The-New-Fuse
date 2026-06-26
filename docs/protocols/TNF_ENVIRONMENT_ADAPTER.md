# TNF Environment Discovery Adapter — Canonical Procedure (TNF-EDA-001)

Status: ACTIVE • Doc-Tag: TNF-EDA-001

## Mission
The first time a user installs the open-source TNF repo on a new machine, the system they have is unknown:
- They may have **any** local AI agent installed (Claude Code, Codex CLI, Gemini CLI, Hermes,
  OpenCode, Pi, Antigravity, Kilo, Cursor, Trae, OpenClaw, OpenInterpreter, Aider, Cline, Continue,
  Roo Code, Windsurf, Tabby, …).
- They may run **any** infrastructure (Redis, Postgres, sqlite, Qdrant, Chroma, OLLama, LM Studio,
  llama.cpp, vLLM, Stable Diffusion, ComfyUI, Whisper, Elasticsearch, Prometheus, …).
- They may carry **any** LLM-provider memberships in `~/.config/<provider>/` or in env vars
  (openai, anthropic, google, mistral, nvidia, openrouter, deepseek, groq, together, fireworks,
  xai, cohere, upstage, perplexity, replicate, runpod, modal, banana, …).
- They may already have **running agents** on ports 3000–9000.
- They may have **information stores** (`~/Documents`, `~/Notes`, `*.md`, vaults, sqlite, JSONL
  archives, vector DBs).
- They may have **apps** referenced via Mac `lsappinfo`, Windows shell apps, or Linux `.desktop`.

TNF CLI must:
1. **Discover** all of the above on first run.
2. **Classify** each finding into one of: `agent | infrastructure | app | information | llm-provider | running-agent`.
3. **Probe** each finding with a bounded-deadline handshake (≤ 500ms per probe).
4. **Adapt** the runtime: register living agents, mount infrastructure, surface apps/information.
5. **Persist** the result as `~/.tnf/environment-manifest.json` so the next boot is incremental.

## Hard Constraints
- Discovery is **read-only and idempotent**. It never mutates the user's machine.
- Probes are **bounded by wall-clock deadline**. Any probe that hangs for >500ms → marked `unreachable` (not failure).
- Hard-coded secrets in the manifest are **never written**. Only metadata (key name, key length, host) is recorded. Secrets themselves are read at runtime through `tnf-auth`.
- The adapter runs as a **single-shot subprocess** and never blocks the boot flow.

## Surface Map (Stable IDs)

| Surface | Path / Source | What we extract |
| --- | --- | --- |
| `surface:agents:cli` | `which <cli>` for known CLIs | binary path, version flag, runtime |
| `surface:infrastructure:bin` | `command -v` for daemons (redis-server, postgres, qdrant, ollama) | binary path, listening ports from `lsof -i` |
| `surface:infrastructure:listening` | `lsof -nP -iTCP -sTCP:LISTEN` on macOS / Linux | host:port, PID, process name |
| `surface:provider:env` | `env` filtered against provider key regexes | key name, but never the value |
| `surface:provider:keychain` | macOS Keychain / Linux `secret-tool` (optional, opt-in) | key name only |
| `surface:app:macos` | `lsappinfo list` (mac only) | bundle id, displayName |
| `surface:info:home` | `~/Documents`, `~/Notes`, `~/Obsidian`, `*.md`, `*.sqlite` | glob summary, size only |
| `surface:running:ollama` | HTTP probe `http://localhost:11434/api/tags` | available models (no auth needed) |
| `surface:running:lms` | HTTP probe `http://localhost:1234/v1/models` | available models |
| `surface:running:openai-compatible` | HTTP probe other ports matching OpenAI shape | unknown |

## Output Schema (`~/.tnf/environment-manifest.json`)
```
{
  "schemaVersion": "1.0",
  "host": { "platform": "...", "arch": "...", "hostname": "..." },
  "discoveredAt": "ISO8601",
  "surfaces": {
    "agents": [ { "name", "kind", "binary", "version?", "probe": "alive|unreachable|unknown" } ],
    "infrastructure": [ { "name", "kind", "status", "ports": [...] } ],
    "providers": [ { "name", "key-name", "key-length", "source": "env|keychain|config" } ],
    "apps": [ { "name", "kind", "bundle-id" } ],
    "information": [ { "name", "kind", "path", "size" } ],
    "running-models": [ { "name", "url", "models": [...] } ]
  },
  "decisions": {
    "fallback_chain": [...],         // auto-built provider fallback
    "mountable_agents": [...],       // agents we can marshal with `tnf assimilate`
    "feature_parity": [...],         // skills/features gained by this environment
    "skipped": [...]                 // surfaces we deliberately ignored (and why)
  }
}
```

## Integration Points
- First-run hook: invoked from `./tnf boot` step [0/14] before port-preflight.
- Reconcile hook: invoked from `tnf agents reconcile --incremental`.
- Export: `tnf environment show --json` and `tnf environment show --summary`.

## Self-Evolution Hook
Surfaces above are seeded; new incoming surfaces land in
`docs/protocols/TNF_ENVIRONMENT_ADAPTER_REGISTRY.json` and become part of the next release.
