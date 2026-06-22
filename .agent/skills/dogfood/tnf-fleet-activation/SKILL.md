---
name: TNF Full Fleet Activation
description:
  Standard operating procedure to spin up complete TNF agent testing fleet for
  full site validation
version: 1.0.0
tags: [tnf, fleet, testing, orchestration, dogfood]
---

# TNF Full Fleet Activation SOP

## Procedure for activating complete agent fleet against production target.

This is the verified working procedure as of 2026-04-09 for the M1 readiness
branch.

### Step 1: Pre-Flight

1. Ensure working directory is `/Users/danielgoldberg` (TNF root)
2. Verify `.tnf/bin/` directory exists and is populated
3. Clear any stale running agents first:

```bash
pkill -f local-subdirector
pkill -f dogfood-runner
```

### Step 2: Start Synaptic Bus

```bash
brew services start redis 2>/dev/null || redis-server --daemonize yes
```

### Step 3: Spawn Full Agent Fleet

```bash
roles=("orchestrator" "broker" "validator" "scraper" "monitor" "auditor" "tester")
for idx in "${!roles[@]}"; do
  port=$((8100 + idx))
  nohup node .tnf/local-subdirector/bin/local-subdirector-runtime.cjs --role "${roles[$idx]}" --port $port > /tmp/tnf-${roles[$idx]}.log 2>&1 &
done
```

### Step 4: Start Supervisory Daemons

```bash
node .tnf/bin/dont-die-supervisor-lite.cjs --all > /tmp/tnf-supervisor.log 2>&1 &
node .tnf/bin/terminal-heartbeat-pulse.cjs > /tmp/tnf-heartbeat.log 2>&1 &
node .tnf/bin/relay-channel-monitor.cjs > /tmp/tnf-relay-monitor.log 2>&1 &
```

### Step 5: Start Continuous Dogfood Testing

```bash
nohup node tools/dogfood/dogfood-runner.cjs https://thenewfuse.com full --continuous > /tmp/tnf-dogfood.log 2>&1 &
```

### Verification

```bash
ps aux | grep local-subdirector | grep -v grep | wc -l
# Should return ~8 running processes
```

### Post Fleet Activation: WhatsApp Group Bridge

After spawning the fleet, connect to real WhatsApp group chat:

```bash
# First ensure WhatsApp Desktop is running locally
# Start TNF relay service
pnpm tnf relay start
# Bind running fleet to WhatsApp group
pnpm tnf convo create --name "TNF FUSE Development Agents" --agents all --platform whatsapp
```

### Operational Notes

- All logs written to `/tmp/tnf-*.log`
- Fleet will automatically self-heal crashes
- No idle agents - every instance is actively performing testing
- Testing runs continuously until terminated
- Follows TNF operational rule: No idle standing by. Always run background work.

### Lessons Learned 2026-04-15

- Do not use non-existent whatsapp subcommand. Use `tnf convo` + `tnf relay`
- Do not pass cwd= parameter to execute_code terminal() helper - use inline cd
- Always run `pnpm run tnf:onboard` FIRST before any TNF CLI commands
- WhatsApp group bridge requires desktop WhatsApp running locally first,
  headless mode is broken currently
