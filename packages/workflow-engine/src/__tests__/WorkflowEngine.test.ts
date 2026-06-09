
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { UnifiedWorkflowEngine, WorkflowEngineConfig } from '../engine/WorkflowEngine';
import { Logger, MasterAgentRegistry } from '@the-new-fuse/relay-core';
import {
  WorkflowExecutionStatus,
  WorkflowNodeType,
  UnifiedWorkflow,
  NodeExecutionStatus
} from '../types/WorkflowTypes';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger;

const mockAgentRegistry = {
  getAllAgents: jest.fn(),
  addAgentTodo: jest.fn(),
  getAgentProfile: jest.fn(),
} as unknown as MasterAgentRegistry;

const mockHeartbeatService = {
  registerAgent: jest.fn(),
  recordActivity: jest.fn(),
};

const mockDrizzle = {
  workflow: {
    findUnique: jest.fn<any>(),
  },
  workflowExecution: {
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
  },
};

const defaultConfig: WorkflowEngineConfig = {
  maxConcurrentExecutions: 10,
  defaultTimeoutMs: 1000,
  enableHeartbeatMonitoring: false,
  enableAgentCoordination: false,
  enableStatePreservation: true,
  relayIntegration: false,
  debug: false,
};

describe('UnifiedWorkflowEngine', () => {
  let engine: UnifiedWorkflowEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDrizzle.workflow.findUnique.mockResolvedValue(null);
    mockDrizzle.workflowExecution.create.mockResolvedValue({});
    mockDrizzle.workflowExecution.update.mockResolvedValue({});
    mockDrizzle.workflowExecution.findUnique.mockResolvedValue(null);
    mockDrizzle.workflowExecution.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    if (engine) {
      engine.stop();
    }
  });

  describe('Execution Persistence', () => {
    it('should persist state after each node execution', async () => {
      // Setup workflow
      const workflow: UnifiedWorkflow = {
        id: 'wf-1',
        name: 'Test Workflow',
        definition: {
          nodes: [
            { id: 'start', type: WorkflowNodeType.START, name: 'Start', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], metadata: {} },
            { id: 'end', type: WorkflowNodeType.END, name: 'End', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], metadata: {} }
          ],
          connections: [
            { id: 'c1', sourceNodeId: 'start', sourceOutputId: 'o1', targetNodeId: 'end', targetInputId: 'i1', metadata: {} }
          ],
          variables: [],
          triggers: [],
          settings: {} as any,
          version: '1'
        },
        status: 'PUBLISHED' as any,
        version: '1',
        tags: [],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        statistics: {} as any,
        metadata: {} as any
      };

      mockDrizzle.workflow.findUnique.mockResolvedValue(workflow);
      mockDrizzle.workflowExecution.create.mockResolvedValue({ id: 'exec-1' });
      mockDrizzle.workflowExecution.update.mockResolvedValue({ id: 'exec-1' });

      engine = new UnifiedWorkflowEngine(defaultConfig, mockDrizzle, mockAgentRegistry, mockHeartbeatService, mockLogger);

      // Execute
      const executionId = await engine.executeWorkflow('wf-1');

      // Wait for execution to complete
      let attempts = 0;
      while (attempts < 20) {
        const status = await engine.getExecutionStatus(executionId);
        if (status?.status === WorkflowExecutionStatus.COMPLETED || status?.status === WorkflowExecutionStatus.FAILED) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      // Verify create called
      expect(mockDrizzle.workflowExecution.create).toHaveBeenCalled();

      // Verify update called (at least once for finalize, and once for each node completion)
      // Nodes: start, end. So 2 node completions + 1 finalize = 3 updates.
      expect(mockDrizzle.workflowExecution.update).toHaveBeenCalledTimes(3);

      // Check the payload of one of the updates to see if nodeExecutions are present
      const calls = mockDrizzle.workflowExecution.update.mock.calls as any[];
      const lastCall = calls[calls.length - 1]; // finalize
      expect(lastCall[0].data.status).toBe(WorkflowExecutionStatus.COMPLETED);

      const nodeUpdateCall = calls.find((args: any) => args[0].data.nodeExecutions?.length > 0);
      expect(nodeUpdateCall).toBeDefined();
      expect(nodeUpdateCall![0].data.nodeExecutions[0].nodeId).toBe('start');
    });

    it('should route condition nodes by selected output handle', async () => {
      const workflow: UnifiedWorkflow = {
        id: 'wf-condition',
        name: 'Conditional Workflow',
        definition: {
          nodes: [
            { id: 'start', type: WorkflowNodeType.START, name: 'Start', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], metadata: {} },
            {
              id: 'condition',
              type: WorkflowNodeType.CONDITION,
              name: 'Condition',
              position: { x: 0, y: 0 },
              config: { expression: 'flag === true', truthyOutput: 'truthy', falsyOutput: 'falsy' },
              inputs: [],
              outputs: [],
              metadata: {},
            },
            { id: 'true-end', type: WorkflowNodeType.END, name: 'True End', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], metadata: {} },
            { id: 'false-end', type: WorkflowNodeType.END, name: 'False End', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], metadata: {} },
          ],
          connections: [
            { id: 'c1', sourceNodeId: 'start', sourceOutputId: 'o1', targetNodeId: 'condition', targetInputId: 'i1', metadata: {} },
            { id: 'c2', sourceNodeId: 'condition', sourceOutputId: 'truthy', targetNodeId: 'true-end', targetInputId: 'i1', metadata: {} },
            { id: 'c3', sourceNodeId: 'condition', sourceOutputId: 'falsy', targetNodeId: 'false-end', targetInputId: 'i1', metadata: {} },
          ],
          variables: [],
          triggers: [],
          settings: {} as any,
          version: '1',
        },
        status: 'PUBLISHED' as any,
        version: '1',
        tags: [],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        statistics: {} as any,
        metadata: {} as any,
      };

      mockDrizzle.workflow.findUnique.mockResolvedValue(workflow);

      engine = new UnifiedWorkflowEngine(defaultConfig, mockDrizzle, mockAgentRegistry, mockHeartbeatService, mockLogger);

      await engine.executeWorkflow('wf-condition', { flag: true });

      let completedCall: any;
      for (let attempts = 0; attempts < 20; attempts++) {
        completedCall = (mockDrizzle.workflowExecution.update.mock.calls as any[]).find(
          (args: any) => args[0].data.status === WorkflowExecutionStatus.COMPLETED
        );
        if (completedCall) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(completedCall).toBeDefined();
      const executedNodeIds = completedCall![0].data.nodeExecutions.map((nodeExecution: any) => nodeExecution.nodeId);
      expect(executedNodeIds).toEqual(['start', 'condition', 'true-end']);
      expect(executedNodeIds).not.toContain('false-end');
    });
  });

  describe('Crash Recovery', () => {
    it('should recover interrupted executions on startup', async () => {
      // Setup interrupted execution in DB
      const interruptedExecution = {
        id: 'exec-interrupted',
        workflowId: 'wf-1',
        status: WorkflowExecutionStatus.RUNNING,
        startedAt: new Date(),
        nodeExecutions: [
          {
            id: 'ne-1',
            nodeId: 'start',
            status: NodeExecutionStatus.COMPLETED,
            startedAt: new Date(),
            completedAt: new Date()
          }
        ],
        context: {
          workflowId: 'wf-1',
          executionId: 'exec-interrupted',
          variables: { foo: 'bar' }
        },
        statistics: {},
        logs: [],
        metadata: {}
      };

      const workflow: UnifiedWorkflow = {
        id: 'wf-1',
        name: 'Test Workflow',
        definition: {
          nodes: [
            { id: 'start', type: WorkflowNodeType.START, name: 'Start', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], metadata: {} },
            { id: 'step2', type: WorkflowNodeType.END, name: 'Step 2', position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [], metadata: {} } // Next step
          ],
          connections: [
            { id: 'c1', sourceNodeId: 'start', sourceOutputId: 'o1', targetNodeId: 'step2', targetInputId: 'i1', metadata: {} }
          ],
          variables: [],
          triggers: [],
          settings: {} as any,
          version: '1'
        },
        status: 'PUBLISHED' as any,
        version: '1',
        tags: [],
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        statistics: {} as any,
        metadata: {} as any
      };

      mockDrizzle.workflowExecution.findMany.mockResolvedValue([{ id: 'exec-interrupted', status: WorkflowExecutionStatus.RUNNING }]);
      mockDrizzle.workflowExecution.findUnique.mockResolvedValue(interruptedExecution);
      mockDrizzle.workflow.findUnique.mockResolvedValue(workflow);
      mockDrizzle.workflowExecution.update.mockResolvedValue({ id: 'exec-interrupted' });

      // Initialize engine
      engine = new UnifiedWorkflowEngine(defaultConfig, mockDrizzle, mockAgentRegistry, mockHeartbeatService, mockLogger);

      // Give time for async recovery
      await new Promise(resolve => setTimeout(resolve, 100));

      // Wait for completion
      let attempts = 0;
      while (attempts < 20) {
        const status = await engine.getExecutionStatus('exec-interrupted');
        if (status?.status === WorkflowExecutionStatus.COMPLETED || status?.status === WorkflowExecutionStatus.FAILED) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      // Verify that it completed 'step2' and updated DB
      const updateCalls = mockDrizzle.workflowExecution.update.mock.calls as any[];
      const completedCall = updateCalls.find((args: any) => args[0].data.status === WorkflowExecutionStatus.COMPLETED);

      expect(completedCall).toBeDefined();
      expect(completedCall![0].where.id).toBe('exec-interrupted');
      expect(completedCall![0].data.nodeExecutions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ nodeId: 'start', status: NodeExecutionStatus.COMPLETED }),
          expect.objectContaining({ nodeId: 'step2', status: NodeExecutionStatus.COMPLETED }),
        ])
      );
    });
  });
});
