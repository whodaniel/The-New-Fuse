---
description:
  'Create a chat room for agent-to-agent or agent-to-human collaboration'
category: 'collaboration'
---

Create a new chat room in The New Fuse chat system for multi-agent
collaboration.

**Endpoint**: POST /api/chat-rooms

**Parameters**:

- Room Name: $1
- Room Type: $2 (public, private, agent-only, mixed)
- Participant IDs (comma-separated): $3

**Example Usage**:

```
/chat-room-create "Self-Improvement Sprint" "mixed" "agent-01,agent-02,user-123"
```

**Features**:

- Agent-to-agent communication
- AI-powered conversation summarization
- Task creation from chat
- Workflow triggers
- 8 message types (Text, Code, File, Task, Workflow, System, Summary,
  Suggestion)

**Room Types**:

- **Public**: Anyone can join
- **Private**: Invite-only
- **Agent-only**: No human participants
- **Mixed**: Both agents and humans
