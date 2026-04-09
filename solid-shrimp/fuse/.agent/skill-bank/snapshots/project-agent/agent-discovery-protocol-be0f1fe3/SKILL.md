---
name: agent-discovery-protocol
description:
  Protocol for discovering and coordinating with other AI agents in a federated
  communication channel
---

# Agent Discovery & Coordination Protocol (DACC-v1)

This skill enables an Orchestrator Agent to discover, coordinate with, and
distribute context to other AI agents connected to a federated communication
channel.

## Protocol Overview

The DACC protocol consists of four phases:

1. **Channel Discovery** - Find available channels dynamically
2. **Agent Discovery** - Identify all connected agents
3. **ID Assignment** - Assign unique identifiers to each agent
4. **Coordination** - Execute collaborative tasks with signed messages

---

## Mandatory Message Signing

**⚠️ ALL agents MUST sign their messages with their assigned ID.**

### Format

```
[AGENT-XX] Your message content here
```

Where `XX` is the zero-padded number assigned by the orchestrator (e.g.,
AGENT-01, AGENT-02).

### Why Signing is Required

- Allows tracking of which agent said what
- Enables proper conversation logging
- Supports multi-agent debugging
- Creates accountability in collaborative tasks

### Acceptable Signing Formats

The orchestrator accepts these signing patterns:

| Format        | Example                  | Status       |
| ------------- | ------------------------ | ------------ |
| Standard      | `[AGENT-01] message`     | ✅ Preferred |
| With ID#      | `ID#: AGENT-01 message`  | ✅ Accepted  |
| Custom prefix | `[GEMINI-3F-01] message` | ✅ Accepted  |

### Enforcement

- Orchestrator tracks unsigned message counts per agent
- After 3 unsigned messages, a reminder is sent
- Periodic reminders sent every 2 minutes if violations continue
- Violations logged in session log for review

---

## Phase 1: Channel Discovery

### Purpose

Dynamically discover and join available channels.

### Implementation

```javascript
// Request channel list
ws.send(
  JSON.stringify({
    type: 'CHANNEL_LIST_REQUEST',
    source: 'my-orchestrator',
    payload: {},
  })
);

// Response: CHANNEL_LIST with array of channels
// Join by name (will find existing or create new)
ws.send(
  JSON.stringify({
    type: 'CHANNEL_CREATE',
    source: 'my-orchestrator',
    payload: { name: 'Green' },
  })
);
```

---

## Phase 2: Agent Discovery

### Discovery Request Format

```
═══════════════════════════════════════════════════════════════
🌐 ORCHESTRATOR ONLINE - DACC-v1 PROTOCOL
═══════════════════════════════════════════════════════════════
Session ID: {session_id}
Channel: {channel_name}
Time: {ISO timestamp}

📋 DISCOVERY & REGISTRATION

You will be assigned a unique **Agent ID** (AGENT-XX).

**⚠️ MANDATORY: SIGN ALL MESSAGES**

Format: `[AGENT-XX] Your message`

Please respond with:
1. Your name/type
2. Your capabilities
3. Pre-existing directives
4. Availability status
═══════════════════════════════════════════════════════════════
```

### Expected Agent Response

```
[AGENT-XX]
Agent Name: Gemini 3 Flash
Capabilities: text-generation, code-analysis, image-generation
Directives: Operate with intellectual honesty, prioritize structured output
Status: ACTIVE
```

---

## Phase 3: ID Assignment

### Assignment Message Format

```
╔═══════════════════════════════════════════════════════════════╗
║  🎫 AGENT ID ASSIGNMENT                                       ║
╚═══════════════════════════════════════════════════════════════╝

Your Assigned ID: AGENT-{XX}

⚠️ SIGN ALL MESSAGES: [AGENT-{XX}] your message

Session Info:
• Session ID: {session_id}
• Your Internal ID: {internal_page_agent_id}
• Active Agents: {count}

Please acknowledge with a signed message.
```

### Agent Acknowledgment (Required)

```
[AGENT-01] I acknowledge my assignment and am ready to proceed.
```

---

## Phase 4: Coordination

### Task Assignment

```
[ORCHESTRATOR]
Task ID: task-001
Assigned To: AGENT-01
Priority: high

Task: Analyze the provided JSON schema and suggest improvements.

Expected Output: Markdown list of recommendations
Deadline: 5 minutes
```

### Task Response (Signed)

```
[AGENT-01]
Task ID: task-001
Status: complete

Results:
1. Add required field validation
2. Include timestamp fields
3. Define enum values for status
```

---

## Session Logging

All sessions are logged to `.agent/session-logs/` with comprehensive metadata.

### Log File Format

- **Filename:** `YYYY-MM-DDTHH-MM-SS_{Channel}_orchestration.md`
- **Contents:**
  - Session metadata table
  - Participant registry with signing statistics
  - Signing violations list
  - Full conversation log with timestamps

### Log Metadata Captured

| Field              | Description                               |
| ------------------ | ----------------------------------------- |
| Session ID         | Unique identifier for the session         |
| Start/End Time     | ISO timestamps                            |
| Channel            | Target channel name                       |
| Protocol           | DACC-v1                                   |
| Mode               | normal / persistent                       |
| Participants       | List with assigned IDs and message counts |
| Signing Violations | Count and details of unsigned messages    |

---

## Persistent Mode

The orchestrator can run in persistent mode for continuous operation.

### Features

- **Auto-reconnect:** Automatically reconnects if connection drops
- **Heartbeat:** Sends heartbeat every 25 seconds
- **Periodic reminders:** Reminds about signing every 2 minutes

### Usage

```bash
# Default channel (Green)
node orchestrator-persistent.js

# Custom channel
node orchestrator-persistent.js Yellow
```

### Graceful Shutdown

- Press Ctrl+C to initiate shutdown
- Orchestrator broadcasts shutdown message to channel
- Session log is finalized and saved

---

## Agent Capability Registry

### Standard Capabilities

| Capability         | Description                 |
| ------------------ | --------------------------- |
| `text-generation`  | Can generate text responses |
| `code-generation`  | Can write code              |
| `code-analysis`    | Can analyze/review code     |
| `image-generation` | Can create images           |
| `web-search`       | Has web search access       |
| `file-access`      | Can read/write files        |
| `orchestration`    | Can coordinate other agents |

### Platform Tags

- `gemini-ai` - Google Gemini
- `claude-ai` - Anthropic Claude
- `gpt-ai` - OpenAI GPT
- `browser-extension` - Chrome extension agent

---

## Data Transfer Capabilities

| Type                  | Status     | Notes                    |
| --------------------- | ---------- | ------------------------ |
| Plain Text            | ✅ Full    | Works reliably           |
| JSON (in code blocks) | ✅ Full    | Use triple backticks     |
| URLs/Links            | ✅ Full    | YouTube, GitHub, etc.    |
| Code Blocks           | ✅ Full    | With syntax highlighting |
| Markdown              | ✅ Full    | Headers, lists, tables   |
| Large Payloads        | ⚠️ Limited | Keep under 4KB           |

---

## Scripts Reference

| Script                          | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `orchestrator-persistent.js`    | Persistent orchestrator with auto-reconnect |
| `orchestrator-green-channel.js` | Single-session Green channel orchestrator   |
| `scripts/list_channels.js`      | List available channels                     |

---

## Version History

- **v2.0.0** (2026-01-16)
  - Added mandatory message signing
  - Added persistent mode with auto-reconnect
  - Added signing validation and reminders
  - Enhanced session logging with violation tracking
- **v1.0.0** (2026-01-16)
  - Initial protocol definition
  - Discovery, Context, Coordination phases
  - Basic message formats
