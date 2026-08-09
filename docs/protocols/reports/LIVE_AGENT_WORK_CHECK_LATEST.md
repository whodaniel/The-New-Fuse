# TNF Live Agent Work Check

- Generated: 2026-08-09T02:13:34.605Z
- Verdict: CAUTION
- Repo: /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse

## Findings

- WARN local-subdirector-attention: Local Subdirector heartbeat is stale or not
  healthy.
- WARN full-auto-stale: Full-auto state has not updated recently.
- WARN protected-full-auto-tokens-missing: Protected full-auto remains gated
  because input/policy tokens are missing.

## Git

- ## fix/honest-failure-reporting...origin/fix/honest-failure-reporting [ahead 13]
- Dirty files: 35
- Stashes: 38
- Index lock: absent

## Launchd

| Label                         | State   |   PID | Last Exit |
| ----------------------------- | ------- | ----: | --------: |
| com.tnf.local-subdirector     | loaded  | 39570 |         0 |
| com.tnf.master-heartbeat      | loaded  | 97422 |         0 |
| com.tnf.fleet-health-probe    | missing |     - |         - |
| com.tnf.master-reconciliation | loaded  |     - |         1 |
| com.thenewfuse.redis-tnf-bus  | loaded  | 76532 |         0 |
| com.thenewfuse.api-local      | loaded  | 35257 |         0 |
| com.thenewfuse.api-gateway    | loaded  | 36293 |         0 |
| com.tnf.voice-beam-watchdog   | loaded  | 35502 |         0 |

## Relay

- Health: healthy
- Listener: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
- Master-clock process count: 1
- WS channel probe: pass

## State Files

| Anchor            | Freshness | Status   |   Age | Generated                |
| ----------------- | --------- | -------- | ----: | ------------------------ |
| local-subdirector | fresh     | critical |   15s | 2026-08-09T02:13:19.865Z |
| master-heartbeat  | fresh     | healthy  |    7s | 2026-08-09T02:13:29.245Z |
| core-fleet        | fresh     | true     |  536s | 2026-08-09T02:04:07.398Z |
| home-handoff      | fresh     | n/a      |  572s | 2026-08-09T01:44:19.914Z |
| repo-handoff      | fresh     | n/a      | 1321s | 2026-08-09T01:44:19.914Z |

## Agent Processes

- 39570 1 S 33:24 /Users/danielgoldberg/.local/bin/node
  /Users/danielgoldberg/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs
- 90324 49415 S 03:40:26
  /Applications/Claude.app/Contents/Helpers/chrome-native-host
  chrome-extension://fcoeoabgfenejglbffodgkkbkcdhcgfn/
- 97422 1 S 01:00:31 /Users/danielgoldberg/.local/bin/node
  /Users/danielgoldberg/.tnf/master-heartbeat/bin/tnf-master-heartbeat-loop.cjs
- 2075 1371 S+ 06:44:55 node /Users/danielgoldberg/.hermes/node/bin/codex
  --dangerously-bypass-approvals-and-sandbox
- 2076 2075 R+ 06:44:55
  /Users/danielgoldberg/.hermes/node/lib/node_modules/@openai/codex/node_modules/@openai/codex-darwin-x64/vendor/x86_64-apple-darwin/bin/codex
  --dangerously-bypass-approvals-and-sandbox
- 98043 2076 S 02:42:59
  /Users/danielgoldberg/.hermes/node/lib/node_modules/@openai/codex/node_modules/@openai/codex-darwin-x64/vendor/x86_64-apple-darwin/bin/codex-code-mode-host
- 61523 60837 R+ 20:03 claude
- 79138 78479 S+ 05:20:40 /Users/danielgoldberg/.local/bin/cursor-agent
  --use-system-ca
  /Users/danielgoldberg/.local/share/cursor-agent/versions/2026.08.04-aaa8809/index.js
- 33030 32459 S+ 04:35:51 claude
- 66454 65571 S+ 04:04:47 opencode

## Operating Rule

Agents should run `pnpm run tnf:live:agents:write` before claiming fleet
success, committing multi-agent work, or handing off after concurrent agent
activity. A BLOCK verdict means pause new autonomous work and repair the
reported live-state gap first.

If the report contains `redis-wedged`, agents must not launch more Redis clients
or bootstrap loops. The Local Subdirector should serialize recovery: stop stuck
Redis callers, restart `com.thenewfuse.redis-tnf-bus`, refresh
`com.tnf.master-heartbeat`, and rerun this check.

If the report contains `redis-unavailable`, do not trust launchd loaded state or
PID alone. Run `bash scripts/runtime/redis-local-bootstrap.sh launchd-start`,
require a bounded `redis-cli -h 127.0.0.1 -p 6379 PING` result of `PONG`,
refresh `com.tnf.master-heartbeat`, and rerun this check.

Operational skill: `.agent/skills/tnf-live-fleet-cohesion/SKILL.md`.
