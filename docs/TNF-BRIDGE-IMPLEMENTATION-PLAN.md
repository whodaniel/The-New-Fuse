# TNF Bridge Implementation Plan

## Objective
Bridge Hermes Agent capabilities to TNF Agent to achieve feature parity while maintaining additive-only changes.

## Priority 1: Skill Registry Bridge
**Goal**: Give TNF a unified skill management system like Hermes

### Implementation Steps
1. Create `~/.tnf/skills/` directory structure mirroring Hermes
2. Add `tnf skill list` command (wraps `skill_manage(action='list')`)
3. Add `tnf skill load <name>` command (wraps `skill_view`)
4. Add `tnf skill create <name>` command (wraps `skill_manage(action='create')`)
5. Bridge existing TNF skills (sspdf, webpilot, etc.) into the registry

### Files to Create
- `~/.tnf/bin/tnf-skill-registry.sh` - Main CLI entrypoint
- `~/.tnf/skills/registry.json` - Skill index
- `~/.tnf/scripts/skill-bridge.js` - Node.js bridge to Hermes skill_manage

### Additive Pattern
```bash
# New command that doesn't break existing TNF
tnf skill list       # Lists all available skills
tnf skill load foo   # Loads skill into context
tnf skill create bar # Creates new skill
```

## Priority 2: Subagent Spawning Bridge
**Goal**: Enable TNF to spawn isolated subagents like Hermes delegate_task

### Implementation Steps
1. Create `~/.tnf/bin/tnf-spawn` wrapper around Hermes delegate_task
2. Add job isolation (separate terminal, context, toolsets)
3. Implement timeout and cancellation handling
4. Add result aggregation and summary return

### Files to Create
- `~/.tnf/bin/tnf-spawn` - CLI for spawning subagents
- `~/.tnf/scripts/spawn-bridge.js` - Bridge to delegate_task API
- `~/.tnf/config/spawn-config.json` - Default timeouts, toolsets

### Additive Pattern
```bash
# New command that doesn't break existing TNF
tnf spawn --goal "debug the api" --toolsets terminal,file
tnf spawn --tasks '[{"goal":"task1"},{"goal":"task2"}]'  # Parallel
```

## Priority 3: MCP Server Bridge
**Goal**: Full MCP server support (not just Redis bridge)

### Implementation Steps
1. Add `tnf mcp list` - List configured MCP servers
2. Add `tnf mcp connect <server>` - Connect to MCP server
3. Add `tnf mcp call <server> <tool> <args>` - Call MCP tools
4. Bridge to Hermes native-mcp skill

### Files to Create
- `~/.tnf/bin/tnf-mcp` - MCP CLI commands
- `~/.tnf/config/mcp-servers.json` - Server configurations
- `~/.tnf/scripts/mcp-bridge.js` - Bridge to native-mcp skill

### Additive Pattern
```bash
# New command that doesn't break existing TNF
tnf mcp list         # Show configured servers
tnf mcp connect fs   # Connect to filesystem server
tnf mcp call fs read-file --path /tmp/foo.txt
```

## Priority 4: Gateway Failover Bridge
**Goal**: Automatic provider failover like Hermes rate-limit-failover-routing

### Implementation Steps
1. Create `~/.tnf/scripts/gateway-failover.js`
2. Add health check probes for each provider
3. Implement automatic failover sequence (primary -> secondary -> tertiary)
4. Add caching of failed provider state

### Files to Create
- `~/.tnf/bin/tnf-gateway-status` - Check provider health
- `~/.tnf/scripts/gateway-failover.js` - Failover logic
- `~/.tnf/config/provider-health.json` - Cached health state

### Additive Pattern
```bash
# New command that doesn't break existing TNF
tnf gateway status   # Show provider health
tnf gateway failover # Manually trigger failover
```

## Implementation Order
1. **Week 1**: Skill Registry Bridge (highest impact, enables all other skills)
2. **Week 2**: Subagent Spawning Bridge (enables parallel work)
3. **Week 3**: MCP Server Bridge (enables tool integration)
4. **Week 4**: Gateway Failover Bridge (enables reliability)

## Validation Criteria
- All new commands are additive (don't break existing TNF)
- Each bridge passes a "dog food" test (used by TNF Agent itself)
- Documentation updated in `~/.tnf/docs/`
- Handoff matrix updated to reflect new capabilities

## Notes
- Use `tnf-additive-cli-verifier-wrapper` skill to create non-invasive CLI commands
- All bridges should log to `~/.tnf/logs/bridge-*.log`
- Monitor for drift between CloudRuntime services and local configs