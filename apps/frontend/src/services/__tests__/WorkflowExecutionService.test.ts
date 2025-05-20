import { workflowExecutionService } from '../WorkflowExecutionService.js';
import { workflowDatabaseService } from '../WorkflowDatabaseService.js';
import { a2aProtocolService } from '../A2AProtocolService.js';

// Mock dependencies
jest.mock('../WorkflowDatabaseService', () => ({
  workflowDatabaseService: {
    createWorkflowExecution: jest.fn(),
    abortWorkflowExecution: jest.fn()
  }
}));

jest.mock('../A2AProtocolService', () => ({
  a2aProtocolService: {
    createMessage: jest.fn(),
    sendMessage: jest.fn(),
    broadcastMessage: jest.fn(),
    sendRequestAndWaitForResponse: jest.fn()
  }
}));

// Mock A2A service
const mockA2AService = {
  agents: [],
  messages: [],
  loading: false,
  error: null,
  loadAgents: jest.fn(),
  sendMessage: jest.fn(),
  broadcastMessage: jest.fn(),
  sendRequestAndWaitForResponse: jest.fn()
};

describe('WorkflowExecutionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    workflowExecutionService.setA2AService(mockA2AService as any);
  });
  
  describe('executeWorkflow', () => {
    it('should execute a workflow and track execution history', async () => {
      // Create a simple workflow
      const workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'input',
            position: { x: 100, y: 100 },
            data: { name: 'Input', type: 'input' }
          },
          {
            id: 'node-2',
            type: 'output',
            position: { x: 300, y: 100 },
            data: { name: 'Output', type: 'output' }
          }
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' }
        ]
      };
      
      // Subscribe to execution updates
      const updateCallback = jest.fn();
      const subscription = workflowExecutionService.subscribe(updateCallback);
      
      // Execute workflow
      const executionId = await workflowExecutionService.executeWorkflow(workflow);
      
      // Verify execution ID is returned
      expect(executionId).toBeDefined();
      
      // Verify execution updates were emitted
      expect(updateCallback).toHaveBeenCalledTimes(4); // started, 2 nodes, completed
      
      // Verify first update is 'started'
      expect(updateCallback.mock.calls[0][0].state).toBe('started');
      
      // Verify last update is 'completed'
      expect(updateCallback.mock.calls[3][0].state).toBe('completed');
      
      // Verify execution was saved to database
      expect(workflowDatabaseService.createWorkflowExecution).toHaveBeenCalledWith(
        workflow.id,
        expect.objectContaining({
          executionId,
          status: 'completed'
        })
      );
      
      // Clean up subscription
      subscription.unsubscribe();
    });
    
    it('should handle errors during workflow execution', async () => {
      // Create a workflow with a node that will fail
      const workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'input',
            position: { x: 100, y: 100 },
            data: { name: 'Input', type: 'input' }
          },
          {
            id: 'node-2',
            type: 'a2a', // This will fail because we haven't mocked the A2A node execution
            position: { x: 300, y: 100 },
            data: { 
              name: 'A2A', 
              type: 'a2a',
              config: {
                agentId: 'non-existent-agent'
              }
            }
          }
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' }
        ]
      };
      
      // Subscribe to execution updates
      const updateCallback = jest.fn();
      const subscription = workflowExecutionService.subscribe(updateCallback);
      
      // Execute workflow and expect it to fail
      await expect(workflowExecutionService.executeWorkflow(workflow)).rejects.toThrow();
      
      // Verify error update was emitted
      const failedUpdate = updateCallback.mock.calls.find(call => call[0].state === 'failed');
      expect(failedUpdate).toBeDefined();
      
      // Verify execution was saved to database with failed status
      expect(workflowDatabaseService.createWorkflowExecution).toHaveBeenCalledWith(
        workflow.id,
        expect.objectContaining({
          status: 'failed'
        })
      );
      
      // Clean up subscription
      subscription.unsubscribe();
    });
  });
  
  describe('abortExecution', () => {
    it('should abort a running workflow execution', async () => {
      // Create a simple workflow
      const workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'input',
            position: { x: 100, y: 100 },
            data: { name: 'Input', type: 'input' }
          }
        ],
        edges: []
      };
      
      // Subscribe to execution updates
      const updateCallback = jest.fn();
      const subscription = workflowExecutionService.subscribe(updateCallback);
      
      // Start workflow execution but don't await it
      const executionPromise = workflowExecutionService.executeWorkflow(workflow);
      
      // Abort execution
      await workflowExecutionService.abortExecution(await executionPromise);
      
      // Verify abort update was emitted
      const abortUpdate = updateCallback.mock.calls.find(call => call[0].state === 'aborted');
      expect(abortUpdate).toBeDefined();
      
      // Verify abort was saved to database
      expect(workflowDatabaseService.abortWorkflowExecution).toHaveBeenCalled();
      
      // Clean up subscription
      subscription.unsubscribe();
    });
  });
  
  describe('debug options', () => {
    it('should set and get debug options', () => {
      const debugOptions = {
        enabled: true,
        stepByStep: true,
        breakpoints: ['node-1'],
        logLevel: 'debug' as const
      };
      
      workflowExecutionService.setDebugOptions(debugOptions);
      
      const options = workflowExecutionService.getDebugOptions();
      expect(options).toEqual(debugOptions);
    });
  });
});
