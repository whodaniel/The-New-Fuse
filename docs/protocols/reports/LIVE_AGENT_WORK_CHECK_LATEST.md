# TNF Live Agent Work Check

- Generated: 2026-08-08T22:47:15.577Z
- Verdict: CAUTION
- Repo: /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse

## Findings

- WARN full-auto-stale: Full-auto state has not updated recently.
- WARN protected-full-auto-tokens-missing: Protected full-auto remains gated
  because input/policy tokens are missing.

## Git

- ## fix/honest-failure-reporting...origin/fix/honest-failure-reporting [ahead 10]
- Dirty files: 17
- Stashes: 38
- Index lock: absent

## Launchd

| Label                         | State  |   PID | Last Exit |
| ----------------------------- | ------ | ----: | --------: |
| com.tnf.local-subdirector     | loaded | 13486 |         0 |
| com.tnf.master-heartbeat      | loaded | 89557 |         0 |
| com.tnf.fleet-health-probe    | loaded |     - |         0 |
| com.tnf.master-reconciliation | loaded |     - |         1 |
| com.thenewfuse.redis-tnf-bus  | loaded | 17043 |       -15 |
| com.thenewfuse.api-local      | loaded | 35257 |         0 |
| com.thenewfuse.api-gateway    | loaded | 36293 |         0 |
| com.tnf.voice-beam-watchdog   | loaded | 35502 |         0 |

## State Files

| Anchor            | Freshness | Status  |   Age | Generated                |
| ----------------- | --------- | ------- | ----: | ------------------------ |
| local-subdirector | fresh     | healthy |    2s | 2026-08-08T22:47:13.152Z |
| master-heartbeat  | fresh     | healthy |  125s | 2026-08-08T22:45:13.196Z |
| core-fleet        | fresh     | true    |   27s | 2026-08-08T22:46:01.036Z |
| home-handoff      | fresh     | n/a     |  646s | 2026-08-08T22:03:21.460Z |
| repo-handoff      | fresh     | n/a     | 2518s | 2026-08-08T22:03:21.460Z |

## Agent Processes

- 13486 1 S 02:40 /Users/danielgoldberg/.local/bin/node
  /Users/danielgoldberg/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs
- 89557 1 S 14:19 /Users/danielgoldberg/.local/bin/node
  /Users/danielgoldberg/.tnf/master-heartbeat/bin/tnf-master-heartbeat-loop.cjs
- 90324 49415 S 14:08
  /Applications/Claude.app/Contents/Helpers/chrome-native-host
  chrome-extension://fcoeoabgfenejglbffodgkkbkcdhcgfn/
- 2075 1371 S+ 03:18:37 node /Users/danielgoldberg/.hermes/node/bin/codex
  --dangerously-bypass-approvals-and-sandbox
- 2076 2075 R+ 03:18:37
  /Users/danielgoldberg/.hermes/node/lib/node_modules/@openai/codex/node_modules/@openai/codex-darwin-x64/vendor/x86_64-apple-darwin/bin/codex
  --dangerously-bypass-approvals-and-sandbox
- 79138 78479 S+ 01:54:22 /Users/danielgoldberg/.local/bin/cursor-agent
  --use-system-ca
  /Users/danielgoldberg/.local/share/cursor-agent/versions/2026.08.04-aaa8809/index.js
- 82425 81858 S+ 01:51:15 node /Users/danielgoldberg/.hermes/node/bin/kilo
- 82478 82425 R+ 01:51:14
  /Users/danielgoldberg/.hermes/node/lib/node_modules/@kilocode/cli/bin/.kilo
- 25592 23282 R+ 01:16:19 agy --dangerously-skip-permissions
- 33030 32459 S+ 01:09:33 claude
- 66454 65571 S+ 38:29 opencode

## Operating Rule

Agents should run `pnpm run tnf:live:agents:write` before claiming fleet
success, committing multi-agent work, or handing off after concurrent agent
activity. A BLOCK verdict means pause new autonomous work and repair the
reported live-state gap first.

If the report contains `redis-wedged`, agents must not launch more Redis clients
or bootstrap loops. The Local Subdirector should serialize recovery: stop stuck
Redis callers, restart `com.thenewfuse.redis-tnf-bus`, refresh
`com.tnf.master-heartbeat`, and rerun this check.
