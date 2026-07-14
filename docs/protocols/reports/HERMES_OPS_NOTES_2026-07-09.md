# Hermes Ops Notes — 2026-07-09

`[CLASS:INTEL] [STATUS:VETTED] [DOC_TYPE:OPS_NOTE] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

## Web UI build (resolved)

`tnf hermes update` failed web build because `web` workspace devDependencies
were not installed. Fix:
`cd ~/.hermes/hermes-agent && npm install --workspace web && npm run build --workspace web`.
Build succeeded; dist at `hermes_cli/web_dist/`.

## platform.matrix lazy backend (known limitation)

`platform.matrix` requires `python-olm` which needs `cmake` + native libolm
build on macOS. Pip error: `cmake` subprocess failed building `python-olm`
wheel. Workaround: install cmake/libolm via Homebrew if Matrix encryption is
needed, or skip Matrix platform. Hermes keeps previously-installed version;
Matrix adapter unavailable until resolved.

## Heartbeat self-wake cron (resolved)

Cron job `8aa92239ce2c` had wrong script path
`scripts/agents/tnf-heartbeat-selfwake.py` (Hermes resolves relative to
`~/.hermes/scripts/`, producing doubled `scripts/scripts/`). Fix:

1. Copy canonical script to `~/.hermes/scripts/agents/tnf-heartbeat-selfwake.py`
2. Update `~/.hermes/cron/jobs.json` script field to
   `agents/tnf-heartbeat-selfwake.py`

When repo script changes, re-copy:
`cp <repo>/scripts/agents/tnf-heartbeat-selfwake.py ~/.hermes/scripts/agents/`

## Daemon persistence

Use `tnf alive up` (detached + Redis status). Foreground `python3 ... live`
exits when parent session ends.

**Open issue (2026-07-09):** Daemon may self-terminate after tool-call errors:
`LLMClient._tool_redis_operation() got an unexpected keyword argument 'start'/'end'/'stop'`.
Log: `~/.tnf/logs/daemon.log`. Heartbeat self-wake cron
(`agents/tnf-heartbeat-selfwake.py`, \*/5) restarts daemon when down; fix
requires patching `tnf-agent-daemon.py` / LLMClient redis tool schema.

## Multi-Agent Operations Fixes (2026-07-09)

1. **Local-Director Cron Spam (resolved):** `tnf-director-loop.cjs` was
   persisting its task queue purely in-memory. Because it's invoked via cron, it
   reset its `resonancePool` every minute, creating an infinite spam loop.
   **Fix:** Refactored to load and persist `resonancePool.json` from
   `~/.tnf/director/state/`.
2. **Terminal Heartbeat Misidentification (resolved):**
   `terminal-heartbeat-pulse.cjs` injected heartbeats into any terminal screen
   scraping words like "gemini" or "claude" (which `pi` prints on startup).
   **Fix:** Officially registered `pi` in `AGENT_COMMAND_HINTS` and hardened
   string matching using word boundaries (`\b`).
3. **Pi Agent 410 Gone Error (resolved):** `pi` threw 410 errors because
   `z-ai/glm-5.1` is no longer active. **Fix:** Re-aligned
   `~/.pi/agent/settings.json` to match Hermes's fallback (`nvidia` /
   `minimaxai/minimax-m3`).
