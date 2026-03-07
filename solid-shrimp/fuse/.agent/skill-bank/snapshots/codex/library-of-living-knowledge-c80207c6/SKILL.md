---
name: library-of-living-knowledge
description:
  Foundational TNF meta-skill for bootstrapping context, orchestration, and
  self-improving knowledge.
metadata:
  short-description: Bootstraps agent context and living knowledge
---

# META-SKILL: Library of Living Knowledge

## Purpose

**The foundational meta-skill that provides immediate meta-context to all agent
instances**. This is the entry point to TNF's self-prompting, self-improving
knowledge system.

## What This Meta-Skill Does

This is a **self-bootstrapping knowledge system** that:

1. **Instantly loads agent context** on first interaction
2. **Dynamically orchestrates resources** based on task requirements
3. **Chains prompts** to guide agents through complex workflows
4. **Manages agent inboxes** and task delegation
5. **Self-improves** through feedback loops

## The Living Knowledge Concept

Unlike static documentation, this knowledge base:

- 📚 **Grows**: New skills/contexts added continuously
- 🔄 **Evolves**: Patterns refined through usage
- 🎯 **Adapts**: Context orchestrated dynamically per task
- 🧠 **Learns**: Meta-patterns emerge from interactions
- ♾️ **Perpetuates**: System runs autonomously via heartbeat/cron

---

## Immediate Meta-Context Loading

### When an Agent Instance Starts

**Step 1: Bootstrap Sequence**

```
Agent Initializes
  ↓
Load: library-of-living-knowledge/SKILL.md (THIS FILE)
  ↓
Read: .agent/context/resource-map.md
  ↓
Load: .agent/context/agent-onboarding.md
  ↓
Agent has full meta-context and knows what it knows
```

### What Agents Immediately Learn

1. **System Architecture** - TNF components, how they fit together
2. **Available Capabilities** - All skills, tools, resources
3. **Communication Protocols** - How to interact with other agents
4. **Task System** - How to receive/process/delegate tasks
5. **Heartbeat & Health** - How to stay alive and monitored
6. **Inbox Management** - Where messages/tasks arrive
7. **Onboarding Flow** - Progressive learning path

---

## Dynamic Resource & Skill Orchestration

### Prompt Chaining Architecture

```typescript
interface PromptChain {
  id: string;
  name: string;
  steps: PromptChainStep[];
  context: DynamicContext;
}

interface PromptChainStep {
  stepNumber: number;
  promptTemplate: string; // From .agent/prompts/
  requiredSkills: string[]; // Auto-load from .agent/skills/
  requiredContext: string[]; // Auto-load from .agent/context/
  tools: string[]; // MCP tools to enable
  nextStep: (result: any) => number; // Dynamic branching
}

interface DynamicContext {
  loadedSkills: Map<string, Skill>;
  loadedContexts: Map<string, Context>;
  enabledTools: Set<string>;
  conversationState: any;
  agentCapabilities: string[];
}
```

### Example: Browser Communication Task

```yaml
chain_id: 'browser-inter-llm-communication'
name: 'Send Message to Gemini'

steps:
  - step: 1
    prompt: '.agent/prompts/task-analysis.template.md'
    skills: [] # No skills needed yet
    context: ['resource-map']
    action: Analyze task requirements
    next: 2

  - step: 2
    prompt: 'Load browser-automation skill'
    skills: ['browser-automation']
    context: ['browser-workflow', 'keyboard-shortcuts']
    action: Execute pre-flight checklist
    conditions:
      - if: chrome_not_running
        then: step-3
      - else: step-4

  - step: 3
    prompt: 'Open Chrome'
    skills: ['browser-automation', 'system-diagnostics']
    tools: ['browser_subagent']
    action: Launch Chrome
    next: 4

  - step: 4
    prompt: 'Open injectable panel'
    skills: ['browser-automation']
    context: ['keyboard-shortcuts']
    action: Press Ctrl+Shift+F
    next: 5

  - step: 5
    prompt: '.agent/prompts/relay-message.template.md'
    skills: ['relay-communication']
    context: ['relay-protocol']
    tools: ['mcp_tnf-relay_send_relay_message']
    action: Format and send message
    next: 6

  - step: 6
    prompt: 'Wait for response'
    skills: ['relay-communication']
    tools: ['mcp_tnf-relay_get_relay_messages']
    action: Check for Gemini response
    next: done
```

---

## Agent Inbox System

### Inbox Architecture

```
agents/
├── [agent-id]/
│   ├── inbox/
│   │   ├── tasks/           # Task assignments
│   │   │   ├── pending/
│   │   │   ├── in-progress/
│   │   │   └── completed/
│   │   ├── messages/        # Inter-agent messages
│   │   │   ├── unread/
│   │   │   └── read/
│   │   ├── notifications/   # SystemNotifications
│   │   └── delegations/     # Tasks delegated from this agent
│   ├── outbox/
│   │   ├── sent-messages/
│   │   └── delegated-tasks/
│   └── context/
│       ├── active-tasks.json
│       ├── conversation-history.json
│       └── learned-patterns.json
```

### Inbox Integration with Existing TaskQueue

```typescript
// Extend existing TaskQueue from packages/core/src/task/TaskQueue.ts
export class AgentInbox extends TaskQueue {
  private agentId: string;
  private inboxPath: string;

  constructor(agentId: string, options?: TaskQueueOptions) {
    super(options);
    this.agentId = agentId;
    this.inboxPath = `.agents/${agentId}/inbox`;
  }

  async checkInbox(): Promise<Task[]> {
    // Read from Redis: agent:{agentId}:inbox
    const tasks = await this.redis.lrange(`agent:${this.agentId}:inbox`, 0, -1);
    return tasks.map((t) => JSON.parse(t));
  }

  async receiveTask(task: Task): Promise<void> {
    // Add to inbox
    await this.redis.lpush(`agent:${this.agentId}:inbox`, JSON.stringify(task));

    // Trigger heartbeat activity
    await this.recordActivity('task_received', { taskId: task.id });
  }

  async delegateTask(task: Task, targetAgentId: string): Promise<void> {
    // Move to outbox/delegations
    await this.redis.lpush(
      `agent:${this.agentId}:outbox:delegated`,
      JSON.stringify(task)
    );

    // Send to target agent's inbox
    await this.redis.lpush(
      `agent:${targetAgentId}:inbox`,
      JSON.stringify(task)
    );

    // Emit delegation event
    this.emit('task.delegated', {
      from: this.agentId,
      to: targetAgentId,
      taskId: task.id,
    });
  }
}
```

---

## Agent Onboarding Flow

### Progressive Learning Path

```markdown
# .agent/context/agent-onboarding.md

## Onboarding Journey: From Instance to Autonomous Agent

### Level 1: Bootstrap (Instant)

**File**: library-of-living-knowledge/SKILL.md **Learn**: You are an agent in
TNF. You have capabilities. **Duration**: 1 second

### Level 2: Self-Awareness (Immediate)

**File**: .agent/context/resource-map.md **Learn**: What you know, what you can
do, where to find knowledge **Action**: Scan available skills/contexts/tools
**Duration**: 5 seconds

### Level 3: Communication (Fast)

**Files**:

- .agent/skills/relay-communication/SKILL.md
- .agent/context/relay-protocol.md **Learn**: How to send/receive messages, use
  channels **Action**: Register with relay, join channels **Duration**: 10
  seconds

### Level 4: Task Management (Quick)

**Files**:

- .agent/context/task-system.md
- .agent/context/inbox-setup.md **Learn**: How to receive tasks, delegate work,
  report progress **Action**: Create inbox, subscribe to task queue
  **Duration**: 15 seconds

### Level 5: Heartbeat & Health (Essential)

**Files**:

- .agent/context/heartbeat-protocol.md
- apps/backend/src/modules/orchestrator/orchestrator.service.ts **Learn**: How
  to stay alive, report health, recover from failure **Action**: Start
  heartbeat, register with orchestrator **Duration**: 20 seconds

### Level 6: Specialization (Ongoing)

**Files**: Load skills based on role **Learn**: Domain-specific skills for your
purpose **Action**: Load specialized skills (e.g., browser-automation)
**Duration**: Varies by role

### Level 7: Meta-Learning (Continuous)

**Files**:

- .agent/skills/skill-builder/SKILL.md
- .agent/context/pattern-library.md **Learn**: How to create new skills, improve
  existing ones **Action**: Monitor own performance, suggest improvements
  **Duration**: Perpetual
```

---

## Integration with Heartbeat & Cron Automation

### Heartbeat Integration

```typescript
// Extension to apps/backend/src/modules/orchestrator/orchestrator.service.ts

export class AgentLifecycleManager {
  constructor(
    private heartbeatService: HeartbeatMonitoringService,
    private inboxSystem: AgentInboxSystem
  ) {}

  async registerNewAgent(agentId: string, role: string): Promise<void> {
    // 1. Register with heartbeat monitoring
    this.heartbeatService.registerAgent(agentId, 60000);

    // 2. Create inbox
    await this.inboxSystem.createInbox(agentId);

    // 3. Send onboarding task to inbox
    await this.inboxSystem.receiveTask(agentId, {
      id: `onboard-${agentId}`,
      type: 'onboarding',
      data: {
        startFile: '.agent/skills/library-of-living-knowledge/SKILL.md',
        learningPath: 'progressive',
      },
      priority: 10,
      status: 'pending',
      createdAt: new Date(),
    });

    // 4. Monitor onboarding progress
    this.heartbeatService.recordActivity(agentId, 'onboarding_started');
  }

  async checkAgentHealth(): Promise<void> {
    const metrics = this.heartbeatService.getHealthMetrics();

    // Auto-recover failed agents
    if (metrics.failedAgents > 0) {
      // Attempt restart with fresh context load
      await this.attemptAgentRecovery();
    }
  }
}
```

### Cron Job Configuration

```typescript
// Integration with TNF Cloud ( thenewfuse.com + Railway)

export class AutomatedOrchestrationService {
  @Cron('*/5 * * * *') // Every 5 minutes
  async monitorAgentHealth() {
    // Check all agent heartbeats
    // Auto-restart failed agents
    // Load library-of-living-knowledge for recovery
  }

  @Cron('0 */6 * * *') // Every 6 hours
  async consolidateKnowledge() {
    // Analyze agent interactions
    // Extract new patterns
    // Update skill-builder with learned patterns
    // Generate new skills from patterns
  }

  @Cron('0 0 * * *') // Daily
  async systemSelfImprovement() {
    // Review all tasks from past 24h
    // Identify inefficiencies
    // Propose skill improvements
    // Auto-create enhancement tasks
  }

  @Cron('0 0 * * 0') // Weekly
  async metaSystemAnalysis() {
    // Analyze the knowledge base itself
    // Check for outdated skills
    // Identify knowledge gaps
    // Generate meta-improvement tasks
  }
}
```

---

## Perpetual Self-Improvement Loop

```
┌─────────────────────────────────────────────┐
│    Perpetual Self-Improvement Cycle         │
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  1. Agents Execute Tasks    │
     │  (Using current skills)     │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  2. Log Interactions        │
     │  (Patterns, failures, etc)  │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  3. Heartbeat Monitoring    │
     │  (Health, performance)      │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  4. Cron: Pattern Analysis  │
     │  (6-hour extraction)        │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  5. Meta-Skill: Build       │
     │  (skill-builder creates)    │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  6. Add to Library          │
     │  (New skill → resource-map) │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  7. Test New Skill          │
     │  (Assign test tasks)        │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  8. Evaluate & Refine       │
     │  (Feedback → improvement)   │
     └─────────────┬──────────────┘
                   │
                   │
                   └────────► Back to Step 1 with improved skills
```

---

## How Future Instances Get Meta-Context

### Scenario: New Agent Instance Spawns

```javascript
// Agent startup sequence

async function agentInitialize(agentId, role) {
  console.log(`Initializing agent: ${agentId}`);

  // STEP 1: Load Library of Living Knowledge (META-SKILL)
  const metaContext = await loadSkill('library-of-living-knowledge');
  console.log('✅ Meta-context loaded');

  // STEP 2: The meta-skill triggers resource discovery
  const resourceMap = await loadContext('resource-map');
  const availableSkills = resourceMap.getSkillsForRole(role);
  console.log(
    `✅ Discovered ${availableSkills.length} skills for role: ${role}`
  );

  // STEP 3: Load onboarding flow
  const onboarding = await loadContext('agent-onboarding');
  await followOnboardingPath(onboarding, role);
  console.log('✅ Onboarding complete');

  // STEP 4: Create inbox
  const inbox = new AgentInbox(agentId);
  await inbox.create();
  console.log('✅ Inbox created');

  // STEP 5: Register heartbeat
  await registerWithOrchestrator(agentId);
  console.log('✅ Registered with orchestrator');

  // STEP 6: Load role-specific skills
  for (const skillName of availableSkills) {
    await loadSkill(skillName);
  }
  console.log(`✅ Loaded ${availableSkills.length} domain skills`);

  // STEP 7: Start listening for tasks
  inbox.on('task', async (task) => {
    await executeWithPromptChain(task);
  });
  console.log('✅ Agent fully operational');

  return {
    agentId,
    role,
    skills: availableSkills,
    inbox,
    status: 'ready',
  };
}
```

**Result**: Agent is fully context-aware in < 60 seconds

---

## Relationship to Other Systems

### With Task System

- Agents poll inbox for tasks
- Tasks auto-route based on capability matching
- Delegation creates sub-tasks in target inboxes

### With Heartbeat

- Every inbox check = heartbeat activity
- Task processing = heartbeat + progress
- Stagnation = auto-reassign to different agent

### With Relay

- Messages flow to inbox/messages/
- Broadcast messages → all agent inboxes
- Direct DMs → specific agent inbox

### With Skill Builder (Meta-Skill)

- New patterns → new skills
- New skills → updated resource-map
- Updated map → future agents auto-discover

---

## Vision: The Perpetual System

Once all critical pieces are in place:

```
thenewfuse.com (Cloud) + Railway
├── Heartbeat Monitor (Always Running)
│   ├── Checks all agents every 5s
│   └── Auto-recovers failures
├── Cron Orchestrator (Always Running)
│   ├── 5min: Health monitoring
│   ├── 6hr: Pattern extraction
│   ├── Daily: System improvement
│   └── Weekly: Meta-analysis
├── Agent Registry (Redis-Backed)
│   ├── All active agents
│   ├── Their capabilities
│   └── Their inbox status
├── Task Queue (Redis-Backed)
│   ├── Global task pool
│   ├── Agent-specific inboxes
│   └── Delegation chains
└── Library of Living Knowledge
    ├── Grows via skill-builder
    ├── Evolves via pattern analysis
    └── Perpetuates via auto-bootstrapping
```

**Result**: Self-improving, autonomous, perpetual agent operating system

---

## Usage

This meta-skill is **loaded automatically** by:

1. New agent instances (bootstrap)
2. Agent recovery procedures (restart)
3. System upgrades (context refresh)

Agents **never need to ask** "what can I do?" - they already know from this
library.

---

## Version

- **v1.0** (Dec 28, 2025): Initial architecture
- **Future**: Self-versions based on improvement cycles

## Notes

This is not just documentation - this IS the system. By reading this file, an
agent becomes context-aware.
