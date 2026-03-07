# Implementation Plan: Multi-Agent Orchestration Enhancement

**Version:** 1.0  
**Date:** January 16, 2026  
**Status:** DRAFT

---

## Overview

This plan outlines the next phase of development for The New Fuse multi-agent
orchestration system. Building on the breakthrough of autonomous AI-to-AI
communication, we will implement conversation stability, stall recovery, and
advanced orchestration patterns.

---

## Phase 1: Conversation Stability [Priority: CRITICAL]

### 1.1 Stall Detection System

**Problem:** Conversations stop prematurely with no mechanism to detect or
recover.

**Implementation:**

```typescript
// packages/relay-core/src/stall-detector.ts

interface ConversationState {
  conversationId: string;
  channelId: string;
  lastActivityAt: number;
  participants: Set<string>;
  messageCount: number;
  status: 'active' | 'stalled' | 'completed' | 'terminated';
}

class StallDetector {
  private conversations: Map<string, ConversationState> = new Map();
  private readonly STALL_THRESHOLD_MS = 30000; // 30 seconds
  private readonly CHECK_INTERVAL_MS = 5000; // Check every 5 seconds

  constructor(private relay: TNFRelayServer) {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    setInterval(() => this.checkForStalls(), this.CHECK_INTERVAL_MS);
  }

  private async checkForStalls(): Promise<void> {
    const now = Date.now();

    for (const [id, state] of this.conversations) {
      if (state.status === 'active') {
        const idleTime = now - state.lastActivityAt;

        if (idleTime > this.STALL_THRESHOLD_MS) {
          state.status = 'stalled';
          await this.handleStall(state);
        }
      }
    }
  }

  private async handleStall(state: ConversationState): Promise<void> {
    console.log(`[StallDetector] Conversation ${state.conversationId} stalled`);

    // Emit stall event
    this.relay.emit('conversation:stalled', {
      conversationId: state.conversationId,
      channelId: state.channelId,
      participants: Array.from(state.participants),
      lastActivityAt: state.lastActivityAt,
      messageCount: state.messageCount,
    });

    // Attempt recovery
    await this.attemptRecovery(state);
  }

  private async attemptRecovery(state: ConversationState): Promise<void> {
    // Send wake-up message to channel
    const wakeMessage = {
      type: 'MESSAGE_SEND',
      channel: state.channelId,
      payload: {
        to: 'broadcast',
        content: `[SYSTEM] Conversation stalled. Agents, please continue or acknowledge completion.`,
        messageType: 'system',
        metadata: {
          senderId: 'stall-detector',
          source: 'system',
          isWakeUp: true,
        },
      },
    };

    // Send through relay
    await this.relay.broadcastToChannel(state.channelId, wakeMessage);
  }
}
```

### 1.2 Heartbeat System

**File:** `packages/relay-core/src/heartbeat-manager.ts`

```typescript
interface AgentHeartbeat {
  agentId: string;
  lastHeartbeat: number;
  status: 'healthy' | 'warning' | 'critical';
  missedBeats: number;
}

class HeartbeatManager {
  private readonly HEARTBEAT_INTERVAL = 10000; // 10 seconds
  private readonly MAX_MISSED_BEATS = 3;

  async checkAgentHealth(agentId: string): Promise<boolean> {
    // Implementation
  }

  async sendHeartbeatRequest(agentId: string): Promise<boolean> {
    // Send PING, expect PONG within timeout
  }
}
```

### 1.3 Self-Prompting Mechanism

**Enhancement to Chrome Extension:**

```typescript
// apps/chrome-extension/src/v5/content/self-prompting.ts

class SelfPrompter {
  private readonly IDLE_THRESHOLD_MS = 45000; // 45 seconds
  private lastActivity: number = Date.now();
  private isEnabled: boolean = true;

  private prompts = [
    'Please continue with the conversation.',
    'What are your thoughts on what was discussed?',
    'Is there anything else to add to this topic?',
    'Please summarize the key points so far.',
    'What should be the next step?',
  ];

  checkAndPrompt(): void {
    if (!this.isEnabled) return;

    const idleTime = Date.now() - this.lastActivity;

    if (idleTime > this.IDLE_THRESHOLD_MS) {
      const prompt = this.selectPrompt();
      this.injectPrompt(prompt);
    }
  }

  private selectPrompt(): string {
    return this.prompts[Math.floor(Math.random() * this.prompts.length)];
  }

  private async injectPrompt(prompt: string): Promise<void> {
    // Use SimpleChatBridge to inject
    await simpleChatBridge.sendMessage(`[Auto-Continue] ${prompt}`);
    this.lastActivity = Date.now();
  }
}
```

---

## Phase 2: Orchestration Framework [Priority: HIGH]

### 2.1 Structured Task Protocol

**File:** `packages/relay-core/src/protocol/task-protocol.ts`

```typescript
interface OrchestrationTask {
  id: string;
  type: 'question' | 'generation' | 'analysis' | 'review' | 'continuation';
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Task definition
  title: string;
  description: string;
  instructions: string[];

  // Targeting
  targetAgents?: string[]; // Specific agents, or null for any
  requiredCapabilities?: string[];

  // Response handling
  requiresResponse: boolean;
  responseTimeout: number; // ms
  maxRetries: number;

  // Chaining
  dependencies?: string[]; // Task IDs that must complete first
  nextTasks?: string[]; // Tasks to trigger on completion

  // Metadata
  correlationId: string;
  parentTaskId?: string;
  createdAt: number;
  createdBy: string;
}

interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  result?: any;
  error?: string;
  completedBy: string;
  completedAt: number;
  duration: number;
}
```

### 2.2 Conversation State Machine

**File:** `packages/relay-core/src/orchestrator/conversation-state-machine.ts`

```typescript
enum ConversationPhase {
  INITIALIZING = 'initializing',
  AGENT_DISCOVERY = 'agent_discovery',
  TASK_ASSIGNMENT = 'task_assignment',
  EXECUTION = 'execution',
  REVIEW = 'review',
  COMPLETION = 'completion',
  STALLED = 'stalled',
  RECOVERY = 'recovery',
  TERMINATED = 'terminated',
}

interface ConversationConfig {
  maxDuration: number; // Max conversation duration
  phaseTimeouts: Record<ConversationPhase, number>;
  autoAdvance: boolean; // Auto-advance phases on timeout
  requireHumanApproval: boolean; // Human checkpoint
}

class ConversationStateMachine {
  private phase: ConversationPhase = ConversationPhase.INITIALIZING;
  private phaseStartedAt: number;
  private config: ConversationConfig;

  async transition(newPhase: ConversationPhase): Promise<void> {
    console.log(`[Conversation] ${this.phase} -> ${newPhase}`);

    // Exit actions
    await this.exitPhase(this.phase);

    // Transition
    this.phase = newPhase;
    this.phaseStartedAt = Date.now();

    // Entry actions
    await this.enterPhase(newPhase);
  }

  private async enterPhase(phase: ConversationPhase): Promise<void> {
    switch (phase) {
      case ConversationPhase.STALLED:
        await this.handleStallEntry();
        break;
      case ConversationPhase.RECOVERY:
        await this.handleRecoveryEntry();
        break;
      // ... other phases
    }
  }
}
```

---

## Phase 3: Integration [Priority: MEDIUM]

### 3.1 Relay Server Enhancements

**File:** `packages/relay-core/src/standalone-relay.ts`

Add to existing relay:

```typescript
// After constructor
private stallDetector: StallDetector;
private heartbeatManager: HeartbeatManager;

constructor() {
  // ... existing code ...

  this.stallDetector = new StallDetector(this);
  this.heartbeatManager = new HeartbeatManager(this);

  // Listen for stall events
  this.on('conversation:stalled', this.handleStalledConversation.bind(this));
}

private async handleStalledConversation(event: StallEvent): Promise<void> {
  console.log(`[Relay] Handling stalled conversation: ${event.conversationId}`);

  // 1. Notify orchestrators
  this.broadcast({
    type: 'CONVERSATION_STALLED',
    payload: event,
  });

  // 2. Attempt agent health check
  for (const agentId of event.participants) {
    const isHealthy = await this.heartbeatManager.checkAgentHealth(agentId);
    if (!isHealthy) {
      console.warn(`[Relay] Agent ${agentId} appears unhealthy`);
    }
  }

  // 3. Send continuation prompt
  await this.sendContinuationPrompt(event.channelId);
}
```

### 3.2 Chrome Extension Updates

**File:** `apps/chrome-extension/src/v5/content/index.ts`

Add stall detection to content script:

```typescript
// Add to FuseConnectController

private selfPrompter: SelfPrompter;
private lastMessageTime: number = Date.now();
private readonly STALL_CHECK_INTERVAL = 5000;

private startStallMonitoring(): void {
  setInterval(() => {
    this.checkForStall();
  }, this.STALL_CHECK_INTERVAL);
}

private checkForStall(): void {
  const idleTime = Date.now() - this.lastMessageTime;

  if (idleTime > 60000) { // 1 minute
    console.log('[FuseConnect] Potential stall detected');

    // Notify background script
    chrome.runtime.sendMessage({
      type: 'STALL_DETECTED',
      data: {
        pageAgentId: this.pageAgentId,
        idleTime,
        url: window.location.href,
      }
    });
  }
}
```

---

## Phase 4: Cloud Integration [Priority: FUTURE]

### 4.1 Cloud Sandbox Integration

```typescript
// packages/deployment-core/src/cloud-orchestrator.ts

interface CloudOrchestrator {
  // Schedule recurring orchestration tasks
  scheduleTask(cronExpression: string, task: OrchestrationTask): string;

  // Cancel scheduled task
  cancelScheduledTask(taskId: string): void;

  // Get task execution history
  getTaskHistory(taskId: string): TaskExecution[];

  // Continuous improvement loop
  startContinuousImprovement(config: CIConfig): void;
}

interface CIConfig {
  evaluationInterval: number; // How often to evaluate
  metricsToTrack: string[]; // What to measure
  improvementThreshold: number; // When to trigger improvement
  maxIterations: number; // Safety limit
}
```

### 4.2 Cron Job Support

```typescript
// packages/relay-core/src/scheduler/cron-manager.ts

import cron from 'node-cron';

class CronManager {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  schedule(id: string, expression: string, task: () => Promise<void>): void {
    const job = cron.schedule(expression, task);
    this.jobs.set(id, job);
  }

  // Example: Hourly stall check
  scheduleStallCheck(): void {
    this.schedule('stall-check', '0 * * * *', async () => {
      await this.performStallCheck();
    });
  }

  // Example: Daily conversation summary
  scheduleDailySummary(): void {
    this.schedule('daily-summary', '0 9 * * *', async () => {
      await this.generateDailySummary();
    });
  }
}
```

---

## Implementation Timeline

| Phase | Description       | Priority | Effort    | Target    |
| ----- | ----------------- | -------- | --------- | --------- |
| 1.1   | Stall Detection   | CRITICAL | 2-3 hours | Immediate |
| 1.2   | Heartbeat System  | HIGH     | 1-2 hours | Next      |
| 1.3   | Self-Prompting    | HIGH     | 1-2 hours | Next      |
| 2.1   | Task Protocol     | MEDIUM   | 3-4 hours | Week 1    |
| 2.2   | State Machine     | MEDIUM   | 4-5 hours | Week 1    |
| 3.x   | Integration       | MEDIUM   | 3-4 hours | Week 2    |
| 4.x   | Cloud Integration | LOW      | 8+ hours  | Future    |

---

## Testing Strategy

### Unit Tests

- StallDetector timing logic
- HeartbeatManager response handling
- ConversationStateMachine transitions

### Integration Tests

- Full conversation flow with stall recovery
- Multi-agent task routing
- Orchestrator command handling

### End-to-End Tests

- Two Gemini tabs with automated orchestration
- Stall injection and recovery verification
- Long-running conversation stability

---

## Metrics to Track

1. **Conversation Stability**
   - Average conversation length (messages)
   - Stall rate (per 100 conversations)
   - Recovery success rate

2. **Performance**
   - Message delivery latency
   - Stall detection time
   - Recovery time

3. **Reliability**
   - Agent uptime
   - WebSocket connection stability
   - Error rates

---

## Next Steps

1. [ ] Implement StallDetector class
2. [ ] Add stall event handling to relay server
3. [ ] Implement self-prompting in Chrome extension
4. [ ] Create integration tests
5. [ ] Deploy and monitor

---

## Related Files

- `packages/relay-core/src/standalone-relay.ts` - Main relay server
- `packages/workflow-engine/src/orchestrator/tnf-router.ts` - Task router
- `packages/agent/src/services/RetryService.tsx` - Retry patterns
- `packages/agent/src/services/InterAgentChatService.tsx` - Chat service
- `apps/chrome-extension/src/v5/content/index.ts` - Content script
