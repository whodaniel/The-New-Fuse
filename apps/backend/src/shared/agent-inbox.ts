import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { v4 as uuid } from 'uuid';

export interface Task<T = any> {
  id: string;
  type: string;
  data: T;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timedout';
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  timeout?: number;
}

export interface TaskQueueOptions {
  concurrency?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

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

  async create(): Promise<void> {
    this.logger.log(`Creating inbox for agent: ${this.agentId}`);
    
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

    for (const key of keys) {
      const exists = await this.redis.exists(key);
      if (!exists) {
        await this.redis.lpush(key, '__INIT__');
        await this.redis.lrem(key, 1, '__INIT__');
      }
    }

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

  async getPendingTasks(): Promise<AgentTask[]> {
    const tasks = await this.redis.lrange(
      `agent:${this.agentId}:inbox:tasks:pending`,
      0,
      -1
    );
    return tasks.map((t) => JSON.parse(t));
  }

  async getPendingCount(): Promise<number> {
    return await this.redis.llen(`agent:${this.agentId}:inbox:tasks:pending`);
  }

  async getInProgressTasks(): Promise<AgentTask[]> {
    const tasks = await this.redis.lrange(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      0,
      -1
    );
    return tasks.map((t) => JSON.parse(t));
  }

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

    await this.redis.lpush(
      `agent:${this.agentId}:inbox:tasks:pending`,
      JSON.stringify(agentTask)
    );

    this.eventEmitter.emit('agent.task_received', {
      agentId: this.agentId,
      taskId: agentTask.id,
      taskType: agentTask.type,
      priority: agentTask.priority,
      timestamp: new Date(),
    });

    await this.recordActivity('task_received', { taskId: agentTask.id });

    return agentTask;
  }

  async startTask(taskId: string): Promise<void> {
    const pending = await this.getPendingTasks();
    const task = pending.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found in pending queue for agent ${this.agentId}`);
    }

    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:pending`,
      1,
      JSON.stringify(task)
    );

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

  async completeTask(taskId: string, result: any): Promise<void> {
    const inProgress = await this.getInProgressTasks();
    const task = inProgress.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(
        `Task ${taskId} not found in in-progress queue for agent ${this.agentId}`
      );
    }

    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      1,
      JSON.stringify(task)
    );

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

    const completedCount = await this.redis.llen(
      `agent:${this.agentId}:inbox:tasks:completed`
    );
    if (completedCount > 100) {
      await this.redis.ltrim(`agent:${this.agentId}:inbox:tasks:completed`, 0, 99);
    }
  }

  async failTask(taskId: string, error: string | Error): Promise<void> {
    const inProgress = await this.getInProgressTasks();
    const task = inProgress.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(
        `Task ${taskId} not found in in-progress queue for agent ${this.agentId}`
      );
    }

    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:in-progress`,
      1,
      JSON.stringify(task)
    );

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

  async delegateTask(taskId: string, targetAgentId: string): Promise<void> {
    this.logger.log(
      `Agent ${this.agentId} delegating task ${taskId} to ${targetAgentId}`
    );

    const pending = await this.getPendingTasks();
    const task = pending.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found in pending queue`);
    }

    const delegatedTask: AgentTask = {
      ...task,
      delegatedFrom: this.agentId,
      delegatedTo: targetAgentId,
      metadata: {
        ...task.metadata,
        delegatedAt: new Date(),
      },
    };

    await this.redis.lrem(
      `agent:${this.agentId}:inbox:tasks:pending`,
      1,
      JSON.stringify(task)
    );

    await this.redis.lpush(
      `agent:${this.agentId}:outbox:delegated`,
      JSON.stringify(delegatedTask)
    );

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

  async getUnreadMessages(): Promise<AgentMessage[]> {
    const messages = await this.redis.lrange(
      `agent:${this.agentId}:inbox:messages:unread`,
      0,
      -1
    );
    return messages.map((m) => JSON.parse(m));
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const unread = await this.getUnreadMessages();
    const message = unread.find((m) => m.id === messageId);

    if (message) {
      await this.redis.lrem(
        `agent:${this.agentId}:inbox:messages:unread`,
        1,
        JSON.stringify(message)
      );

      await this.redis.lpush(
        `agent:${this.agentId}:inbox:messages:read`,
        JSON.stringify({ ...message, read: true, readAt: new Date() })
      );

      await this.recordActivity('message_read', { messageId });
    }
  }

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

  async getNotifications(): Promise<AgentNotification[]> {
    const notifications = await this.redis.lrange(
      `agent:${this.agentId}:inbox:notifications`,
      0,
      -1
    );
    return notifications.map((n) => JSON.parse(n));
  }

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

  async cleanup(retentionDays: number = 7): Promise<void> {
    await this.redis.ltrim(`agent:${this.agentId}:inbox:tasks:completed`, 0, 99);
    await this.redis.ltrim(`agent:${this.agentId}:inbox:tasks:failed`, 0, 99);
    await this.redis.ltrim(`agent:${this.agentId}:inbox:messages:read`, 0, 99);
  }
}
