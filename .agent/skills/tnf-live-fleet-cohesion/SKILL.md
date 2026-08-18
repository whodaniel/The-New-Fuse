---
name: tnf-live-fleet-cohesion
description:
  Use when acting as TNF Local Subdirector to poll active agents, reconcile
  concurrent work, repair Redis/master-heartbeat liveness, or respond to
  live-agent-work-check BLOCK/CAUTION verdicts.
---

# TNF Live Fleet Cohesion

Use this skill when local agents disagree, live state is stale, Redis blocks
fleet communication, or the operator asks the agent to act as Local Subdirector.

## Operating Loop

1. Inspect live state before sending prompts:

   ```bash
   pnpm run tnf:live:agents:write
   ```

2. Read the latest verdict:
   - `PROCEED`: normal work may continue.
   - `CAUTION`: agents may continue only if they name the warnings in handoff.
   - `BLOCK`: pause new autonomous work; repair or explicitly accept critical
     findings first.

3. Poll agents with bounded, role-specific prompts. Avoid broad generic
   instructions.

4. Verify the result by rerunning the live checker.

## Redis Wedge Playbook

If `LIVE_AGENT_WORK_CHECK_LATEST.*` reports `redis-wedged` or Redis is listening
but `redis-cli PING` times out:

- Tell all agents not to spawn new Redis clients or bootstrap loops.
- Stop stuck bootstrap/shutdown callers before restarting Redis.
- Restart `com.thenewfuse.redis-tnf-bus`.
- Refresh `com.tnf.master-heartbeat`.
- Rerun `pnpm run tnf:live:agents:write`.

Never treat a launchd-loaded Redis process as healthy unless a bounded PING
returns `PONG`.

If it reports `redis-launchd-mismatch` or `redis-config-drift`, Redis is
answering but not as the TNF local bus. Re-run:

```bash
bash scripts/runtime/redis-local-bootstrap.sh launchd-start
pnpm run tnf:live:agents:write
```

The expected Redis state is: launchd owns `com.thenewfuse.redis-tnf-bus`,
`config_file` is `~/.tnf/redis/redis.conf`, `save` is empty, and
`shutdown-on-sigterm` is `nosave`.

## Agent Polling Rules

- Prefer `tnf send` only when Redis is healthy.
- When Redis is unavailable, use the local Terminal lane map from
  `~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json`.
- Prompt only selected lanes. Do not blindly inject every terminal.
- Give each agent one narrow assignment:
  - security lane: credential exposure, PR diff review, no broad merges.
  - runtime lane: Redis/master-heartbeat diagnostics only.
  - review lane: read-only CI/package-boundary audit.
  - product lane: pause unless runtime/security is clear.
- Require status reports to include current task, owned files, active commands,
  and whether any git operation is running.

## Safety Rules

- Do not approve credential rotation on behalf of the operator.
- Do not merge security PRs until credential rotation status is known, unless
  the operator explicitly accepts the risk.
- Do not run full-auto unless `TNF_SUPER_ADMIN_INPUT_TOKEN` and
  `TNF_GATE_POLICY_TOKEN` are set.
- Do not delete `.agent`, `.tnf`, `.codex`, `.claude`, `.gemini`, `.kilo`, or
  other agent state trees.
- Prefer quarantining stale locks over deleting them.
- After any process repair, verify with live checker and direct state files.

## Success Criteria

The Subdirector pass is complete when:

- Local Subdirector heartbeat is fresh.
- Redis returns `PONG` or the report clearly says why it cannot.
- Master-heartbeat state is fresh or its degraded steps are named.
- Agent sessions are either active/healthy or explicitly assigned.
- The latest live report is written and referenced in handoff.
