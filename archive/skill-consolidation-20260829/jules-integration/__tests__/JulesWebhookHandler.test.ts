import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DrizzleClient } from '@drizzle/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { RedisClientType } from 'redis';
import { JulesWebhookHandler } from '../src/JulesWebhookHandler.js';

class JulesUsageTracker {
  logUsageStart = jest.fn();
  logUsageEnd = jest.fn();
}

describe('JulesWebhookHandler', () => {
  let handler: JulesWebhookHandler;
  let db: any;
  let redis: DeepMockProxy<RedisClientType>;
  let usageTracker: JulesUsageTracker;

  beforeEach(() => {
    db = {
      jules: {
        findSessionByJulesSessionId: jest.fn(),
        updateSessionByJulesSessionId: jest.fn(),
      },
      tasks: {
        findTaskById: jest.fn(),
      },
    };
    redis = mockDeep<RedisClientType>();
    usageTracker = new JulesUsageTracker();
    handler = new JulesWebhookHandler(db as any, redis as any, usageTracker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleWebhook', () => {
    const encodedContext = Buffer.from(
      JSON.stringify({
        tenantId: 'test-tenant',
        taskId: 'test-task',
        conversationId: 'test-conversation',
      })
    ).toString('base64url');

    const mockJulesSession = {
      id: 'test-jules-session-id',
      julesSessionId: 'test-session',
      status: 'PENDING',
      delegatedByAgentId: 'claude-agent-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTask = {
      id: 'test-task',
      title: 'Test Task',
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle a NEEDS_APPROVAL webhook', async () => {
      const payload = {
        sessionId: 'test-session',
        state: 'NEEDS_APPROVAL' as const,
        status: 'waiting for approval',
        timestamp: new Date().toISOString(),
      };

      (db.jules.findSessionByJulesSessionId as jest.Mock).mockResolvedValue(mockJulesSession);
      (db.tasks.findTaskById as jest.Mock).mockResolvedValue(mockTask);

      await handler.handleWebhook(payload, encodedContext);

      expect(db.jules.updateSessionByJulesSessionId).toHaveBeenCalledWith('test-session', {
        status: 'NEEDS_APPROVAL',
      });
      expect(redis.publish).toHaveBeenCalled();
      expect(usageTracker.logUsageStart).toHaveBeenCalled();
    });

    it('should handle a COMPLETED webhook', async () => {
      const payload = {
        sessionId: 'test-session',
        state: 'COMPLETED' as const,
        status: 'work complete',
        timestamp: new Date().toISOString(),
      };

      (db.jules.findSessionByJulesSessionId as jest.Mock).mockResolvedValue(mockJulesSession);
      (db.tasks.findTaskById as jest.Mock).mockResolvedValue(mockTask);

      await handler.handleWebhook(payload, encodedContext);

      expect(db.jules.updateSessionByJulesSessionId).toHaveBeenCalledWith('test-session', {
        status: 'COMPLETED',
      });
      expect(redis.publish).toHaveBeenCalled();
      expect(usageTracker.logUsageEnd).toHaveBeenCalled();
    });

    it('should handle a FAILED webhook', async () => {
      const payload = {
        sessionId: 'test-session',
        state: 'FAILED' as const,
        status: 'error occurred',
        message: 'Something went wrong',
        timestamp: new Date().toISOString(),
      };

      (db.jules.findSessionByJulesSessionId as jest.Mock).mockResolvedValue(mockJulesSession);
      (db.tasks.findTaskById as jest.Mock).mockResolvedValue(mockTask);

      await handler.handleWebhook(payload, encodedContext);

      expect(db.jules.updateSessionByJulesSessionId).toHaveBeenCalledWith('test-session', {
        status: 'FAILED',
      });
      expect(redis.publish).toHaveBeenCalled();
      expect(usageTracker.logUsageEnd).toHaveBeenCalled();
    });
  });
});
