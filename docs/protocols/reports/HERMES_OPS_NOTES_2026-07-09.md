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
