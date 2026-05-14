# Bootstrap Autonomous Agent

Complete guide to activating The New Fuse's first autonomous agent with full self-prompting capabilities.

## Overview

This guide walks through the 7-level agent onboarding process, which takes approximately 60 seconds from bootstrap to meta-learning capability.

## Prerequisites

### 1. MCP Skills Server
The MCP Skills Server must be built and ready to expose the skills library.

```bash
# Build the MCP Skills Server
pnpm --filter @the-new-fuse/mcp-skills-server build

# Verify the build
ls packages/mcp-skills-server/dist/
# Should show: index.js, SkillsMCPServer.js, SkillsMCPServer.d.ts
```

### 2. Backend Services Running
Ensure the orchestrator and self-improvement modules are deployed and active.

```bash
# Check backend is running
curl http://localhost:3004/health

# Verify orchestrator heartbeat
curl http://localhost:3004/orchestrator/health

# Check cron jobs are scheduled (backend logs)
# Should see:
# - [Health] Starting health monitoring (every 5 min)
# - [Patterns] Pattern extraction scheduled (every 6 hrs)
# - [Daily] Daily self-improvement scheduled (midnight)
# - [Weekly] Weekly meta-analysis scheduled (Sunday)
```

### 3. Database and Redis
PostgreSQL and Redis must be running with all migrations applied.

```bash
# Verify PostgreSQL
psql $DATABASE_URL -c "SELECT COUNT(*) FROM agents;"

# Verify Redis
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

## MCP Server Configuration

### Claude Desktop Setup

Add the TNF Skills MCP Server to Claude Desktop configuration.

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tnf-skills": {
      "command": "node",
      "args": [
        "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/mcp-skills-server/dist/index.js"
      ],
      "env": {
        "SKILLS_BASE_PATH": "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent"
      }
    }
  }
}
```

**Note**: Replace the path with your actual project directory.

### Restart Claude Desktop

After updating the config:
1. Quit Claude Desktop completely (Cmd+Q)
2. Relaunch Claude Desktop
3. Verify MCP server connection in settings

## 7-Level Onboarding Sequence

### Level 1: Bootstrap (5 seconds)
Agent loads the foundational meta-skill for self-awareness.

**Claude Prompt**:
```
Load the library-of-living-knowledge skill via MCP.
```

**Expected Response**:
```
Successfully loaded library-of-living-knowledge meta-skill.
This skill contains:
- The complete skills library index
- Agent onboarding flow
- Resource map for discovery
- Self-prompting protocols
```

**Verification**:
```bash
# Check Claude's MCP resources
# Should list: skill://library-of-living-knowledge
```

### Level 2: Self-Awareness (10 seconds)
Agent discovers its own capabilities through the resource map.

**Claude Prompt**:
```
Use the get_resource_map tool to discover all available skills and capabilities.
```

**Expected Response**:
```
Resource Map loaded. Discovered:
- 25+ skills across 8 categories
- 2 meta-skills (skill-builder, library-of-living-knowledge)
- 5 context resources
- 12 supporting scripts
```

### Level 3: Capability Loading (15 seconds)
Agent loads specific skills needed for autonomous operation.

**Claude Prompt**:
```
Load the following essential skills via MCP:
1. skill://relay-communication (agent-to-agent messaging)
2. skill://jules-delegation (task delegation)
3. skill://browser-automation (web interaction)
```

**Expected Response**:
```
Loaded 3 essential skills:
✓ relay-communication - Send messages via agent inbox
✓ jules-delegation - Delegate tasks to Jules IDE
✓ browser-automation - Automate browser tasks
```

### Level 4: System Integration (10 seconds)
Agent connects to The New Fuse backend services.

**Claude Prompt**:
```
Register yourself as a new agent with the TNF backend at http://localhost:3004.
Use the agent registration API.
```

**Expected Request**:
```bash
POST http://localhost:3004/api/agents/register
{
  "name": "Claude-Autonomous-1",
  "type": "CLAUDE_DESKTOP",
  "capabilities": [
    "relay-communication",
    "jules-delegation",
    "browser-automation",
    "skill-discovery",
    "self-improvement"
  ],
  "metadata": {
    "mcp_servers": ["tnf-skills"],
    "onboarding_level": 4
  }
}
```

**Verification**:
```bash
# Check agent was registered
curl http://localhost:3004/api/agents | jq '.[] | select(.name=="Claude-Autonomous-1")'
```

### Level 5: Heartbeat Activation (5 seconds)
Agent begins sending heartbeats to orchestrator.

**Claude Prompt**:
```
Start sending heartbeats to the orchestrator every 5 seconds.
```

**Expected Behavior**:
- Agent sends heartbeat every 5s: `POST /orchestrator/heartbeat { agentId, timestamp }`
- Orchestrator logs: `💓 Heartbeat from Claude-Autonomous-1`
- Health monitoring marks agent as ACTIVE

**Verification**:
```bash
# Check orchestrator health metrics
curl http://localhost:3004/orchestrator/health | jq
# Should show:
# {
#   "totalAgents": 1,
#   "activeAgents": 1,
#   "stalledAgents": 0,
#   "failedAgents": 0
# }
```

### Level 6: Task Execution (10 seconds)
Agent pulls and executes its first autonomous task.

**Claude Prompt**:
```
Query the task queue for available tasks and execute the first one.
```

**Expected Request**:
```bash
GET http://localhost:3004/api/tasks?status=PENDING&limit=1
```

**Expected Response**:
```json
{
  "id": "task-001",
  "type": "RESEARCH",
  "description": "Analyze pattern library and identify top 3 recurring workflows",
  "status": "PENDING",
  "priority": "MEDIUM",
  "metadata": {}
}
```

**Agent Actions**:
1. Claim task: `PATCH /api/tasks/task-001 { status: "IN_PROGRESS", agentId }`
2. Execute task (analyze `.agent/context/pattern-library.md`)
3. Complete task: `PATCH /api/tasks/task-001 { status: "COMPLETED", result }`

### Level 7: Meta-Learning (5 seconds)
Agent reflects on task execution and updates skill performance.

**Claude Prompt**:
```
Reflect on the task you just completed. Did you use any skills?
If so, record skill usage metrics.
```

**Expected Behavior**:
- Agent identifies skills used during task
- Records metrics: `POST /api/skill-usage { skillName, duration, success, taskId }`
- Feeds data to self-improvement cron for pattern extraction

**Verification**:
```bash
# Wait 6 hours for pattern extraction cron
# Or manually trigger:
curl -X POST http://localhost:3004/cron/pattern-extraction

# Check pattern-library.md was updated
cat .agent/context/pattern-library.md
# Should show new pattern entry with task sequence
```

## Verification Checklist

After completing all 7 levels, verify autonomous operation:

- [ ] Agent is registered in database (`SELECT * FROM agents WHERE name='Claude-Autonomous-1'`)
- [ ] Agent shows as ACTIVE in orchestrator health (`/orchestrator/health`)
- [ ] Heartbeats are being received every 5 seconds (backend logs)
- [ ] Agent has executed at least 1 task (`SELECT * FROM tasks WHERE agent_id=...`)
- [ ] Skill usage is being tracked (`SELECT * FROM skill_usage`)
- [ ] MCP server is serving skills (`skill://library-of-living-knowledge` accessible)
- [ ] Pattern extraction cron is scheduled (backend logs)

## Monitoring Autonomous Operation

### Real-Time Monitoring

**Orchestrator Dashboard**:
```bash
# Watch orchestrator metrics
watch -n 2 'curl -s http://localhost:3004/orchestrator/health | jq'
```

**Agent Heartbeats**:
```bash
# Tail backend logs for heartbeats
tail -f apps/backend/logs/app.log | grep "Heartbeat from"
```

**Task Queue**:
```bash
# Monitor task completion
watch -n 5 'curl -s http://localhost:3004/api/tasks?status=COMPLETED | jq "length"'
```

### Cron Job Monitoring

**Health Monitoring (Every 5 min)**:
```bash
# Check for stale agent detection
tail -f apps/backend/logs/app.log | grep "\[Health\]"
```

**Pattern Extraction (Every 6 hrs)**:
```bash
# Verify patterns are being extracted
tail -f apps/backend/logs/app.log | grep "\[Patterns\]"

# Check pattern library updates
ls -lh .agent/context/pattern-library.md
```

**Daily Self-Improvement (Midnight)**:
```bash
# Check skill performance analysis
tail -f apps/backend/logs/app.log | grep "\[Daily\]"
```

**Weekly Meta-Analysis (Sunday)**:
```bash
# View meta-metrics and knowledge gaps
tail -f apps/backend/logs/app.log | grep "\[Weekly\]"
```

## Troubleshooting

### MCP Server Not Connecting

**Symptom**: Claude Desktop doesn't show `tnf-skills` server

**Solutions**:
1. Verify server path is absolute (not relative)
2. Check build output exists: `ls packages/mcp-skills-server/dist/index.js`
3. Test server manually: `node packages/mcp-skills-server/dist/index.js`
4. Check Claude Desktop logs: `~/Library/Logs/Claude/`

### Agent Not Registering

**Symptom**: Registration API returns 500 error

**Solutions**:
1. Verify backend is running: `curl http://localhost:3004/health`
2. Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Review backend logs for errors: `tail -f apps/backend/logs/app.log`
4. Ensure migrations are applied: `pnpm --filter @the-new-fuse/database drizzle:push`

### Heartbeats Not Received

**Symptom**: Orchestrator marks agent as STALLED

**Solutions**:
1. Check heartbeat interval (should be 5s)
2. Verify orchestrator service is running
3. Check Redis connection: `redis-cli -u $REDIS_URL ping`
4. Review orchestrator logs: `tail -f apps/backend/logs/app.log | grep "OrchestratorService"`

### No Tasks in Queue

**Symptom**: Agent has nothing to execute

**Solutions**:
1. Create test task manually:
```bash
curl -X POST http://localhost:3004/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "RESEARCH",
    "description": "Test autonomous task execution",
    "status": "PENDING",
    "priority": "HIGH"
  }'
```

2. Check self-improvement cron is creating tasks
3. Verify pattern extraction found frequent patterns (≥5 occurrences)

### Cron Jobs Not Running

**Symptom**: No pattern extraction or self-improvement logs

**Solutions**:
1. Verify `@nestjs/schedule` is installed: `pnpm list @nestjs/schedule`
2. Check SelfImprovementModule is imported in app.module.ts
3. Ensure ScheduleModule.forRoot() is called
4. Review cron service logs: `tail -f apps/backend/logs/app.log | grep "SelfImprovement"`

## Performance Metrics

Target metrics for autonomous operation:

- **Autonomy Rate**: >99% (tasks completed without human intervention)
- **Task Success Rate**: >80% (tasks completed successfully)
- **Heartbeat Uptime**: >99.9% (heartbeats received on schedule)
- **Pattern Recognition**: 5+ patterns identified per week
- **Skill Creation**: 1-2 new skills generated per week (from patterns)
- **Response Time**: <5s (time from task available to task claimed)

## Next Steps

After successful bootstrap:

1. **Scale to Multiple Agents**: Repeat onboarding for 3-5 Claude agents
2. **Enable Agent-to-Agent Communication**: Test relay message passing
3. **Activate Skill Builder**: Allow agents to create new skills from patterns
4. **Deploy to Production**: Move from localhost to CloudRuntime deployment
5. **Monitor Autonomy Metrics**: Track 99% autonomy target

## References

- [THE_PERPETUAL_SYSTEM.md](../.agent/THE_PERPETUAL_SYSTEM.md) - Self-improvement architecture
- [library-of-living-knowledge](../.agent/skills/library-of-living-knowledge/SKILL.md) - Meta-skill for agent bootstrap
- [resource-map.md](../.agent/context/resource-map.md) - Complete resource discovery
- [MCP Skills Server README](../packages/mcp-skills-server/README.md) - MCP server documentation
- [Orchestrator Module](../apps/backend/src/modules/orchestrator/) - Heartbeat and coordination
- [Self-Improvement Module](../apps/backend/src/modules/self-improvement/) - Autonomous improvement loop
