import { DatabaseService } from '@the-new-fuse/database';
import { TNFEnvelope, TNFMessageBuilder } from '@the-new-fuse/relay-core';
import type { RedisClientType } from 'redis';

// Placeholder for the JulesUsageTracker
class JulesUsageTracker {
  logUsageStart(julesSessionId: string, taskId: string) {
    console.log(`Usage tracking started for session ${julesSessionId} and task ${taskId}`);
  }
  logUsageEnd(julesSessionId: string) {
    console.log(`Usage tracking ended for session ${julesSessionId}`);
  }
}

interface JulesWebhookPayload {
  sessionId: string;
  state: 'IN_PROGRESS' | 'NEEDS_APPROVAL' | 'USER_INPUT_REQUIRED' | 'COMPLETED' | 'FAILED';
  status: string;
  message?: string;
  timestamp: string;
}

// This is a simplified Task type. I'll need to see where the actual type is defined.
interface Task {
  id: string;
  title: string | null;
  status: string;
}

type TaskStatus = 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'FAILED';

export class JulesWebhookHandler {
  constructor(
    private db: DatabaseService,
    private redis: RedisClientType,
    private julesUsageTracker: JulesUsageTracker
  ) {}

  async handleWebhook(payload: JulesWebhookPayload, encodedContext: string): Promise<void> {
    const context = this.decodeContext(encodedContext);
    if (!context) {
      console.error('Invalid encoded context');
      // In a real scenario, you might throw an error to be caught by the controller
      return;
    }

    const { tenantId, taskId, conversationId } = context;

    const julesSession = await this.db.jules.findSessionByJulesSessionId(payload.sessionId);

    if (!julesSession) {
      console.warn(`Jules session not found for id: ${payload.sessionId}`);
      return;
    }

    const task = await this.db.tasks.findById(taskId);

    if (!task) {
      console.error(`Task not found for id: ${taskId}`);
      return;
    }

    const newStatus = this.mapJulesStatusToTaskStatus(payload.state);
    await this.updateTaskStatus(julesSession.julesSessionId, newStatus);

    // Log usage start if it's the first webhook for the session
    if (julesSession.status === 'PENDING') {
      // Assuming a PENDING status initially
      this.julesUsageTracker.logUsageStart(payload.sessionId, task.id);
    }

    switch (payload.state) {
      case 'NEEDS_APPROVAL':
      case 'USER_INPUT_REQUIRED': {
        const message = this.buildApprovalMessage(payload, task);
        const envelope = this.createTnfEnvelope(
          payload,
          task,
          julesSession,
          message,
          tenantId,
          conversationId,
          true
        );
        await this.publishToRelay(envelope);
        break;
      }
      case 'COMPLETED': {
        this.julesUsageTracker.logUsageEnd(payload.sessionId);
        const message = this.buildCompletionMessage(payload, task);
        const envelope = this.createTnfEnvelope(
          payload,
          task,
          julesSession,
          message,
          tenantId,
          conversationId,
          false
        );
        await this.publishToRelay(envelope);
        break;
      }
      case 'FAILED': {
        this.julesUsageTracker.logUsageEnd(payload.sessionId);
        const message = this.buildFailureMessage(payload, task);
        const envelope = this.createTnfEnvelope(
          payload,
          task,
          julesSession,
          message,
          tenantId,
          conversationId,
          false
        );
        await this.publishToRelay(envelope);
        break;
      }
      case 'IN_PROGRESS':
        // Optional: Send a status update
        break;
    }
  }

  private decodeContext(
    encodedContext: string
  ): { tenantId: string; taskId: string; conversationId: string } | null {
    try {
      const decoded = Buffer.from(encodedContext, 'base64url').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode context:', error);
      return null;
    }
  }

  private async updateTaskStatus(julesSessionId: string, status: TaskStatus): Promise<void> {
    await this.db.jules.updateSessionByJulesSessionId(julesSessionId, { status });
  }

  private async publishToRelay(envelope: TNFEnvelope): Promise<void> {
    const channel = 'tnf:bus:ingress';
    try {
      await this.redis.publish(channel, JSON.stringify(envelope));
    } catch (error) {
      console.error('Failed to publish to Redis:', error);
      // Implement retry logic here if necessary
    }
  }

  private buildApprovalMessage(payload: JulesWebhookPayload, task: Task): string {
    if (payload.state === 'NEEDS_APPROVAL') {
      return `🔔 Jules Session Needs Your Approval

Task: ${task.title}
Jules has created an execution plan and needs your review.

Session: https://jules.google.com/session/${payload.sessionId}

Please review and approve to continue.`;
    }
    return `⚠️ Jules Needs Clarification

Task: ${task.title}
Jules needs your input: ${payload.message}

Session: https://jules.google.com/session/${payload.sessionId}`;
  }

  private buildCompletionMessage(payload: JulesWebhookPayload, task: Task): string {
    return `✅ Jules Task Completed

Task: ${task.title}
Jules has successfully completed the work.

Session: https://jules.google.com/session/${payload.sessionId}`;
  }

  private buildFailureMessage(payload: JulesWebhookPayload, task: Task): string {
    return `❌ Jules Task Failed

Task: ${task.title}
Error: ${payload.message}

Session: https://jules.google.com/session/${payload.sessionId}`;
  }

  private mapJulesStatusToTaskStatus(julesStatus: string): TaskStatus {
    const JULES_TO_TNF_STATUS = {
      IN_PROGRESS: 'IN_PROGRESS',
      NEEDS_APPROVAL: 'BLOCKED',
      USER_INPUT_REQUIRED: 'BLOCKED',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
    } as const;
    return JULES_TO_TNF_STATUS[julesStatus as keyof typeof JULES_TO_TNF_STATUS];
  }

  private createTnfEnvelope(
    payload: JulesWebhookPayload,
    task: Task,
    julesSession: { delegatedByAgentId: string },
    message: string,
    tenantId: string,
    conversationId: string,
    requiresAction: boolean
  ): TNFEnvelope {
    return new TNFMessageBuilder()
      .type('event')
      .from({
        agentId: `jules-agent-${tenantId}`,
        role: 'worker',
        platform: 'jules',
      })
      .to({
        agentId: julesSession.delegatedByAgentId,
      })
      .payload({ content: message })
      .context({
        sessionId: conversationId,
      })
      .metadata({
        priority: 'high',
        julesSessionUrl: `https://jules.google.com/session/${payload.sessionId}`,
        julesSessionId: payload.sessionId,
        taskId: task.id,
        requiresAction: requiresAction,
      })
      .build();
  }
}
