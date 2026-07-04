# TNF Module Dependency Awareness Protocol

Status: ACTIVE Protocol ID: TNF_MODULE_DEPENDENCY_AWARENESS_v1.0 Created:
2026-07-04

## Authority

- Canonical source: `docs/protocols/TNF_MODULE_DEPENDENCY_AWARENESS.md`
- This protocol establishes the standard for managing Node.js module
  dependencies across TNF

## Critical Incident (2026-07-04)

**Incident:** `terminal-heartbeat-pulse.cjs` failing with
`MODULE_NOT_FOUND: Cannot find module 'ioredis'`

**Root Cause Analysis:**

- Script located at `~/.tnf/bin/terminal-heartbeat-pulse.cjs`
- Depends on `ioredis` which exists only in TNF repository's `node_modules/`
- Running `node` without `NODE_PATH` set causes module resolution to fail
- Error manifests as cryptic "no module" errors

**Impact:** Heartbeat fails to pulse, agents cannot communicate via TNF bus, 410
errors appear

## Module Resolution Architecture

TNF has a split architecture for Node.js scripts:

1. **Repository Scripts** (run from TNF repo root)
   - `node_modules/` is local → modules resolve automatically
   - Example: `node scripts/turn-end.cjs`

2. **Deployment Scripts** (copied to `~/.tnf/bin/`)
   - `node_modules/` is NOT local → requires explicit `NODE_PATH`
   - Example: `node ~/.tnf/bin/terminal-heartbeat-pulse.cjs`

## Required Environment Variables

```bash
# REQUIRED for all ~/.tnf/bin/ node scripts
export NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules"

# OPTIONAL - TNF root (defaults to ~/.tnf)
export TNF_ROOT="${TNF_ROOT:-$HOME/.tnf}"
```

## Wrapper Script Standard

All Node.js scripts in `~/.tnf/bin/` MUST be wrapped with:

```bash
#!/bin/bash
# TNF Module Dependency Wrapper
export NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules"
exec node "$@"
```

### Wrapped Scripts Inventory

| Script                         | Dependencies            | Wrapped                        |
| ------------------------------ | ----------------------- | ------------------------------ |
| `terminal-heartbeat-pulse.cjs` | ioredis, yaml           | ✅ Yes (tnf-zero-turn)         |
| `tnf-self-healing.cjs`         | fs, path, child_process | ✅ Built-in (no external deps) |
| `federation-protocol.cjs`      | ioredis, axios          | Need verification              |
| `federation-relay-client.cjs`  | ioredis                 | Need verification              |

## Detection and Prevention

### Pre-Run Check

Before running any node script in ~/.tnf/bin/:

```bash
check_dependencies() {
    local script="$1"
    local required_modules="${2:-ioredis}"

    for mod in $required_modules; do
        if ! env NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules" \
                   node -e "require('$mod')" 2>/dev/null; then
            echo "MISSING: $mod"
            return 1
        fi
    done
    return 0
}
```

### Automated NODE_PATH Injection

Create `/Users/danielgoldberg/.tnf/bin/node-wrapper`:

```bash
#!/bin/bash
# Injected at start of ALL ~/.tnf/bin/ node script invocations
export NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules"
exec node "$@"
```

Usage: `node-wrapper ~/.tnf/bin/some-script.cjs`

## Integration with Other Protocols

- **TNF_SELF_HEALING_PROTOCOL**: Self-healing checks NODE_PATH before other
  actions
- **TURN_ZERO_MANDATE**: Startup sequence must verify NODE_PATH is set
- **TNF_FLEET_HEALTH_PROBE**: Health probe validates module accessibility

## Enforcement

This protocol is ENFORCED by:

1. `tnf-zero-turn` wrapper script (line 149, NODE_PATH injection)
2. Self-healing cron (checks NODE_PATH before running node scripts)
3. Fleet health probe (verifies ioredis accessibility)

## Test Procedure

Verify protocol compliance:

```bash
# Test 1: Script without NODE_PATH should fail
node ~/.tnf/bin/terminal-heartbeat-pulse.cjs 2>&1 | grep -q "MODULE_NOT_FOUND" && echo "❌ Protocol violation: module missing without NODE_PATH"

# Test 2: Script with NODE_PATH should work
env NODE_PATH="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules" node ~/.tnf/bin/terminal-heartbeat-pulse.cjs &
sleep 2
pgrep -f "terminal-heartbeat-pulse.cjs" && echo "✅ Protocol working"
```
