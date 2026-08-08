# TNF Live Agent Work Check

- Generated: 2026-08-08T22:02:29.553Z
- Verdict: BLOCK
- Repo: /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse

## Findings

- CRITICAL master-heartbeat-unloaded: com.tnf.master-heartbeat is not loaded in
  launchd.
- CRITICAL master-heartbeat-stale: Master heartbeat state is missing,
  unreadable, or stale.
- WARN local-subdirector-attention: Local Subdirector heartbeat is stale or not
  healthy.
- CRITICAL redis-unavailable: Redis is not responding with PONG.
- WARN full-auto-stale: Full-auto state has not updated recently.
- WARN protected-full-auto-tokens-missing: Protected full-auto remains gated
  because input/policy tokens are missing.

## Git

- ## fix/honest-failure-reporting...origin/fix/honest-failure-reporting [ahead 8]
- Dirty files: 9
- Stashes: 38
- Index lock: absent

## Launchd

| Label                         | State   |   PID | Last Exit |
| ----------------------------- | ------- | ----: | --------: |
| com.tnf.local-subdirector     | loaded  | 50172 |         0 |
| com.tnf.master-heartbeat      | missing |     - |         - |
| com.tnf.fleet-health-probe    | loaded  | 49615 |         0 |
| com.tnf.master-reconciliation | loaded  |     - |         1 |
| com.thenewfuse.redis-tnf-bus  | loaded  | 35498 |         0 |
| com.thenewfuse.api-local      | loaded  | 35257 |         0 |
| com.thenewfuse.api-gateway    | loaded  | 36293 |         0 |
| com.tnf.voice-beam-watchdog   | loaded  | 35502 |         0 |

## State Files

| Anchor            | Freshness | Status         |   Age | Generated                |
| ----------------- | --------- | -------------- | ----: | ------------------------ |
| local-subdirector | fresh     | critical       |    2s | 2026-08-08T22:02:27.326Z |
| master-heartbeat  | stale     | skipped-locked |  622s | 2026-08-08T21:52:11.772Z |
| core-fleet        | fresh     | true           | 1145s | 2026-08-08T21:33:42.189Z |
| home-handoff      | fresh     | n/a            |  542s | 2026-08-08T21:45:38.208Z |
| repo-handoff      | fresh     | n/a            | 1015s | 2026-08-08T21:45:38.208Z |

## Agent Processes

- 49048 49033 S 12:31 redis-cli -p 6379 HSET tnf:agent-registry
  agent_hermes-codegen-worker_1782364000001
  {"id":"agent_hermes-codegen-worker_1782364000001","name":"hermes-codegen-worker","role":"worker","platform":"claude","status":"active","isOnline":true,"capabilities":["code_generation","typescript_strict","monorepo_pnpm","pnpm_filter_invocation","drizzle_migration_apply","zod_schema_generation","subagent_dispatch_handoff"],"registeredAt":"2026-08-08T21:50:02.000Z","lastSeen":"2026-08-08T21:50:02.000Z","routing":{"callableWorker":true,"directorPoolEligible":true},"source":"sub-director-cron-refresh","subdirector_authorized":true}
- 50172 1 S 10:45 /Users/danielgoldberg/.local/bin/node
  /Users/danielgoldberg/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs
- 51130 33030 Ss 09:04 /bin/zsh -c -l setopt NO_EXTENDED_GLOB NO_BARE_GLOB_QUAL
  2>/dev/null || true && { \builtin unalias -- 'unsetenv'; \builtin unset -f --
  'unsetenv'; } >/dev/null 2>&1 || true && eval 'cd
  ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse && node scripts/tnf-onboard.cjs 2>&1 |
  tail -150' < /dev/null && pwd -P >| /tmp/claude-1aad-cwd
- 51965 51937 S 07:31 redis-cli -p 6379 HSET tnf:agent-registry
  agent_hermes-codegen-worker_1782364000001
  {"id":"agent_hermes-codegen-worker_1782364000001","name":"hermes-codegen-worker","role":"worker","platform":"claude","status":"active","isOnline":true,"capabilities":["code_generation","typescript_strict","monorepo_pnpm","pnpm_filter_invocation","drizzle_migration_apply","zod_schema_generation","subagent_dispatch_handoff"],"registeredAt":"2026-08-08T21:55:02.000Z","lastSeen":"2026-08-08T21:55:02.000Z","routing":{"callableWorker":true,"directorPoolEligible":true},"source":"sub-director-cron-refresh","subdirector_authorized":true}
- 55304 55271 S 02:33 redis-cli -p 6379 HSET tnf:agent-registry
  agent_hermes-infra-worker_1782364000002
  {"id":"agent_hermes-infra-worker_1782364000002","name":"hermes-infra-worker","role":"worker","platform":"claude","status":"active","isOnline":true,"capabilities":["infra_audit","cloud_run_manifest_validate","image_tag_resolve","build_config_render","rollout_health_probe","iam_scope_audit"],"registeredAt":"2026-08-08T22:00:00.000Z","lastSeen":"2026-08-08T22:00:00.000Z","routing":{"callableWorker":true,"directorPoolEligible":true},"source":"sub-director-cron-refresh","subdirector_authorized":true}
- 55305 55272 S 02:33 redis-cli -p 6379 HSET tnf:agent-registry
  agent_hermes-codegen-worker_1782364000001
  {"id":"agent_hermes-codegen-worker_1782364000001","name":"hermes-codegen-worker","role":"worker","platform":"claude","status":"active","isOnline":true,"capabilities":["code_generation","typescript_strict","monorepo_pnpm","pnpm_filter_invocation","drizzle_migration_apply","zod_schema_generation","subagent_dispatch_handoff"],"registeredAt":"2026-08-08T22:00:00.000Z","lastSeen":"2026-08-08T22:00:00.000Z","routing":{"callableWorker":true,"directorPoolEligible":true},"source":"sub-director-cron-refresh","subdirector_authorized":true}
- 2075 1371 S+ 02:33:52 node /Users/danielgoldberg/.hermes/node/bin/codex
  --dangerously-bypass-approvals-and-sandbox
- 2076 2075 R+ 02:33:52
  /Users/danielgoldberg/.hermes/node/lib/node_modules/@openai/codex/node_modules/@openai/codex-darwin-x64/vendor/x86_64-apple-darwin/bin/codex
  --dangerously-bypass-approvals-and-sandbox
- 61094 60725 S+ 01:20:15 sudo -n -u tnf-agent /opt/tnf-node/bin/node
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/scripts/antigravity-redis-wrapper.cjs
- 61138 61094 S+ 01:20:14 /opt/tnf-node/bin/node
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/scripts/antigravity-redis-wrapper.cjs
- 79138 78479 S+ 01:09:37 /Users/danielgoldberg/.local/bin/cursor-agent
  --use-system-ca
  /Users/danielgoldberg/.local/share/cursor-agent/versions/2026.08.04-aaa8809/index.js
- 82425 81858 S+ 01:06:30 node /Users/danielgoldberg/.hermes/node/bin/kilo
- 82478 82425 R+ 01:06:29
  /Users/danielgoldberg/.hermes/node/lib/node_modules/@kilocode/cli/bin/.kilo
- 25592 23282 R+ 31:34 agy --dangerously-skip-permissions
- 33030 32459 S+ 24:48 claude

## Operating Rule

Agents should run `pnpm run tnf:live:agents:write` before claiming fleet
success, committing multi-agent work, or handing off after concurrent agent
activity. A BLOCK verdict means pause new autonomous work and repair the
reported live-state gap first.
