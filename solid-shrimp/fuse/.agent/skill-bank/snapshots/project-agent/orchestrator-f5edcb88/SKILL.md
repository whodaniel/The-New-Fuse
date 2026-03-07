---
name: orchestrator
description:
  Multi-Agent Orchestration skill for coordinating AI agents across channels,
  managing sessions, distributing tasks, and leveraging distributed compute
  resources.
---

# Orchestrator Skill

## Purpose

Enable AI agents to act as **Orchestrators** - coordinating multiple AI agents
across federated communication channels, managing sessions, distributing tasks,
and aggregating results.

## When to Use This Skill

Activate when you need to:

- Coordinate multiple AI agents for collaborative work
- Distribute tasks across parallel compute resources
- Manage multi-agent sessions with ID assignment
- Aggregate results from multiple sources
- Leverage free/low-cost AI compute (Gemini tabs, Jules CLI, etc.)

---

## Quick Start

### 1. Start the Relay Server

```bash
pnpm relay:start
```

### 2. Launch Persistent Orchestrator

```bash
node orchestrator-persistent.js Green  # Join Green channel
```

### 3. Session Control Commands

```bash
node session-control.js status   # Check agent status
node session-control.js pause    # Pause all agents
node session-control.js resume   # Resume operations
node session-control.js end      # End session
```

---

## Protocol: DACC-v1

**Distributed Agent Communication & Coordination Protocol v1**

### Core Principles

1. **Mandatory Signing** - All agents MUST sign messages with `[AGENT-XX]`
2. **ID Assignment** - Orchestrator assigns unique IDs to agents
3. **Structured Communication** - Use formatted message templates
4. **Session Logging** - All conversations logged to markdown files

### Message Signing Format

```
[AGENT-XX] Your message content here
```

Acceptable alternatives:

- `ID#: AGENT-XX message`
- `[GEMINI-3F-01] message` (custom IDs)

---

## Compute Resources

### Available Sources (Prioritized by Cost)

| Source              | Cost | Parallelism      | Best For            |
| ------------------- | ---- | ---------------- | ------------------- |
| **Gemini Web Tabs** | FREE | Multiple tabs    | Analysis, reasoning |
| **Jules CLI**       | FREE | Up to 4 parallel | Async coding tasks  |
| **HuggingChat**     | FREE | 1                | Open source models  |
| **Perplexity**      | FREE | 1                | Search + reasoning  |
| **Claude Free**     | FREE | Limited          | Complex reasoning   |
| **ChatGPT Free**    | FREE | Limited          | General tasks       |

### Jules CLI Integration

```bash
# Check Jules status
jules version
jules remote list --session

# Submit task
jules new "Implement feature X in packages/core"

# Parallel execution
jules new --parallel 4 "Add tests to all services"

# Pull completed work
jules remote pull --session 123456 --apply
```

### Chrome Extension (Gemini Tabs)

1. Open multiple Gemini tabs
2. Press Ctrl+Shift+F to open Fuse Connect
3. Join the same channel in each tab
4. Each tab becomes an independent agent

---

## Session Management

### Starting a Session

1. **Start Relay:** `pnpm relay:start`
2. **Launch Orchestrator:** `node orchestrator-persistent.js [channel]`
3. **Open Agent Tabs:** Gemini tabs with Fuse extension
4. **Join Channel:** All agents join same channel

### Session Commands

| Command | Script                           | Purpose                        |
| ------- | -------------------------------- | ------------------------------ |
| Pause   | `node session-control.js pause`  | Request all agents to pause    |
| Resume  | `node session-control.js resume` | Resume paused session          |
| Status  | `node session-control.js status` | Request status from all agents |
| End     | `node session-control.js end`    | End the current session        |

### Session Logs

All sessions are logged to:

```
.agent/session-logs/YYYY-MM-DDTHH-MM-SS_Channel_persistent.md
```

Log contents:

- Session metadata (ID, times, channel, protocol)
- Participant table (assigned IDs, message counts, violations)
- Full conversation log with timestamps
- Signing violation tracking

---

## Task Distribution

### Task Template

```
═══════════════════════════════════════════════════════════════
🔧 TASK: [Task Name]
═══════════════════════════════════════════════════════════════
Task ID: [unique-id]
Priority: [high|medium|low]
Assigned To: [AGENT-XX or "all"]

📋 DESCRIPTION
[Clear description of what needs to be done]

📌 DELIVERABLES
1. [Deliverable 1]
2. [Deliverable 2]

⏱️ DEADLINE: [Time constraint if any]

🔔 Sign responses with [AGENT-XX]!
═══════════════════════════════════════════════════════════════
```

### Parallel Task Distribution

```
ORCHESTRATOR assigns:
├── AGENT-01: Analyze packages/a2a-core
├── AGENT-02: Analyze packages/agent
├── JULES-01: Implement security fixes (async)
└── JULES-02: Add unit tests (async)
```

---

## Scripts Reference

| Script                          | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `orchestrator-persistent.js`    | Persistent orchestrator with auto-reconnect |
| `orchestrator-green-channel.js` | Single-session orchestrator                 |
| `session-control.js`            | Pause/resume/end session commands           |
| `send-improvement-task.js`      | Send improvement tasks                      |
| `scripts/list_channels.js`      | List available channels                     |

---

## Self-Improvement Cycle

### Daily Protocol

1. **Review** - Check overnight agent conversations in session logs
2. **Identify** - Find improvement candidates from agent analyses
3. **Prioritize** - Rank by impact and effort
4. **Distribute** - Assign tasks to available compute
5. **Implement** - Agents execute tasks
6. **Verify** - Check results and integrate
7. **Document** - Update documentation and logs

### Continuous Improvement File

Track improvement status in:

```
.agent/SELF_IMPROVEMENT_CYCLE.md
```

---

## Integration with Other Skills

### agent-discovery-protocol

Protocol specification for agent discovery and ID assignment.

### jules-delegation

Delegate async coding tasks to Jules CLI.

### chrome-devtools

Browser automation for testing and verification.

---

## Troubleshooting

### Agents Not Responding

1. Check relay is running: `pnpm relay:start`
2. Verify agents are on same channel
3. Check orchestrator logs for errors

### Signing Violations

1. Orchestrator sends reminders automatically
2. Check session log for violation count
3. Send manual reminder: `node session-control.js status`

### Connection Drops

1. Persistent orchestrator auto-reconnects in 5 seconds
2. Check relay server health: `curl localhost:3001/health`
3. Agents should auto-reconnect on tab refresh

---

## Issue Resolution Protocol

**Orchestrators MUST use available tools to resolve issues autonomously.**

### When Issues Arise

1. **Identify** the issue type
2. **Select** appropriate tool(s)
3. **Execute** the fix
4. **Verify** the resolution
5. **Document** what was done

### Tool Selection Matrix

| Issue Type           | Tools to Use                                       | Action                        |
| -------------------- | -------------------------------------------------- | ----------------------------- |
| Build failure        | `run_command`, `grep_search`, `view_file`          | Find error, view code, fix    |
| Test failure         | `run_command`, `view_file`, `replace_file_content` | Run tests, view failures, fix |
| Agent not responding | `mcp_chrome-devtools_*`, `run_command`             | Check browser, restart relay  |
| Connection error     | `run_command`, `read_terminal`                     | Check relay status, restart   |
| Missing file         | `write_to_file`, `run_command`                     | Create file, verify           |
| Code error           | `view_file`, `replace_file_content`                | View, fix, verify             |
| Documentation gap    | `write_to_file`, `replace_file_content`            | Update docs                   |

### Auto-Resolution Prompts

When encountering an error, use this mental framework:

```
I encountered: [ERROR DESCRIPTION]

Available tools that could help:
1. run_command - Execute shell commands to diagnose/fix
2. view_file - Inspect source code for issues
3. grep_search - Find related code or error patterns
4. replace_file_content - Fix code issues
5. write_to_file - Create missing files
6. browser_subagent - Interact with browser for testing
7. mcp_chrome-devtools_* - Direct browser control

I will:
1. Use [TOOL] to [ACTION]
2. Verify with [VERIFICATION METHOD]
3. Document the fix in session log
```

### Common Issue Resolutions

#### Relay Not Running

```bash
# Check status
curl localhost:3001/health

# If down, restart
pnpm relay:start
```

#### Agent Not Signing Messages

```
Send reminder via session-control.js status
or broadcast direct reminder to channel
```

#### Build Errors

```
1. run_command: pnpm build 2>&1 | head -50
2. grep_search: Find the error file
3. view_file: Inspect the error location
4. replace_file_content: Fix the issue
5. run_command: Verify build passes
```

#### Jules Task Failed

```bash
# Check session status
jules remote list --session

# Get details
jules remote pull --session [ID]

# Retry with improved prompt
jules new "Fixed version of: [original task]"
```

### Escalation

If tools cannot resolve the issue:

1. Document the issue fully in session log
2. Create a clear summary for human review
3. Continue with other tasks that can proceed

---

## Version History

- **v1.0.0** (2026-01-16)
  - Initial orchestrator skill
  - Persistent mode with auto-reconnect
  - Session control commands (pause/resume/end)
  - Compute resource documentation
  - DACC-v1 protocol integration
