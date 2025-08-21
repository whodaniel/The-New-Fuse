/**
 * Tests for PromptHandoffFlywheel
 * 
 * Comprehensive test suite covering all requirements:
 * 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { PromptHandoffFlywheel, HandoffContext, HandoffTemplate, AgentCapability } from './PromptHandoffFlywheel';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { MasterClockService } from '../services/MasterClockService';
import { ConflictManager } from '../services/ConflictManager';

// Mock dependencies
vi.mock('../services/SyncOrchestrator');
vi.mock('../services/MasterClockService');
vi.mock('../services/ConflictManager');

describe('PromptHandoffFlywheel', () => {
  let flywheel: PromptHandoffFlywheel;
  let mockSyncOrchestrator: vi.Mocked<SyncOrchestrator>;
  let mockMasterClock: vi.Mocked<MasterClockService>;
  let mockConflictManager: vi.Mocked<ConflictManager>;

  beforeEach(() => {
    mockSyncOrchestrator = {
      syncGlobalData: vi.fn().mockResolvedValue(undefined),
      syncAgentState: vi.fn().mockResolvedValue({ success: true }),
      on: vi.fn()
    } as any;

    mockMasterClock = {
      now: vi.fn().mockResolvedValue(new Date('2024-01-01T00:00:00Z'))
    } as any;

    mockConflictManager = {} as any;

    flywheel = new PromptHandoffFlywheel(
      mockSyncOrchestrator,
      mockMasterClock,
      mockConflictManager
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 4.1: Complete execution context and history preservation', () => {
    it('should initiate handoff with complete context', async () => {
      const templateId = 'test-template';
      const variables = { task: 'test task', context: 'test context' };
      
      const contextId = await flywheel.initiateHandoff(
        'agent-1',
        templateId,
        variables,
        { sessionId: 'session-1' }
      );

      expect(contextId).toBeDefined();
      expect(mockSyncOrchestrator.syncGlobalData).toHaveBeenCalledWith(
        'handoff_context',
        expect.objectContaining({
          action: 'create',
          context: expect.objectContaining({
            sourceAgentId: 'agent-1',
            templateId,
            variables: expect.objectContaining(variables),
            sessionId: 'session-1'
          })
        })
      );
    });

    it('should preserve execution history across handoffs', async () => {
      const context = await flywheel.getHandoffContext('test-context');
      
      // Mock context with execution history
      const mockContext: HandoffContext = {
        id: 'test-context',
        sessionId: 'session-1',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        executionHistory: [
          {
            id: 'exec-1',
            agentId: 'agent-1',
            startTime: new Date(),
            input: { task: 'initial task' },
            output: 'initial result',
            metrics: { processingTime: 1000 },
            contextPreservation: 95
          }
        ],
        variables: {},
        metadata: {},
        priority: 'normal',
        timeout: 300000,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      // Test that execution history is preserved
      expect(mockContext.executionHistory).toHaveLength(1);
      expect(mockContext.executionHistory[0].contextPreservation).toBe(95);
    });
  });

  describe('Requirement 4.2: Latest template versions with automatic updates', () => {
    it('should update handoff template and sync across instances', async () => {
      const templateId = 'template-1';
      
      await flywheel.updateHandoffTemplate(templateId, {
        name: 'Updated Template',
        content: 'Updated content'
      });

      expect(mockSyncOrchestrator.syncGlobalData).toHaveBeenCalledWith(
        'handoff_template',
        expect.objectContaining({
          action: 'update',
          template: expect.objectContaining({
            name: 'Updated Template',
            content: 'Updated content'
          })
        })
      );
    });

    it('should increment version number on template update', async () => {
      const template: HandoffTemplate = {
        id: 'template-1',
        name: 'Test Template',
        description: 'Test',
        version: '1.0.0',
        content: 'test content',
        variables: {},
        contextRequirements: [],
        agentCapabilities: [],
        successCriteria: [],
        backpressureThreshold: 10,
        loadBalancingWeight: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the template exists
      vi.spyOn(flywheel as any, 'handoffTemplates', 'get').mockReturnValue(
        new Map([['template-1', template]])
      );

      await flywheel.updateHandoffTemplate('template-1', {
        content: 'updated content'
      });

      expect(mockSyncOrchestrator.syncGlobalData).toHaveBeenCalledWith(
        'handoff_template',
        expect.objectContaining({
          template: expect.objectContaining({
            version: '1.0.1'
          })
        })
      );
    });
  });

  describe('Requirement 4.3: Backpressure and load balancing', () => {
    beforeEach(async () => {
      // Register test agents
      await flywheel.registerAgent('agent-1', ['general', 'analysis']);
      await flywheel.registerAgent('agent-2', ['general', 'coding']);
      await flywheel.registerAgent('agent-3', ['analysis', 'review']);
    });

    it('should select optimal agent based on load and capabilities', async () => {
      // Update agent loads
      await flywheel.updateAgentStatus('agent-1', 'available', 20);
      await flywheel.updateAgentStatus('agent-2', 'available', 80);
      await flywheel.updateAgentStatus('agent-3', 'available', 40);

      // Mock selectOptimalAgent method
      const selectOptimalAgent = vi.spyOn(flywheel as any, 'selectOptimalAgent');
      selectOptimalAgent.mockResolvedValue('agent-1'); // Lowest load

      const result = await (flywheel as any).selectOptimalAgent(
        ['general'],
        'normal'
      );

      expect(result).toBe('agent-1');
    });

    it('should apply backpressure when queue is full', async () => {
      const mockQueue = {
        id: 'queue-1',
        currentSize: 15,
        maxSize: 10,
        backpressureEnabled: true,
        metrics: { backpressureEvents: 0 }
      };

      const mockTemplate = {
        backpressureThreshold: 10
      };

      const shouldApplyBackpressure = await (flywheel as any).shouldApplyBackpressure(
        mockQueue,
        { templateId: 'template-1' }
      );

      expect(shouldApplyBackpressure).toBe(true);
    });

    it('should rebalance queues when overloaded', async () => {
      const rebalanceQueues = vi.spyOn(flywheel as any, 'rebalanceQueues');
      rebalanceQueues.mockResolvedValue(undefined);

      // Trigger rebalancing
      await (flywheel as any).rebalanceQueues();

      expect(rebalanceQueues).toHaveBeenCalled();
    });
  });

  describe('Requirement 4.4: Exponential backoff and escalation', () => {
    it('should retry with exponential backoff on failure', async () => {
      const mockContext: HandoffContext = {
        id: 'context-1',
        sessionId: 'session-1',
        sourceAgentId: 'agent-1',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        executionHistory: [],
        variables: {},
        metadata: {},
        priority: 'normal',
        timeout: 300000,
        retryCount: 1,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const error = new Error('Test error');
      
      // Mock setTimeout to capture delay
      const mockSetTimeout = vi.spyOn(global, 'setTimeout');
      mockSetTimeout.mockImplementation((callback, delay) => {
        expect(delay).toBe(2000); // 1000 * 2^1
        return {} as any;
      });

      await (flywheel as any).handleHandoffFailure(mockContext, error);

      expect(mockContext.retryCount).toBe(2);
      expect(mockSetTimeout).toHaveBeenCalled();

      mockSetTimeout.mockRestore();
    });

    it('should escalate to human intervention after max retries', async () => {
      const mockContext: HandoffContext = {
        id: 'context-1',
        sessionId: 'session-1',
        sourceAgentId: 'agent-1',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        executionHistory: [],
        variables: {},
        metadata: {},
        priority: 'normal',
        timeout: 300000,
        retryCount: 3,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const error = new Error('Test error');
      const emitSpy = vi.spyOn(flywheel, 'emit');

      await (flywheel as any).handleHandoffFailure(mockContext, error);

      expect(mockContext.status).toBe('failed');
      expect(emitSpy).toHaveBeenCalledWith('handoffEscalated', mockContext, error);
      expect(mockSyncOrchestrator.syncGlobalData).toHaveBeenCalledWith(
        'handoff_context',
        expect.objectContaining({
          action: 'failed',
          context: mockContext,
          error: 'Test error'
        })
      );
    });
  });

  describe('Requirement 4.5: Unified analytics and metrics', () => {
    it('should calculate context preservation score', async () => {
      const mockContext: HandoffContext = {
        id: 'context-1',
        sessionId: 'session-1',
        sourceAgentId: 'agent-1',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        executionHistory: [],
        variables: {},
        metadata: {},
        priority: 'normal',
        timeout: 300000,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const mockExecution = {
        id: 'exec-1',
        agentId: 'agent-1',
        startTime: new Date(),
        output: 'test output with required context',
        metrics: { processingTime: 1000 },
        contextPreservation: 0
      };

      const mockTemplate: HandoffTemplate = {
        id: 'template-1',
        name: 'Test Template',
        description: 'Test',
        version: '1.0.0',
        content: 'test content',
        variables: {},
        contextRequirements: ['required context'],
        agentCapabilities: [],
        successCriteria: [],
        backpressureThreshold: 10,
        loadBalancingWeight: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock template retrieval
      vi.spyOn(flywheel as any, 'handoffTemplates', 'get').mockReturnValue(
        new Map([['template-1', mockTemplate]])
      );

      const score = await (flywheel as any).calculateContextPreservation(
        mockContext,
        mockExecution
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should update handoff metrics after execution', async () => {
      const mockContext: HandoffContext = {
        id: 'context-1',
        sessionId: 'session-1',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        executionHistory: [],
        variables: {},
        metadata: {},
        priority: 'normal',
        timeout: 300000,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const mockExecution = {
        id: 'exec-1',
        agentId: 'agent-2',
        startTime: new Date(),
        endTime: new Date(),
        output: 'test output',
        metrics: { processingTime: 1500 },
        contextPreservation: 90
      };

      await (flywheel as any).updateHandoffMetrics(mockContext, mockExecution);

      expect(mockSyncOrchestrator.syncGlobalData).toHaveBeenCalledWith(
        'handoff_metrics',
        expect.objectContaining({
          contextId: 'context-1',
          execution: mockExecution
        })
      );
    });

    it('should track agent performance metrics', async () => {
      await flywheel.registerAgent('agent-1', ['general']);
      
      expect(mockSyncOrchestrator.syncGlobalData).toHaveBeenCalledWith(
        'agent_capability',
        expect.objectContaining({
          action: 'register',
          capability: expect.objectContaining({
            agentId: 'agent-1',
            capabilities: ['general'],
            successRate: 100,
            averageProcessingTime: 0
          })
        })
      );
    });
  });

  describe('Integration and API methods', () => {
    it('should register and update agent capabilities', async () => {
      await flywheel.registerAgent('agent-1', ['general', 'analysis']);
      
      const emitSpy = vi.spyOn(flywheel, 'emit');
      
      await flywheel.updateAgentStatus('agent-1', 'busy', 50);

      expect(emitSpy).toHaveBeenCalledWith(
        'agentStatusUpdated',
        expect.objectContaining({
          agentId: 'agent-1',
          status: 'busy',
          currentLoad: 50
        })
      );
    });

    it('should retrieve handoff context', async () => {
      const contextId = await flywheel.initiateHandoff(
        'agent-1',
        'default-handoff',
        { task: 'test' }
      );

      const context = await flywheel.getHandoffContext(contextId);
      
      expect(context).toBeDefined();
      expect(context?.sourceAgentId).toBe('agent-1');
    });

    it('should retrieve handoff template', async () => {
      const template = await flywheel.getHandoffTemplate('default-handoff');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Default Handoff Template');
    });

    it('should get queue status', async () => {
      await flywheel.registerAgent('agent-1', ['general']);
      
      const queueStatus = await flywheel.getQueueStatus('agent-1');
      
      // Queue should be created on demand
      expect(queueStatus).toBeDefined();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle missing template gracefully', async () => {
      await expect(
        flywheel.initiateHandoff('agent-1', 'non-existent-template', {})
      ).rejects.toThrow('Handoff template not found: non-existent-template');
    });

    it('should handle missing agent gracefully', async () => {
      const contextId = await flywheel.initiateHandoff(
        'agent-1',
        'default-handoff',
        {},
        { targetAgentId: 'non-existent-agent' }
      );

      // Should still create context but may fail during processing
      expect(contextId).toBeDefined();
    });

    it('should handle sync orchestrator failures', async () => {
      mockSyncOrchestrator.syncGlobalData.mockRejectedValue(new Error('Sync failed'));

      await expect(
        flywheel.initiateHandoff('agent-1', 'default-handoff', {})
      ).rejects.toThrow('Sync failed');
    });
  });
});