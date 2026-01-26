---
name: clawd-bot-integration
description:
  Integration with Clawdbot for local, proactive, and persistent AI assistance.
  Enables TNF agents to leverage Clawdbot's skills and system access.
---

# Clawdbot Integration Skill

## Purpose

Enable TNF agents to synergize with **Clawdbot**, leveraging its capabilities
for:

- **Persistent Memory**: Storing long-term context and user preferences locally.
- **Proactive Actions**: Scheduling tasks and reminders.
- **System Automation**: Executing system-level commands and scripts via
  Clawdbot's secure sandbox.
- **Cross-Platform Messaging**: Communicating via WhatsApp, Telegram, Discord,
  etc.

## When to Use This Skill

Activate when you need to:

- **Delegate Personal Tasks**: "Remind the user to check the build in 2 hours."
- **Access Local System Context**: Retrieve deeper system state or files via
  Clawdbot's context.
- **Extend Capabilities**: Generate new skills for Clawdbot to perform novel
  tasks.
- **Bridge Ecosystems**: Connect TNF's development workflow with Clawdbot's
  personal assistance.

---

## Quick Start

### 1. Requirements

- Clawdbot installed and running locally.
- Access to `~/clawd/skills/` (default skill directory).

### 2. Usage

#### Generating a New Skill for Clawdbot

To add a capability to Clawdbot, create a Markdown file in `~/clawd/skills/`.

**Template:**

```markdown
# Skill Name

[Description of what the skill does]

## Usage

[Example commands]

## Implementation

... code or script ...
```

#### Delegating a Task

(Future functionality via API Bridge)
`node clawd-bridge.js "Check my calendar for conflicts with the deployment window"`

---

## Synergy Protocols

### 1. Skill Synthesis

TNF agents can generate _Skills_ for Clawdbot. When a user requests a personal
automation (e.g., "Check my email for server alerts"), TNF agents should:

1.  **Analyze** the requirement.
2.  **Generate** a Clawdbot-compatible skill (Markdown/Script).
3.  **Deploy** it to the Clawdbot skills directory.
4.  **Notify** the user to generic "Reload Skills".

### 2. Context Exchange

(Planned) Use a shared context file (e.g., `.clawd/context.json`) or a local
vector store to share memory between TNF workspace and Clawdbot's personal
context.

---

## Troubleshooting

### Connectivity

- Ensure Clawdbot Gateway is running (default port 3000?).
- Verify skill directory permissions.

### Skill format

- Clawdbot skills must follow the specific Markdown structure expected by its
  parser. Start simple.
