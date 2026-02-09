# TNF Resource Map - Self-Referential Discovery

## What is This?

This is a **self-referential discovery document** that helps Claude understand:

- What knowledge resources exist in TNF
- When to use each resource
- How resources relate hierarchically
- How to compose context for complex tasks

**Read this file FIRST** when starting any TNF task to understand available
capabilities.

---

## 📚 Available Skills

### 1. **browser-automation**

- **Location**: `.agent/skills/browser-automation/SKILL.md`
- **Purpose**: Browser operations, Chrome extension handling
- **Use When**: Working with web browsers, Gemini chat, inter-LLM communication
- **Key Features**:
  - Pre-flight checks for Chrome status
  - Keyboard shortcut guide (`Ctrl+Shift+F`)
  - Injectable UI workflow
  - Common mistake prevention
- **Scripts**:
  - `check_browser.py` - Verify Chrome is running

### 2. **relay-communication** (Planned)

- **Location**: `.agent/skills/relay-communication/SKILL.md`
- **Purpose**: TNF Relay messaging, channels, protocol
- **Use When**: Sending/receiving relay messages, inter-agent communication
- **Dependencies**: May need `browser-automation` for web-based agents

### 3. **system-diagnostics** (Planned)

- **Location**: `.agent/skills/system-diagnostics/SKILL.md`
- **Purpose**: Port checking, service status, health monitoring
- **Use When**: Troubleshooting, startup verification, debugging

### 4. **skill-builder** (Meta-Skill) ⭐

- **Location**: `.agent/skills/skill-builder/SKILL.md`
- **Purpose**: Creates new skills based on patterns
- **Use When**: User requests new capabilities, extending TNF
- **Special**: This is a meta-skill - it builds other skills

### 5. **planning-with-files** (Context Engineering) ⭐⭐

- **Location**: `.agent/skills/planning-with-files/SKILL.md`
- **Purpose**: Manus-style + BMAD-inspired file-based planning
- **Use When**: Complex multi-step tasks, >5 tool calls, multi-session work
- **Key Features**:
  - 3-File Pattern: `task_plan.md`, `findings.md`, `progress.md`
  - BMAD 4-Phase Workflow: ANALYSIS → PLANNING → SOLUTIONING → IMPLEMENTATION
  - Session recovery after `/clear`
  - 2-Action Rule for multimodal content
  - 3-Strike Error Protocol
  - Cross-session handoff notes
- **Templates**:
  - `templates/task_plan.md` - Phase tracking (TNF-enhanced)
  - `templates/findings.md` - Research storage
  - `templates/progress.md` - Session logging
  - `templates/tnf_handoff.md` - Cross-session handoff
- **Scripts**:
  - `scripts/init-session.sh` - Initialize planning files
  - `scripts/check-complete.sh` - Verify phases complete
  - `scripts/session-catchup.py` - Recover prior context
- **Version**: 3.0.0-tnf (Unified Manus + BMAD)

### 6. **jules-delegation**

- **Location**: `.agent/skills/jules-delegation/SKILL.md`
- **Purpose**: Delegate complex tasks to Jules autonomous agent
- **Use When**: Tasks >30 min, parallel execution needed, async work
- **Commands**:
  - `jules new "description"` - Create task
  - `jules new --parallel 4` - Parallel execution
  - `jules remote list --session` - Monitor progress

---

## 📄 Available Context Resources

### 1. **browser-workflow**

- **Location**: `.agent/context/browser-workflow.md`
- **Content**: Complete browser operation workflow
- **Sections**:
  - Phase-by-phase checklist
  - Common failure points
  - Keyboard shortcuts
  - Extension verification
- **Referenced By**: `browser-automation` skill

### 7. **context-frontloader** (Context Engineering) ⭐⭐⭐

- **Location**: `.agent/skills/context-frontloader/SKILL.md`
- **Purpose**: Ensures every AI session starts with full ecosystem awareness.
- **Use When**: Session start, context clear, or switching platforms.
- **Key Features**:
  - Auto-injection of `SYSTEM_PROMPT.md`
  - Integration with Ralph Wiggum "Fresh Context" technique
  - Cross-platform frontloading guides
  - Automated context verification
- **Resources**:
  - `.agent/SYSTEM_PROMPT.md` — Global TNF identity
  - `.agent/memories.md` — Persistent cross-session wisdom
- **Version**: 1.0.0

---

## 📄 Available Context Resources

### 1. **browser-workflow**

- **Location**: `.agent/context/browser-workflow.md`
- **Content**: Complete browser operation workflow
- **Sections**:
  - Phase-by-phase checklist
  - Common failure points
  - Keyboard shortcuts
  - Extension verification
- **Referenced By**: `browser-automation` skill

### 2. **resource-map** (This File)

- **Location**: `.agent/context/resource-map.md`
- **Content**: Map of all available resources
- **Purpose**: Self-referential discovery
- **Use**: Start here for any new task

### 3. **memories**

- **Location**: `.agent/memories.md`
- **Content**: Persistent cross-session wisdom, patterns, and decisions.
- **Purpose**: Historical awareness and learning preservation.
- **Use**: Read to understand architectural decisions and proven patterns.

### 4. **relay-protocol** (Planned)

- **Purpose**: TNF Relay message structure, channels
- **Format**: Message schemas, channel conventions

### 5. **keyboard-shortcuts** (Planned)

- **Purpose**: All TNF keyboard shortcuts
- **Contents**:
  - Chrome Extension: `Ctrl+Shift+F` (Windows/Linux), `Cmd+Shift+F` (Mac)
  - IDE shortcuts
  - Terminal shortcuts

---

## 🎯 Available Prompts (Templates)

### 1. **browser-task-template**

- **Location**: MCP Server (`prompts/browser-task`)
- **Arguments**:
  - `task` (required) - The browser operation to perform
  - `url` (optional) - Target URL
- **Output**: Complete pre-flight checklist + execution steps

### 2. **relay-message-template** (Planned)

- **Arguments**:
  - `channel` - Target channel ID
  - `content` - Message content
  - `recipient` - Specific agent or broadcast
- **Output**: Properly formatted TNF Relay message

### 3. **skill-creation-template** (Planned)

- **Arguments**:
  - `skill_name` - Name of new skill
  - `purpose` - What the skill does
  - `domain` - Category (browser, network, etc.)
- **Output**: Complete SKILL.md file + scripts

---

## 🔧 Available Tools (MCP)

### 1. **mcp_tnf-relay_send_relay_message**

- **Purpose**: Send message to TNF Relay
- **Parameters**:
  - `channel` - Channel ID
  - `content` - Message text
- **Returns**: Success confirmation

### 2. **mcp_tnf-relay_get_relay_messages**

- **Purpose**: Retrieve messages from relay
- **Parameters**:
  - `clear` - Whether to clear after reading
- **Returns**: Array of messages

---

## 🌳 Hierarchical Loading Pattern

### Pattern: Simple Task

```
Task: "Check if Chrome is running"
  ↓
Load: browser-automation/SKILL.md
  ↓
Execute: check_browser.py
  ↓
Done
```

### Pattern: Complex Task

```
Task: "Send message to Gemini via relay"
  ↓
Load: browser-automation/SKILL.md
  ├─ References: browser-workflow.md
  │  └─ Context: Keyboard shortcuts, failure points
  ↓
Load: relay-communication/SKILL.md
  ├─ References: relay-protocol.md
  │  └─ Context: Message format, channels
  ↓
Compose: Full context from all resources
  ↓
Execute: Multi-step workflow
  1. Check Chrome (browser-automation)
  2. Open injectable panel (browser-workflow)
  3. Format message (relay-protocol)
  4. Send via relay (relay-communication)
  ↓
Done
```

### Pattern: Meta Task

```
Task: "Create a skill for Docker management"
  ↓
Load: skill-builder/SKILL.md (meta-skill)
  ├─ Reads: All existing skills for patterns
  ├─ Reads: Similar skill (system-diagnostics)
  ├─ Composes: New skill from pattern
  ├─ Generates: docker-management/SKILL.md
  └─ Creates: check_docker.py, manage_container.py
  ↓
Register: New skill with MCP server
  ↓
Done (New skill now available)
```

---

## 🎯 Quick Reference Guide

### When to Load What

| Task Type               | Primary Skill        | Referenced Resources                  |
| ----------------------- | -------------------- | ------------------------------------- |
| Browser operation       | browser-automation   | browser-workflow.md                   |
| Send relay message      | relay-communication  | relay-protocol.md, browser-automation |
| Check system status     | system-diagnostics   | -                                     |
| Create new skill        | skill-builder (meta) | All existing skills, pattern library  |
| Complex task (>5 steps) | planning-with-files  | BMAD workflow, handoff notes          |
| Long-running task       | jules-delegation     | Jules CLI, async execution            |
| Troubleshoot            | Multiple skills      | Diagnostic context, logs              |

### Keyword → Skill Mapping

| Keywords                                         | Load This Skill      |
| ------------------------------------------------ | -------------------- |
| "browser", "chrome", "gemini", "webpage"         | browser-automation   |
| "relay", "message", "channel", "broadcast"       | relay-communication  |
| "port", "service", "status", "running"           | system-diagnostics   |
| "create skill", "new capability", "add function" | skill-builder (meta) |
| "plan", "complex", "multi-step", "phases"        | planning-with-files  |
| "findings", "progress", "handoff", "session"     | planning-with-files  |
| "delegate", "jules", "async", "parallel"         | jules-delegation     |

---

## 🔄 Self-Referential Discovery Process

### Step 1: Start Here

When given any task, Claude should:

1. Read this resource map FIRST
2. Identify which skills/resources are relevant
3. Load them hierarchically

### Step 2: Progressive Loading

```
1. Load metadata (skill names, descriptions)
   ↓
2. Match task to relevant skills
   ↓
3. Load full SKILL.md for matched skills
   ↓
4. Load referenced context resources
   ↓
5. Load referenced related skills
   ↓
6. Execute scripts if needed
```

### Step 3: Context Composition

Combine all loaded resources into unified understanding:

- Skills provide procedures
- Contexts provide background knowledge
- Prompts provide templates
- Tools provide actions

---

## 📊 Resource Relationships

```
skill-builder (meta)
├── browser-automation
│   ├── browser-workflow.md
│   └── keyboard-shortcuts.md
├── relay-communication
│   ├── relay-protocol.md
│   └── browser-automation (dependency)
└── system-diagnostics
    └── (standalone)
```

---

## 🚀 How to Use This Map

### For Claude:

1. When starting a task, read this file
2. Identify relevant skills/resources
3. Load them hierarchically
4. Compose complete context
5. Execute with full knowledge

### For Developers:

1. Add new skills to `.agent/skills/[name]/`
2. Update this map with new entries
3. Define relationships and dependencies
4. Update MCP server resource listings

---

## 🔍 Finding Resources

### By URI (MCP)

- Skills: `tnf://skills/[skill-name]`
- Contexts: `tnf://context/[context-name]`
- MetaResources: `tnf://meta/[meta-name]`

### By Filesystem

- Skills: `.agent/skills/[skill-name]/SKILL.md`
- Contexts: `.agent/context/[context-name].md`
- Prompts: `.agent/prompts/[prompt-name].template.md`

---

## 📝 Maintenance

### When to Update This Map

- ✅ New skill created
- ✅ New context resource added
- ✅ Skill dependencies change
- ✅ New patterns discovered

### Version History

- **v1.0** (Dec 28, 2025): Initial resource map
- Skills: browser-automation, skill-builder (meta)
- Contexts: browser-workflow, resource-map

---

**Purpose**: This map enables **self-referential discovery** - Claude learns
what it knows by reading this, then loads specific knowledge on-demand.

**Living Document**: This map grows as the TNF knowledge base expands.
