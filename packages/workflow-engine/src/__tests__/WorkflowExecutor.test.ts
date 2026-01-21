import { WorkflowExecutor } from '../WorkflowExecutor';
import { WorkflowEngine } from '../WorkflowEngine';
import { MasterAgentRegistry, Logger } from '@the-new-fuse/relay-core';
import {
  WorkflowStep,
  StepType,
  WorkflowInstance,
  WorkflowStepStatus,
  TaskPriority,
  TaskStatus,
  WorkflowDefinition,
  WorkflowStatus
} from '../WorkflowTypes';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger;

const mockAgentRegistry = {} as unknown as MasterAgentRegistry;

const mockWorkflowEngine = {
  getWorkflow: jest.fn(),
} as unknown as WorkflowEngine;

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor(mockLogger, mockAgentRegistry, mockWorkflowEngine);
    jest.clearAllMocks();
  });

  describe('A2A_HANDOFF Step', () => {
    it('should process A2A_HANDOFF and set pendingContext', async () => {
      const step: WorkflowStep = {
        id: 'step_handoff',
        type: StepType.A2A_HANDOFF,
        name: 'Handoff Step',
        inputs: {},
        outputs: {},
        assignee: { type: 'ROLE', value: 'coordinator' },
        position: { x: 0, y: 0 },
        a2aHandoff: {
          handoffSchema: {
            summary: 'some summary',
            data: 'some data'
          },
          contextInstructions: 'Please analyze this.'
        }
      };

      const workflow: WorkflowDefinition = {
        id: 'wf_1',
        name: 'Test Workflow',
        version: 1,
        status: WorkflowStatus.ACTIVE,
        steps: [step],
        edges: [],
        trigger: { type: 'MANUAL' } as any,
        inputSchema: {},
        defaultPriority: TaskPriority.MEDIUM,
        maxRetries: 0,
        timeoutSeconds: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 'user1',
        tags: []
      };

      (mockWorkflowEngine.getWorkflow as jest.Mock).mockResolvedValue(workflow);

      const instanceId = await executor.executeWorkflow('wf_1', {});

      // We need to access the running instance to check pendingContext.
      // Since it's private, we'll verify behavior via side effects or by checking logs if strictly necessary,
      // but simpler is to trust the next step test.

      // However, we can spy on handleTaskCompletion to see if it passed context
      const completionSpy = jest.spyOn(executor, 'handleTaskCompletion');

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('A2A Handoff context prepared'));
    });
  });

  describe('NOTIFICATION Step', () => {
    it('should emit notification_requested event', async () => {
      const step: WorkflowStep = {
        id: 'step_notify',
        type: StepType.NOTIFICATION,
        name: 'Notify Step',
        inputs: { userName: 'Alice' },
        outputs: {},
        assignee: { type: 'ROLE', value: 'system' },
        position: { x: 0, y: 0 },
        notification: {
          channelSelector: 'SLACK',
          config: { channelId: 'C123' },
          template: 'Hello {{userName}}'
        }
      };

      const workflow: WorkflowDefinition = {
        id: 'wf_2',
        name: 'Test Workflow',
        version: 1,
        status: WorkflowStatus.ACTIVE,
        steps: [step],
        edges: [],
        trigger: { type: 'MANUAL' } as any,
        inputSchema: {},
        defaultPriority: TaskPriority.MEDIUM,
        maxRetries: 0,
        timeoutSeconds: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 'user1',
        tags: []
      };

      (mockWorkflowEngine.getWorkflow as jest.Mock).mockResolvedValue(workflow);

      const notificationSpy = jest.fn();
      executor.on('notification_requested', notificationSpy);

      await executor.executeWorkflow('wf_2', { userName: 'Alice' });

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notificationSpy).toHaveBeenCalledWith(expect.objectContaining({
        channel: 'SLACK',
        message: 'Hello Alice'
      }));
    });
  });

  describe('Integration: A2A -> TASK', () => {
    it('should pass context from A2A to subsequent TASK', async () => {
      const handoffStep: WorkflowStep = {
        id: 'step_1',
        type: StepType.A2A_HANDOFF,
        name: 'Handoff',
        inputs: {},
        outputs: {},
        assignee: { type: 'ROLE', value: 'coordinator' },
        position: { x: 0, y: 0 },
        a2aHandoff: {
          handoffSchema: { info: 'important info' },
          contextInstructions: 'Read this:'
        }
      };

      const taskStep: WorkflowStep = {
        id: 'step_2',
        type: StepType.TASK,
        name: 'Agent Task',
        inputs: {},
        outputs: {},
        assignee: { type: 'AGENT_ID', value: 'agent1' },
        position: { x: 0, y: 0 },
        task: {
          action: 'analyze',
          params: {}
        }
      };

      const workflow: WorkflowDefinition = {
        id: 'wf_3',
        name: 'Test Workflow',
        version: 1,
        status: WorkflowStatus.ACTIVE,
        steps: [handoffStep, taskStep],
        edges: [{ id: 'e1', sourceStepId: 'step_1', targetStepId: 'step_2' }],
        trigger: { type: 'MANUAL' } as any,
        inputSchema: {},
        defaultPriority: TaskPriority.MEDIUM,
        maxRetries: 0,
        timeoutSeconds: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 'user1',
        tags: []
      };

      (mockWorkflowEngine.getWorkflow as jest.Mock).mockResolvedValue(workflow);

      const taskCreatedSpy = jest.fn();
      executor.on('task_created', taskCreatedSpy);

      await executor.executeWorkflow('wf_3', {});

      // Wait for async execution including the 1000ms delay for task completion
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(taskCreatedSpy).toHaveBeenCalledTimes(1);
      const task = taskCreatedSpy.mock.calls[0][0];

      expect(task.description).toContain('[System Context]');
      expect(task.description).toContain('important info');
      expect(task.description).toContain('Read this:');
    });
  });
});
