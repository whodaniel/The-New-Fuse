`[CLASS:PRIME] [STATUS:PENDING]` `[DOC_AUDIT_BACKFILL:2026-07-14]` — header
restored for Gate 3 compliance; reclassify on next vetting pass.

# TNF Fleet Health Probe Protocol

Status: ACTIVE Protocol ID: TNF_FLEET_HEALTH_PROBE_v2.0 Version: 2.0 (Evolved
from v1.0 - adds NODE_PATH awareness and dependency verification) Created:
2026-07-04 Author: TNF Framework Evolution

## Authority

- Canonical source: `docs/protocols/TNF_FLEET_HEALTH_PROBE_PROTOCOL.md`
- This protocol supersedes v1.0 which lacked dependency awareness
- If any external mirror conflicts, this file wins

## Purpose

The Fleet Health Probe is the continuous monitoring system that verifies all TNF
components are operational and can communicate. It replaces manual health checks
with automated, systematic verification.

## Critical Discovery (2026-07-04)

**NODE_PATH Dependency Issue Identified:** The `terminal-heartbeat-pulse.cjs`
script requires `ioredis` which is only available in the TNF repository's
`node_modules/`. When executed without `NODE_PATH` set, the script fails with
`MODULE_NOT_FOUND` for `ioredis`.

**Root Cause:** The script is copied to `~/.tnf/bin/` but depends on `ioredis`
from the repo's `node_modules/`. Without `NODE_PATH` pointing to
`$TNF_ROOT/node_modules`, the module resolution fails.

**Solution Applied:** All heartbeat invocations now use:

```bash
env NODE_PATH="$TNF_ROOT/node_modules" node <script>
```

## Execution Procedure

### Phase 1: Dependency Verification

Before running any node.js script in the TNF ecosystem, verify NODE_PATH:

```bash
# Check if NODE_PATH is set correctly
echo "NODE_PATH: ${NODE_PATH:-NOT SET}"

# If NOT SET, set it before running node scripts
if [ -z "$NODE_PATH" ]; then
    export NODE_PATH="$TNF_ROOT/node_modules"
fi

# Verify ioredis is accessible
node -e "require('ioredis')" 2>/dev/null && echo "ioredis: OK" || echo "ioredis: MISSING"
```

### Phase 2: Core Component Health Check

Run these checks every 15 minutes via cron:

```bash
# 1. TNF Agent Daemon
if pgrep -f "tnf-agent-daemon.py" > /dev/null; then
    echo "✅ Daemon: running (PID: $(pgrep -f 'tnf-agent-daemon.py' | head -1))"
else
    echo "❌ Daemon: NOT running - restarting..."
    cd $TNF_ROOT && \
    nohup python3 scripts/agents/tnf-agent-daemon.py live > ~/.tnf/logs/daemon.log 2>&1 &
fi

# 2. Terminal Heartbeat (with NODE_PATH fix)
export NODE_PATH="$TNF_ROOT/node_modules"
if pgrep -f "terminal-heartbeat-pulse.cjs" > /dev/null; then
    echo "✅ Heartbeat: running (PID: $(pgrep -f 'terminal-heartbeat-pulse.cjs' | head -1))"
else
    echo "❌ Heartbeat: NOT running - restarting with NODE_PATH..."
    nohup env NODE_PATH="$NODE_PATH" node ~/.tnf/bin/terminal-heartbeat-pulse.cjs > ~/.tnf/logs/heartbeat.log 2>&1 &
fi

# 3. Redis
if redis-cli PING 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis: running"
else
    echo "❌ Redis: NOT running"
fi

# 4. Relay Core
if pgrep -f "standalone-relay.js" > /dev/null; then
    echo "✅ Relay: running (PID: $(pgrep -f 'standalone-relay.js' | head -1))"
else
    echo "❌ Relay: NOT running"
fi
```

### Phase 3: Agent Registry Health

```bash
# Count active vs offline agents
ACTIVE=$(redis-cli HGETALL tnf:agent-registry 2>/dev/null | grep -c '"status":"active"' || echo 0)
OFFLINE=$(redis-cli HGETALL tnf:agent-registry 2>/dev/null | grep -c '"status":"offline"' || echo 0)
TOTAL=$((ACTIVE + OFFLINE))

echo "Fleet: $ACTIVE active, $OFFLINE offline, $TOTAL total"

# Flag if >20% offline (potential cleanup needed)
if [ "$OFFLINE" -gt 0 ] && [ $((OFFLINE * 100 / TOTAL)) -gt 20 ]; then
    echo "⚠️  Fleet health: $OFFLINE offline agents ($((OFFLINE * 100 / TOTAL))%) - cleanup recommended"
fi
```

### Phase 4: Self-Healing Triggers

| Condition                  | Action                     |
| -------------------------- | -------------------------- |
| Daemon not running         | Restart via `tnf alive up` |
| Heartbeat not running      | Restart with NODE_PATH     |
| Redis not responding       | Log alert, check process   |
| >20% agents offline        | Flag for cleanup review    |
| Heartbeat log shows errors | Check NODE_PATH, restart   |

## Cron Installation

```bash
# Install fleet health probe (15 minute intervals)
(crontab -l 2>/dev/null | grep -v "tnf-fleet-health-probe"; echo "*/15 * * * * cd $TNF_ROOT && $HOME/Library/pnpm/node scripts/protocols/run-chronological-process.cjs --process-id tnf-fleet-health-probe >> ~/.tnf/poll-jobs/tnf-fleet-health-probe/cron.log 2>&1") | crontab -
```

## Integration with Other Protocols

- **TURN_ZERO_MANDATE**: Fleet health check is part of startup sequence
- **TURN_END_MANDATE**: If fleet health degraded, must be documented in handoff
- **TNF_SELF_HEALING_PROTOCOL**: Health probe results trigger self-healing
  actions

## Version History

- v1.0: Initial fleet health probe (basic process checking)
- v2.0: Added NODE_PATH awareness, dependency verification, self-healing
  triggers
