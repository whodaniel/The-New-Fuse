import { Injectable, Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { Task } from './TaskQueue.js';

/**
 * TNF Agent Inbox System
 * Provides persistent, Redis-backed task management for individual agents.
 * Extends the global TaskQueue with decentralized, agent-specific routing.
 */
@Injectable()
export class AgentInbox {
  private readonly logger = new Logger(AgentInbox.name);
  private readonly redisService: UnifiedRedisService;

  constructor(redisService: UnifiedRedisService) {
    this.redisService = redisService;
  }

  private getInboxKey(agentId: string, subType: string = 'pending'): string {
    return `agent:${agentId}:inbox:tasks:${subType}`;
  }

  /**
   * Add a task to an agent's specific inbox
   */
  async pushTask(agentId: string, task: Task): Promise<void> {
    const key = this.getInboxKey(agentId, 'pending');
    await this.redisService.lpush(key, JSON.stringify(task));
    this.logger.log(`Task ${task.id} pushed to AGENT:${agentId} inbox`);
  }

  /**
   * Poll for new tasks from the inbox
   */
  async pollTask(agentId: string): Promise<Task | null> {
    const pendingKey = this.getInboxKey(agentId, 'pending');
    const runningKey = this.getInboxKey(agentId, 'running');

    // Atomically move from pending to running (RPOPLPUSH)
    const taskJson = await this.redisService.rpoplpush(pendingKey, runningKey);
    if (!taskJson) return null;

    const task: Task = JSON.parse(taskJson);
    task.status = 'running';
    task.startedAt = new Date();

    return task;
  }

  /**
   * Mark a task as completed and move to permanent storage
   */
  async completeTask(agentId: string, taskId: string, result: any): Promise<void> {
    const runningKey = this.getInboxKey(agentId, 'running');
    const completedKey = this.getInboxKey(agentId, 'completed');

    // Implementation would search for task in running list, update, and move to completed set
    this.logger.log(`Task ${taskId} completed by AGENT:${agentId}`);
  }
}
