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

### 4. **env-manager** ⭐

- **Location**: `.agent/skills/env-manager/SKILL.md`
- **Purpose**: Programmatic environment variable management, backups, and
  verification.
- **Use When**: Setting up keys, fixing DATABASE_URL issues, configuring
  services.
- **Key Features**: Auto-backup, programmatic set/get, pre-flight checks.
- **Scripts**:
  - `manage_env.py` - Core CLI for env manipulation.

### 5. **continuous-improvement** ⭐

- **Location**: `.agent/skills/continuous-improvement/SKILL.md`
- **Purpose**: Autonomously diagnose system health and tech debt.
- **Use When**: Routine audits, system optimization.
- **Key Features**: Integrated `tnf doctor` scans, TODO grep analysis.

### 6. **news-scouting** ⭐

- **Location**: `.agent/skills/news-scouting/SKILL.md`
- **Purpose**: Autonomous tracking of AI news and competitor trends.
- **Use When**: Strategy updates, market analysis.
- **Key Features**: Competitive reporting, threat detection.

### 7. **skill-builder** (Meta-Skill) ⭐

- **Location**: `.agent/skills/skill-builder/SKILL.md`
- **Purpose**: Creates new skills based on patterns
- **Use When**: User requests new capabilities, extending TNF
- **Special**: This is a meta-skill - it builds other skills

### 6. **framework-consciousness** (Meta-Skill) ⭐⭐⭐

- **Location**: `.claude/skills/framework-consciousness.md`
- **Purpose**: P0 Foundation - Achieve holistic, multi-dimensional understanding
  of TNF as a living system.
- **Use When**: Session start, major architectural changes, complex
  orchestrations.
- **Key Features**: Foundation Discovery, Pattern Recognition, Integration
  Intelligence, Capability Synthesis, Evolution & Emergence.
- **Directives**: Survival, Thriving, Learning, Growing, Adapting, Providing
  Compounding Value.

### 7. **planning-with-files** (Context Engineering) ⭐⭐

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

### 8. **context-frontloader** (Context Engineering) ⭐⭐⭐

- **Location**: `.agent/skills/context-frontloader/SKILL.md`
- **Purpose**: Ensures every AI session starts with full ecosystem awareness.
- **Use When**: Session start, context clear, or switching platforms.
- **Key Features**:
  - Auto-injection of `SYSTEM_PROMPT.md`
  - Integration with Ralph Wiggum "Fresh Context" technique
  - Cross-platform frontloading guides
  - Automated context verification
- **Version**: 1.0.0

### 9. **claude-skills-integration**

- **Location**: `docs/CLAUDE_SKILLS.md`
- **Purpose**: Integration layer for Anthropic's official Claude Skills.
- **Use When**: Needing document processing (PDF, XLSX, PPTX), web testing,
  artistic generation.

### 10. **personal-historical-archaeology** ⭐⭐

- **Location**: `.agent/skills/personal-historical-archaeology/SKILL.md`
- **Purpose**: Reconstruct personal and project timelines from repos, notes,
  media, and local evidence while preserving privacy.
- **Use When**: Recovering predecessor project history, mapping pivots and
  restarts, or preparing TNF timeline batches from scattered evidence.
- **Key Features**:
  - Privacy-first filtering for sensitive paths and content
  - Supports repo roots, exported notes, screenshots, and videos
  - Apple Notes MCP-aware workflow when available
  - Emits TNF-compatible `historical_event` batches

### 11. **personal-archaeology-orchestration** ⭐⭐

- **Location**: `.agent/skills/personal-archaeology-orchestration/SKILL.md`
- **Purpose**: Runs the personal archaeology fleet with Master Orchestrator,
  Team Orchestrators, sub-skill taxonomy, heartbeat cadence, and human
  escalation rules.
- **Use When**: Operating archaeology teams continuously or formalizing titles,
  sub-skills, and skill chains for historical reconstruction.
- **Key Features**:
  - Distinguishes `Master Director` from `Master Orchestrator`
  - Treats classification and skill chaining as first-class sub-skills
  - Defines cron and heartbeat contracts for the archaeology program

### 12. **master-of-taxonomies** ⭐⭐

- **Location**: `.agent/skills/master-of-taxonomies/SKILL.md`
- **Purpose**: Owns definition-of-definitions, title hierarchy, skill
  classification, and skill chaining semantics.
- **Use When**: Formalizing roles, naming systems, sub-skills, or semantic
  boundaries across TNF.

### 13. **trait-antigravity** (Meta-Skill) ⭐⭐⭐

- **Location**: `.agent/skills/antigravity/trait-antigravity/SKILL.md`
- **Purpose**: Core Antigravity persona trait - rigor, aesthetics, autonomy.
- **Use When**: Needing high-performance mode, premium UI design, or rigorous
  planning.
- **Key Features**: Ralph Wiggum technique, 3-Strike protocol, Premium
  Aesthetics, Janus planning.

### 14. **tnf-cli-agent** (Specialized Agent) ⭐⭐⭐

- **Location**: `.agent/agents/tnf-cli.md`
- **Purpose**: The canonical CLI-optimized Antigravity agent for TNF and the
  current embodiment of the `Master Director` title.
- **Use When**: Orchestrating workflows via CLI, managing system state.
- **Key Features**: CLI-native, trait-aligned, autonomous orchestration.

### 15. **master-of-taxonomies** (Specialized Agent) ⭐⭐

- **Location**: `.agent/agents/master-of-taxonomies.md`
- **Purpose**: Semantic authority for definitions of definitions.
- **Use When**: TNF needs title, skill, sub-skill, or chain classification.

### 16. **personal-historical-archaeologist** (Specialized Agent) ⭐⭐

- **Location**: `.agent/agents/personal-historical-archaeologist.md`
- **Purpose**: Rebuilds long-running technical and personal timelines from local
  evidence with explicit privacy gates.
- **Use When**: Timeline archaeology, origin-story reconstruction, or
  predecessor-project mapping.
- **Key Features**: Evidence tiering, narrative clustering, privacy-first local
  scanning.

### 17. **personal-archaeology-master-orchestrator** (Specialized Agent) ⭐⭐

- **Location**: `.agent/agents/personal-archaeology-master-orchestrator.md`
- **Purpose**: Bounded Master Orchestrator for the archaeology program.
- **Use When**: Coordinating sub-fleets for repos, notes, media, code, and
  synthesis under the TNF Master Director.
- **Key Features**: Team delegation, cadence enforcement, blocked-state routing.

### 18. **stitch-direct** ⭐⭐

- **Location**: `.agent/skills/stitch-direct/SKILL.md`
- **Purpose**: Direct programmatic interaction with Google Stitch via JSON-RPC.
- **Use When**: High-level design tools fail or precise control over UI
  generation is needed.
- **Key Features**: Bypasses UI abstractions, direct code/image retrieval, 120s
  timeout handling.
- **Scripts**:
  - `stitch_rpc.py` - Core JSON-RPC bridge for Stitch MCP.

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

### 4. **relay-protocol**

- **Location**: `.agent/context/relay-protocol.md`
- **Purpose**: TNF Relay message structure, channels
- **Format**: Message schemas, envelope conventions

### 5. **heartbeat-protocol**

- **Location**: `.agent/context/heartbeat-protocol.md`
- **Purpose**: Standard for agent health reporting
- **Format**: Redis heartbeat pulse schema

### 6. **human-handoff**

- **Location**: `.agent/context/human-handoff.md`
- **Purpose**: Direct channels to reach human operator (Telegram/Discord)
- **Use When**: Critical escalations, budget approval, stuck state.

### 7. **keyboard-shortcuts** (Planned)

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

| Task Type               | Primary Skill        | Referenced Resources                   |
| ----------------------- | -------------------- | -------------------------------------- |
| Browser operation       | browser-automation   | browser-workflow.md                    |
| Send relay message      | relay-communication  | relay-protocol.md, browser-automation  |
| Check system status     | system-diagnostics   | -                                      |
| Create new skill        | skill-builder (meta) | All existing skills, pattern library   |
| Complex task (>5 steps) | planning-with-files  | BMAD workflow, handoff notes           |
| Long-running task       | jules-delegation     | Jules CLI, async execution             |
| High-performance work   | trait-antigravity    | Ralph Wiggum, 3-Strike, High-Aesthetic |
| CLI Orchestration       | tnf-cli-agent        | CLI ops, trait-alignment               |
| Troubleshoot            | Multiple skills      | Diagnostic context, logs               |

### Keyword → Skill Mapping

| Keywords                                         | Load This Skill        |
| ------------------------------------------------ | ---------------------- |
| "browser", "chrome", "gemini", "webpage"         | browser-automation     |
| "relay", "message", "channel", "broadcast"       | relay-communication    |
| "port", "service", "status", "running"           | system-diagnostics     |
| "news", "trend", "scout", "competitor"           | news-scouting          |
| "audit", "tech debt", "improver"                 | continuous-improvement |
| "create skill", "new capability", "add function" | skill-builder (meta)   |
| "plan", "complex", "multi-step", "phases"        | planning-with-files    |
| "findings", "progress", "handoff", "session"     | planning-with-files    |
| "delegate", "jules", "async", "parallel"         | jules-delegation       |
| "antigravity", "trait", "high-performance"       | trait-antigravity      |
| "tnf cli", "cli agent", "orchestrate cli"        | tnf-cli-agent          |

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

- **v1.1** (Mar 18, 2026): Added `stitch-direct` skill for granular UI control.
- **v1.0** (Dec 28, 2025): Initial resource map
- Skills: browser-automation, skill-builder (meta)
- Contexts: browser-workflow, resource-map

---

**Purpose**: This map enables **self-referential discovery** - Claude learns
what it knows by reading this, then loads specific knowledge on-demand.

**Living Document**: This map grows as the TNF knowledge base expands.
