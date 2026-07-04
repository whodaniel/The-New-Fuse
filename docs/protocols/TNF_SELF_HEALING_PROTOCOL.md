# TNF Self-Healing Protocol

Status: ACTIVE Protocol ID: TNF_SELF_HEALING_v2.0 Version: 2.0 (Evolved - adds
module dependency awareness and automatic NODE_PATH correction) Created:
2026-07-04

## Authority

- Canonical source: `docs/protocols/TNF_SELF_HEALING_PROTOCOL.md`
- This protocol enables autonomous recovery from common failure modes
- Supersedes v1.0 which lacked awareness of node module dependency issues

## Core Principle

TNF must be capable of autonomous recovery from failure states without human
intervention. The Inspect → Act → Verify pattern applies to self-healing as to
all operations.

## Known Failure Modes and Remedies

### 1. Module Resolution Failure (NEW - 2026-07-04)

**Symptom:** `Error: Cannot find module 'ioredis'` or similar node module errors
**Root Cause:** Scripts copied to `~/.tnf/bin/` cannot resolve modules from TNF
repo's `node_modules/` **Detection:**

```bash
node -e "require('ioredis')" 2>&1 | grep -q "MODULE_NOT_FOUND" && echo "MODULE_MISSING"
```

**Remedy:**

```bash
export NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules"
# Re-run the failed command with NODE_PATH set
```

**Prevention:** All node.js scripts in ~/.tnf/bin/ must be wrapped:

```bash
#!/bin/bash
export NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules"
exec node "$@"
```

### 2. Agent Daemon Not Running

**Symptom:** `tnf alive status` shows "TNF Agent Daemon: not running"
**Detection:** `pgrep -f "tnf-agent-daemon.py"` returns empty **Remedy:**

```bash
cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse
nohup python3 scripts/agents/tnf-agent-daemon.py live > ~/.tnf/logs/daemon.log 2>&1 &
sleep 2
pgrep -f "tnf-agent-daemon.py" && echo "✅ Daemon restarted" || echo "❌ Restart failed"
```

### 3. Terminal Heartbeat Stalled

**Symptom:** No new entries in `~/.tnf/logs/heartbeat.log` for >10 minutes
**Detection:**

```bash
last_heartbeat=$(stat -f "%m" ~/.tnf/logs/heartbeat.log 2>/dev/null || echo 0)
now=$(date +%s)
if [ $((now - last_heartbeat)) -gt 600 ]; then
    echo "HEARTBEAT_STALLED"
fi
```

**Remedy:**

```bash
pkill -f "terminal-heartbeat-pulse.cjs" 2>/dev/null
export NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules"
nohup env NODE_PATH="$NODE_PATH" node ~/.tnf/bin/terminal-heartbeat-pulse.cjs > ~/.tnf/logs/heartbeat.log 2>&1 &
```

### 4. Redis Connection Failure

**Symptom:** `redis-cli PING` returns error or times out **Detection:**
`redis-cli PING 2>&1 | grep -v "PONG"` **Remedy:**

```bash
# Check if redis-server process is running
pgrep -f "redis-server" || echo "Redis process not found"

# If using brew services
brew services restart redis

# Or start manually
redis-server --daemonize yes
```

### 5. Agent Registration Stale (410 Gone)

**Symptom:** `410 status code (no body)` errors when agents try to communicate
**Root Cause:** Agent's registered endpoint is no longer valid **Detection:**
Check `~/.tnf/logs/daemon.log` for 410 errors **Remedy:**

```bash
# Re-register the agent on the bus
cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse
node scripts/agents/tnf-agent-daemon.py live --re-register
```

### 6. Cron Jobs Not Running

**Symptom:** Expected periodic tasks not executing **Detection:**

```bash
# Check if cron is running
pgrep -f "cron" || echo "CRON_NOT_RUNNING"

# Check recent cron output
tail -5 ~/.tnf/poll-jobs/*/cron.log 2>/dev/null | grep -i error
```

**Remedy:**

```bash
# Reload crontab
crontab ~/.tnf/crons/manifest.txt 2>/dev/null || echo "No manifest"

# Or manually restart cron
crond -f &
```

## Self-Healing Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│  INSPECT: Check component health                             │
│  - Run fleet health probe                                   │
│  - Check logs for errors                                    │
│  - Verify processes are running                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  ACT: Apply remediation                                     │
│  - Set NODE_PATH if missing                                │
│  - Restart failed processes                                │
│  - Re-register stale agents                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  VERIFY: Confirm recovery                                  │
│  - Re-run health check                                    │
│  - Confirm process started                                 │
│  - Check logs for new errors                              │
└─────────────────────────────────────────────────────────────┘
```

## Automated Self-Healing Cron

Install the self-healing cron job:

```bash
# Every 5 minutes, run self-healing check
(crontab -l 2>/dev/null | grep -v "tnf-self-healing"; echo "*/5 * * * * /Users/danielgoldberg/.tnf/bin/tnf-self-healing.cjs >> ~/.tnf/logs/self-healing.log 2>&1") | crontab -
```

## Self-Healing Script

Create `/Users/danielgoldberg/.tnf/bin/tnf-self-healing.cjs`:

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TNF_ROOT = process.env.TNF_ROOT || path.join(process.env.HOME, '.tnf');
const NODE_PATH =
  '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules';

const log = (msg) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
  fs.appendFileSync(
    path.join(TNF_ROOT, 'logs', 'self-healing.log'),
    `[${timestamp}] ${msg}\n`
  );
};

const runCommand = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return e.stdout || e.message;
  }
};

// Phase 1: Fix NODE_PATH if missing
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = NODE_PATH;
  log('Set NODE_PATH to TNF repository node_modules');
}

// Phase 2: Check and restart daemon
const daemonRunning = runCommand('pgrep -f "tnf-agent-daemon.py"').trim();
if (!daemonRunning) {
  log('Daemon not running - restarting...');
  try {
    execSync(
      'cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse && ' +
        'nohup python3 scripts/agents/tnf-agent-daemon.py live > ~/.tnf/logs/daemon.log 2>&1 &',
      { stdio: 'ignore' }
    );
    log('Daemon restart command issued');
  } catch (e) {
    log(`Daemon restart failed: ${e.message}`);
  }
}

// Phase 3: Check and restart heartbeat
const heartbeatRunning = runCommand(
  'pgrep -f "terminal-heartbeat-pulse.cjs"'
).trim();
if (!heartbeatRunning) {
  log('Heartbeat not running - restarting with NODE_PATH...');
  try {
    execSync(
      `env NODE_PATH="${NODE_PATH}" nohup node ${TNF_ROOT}/bin/terminal-heartbeat-pulse.cjs > ${TNF_ROOT}/logs/heartbeat.log 2>&1 &`,
      { stdio: 'ignore' }
    );
    log('Heartbeat restart command issued');
  } catch (e) {
    log(`Heartbeat restart failed: ${e.message}`);
  }
}

// Phase 4: Verify Redis
const redisOk = runCommand('redis-cli PING 2>/dev/null').includes('PONG');
if (!redisOk) {
  log('Redis not responding');
} else {
  log('Redis: OK');
}

// Report status
log(
  `Self-healing check complete. Daemon: ${daemonRunning ? 'OK' : 'RESTARTED'}, Heartbeat: ${heartbeatRunning ? 'OK' : 'RESTARTED'}`
);
```

## Version History

- v1.0: Basic process monitoring and restart
- v2.0: Added NODE_PATH/module dependency awareness, comprehensive failure mode
  coverage
