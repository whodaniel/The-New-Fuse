import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Logger, MasterAgentRegistry } from '@the-new-fuse/relay-core';
import { WorkflowExecutor } from '../executor/WorkflowExecutor';
import {
  WorkflowNode,
  WorkflowNodeType,
  WorkflowExecution,
  WorkflowExecutionStatus,
} from '../types/WorkflowTypes';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger;

const mockAgentRegistry = {
  addAgentTodo: jest.fn().mockResolvedValue('todo_123'),
  getAllAgents: jest.fn().mockReturnValue([{ id: 'agent1', type: 'RESEARCHER', status: 'ACTIVE', capabilities: {} }]),
  getAgentProfile: jest.fn().mockReturnValue({ id: 'agent1', todoList: [{ id: 'todo_123', status: 'completed', updatedAt: new Date(), createdAt: new Date() }] }),
} as unknown as MasterAgentRegistry;

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor(
      {
        maxParallelNodes: 1,
        nodeTimeoutMs: 1000,
        retryDelayMs: 100,
        maxRetries: 3,
        enableDebugLogging: false
      },
      mockAgentRegistry,
      mockLogger
    );
    jest.clearAllMocks();
  });

  const mockExecution: WorkflowExecution = {
    id: 'exec_1',
    workflowId: 'wf_1',
    status: WorkflowExecutionStatus.RUNNING,
    triggeredBy: 'system',
    triggerType: 'manual' as any,
    startedAt: new Date(),
    nodeExecutions: [],
    context: {
        executionId: 'exec_1',
        workflowId: 'wf_1',
        variables: {},
        temporaryData: {}
    },
    statistics: {} as any,
    logs: [],
    metadata: {}
  };

  describe('executeStep', () => {
    it('should execute START node', async () => {
      const node: WorkflowNode = {
        id: 'node_start',
        type: WorkflowNodeType.START,
        name: 'Start Node',
        position: { x: 0, y: 0 },
        config: {},
        inputs: [],
        outputs: [],
        metadata: {}
      };

      const result = await executor.executeStep(node, mockExecution.context, mockExecution);
      expect(result.status).toBe('started');
      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Workflow execution started');
    });
  });
});
