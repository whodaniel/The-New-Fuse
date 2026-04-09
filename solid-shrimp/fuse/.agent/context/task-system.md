# Task System & Agent Inbox Integration

## Overview

This document describes how the **Agent Inbox System** integrates with TNF's
existing **TaskQueue** infrastructure to create a comprehensive task management
and delegation system.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           TNF Task & Inbox Ecosystem                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │ Global Task  │────────▶│   TNFRouter  │         │
│  │    Queue     │         │ (Orchestrator│         │
│  │ (Redis)      │         │              │         │
│  └──────┬───────┘         └──────┬───────┘         │
│         │                        │                  │
│         │ Route based on         │ Delegate to      │
│         │ capabilities           │ capable agent    │
│         │                        │                  │
│         ▼                        ▼                  │
│  ┌──────────────────────────────────────┐          │
│  │      Agent-Specific Inboxes          │          │
│  │  (One per agent, Redis-backed)       │          │
│  ├──────────────────────────────────────┤          │
│  │  agents/{agentId}/inbox/             │          │
│  │  ├── tasks/                          │          │
│  │  │   ├── pending/                    │          │
│  │  │   ├── in-progress/                │          │
│  │  │   └── completed/                  │          │
│  │  ├── messages/                       │          │
│  │  │   ├── unread/                     │          │
│  │  │   └── read/                       │          │
│  │  ├── notifications/                  │          │
│  │  └── delegations/                    │          │
│  └──────────────────────────────────────┘          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Integration with Existing TaskQueue

### packages/core/src/task/TaskQueue.ts

The existing `TaskQueue.ts` provides:

- Redis-backed task storage
- Task status management (pending, running, completed, failed)
- Priority handling
- Event emission

### Extension: AgentInbox

```typescript
// packages/core/src/task/AgentInbox.ts

import { TaskQueue, Task, TaskQueueOptions } from './TaskQueue';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';

export interface AgentTask extends Task {
  agentId: string;
  delegatedFrom?: string;
  delegatedTo?: string;
  requiresSkills?: string[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  read: boolean;
  channel?: string;
}

@Injectable()
export class AgentInbox extends TaskQueue<AgentTask> {
  private readonly logger = new Logger(AgentInbox.name);
  private readonly agentId: string;
  private redis: Redis;
  private eventEmitter: EventEmitter2;

  constructor(
    agentId: string,
    redis: Redis,
    eventEmitter: EventEmitter2,
    options?: TaskQueueOptions
  ) {
    super(options);
    this.agentId = agentId;
    this.redis = redis;
    this.eventEmitter = eventEmitter;
  }

  // ============ INBOX OPERATIONS ============

  /**
   * Get all pending tasks from this agent's inbox
   */
  async getPendingTasks(): Promise<AgentTask[]> {
    const tasks = await this.redis.lrange(
      `agent:${this.agentId}:inbox:tasks:pending`,
      0,
      -1
    );
    return tasks.map((t) => JSON.parse(t));
  }

  /**
   * Get count of pending tasks
   */
  async getPendingCount(): Promise<number> {
    return await this.redis.llen(`agent:${this.agentId}:inbox:tasks:pending`);
  }

  /**
   * Receive a new task into inbox
   */
  async receiveTask(task: AgentTask): Promise<void> {
    this.logger.log(`Agent ${this.agentId} receiving task: ${task.id}`);

    // Add to pending queue
    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:pending`,
      JSON.stringify({ ...task, agentId: this.agentId, receivedAt: new Date() })
    );

    // Emit event
    this.eventEmitter.emit('agent.task_received', {
      agentId: this.agentId,
      taskId: task.id,
      timestamp: new Date(),
    });

    // Record activity for heartbeat
    await this.recordActivity('task_received', { taskId: task.id });
  }

  /**
   * Move task from pending to in-progress
   */
  async startTask(taskId: string): Promise<void> {
    const pending = await this.getPendingTasks();
    const task = pending.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found in pending queue`);
    }

    // Remove from pending
    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:pending`,
      1,
      JSON.stringify(task)
    );

    // Add to in-progress
    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      JSON.stringify({ ...task, startedAt: new Date() })
    );

    this.eventEmitter.emit('agent.task_started', {
      agentId: this.agentId,
      taskId,
      timestamp: new Date(),
    });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result: any): Promise<void> {
    const inProgress = await this.redis.lrange(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      0,
      -1
    );
    const task = inProgress
      .map((t) => JSON.parse(t))
      .find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found in in-progress queue`);
    }

    // Remove from in-progress
    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      1,
      JSON.stringify(task)
    );

    // Add to completed
    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:completed`,
      JSON.stringify({
        ...task,
        completedAt: new Date(),
        result,
      })
    );

    this.eventEmitter.emit('agent.task_completed', {
      agentId: this.agentId,
      taskId,
      result,
      timestamp: new Date(),
    });
  }

  // ============ DELEGATION ============

  /**
   * Delegate task to another agent
   */
  async delegateTask(taskId: string, targetAgentId: string): Promise<void> {
    this.logger.log(
      `Agent ${this.agentId} delegating task ${taskId} to ${targetAgentId}`
    );

    const pending = await this.getPendingTasks();
    const task = pending.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Mark as delegated
    const delegatedTask: AgentTask = {
      ...task,
      delegatedFrom: this.agentId,
      delegatedTo: targetAgentId,
    };

    // Remove from this agent's inbox
    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:pending`,
      1,
      JSON.stringify(task)
    );

    // Add to outbox/delegations
    await this.redis.lpush(
      `agent:${this.agentId}:outbox:delegated`,
      JSON.stringify(delegatedTask)
    );

    // Send to target agent's inbox
    const targetInbox = new AgentInbox(
      targetAgentId,
      this.redis,
      this.eventEmitter,
      this.options
    );
    await targetInbox.receiveTask(delegatedTask);

    this.eventEmitter.emit('agent.task_delegated', {
      from: this.agentId,
      to: targetAgentId,
      taskId,
      timestamp: new Date(),
    });
  }

  // ============ MESSAGES ============

  /**
   * Receive a message
   */
  async receiveMessage(message: AgentMessage): Promise<void> {
    await this.redis.lpush(
      `agent:${this.agentId}:inbox:messages:unread`,
      JSON.stringify(message)
    );

    this.eventEmitter.emit('agent.message_received', {
      agentId: this.agentId,
      messageId: message.id,
      from: message.from,
      timestamp: new Date(),
    });
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(): Promise<AgentMessage[]> {
    const messages = await this.redis.lrange(
      `agent:${this.agentId}:inbox:messages:unread`,
      0,
      -1
    );
    return messages.map((m) => JSON.parse(m));
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    const unread = await this.getUnreadMessages();
    const message = unread.find((m) => m.id === messageId);

    if (message) {
      // Remove from unread
      await this.redis.lrem(
        `agent:${this.agentId}:inbox:messages:unread`,
        1,
        JSON.stringify(message)
      );

      // Add to read
      await this.redis.lpush(
        `agent:${this.agentId}:inbox:messages:read`,
        JSON.stringify({ ...message, read: true, readAt: new Date() })
      );
    }
  }

  // ============ NOTIFICATIONS ============

  /**
   * Send notification to agent
   */
  async sendNotification(notification: {
    type: string;
    message: string;
    priority: number;
  }): Promise<void> {
    await this.redis.lpush(
      `agent:${this.agentId}:inbox:notifications`,
      JSON.stringify({
        ...notification,
        timestamp: new Date(),
      })
    );

    this.eventEmitter.emit('agent.notification_sent', {
      agentId: this.agentId,
      type: notification.type,
      timestamp: new Date(),
    });
  }

  // ============ HEARTBEAT INTEGRATION ============

  /**
   * Record activity (for heartbeat monitoring)
   */
  private async recordActivity(
    activityType: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.redis.publish(
      'agent:activity',
      JSON.stringify({
        agentId: this.agentId,
        activityType,
        metadata,
        timestamp: new Date(),
      })
    );
  }

  /**
   * Get current task (for heartbeat reporting)
   */
  async getCurrentTask(): Promise<string | undefined> {
    const inProgress = await this.redis.lrange(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      0,
      0
    );
    if (inProgress.length > 0) {
      const task: AgentTask = JSON.parse(inProgress[0]);
      return task.id;
    }
    return undefined;
  }
}
```

---

## Integration with TNFRouter

The TNFRouter (`packages/workflow-engine/src/orchestrator/tnf-router.ts`) routes
tasks to appropriate agents based on:

1. **Capability matching** - Agent has required skills
2. **Load balancing** - Agent with fewest pending tasks
3. **Specialization** - Agent role matches task domain

### Enhanced TNFRouter with Inbox Integration

```typescript
// packages/workflow-engine/src/orchestrator/tnf-router.ts (additions)

export class TNFRouter {
  // ... existing code ...

  async routeTaskToAgent(task: Task): Promise<void> {
    // 1. Determine required skills
    const requiredSkills = this.analyzeTaskSkills(task);

    // 2. Find capable agents
    const capableAgents = await this.findCapableAgents(requiredSkills);

    if (capableAgents.length === 0) {
      this.logger.warn(`No capable agents found for task ${task.id}`);
      return;
    }

    // 3. Select best agent (load balancing)
    const selectedAgent = await this.selectBestAgent(capableAgents);

    // 4. Send to agent's inbox
    const inbox = new AgentInbox(selectedAgent, this.redis, this.eventEmitter);
    await inbox.receiveTask({
      ...task,
      requiresSkills: requiredSkills,
    });

    this.logger.log(`Task ${task.id} routed to agent ${selectedAgent}`);
  }

  private async selectBestAgent(capableAgents: string[]): Promise<string> {
    // Load balance: select agent with fewest pending tasks
    const loadMap = new Map<string, number>();

    for (const agentId of capableAgents) {
      const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
      const pendingCount = await inbox.getPendingCount();
      loadMap.set(agentId, pendingCount);
    }

    // Return agent with minimum load
    return Array.from(loadMap.entries()).sort((a, b) => a[1] - b[1])[0][0];
  }
}
```

---

## Heartbeat Integration

### Extension to OrchestratorService

```typescript
// apps/backend/src/modules/orchestrator/orchestrator.service.ts (additions)

export class OrchestratorService {
  // ... existing code ...

  /**
   * Monitor agent inbox health
   */
  @Cron('*/1 * * * *') // Every minute
  async monitorAgentInboxes(): Promise<void> {
    const agents = await this.heartbeatService.getAllAgentStatuses();

    for (const [agentId, status] of agents) {
      if (status.status === 'active') {
        const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
        const pendingCount = await inbox.getPendingCount();

        // Alert if inbox is overflowing
        if (pendingCount > 50) {
          this.logger.warn(
            `Agent ${agentId} inbox overflowing: ${pendingCount} pending tasks`
          );
          await inbox.sendNotification({
            type: 'inbox_overflow',
            message: `You have ${pendingCount} pending tasks`,
            priority: 8,
          });
        }

        // Redistribute tasks if agent is stalled
        if (status.status === 'stalled' && pendingCount > 0) {
          this.logger.log(`Redistributing tasks from stalled agent ${agentId}`);
          await this.redistributeTasks(agentId);
        }
      }
    }
  }

  /**
   * Redistribute tasks from failed/stalled agent
   */
  private async redistributeTasks(agentId: string): Promise<void> {
    const inbox = new AgentInbox(agentId, this.redis, this.eventEmitter);
    const pendingTasks = await inbox.getPendingTasks();

    for (const task of pendingTasks) {
      // Route to another capable agent
      await this.router.routeTaskToAgent(task);
    }

    this.logger.log(
      `Redistributed ${pendingTasks.length} tasks from agent ${agentId}`
    );
  }
}
```

---

## Usage Examples

### Agent Checking Inbox

```typescript
// In agent runtime
const inbox = new AgentInbox(this.agentId, redis, eventEmitter);

// Poll inbox every 5 seconds
setInterval(async () => {
  const tasks = await inbox.getPendingTasks();

  if (tasks.length > 0) {
    const task = tasks[0]; // Get highest priority
    await inbox.startTask(task.id);

    try {
      const result = await this.executeTask(task);
      await inbox.completeTask(task.id, result);
    } catch (error) {
      this.logger.error(`Task ${task.id} failed:`, error);
    }
  }
}, 5000);
```

### Delegating a Task

```typescript
// Agent realizes it doesn't have required skill
if (!this.hasSkill('browser-automation')) {
  // Find agent with browser-automation capability
  const targetAgent = await this.findAgentWithSkill('browser-automation');

  // Delegate task
  await inbox.delegateTask(task.id, targetAgent);
}
```

### Receiving Messages from Relay

```typescript
// Listen for relay messages→ inbox integration
relay.on('message_received', async (msg) => {
  await inbox.receiveMessage({
    id: msg.id,
    from: msg.from,
    to: this.agentId,
    content: msg.content,
    timestamp: new Date(),
    read: false,
    channel: msg.channel,
  });
});
```

---

## Redis Schema

```
# Global Task Queue
task:queue → LIST of tasks (to be routed)

# Agent-Specific Inboxes
agent:{agentId}:inbox:tasks:pending → LIST
agent:{agentId}:inbox:tasks:in-progress → LIST
agent:{agentId}:inbox:tasks:completed → LIST
agent:{agentId}:inbox:messages:unread → LIST
agent:{agentId}:inbox:messages:read → LIST
agent:{agentId}:inbox:notifications → LIST

# Agent Outbox
agent:{agentId}:outbox:delegated → LIST
agent:{agentId}:outbox:sent-messages → LIST

# Capability Registry
agent:{agentId}:capabilities → SET (skill names)
agent:{agentId}:status → HASH {status, lastHeartbeat, currentTask, ...}
```

---

## Event Emissions

```typescript
// Task Events
'agent.task_received' → { agentId, taskId, timestamp }
'agent.task_started' → { agentId, taskId, timestamp }
'agent.task_completed' → { agentId, taskId, result, timestamp }
'agent.task_delegated' → { from, to, taskId, timestamp }

// Message Events
'agent.message_received' → { agentId, messageId, from, timestamp }
'agent.notification_sent' → { agentId, type, timestamp }

// Orchestration Events
'agent.registered' → { agentId, timestamp }
'agent.heartbeat' → { agentId, taskId, timestamp }
'agent.stagnation' → { agentId, type, severity, timestamp }
'agent.emergency' → { agentId, alert, timestamp }
```

---

## Summary

The **Agent Inbox System**:

1. ✅ Extends existing TaskQueue infrastructure
2. ✅ Provides per-agent task inboxes (Redis-backed)
3. ✅ Integrates with TNFRouter for capability-based routing
4. ✅ Supports task delegation between agents
5. ✅ Includes message/notification handling
6. ✅ Integrates with heartbeat monitoring
7. ✅ Auto-redistributes tasks from failed agents
8. ✅ Enables perpetual, autonomous task processing

**Result**: Agents can now operate like email inboxes - receiving, processing,
and delegating work autonomously. 📬

---

_Last Updated: Dec 28, 2025_  
_Version: 1.0 - Initial Task & Inbox Integration_
