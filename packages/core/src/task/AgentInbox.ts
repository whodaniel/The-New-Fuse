import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { v4 as uuid } // @ts-ignore
from 'uuid';
import { Task, TaskQueueOptions } from './TaskQueue';

export interface AgentTask extends Task {
  agentId: string;
  delegatedFrom?: string;
  delegatedTo?: string;
  requiresSkills?: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  read: boolean;
  channel?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentNotification {
  id: string;
  type: string;
  message: string;
  priority: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * AgentInbox - Email-like inbox system for agents
 * 
 * Each agent has:
 * - tasks/ (pending, in-progress, completed)
 * - messages/ (unread, read)
 * - notifications/
 * - delegations/
 * 
 * Integrates with:
 * - Existing TaskQueue infrastructure
 * - Heartbeat monitoring
 * - TNFRouter for task routing
 */
@Injectable()
export class AgentInbox {
  private readonly logger = new Logger(AgentInbox.name);
  private readonly agentId: string;
  private redis: Redis;
  private eventEmitter: EventEmitter2;
  private options: TaskQueueOptions;

  constructor(
    agentId: string,
    redis: Redis,
    eventEmitter: EventEmitter2,
    options?: TaskQueueOptions
  ) {
    this.agentId = agentId;
    this.redis = redis;
    this.eventEmitter = eventEmitter;
    this.options = options || {};
    
    this.logger.log(`AgentInbox created for agent: ${agentId}`);
  }

  // ============ INBOX LIFECYCLE ============

  /**
   * Create inbox structure for agent
   */
  async create(): Promise<void> {
    this.logger.log(`Creating inbox for agent: ${this.agentId}`);
    
    // Ensure Redis keys exist
    const keys = [
      `agent:${this.agentId}:inbox:tasks:pending`,
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      `agent:${this.agentId}:inbox:tasks:completed`,
      `agent:${this.agentId}:inbox:tasks:failed`,
      `agent:${this.agentId}:inbox:messages:unread`,
      `agent:${this.agentId}:inbox:messages:read`,
      `agent:${this.agentId}:inbox:notifications`,
      `agent:${this.agentId}:outbox:delegated`,
      `agent:${this.agentId}:outbox:sent-messages`,
    ];

    // Initialize with empty lists if they don't exist
    for (const key of keys) {
      const exists = await this.redis.exists(key);
      if (!exists) {
        await this.redis.lpush(key, '__INIT__');
        await this.redis.lrem(key, 1, '__INIT__');
      }
    }

    // Set metadata
    await this.redis.hset(`agent:${this.agentId}:metadata`, {
      createdAt: new Date().toISOString(),
      status: 'active',
      version: '1.0',
    });

    this.eventEmitter.emit('agent.inbox_created', {
      agentId: this.agentId,
      timestamp: new Date(),
    });
  }

  // ============ TASK OPERATIONS ============

  /**
   * Get all pending tasks
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
   * Get in-progress tasks
   */
  async getInProgressTasks(): Promise<AgentTask[]> {
    const tasks = await this.redis.lrange(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      0,
      -1
    );
    return tasks.map((t) => JSON.parse(t));
  }

  /**
   * Receive a new task into inbox
   */
  async receiveTask(task: Partial<AgentTask>): Promise<AgentTask> {
    const agentTask: AgentTask = {
      id: task.id || uuid(),
      type: task.type || 'unknown',
      data: task.data || {},
      status: 'pending',
      priority: task.priority || 5,
      createdAt: task.createdAt || new Date(),
      agentId: this.agentId,
      requiresSkills: task.requiresSkills || [],
      delegatedFrom: task.delegatedFrom,
      metadata: {
        ...task.metadata,
        receivedAt: new Date(),
      },
    };

    this.logger.log(
      `Agent ${this.agentId} receiving task: ${agentTask.id} (type: ${agentTask.type})`
    );

    // Add to pending queue
    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:pending`,
      JSON.stringify(agentTask)
    );

    // Emit event
    this.eventEmitter.emit('agent.task_received', {
      agentId: this.agentId,
      taskId: agentTask.id,
      taskType: agentTask.type,
      priority: agentTask.priority,
      timestamp: new Date(),
    });

    // Record activity for heartbeat
    await this.recordActivity('task_received', { taskId: agentTask.id });

    return agentTask;
  }

  /**
   * Start working on a task (move from pending to in-progress)
   */
  async startTask(taskId: string): Promise<void> {
    const pending = await this.getPendingTasks();
    const task = pending.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found in pending queue for agent ${this.agentId}`);
    }

    // Remove from pending
    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:pending`,
      1,
      JSON.stringify(task)
    );

    // Add to in-progress
    const inProgressTask = {
      ...task,
      status: 'running',
      startedAt: new Date(),
    };

    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      JSON.stringify(inProgressTask)
    );

    this.eventEmitter.emit('agent.task_started', {
      agentId: this.agentId,
      taskId,
      timestamp: new Date(),
    });

    await this.recordActivity('task_started', { taskId });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result: any): Promise<void> {
    const inProgress = await this.getInProgressTasks();
    const task = inProgress.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(
        `Task ${taskId} not found in in-progress queue for agent ${this.agentId}`
      );
    }

    // Remove from in-progress
    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      1,
      JSON.stringify(task)
    );

    // Add to completed
    const completedTask = {
      ...task,
      status: 'completed',
      completedAt: new Date(),
      result,
    };

    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:completed`,
      JSON.stringify(completedTask)
    );

    this.eventEmitter.emit('agent.task_completed', {
      agentId: this.agentId,
      taskId,
      result,
      duration: new Date().getTime() - new Date(task.startedAt!).getTime(),
      timestamp: new Date(),
    });

    await this.recordActivity('task_completed', { taskId, result });

    // Cleanup old completed tasks (keep last 100)
    const completedCount = await this.redis.llen(
      `agent:${this.agentId}:inbox:tasks:completed`
    );
    if (completedCount > 100) {
      await this.redis.ltrim(`agent:${this.agentId}:inbox:tasks:completed`, 0, 99);
    }
  }

  /**
   * Fail a task
   */
  async failTask(taskId: string, error: string | Error): Promise<void> {
    const inProgress = await this.getInProgressTasks();
    const task = inProgress.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(
        `Task ${taskId} not found in in-progress queue for agent ${this.agentId}`
      );
    }

    // Remove from in-progress
    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      1,
      JSON.stringify(task)
    );

    // Add to failed
    const failedTask = {
      ...task,
      status: 'failed',
      completedAt: new Date(),
      error: error instanceof Error ? error.message : error,
    };

    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:failed`,
      JSON.stringify(failedTask)
    );

    this.eventEmitter.emit('agent.task_failed', {
      agentId: this.agentId,
      taskId,
      error: failedTask.error,
      timestamp: new Date(),
    });

    await this.recordActivity('task_failed', { taskId, error: failedTask.error });
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
      throw new Error(`Task ${taskId} not found in pending queue`);
    }

    // Mark as delegated
    const delegatedTask: AgentTask = {
      ...task,
      delegatedFrom: this.agentId,
      delegatedTo: targetAgentId,
      metadata: {
        ...task.metadata,
        delegatedAt: new Date(),
      },
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

    await this.recordActivity('task_delegated', {
      taskId,
      targetAgentId,
    });
  }

  // ============ MESSAGES ============

  /**
   * Receive a message
   */
  async receiveMessage(message: Partial<AgentMessage>): Promise<AgentMessage> {
    const agentMessage: AgentMessage = {
      id: message.id || uuid(),
      from: message.from || 'unknown',
      to: this.agentId,
      content: message.content || '',
      timestamp: message.timestamp || new Date(),
      read: false,
      channel: message.channel,
      metadata: message.metadata,
    };

    await this.redis.lpush(
      `agent:${this.agentId}:inbox:messages:unread`,
      JSON.stringify(agentMessage)
    );

    this.eventEmitter.emit('agent.message_received', {
      agentId: this.agentId,
      messageId: agentMessage.id,
      from: agentMessage.from,
      timestamp: new Date(),
    });

    await this.recordActivity('message_received', {
      messageId: agentMessage.id,
      from: agentMessage.from,
    });

    return agentMessage;
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

      await this.recordActivity('message_read', { messageId });
    }
  }

  // ============ NOTIFICATIONS ============

  /**
   * Send notification to agent
   */
  async sendNotification(
    notification: Partial<AgentNotification>
  ): Promise<AgentNotification> {
    const agentNotification: AgentNotification = {
      id: notification.id || uuid(),
      type: notification.type || 'info',
      message: notification.message || '',
      priority: notification.priority || 5,
      timestamp: notification.timestamp || new Date(),
      metadata: notification.metadata,
    };

    await this.redis.lpush(
      `agent:${this.agentId}:inbox:notifications`,
      JSON.stringify(agentNotification)
    );

    this.eventEmitter.emit('agent.notification_sent', {
      agentId: this.agentId,
      type: agentNotification.type,
      priority: agentNotification.priority,
      timestamp: new Date(),
    });

    return agentNotification;
  }

  /**
   * Get all notifications
   */
  async getNotifications(): Promise<AgentNotification[]> {
    const notifications = await this.redis.lrange(
      `agent:${this.agentId}:inbox:notifications`,
      0,
      -1
    );
    return notifications.map((n) => JSON.parse(n));
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

  /**
   * Get inbox stats
   */
  async getStats(): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    unreadMessages: number;
    notifications: number;
  }> {
    const [pending, inProgress, completed, failed, unreadMessages, notifications] =
      await Promise.all([
        this.redis.llen(`agent:${this.agentId}:inbox:tasks:pending`),
        this.redis.llen(`agent:${this.agentId}:inbox:tasks:in-progress`),
        this.redis.llen(`agent:${this.agentId}:inbox:tasks:completed`),
        this.redis.llen(`agent:${this.agentId}:inbox:tasks:failed`),
        this.redis.llen(`agent:${this.agentId}:inbox:messages:unread`),
        this.redis.llen(`agent:${this.agentId}:inbox:notifications`),
      ]);

    return {
      pending,
      inProgress,
      completed,
      failed,
      unreadMessages,
      notifications,
    };
  }

  /**
   * Clear completed/failed tasks older than retentionDays
   */
  async cleanup(retentionDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // For now, just trim to last 100 items
    // TODO: Implement date-based cleanup
    await this.redis.ltrim(`agent:${this.agentId}:inbox:tasks:completed`, 0, 99);
    await this.redis.ltrim(`agent:${this.agentId}:inbox:tasks:failed`, 0, 99);
    await this.redis.ltrim(`agent:${this.agentId}:inbox:messages:read`, 0, 99);
  }
}
