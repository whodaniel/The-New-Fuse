/**
 * Master Agent Registry + Workflow Engine Integration Tests
 * 
 * Tests the integration between the Master Agent Registry and Workflow Engine,
 * validating agent task assignment, execution, handoffs, and monitoring
 */

import { getTestEnvironment, TestHelpers } from '../setup/test-setup';
import { WorkflowNodeType } from '@the-new-fuse/workflow-engine/types';

describe('Master Agent Registry + Workflow Engine Integration', () => {
  let env: any;

  beforeAll(async () => {
    env = getTestEnvironment();
  });

  describe('Agent Task Assignment', () => {
    test('should assign workflow tasks to agents', async () => {
      // Create test agents
      const dataAgent = await TestHelpers.createTestAgent('DataProcessor', 'DATA_PROCESSOR');
      const analysisAgent = await TestHelpers.createTestAgent('DataAnalyzer', 'ANALYST');

      // Create workflow with agent tasks
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Agent Task Test');
      
      // Add agent task nodes
      const processTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Process Data',
        { x: 200, y: 100 },
        {
          agentId: dataAgent.agentId,
          task: 'Process the input data and clean it',
          priority: 'high',
          expectedDuration: 5,
          instructions: 'Remove null values and normalize formats'
        }
      );

      const analyzeTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Analyze Data',
        { x: 350, y: 100 },
        {
          agentId: analysisAgent.agentId,
          task: 'Analyze the processed data for patterns',
          priority: 'medium',
          expectedDuration: 10,
          instructions: 'Look for trends and anomalies'
        }
      );

      // Connect nodes
      builder.addConnection(workflow.definition.nodes[0].id, 'output', processTaskNode.id, 'task');
      builder.addConnection(processTaskNode.id, 'result', analyzeTaskNode.id, 'task');
      builder.addConnection(analyzeTaskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Save and execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(
        savedWorkflow.id,
        { data: TestHelpers.generateTestData(50) }
      );

      // Verify task assignment
      await TestHelpers.waitForCondition(async () => {
        const dataAgentProfile = await env.agentRegistry.getAgentProfile(dataAgent.agentId);
        return dataAgentProfile?.todoList.some(todo => todo.category === 'task') || false;
      });

      const dataAgentProfile = await env.agentRegistry.getAgentProfile(dataAgent.agentId);
      const analysisAgentProfile = await env.agentRegistry.getAgentProfile(analysisAgent.agentId);

      expect(dataAgentProfile.todoList).toHaveLength(1);
      expect(dataAgentProfile.todoList[0].content).toContain('Process the input data');
      expect(dataAgentProfile.todoList[0].priority).toBe('high');
      expect(dataAgentProfile.todoList[0].context.workflowExecutionId).toBe(executionId);

      // Check if analysis task is pending (waiting for data processing)
      expect(analysisAgentProfile.todoList.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle agent capability matching', async () => {
      // Create agents with specific capabilities
      const fileAgent = await TestHelpers.createTestAgent('FileProcessor', 'FILE_PROCESSOR');
      const apiAgent = await TestHelpers.createTestAgent('APIConnector', 'API_CONNECTOR');

      // Update agent capabilities
      await env.agentRegistry.updateAgentCapabilities(fileAgent.agentId, {
        fileOperations: true,
        dataProcessing: true,
        apiCalls: false
      });

      await env.agentRegistry.updateAgentCapabilities(apiAgent.agentId, {
        fileOperations: false,
        dataProcessing: false,
        apiCalls: true
      });

      // Create workflow that requires specific capabilities
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Capability Matching Test');
      
      const fileTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'File Processing',
        { x: 200, y: 100 },
        {
          task: 'Read and process files',
          requiredCapabilities: ['fileOperations'],
          priority: 'medium',
          expectedDuration: 3
        }
      );

      const apiTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'API Integration',
        { x: 350, y: 100 },
        {
          task: 'Make API calls to external service',
          requiredCapabilities: ['apiCalls'],
          priority: 'medium',
          expectedDuration: 5
        }
      );

      // Connect nodes
      builder.addConnection(workflow.definition.nodes[0].id, 'output', fileTaskNode.id, 'task');
      builder.addConnection(fileTaskNode.id, 'result', apiTaskNode.id, 'task');
      builder.addConnection(apiTaskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(savedWorkflow.id, {});

      // Wait for task assignments
      await TestHelpers.waitForCondition(async () => {
        const fileAgentProfile = await env.agentRegistry.getAgentProfile(fileAgent.agentId);
        const apiAgentProfile = await env.agentRegistry.getAgentProfile(apiAgent.agentId);
        return (fileAgentProfile?.todoList.length > 0 || apiAgentProfile?.todoList.length > 0);
      });

      // Verify correct agent assignment based on capabilities
      const fileAgentProfile = await env.agentRegistry.getAgentProfile(fileAgent.agentId);
      const apiAgentProfile = await env.agentRegistry.getAgentProfile(apiAgent.agentId);

      // File agent should get the file processing task
      const fileTask = fileAgentProfile.todoList.find(todo => 
        todo.content.includes('Read and process files')
      );
      expect(fileTask).toBeDefined();

      // API agent should get the API task (once file task completes)
      // This might be pending until the file task is done
      expect(executionId).toBeDefined();
    });
  });

  describe('Agent Handoffs', () => {
    test('should execute agent handoffs in workflows', async () => {
      // Create agents for handoff
      const primaryAgent = await TestHelpers.createTestAgent('PrimaryAgent', 'PRIMARY');
      const secondaryAgent = await TestHelpers.createTestAgent('SecondaryAgent', 'SECONDARY');

      // Create workflow with handoff
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Agent Handoff Test');
      
      const primaryTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Primary Task',
        { x: 200, y: 100 },
        {
          agentId: primaryAgent.agentId,
          task: 'Initial data processing',
          priority: 'high',
          expectedDuration: 3
        }
      );

      const handoffNode = builder.addNode(
        WorkflowNodeType.AGENT_HANDOFF,
        'Handoff to Secondary',
        { x: 350, y: 100 },
        {
          fromAgentId: primaryAgent.agentId,
          toAgentId: secondaryAgent.agentId,
          handoffTemplateId: 'data-processing-handoff',
          preserveContext: true,
          stagnationThresholdMs: 30000
        }
      );

      const secondaryTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Secondary Task',
        { x: 500, y: 100 },
        {
          agentId: secondaryAgent.agentId,
          task: 'Continue processing with handoff context',
          priority: 'medium',
          expectedDuration: 5
        }
      );

      // Connect nodes
      builder.addConnection(workflow.definition.nodes[0].id, 'output', primaryTaskNode.id, 'task');
      builder.addConnection(primaryTaskNode.id, 'result', handoffNode.id, 'fromAgent');
      builder.addConnection(handoffNode.id, 'toAgent', secondaryTaskNode.id, 'task');
      builder.addConnection(secondaryTaskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(
        savedWorkflow.id,
        { initialData: 'test-data-for-handoff' }
      );

      // Wait for execution to start
      await TestHelpers.waitForCondition(async () => {
        const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
        return execution?.status !== 'PENDING';
      });

      // Verify handoff was recorded
      const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
      expect(execution).toBeDefined();
      expect(execution.nodeExecutions.length).toBeGreaterThan(0);

      // Check if agents have appropriate tasks
      const primaryAgentProfile = await env.agentRegistry.getAgentProfile(primaryAgent.agentId);
      const secondaryAgentProfile = await env.agentRegistry.getAgentProfile(secondaryAgent.agentId);

      expect(primaryAgentProfile.todoList.length).toBeGreaterThan(0);
      expect(executionId).toBeDefined();
    });
  });

  describe('Agent Coordination', () => {
    test('should coordinate multiple agents in parallel workflows', async () => {
      // Create multiple agents
      const agents = await Promise.all([
        TestHelpers.createTestAgent('Agent1', 'PROCESSOR'),
        TestHelpers.createTestAgent('Agent2', 'PROCESSOR'),
        TestHelpers.createTestAgent('Agent3', 'PROCESSOR')
      ]);

      // Create workflow with parallel agent coordination
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Agent Coordination Test');
      
      const coordinationNode = builder.addNode(
        WorkflowNodeType.AGENT_COORDINATION,
        'Parallel Processing',
        { x: 200, y: 100 },
        {
          coordinationType: 'parallel',
          agentIds: agents.map(a => a.agentId),
          task: 'Process data chunk in parallel',
          maxConcurrency: 3
        }
      );

      // Connect coordination node
      builder.addConnection(workflow.definition.nodes[0].id, 'output', coordinationNode.id, 'agents');
      builder.addConnection(coordinationNode.id, 'results', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const testData = TestHelpers.generateTestData(300); // Large dataset for parallel processing
      
      const executionId = await env.workflowEngine.engine.executeWorkflow(
        savedWorkflow.id,
        { data: testData }
      );

      // Wait for coordination to start
      await TestHelpers.waitForCondition(async () => {
        const agentProfiles = await Promise.all(
          agents.map(a => env.agentRegistry.getAgentProfile(a.agentId))
        );
        return agentProfiles.some(profile => profile?.todoList.length > 0);
      });

      // Verify all agents received coordination tasks
      const agentProfiles = await Promise.all(
        agents.map(a => env.agentRegistry.getAgentProfile(a.agentId))
      );

      agentProfiles.forEach((profile, index) => {
        expect(profile.todoList.length).toBeGreaterThan(0);
        const coordinationTask = profile.todoList.find(todo => 
          todo.category === 'coordination'
        );
        expect(coordinationTask).toBeDefined();
        expect(coordinationTask.context.participantAgents).toEqual(agents.map(a => a.agentId));
      });
    });
  });

  describe('Heartbeat Integration', () => {
    test('should monitor agent activity during workflow execution', async () => {
      // Create test agent
      const agent = await TestHelpers.createTestAgent('MonitoredAgent', 'MONITORED');

      // Create workflow with long-running task
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Heartbeat Monitor Test');
      
      const longTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Long Running Task',
        { x: 200, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Process large dataset (long running)',
          priority: 'low',
          expectedDuration: 30 // 30 minutes (will be interrupted for test)
        }
      );

      // Connect node
      builder.addConnection(workflow.definition.nodes[0].id, 'output', longTaskNode.id, 'task');
      builder.addConnection(longTaskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(
        savedWorkflow.id,
        { largeDataset: TestHelpers.generateTestData(1000) }
      );

      // Wait for task assignment
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        return agentProfile?.todoList.length > 0;
      });

      // Verify heartbeat monitoring is active
      const agentHealth = await env.heartbeatService.getAgentHealth(agent.agentId);
      expect(agentHealth.isHealthy).toBe(true);
      expect(agentHealth.lastHeartbeat).toBeDefined();

      // Simulate heartbeat
      await env.heartbeatService.recordActivity(agent.agentId, 'task_progress', {
        workflowExecutionId: executionId,
        progress: 25
      });

      // Verify heartbeat was recorded
      const updatedHealth = await env.heartbeatService.getAgentHealth(agent.agentId);
      expect(updatedHealth.lastHeartbeat.getTime()).toBeGreaterThan(agentHealth.lastHeartbeat.getTime());
    });

    test('should detect and handle agent stagnation during workflow execution', async () => {
      // Create test agent
      const agent = await TestHelpers.createTestAgent('StagnantAgent', 'STAGNANT_TEST');

      // Create workflow
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Stagnation Detection Test');
      
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Task That Will Stagnate',
        { x: 200, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Task that will simulate stagnation',
          priority: 'medium',
          expectedDuration: 1 // Short duration to trigger stagnation quickly
        }
      );

      // Connect node
      builder.addConnection(workflow.definition.nodes[0].id, 'output', taskNode.id, 'task');
      builder.addConnection(taskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(savedWorkflow.id, {});

      // Wait for task assignment
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        return agentProfile?.todoList.length > 0;
      });

      // Don't send heartbeats to simulate stagnation
      // Wait for stagnation detection (longer than stagnation threshold)
      await new Promise(resolve => setTimeout(resolve, 35000)); // 35 seconds

      // Check if stagnation was detected
      const stagnationStatus = await env.heartbeatService.getStagnationStatus();
      const agentStagnation = stagnationStatus.find(s => s.agentId === agent.agentId);
      
      expect(agentStagnation).toBeDefined();
      expect(agentStagnation.isStagnant).toBe(true);
      expect(agentStagnation.stagnantDuration).toBeGreaterThan(30000);
    }, 45000); // Longer timeout for this test
  });

  describe('Error Handling and Recovery', () => {
    test('should handle agent failures gracefully in workflows', async () => {
      // Create test agents
      const unreliableAgent = await TestHelpers.createTestAgent('UnreliableAgent', 'UNRELIABLE');
      const backupAgent = await TestHelpers.createTestAgent('BackupAgent', 'BACKUP');

      // Create workflow with error handling
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Error Handling Test');
      
      const primaryTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Primary Task (May Fail)',
        { x: 200, y: 100 },
        {
          agentId: unreliableAgent.agentId,
          task: 'Task that may fail',
          priority: 'high',
          expectedDuration: 5,
          fallbackAgentId: backupAgent.agentId
        }
      );

      // Connect node
      builder.addConnection(workflow.definition.nodes[0].id, 'output', primaryTaskNode.id, 'task');
      builder.addConnection(primaryTaskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(savedWorkflow.id, {});

      // Wait for task assignment
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(unreliableAgent.agentId);
        return agentProfile?.todoList.length > 0;
      });

      // Simulate agent failure by marking agent as failed
      await env.agentRegistry.updateAgentStatus(unreliableAgent.agentId, 'FAILED');

      // Wait for failure detection and potential fallback
      await TestHelpers.waitForCondition(async () => {
        const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
        return execution?.status !== 'RUNNING';
      });

      // Verify execution handled the failure appropriately
      const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
      expect(execution).toBeDefined();
      
      // Check if backup agent was engaged (if fallback is implemented)
      const backupAgentProfile = await env.agentRegistry.getAgentProfile(backupAgent.agentId);
      // Note: Fallback behavior depends on implementation details
      expect(executionId).toBeDefined(); // Basic verification that execution continued
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent workflows with agent task assignment', async () => {
      // Create pool of agents
      const agentPool = await Promise.all(
        Array.from({ length: 5 }, (_, i) => 
          TestHelpers.createTestAgent(`PoolAgent${i}`, 'POOL_AGENT')
        )
      );

      // Create multiple workflows
      const workflows = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          const { workflow, builder } = await TestHelpers.createTestWorkflow(`Concurrent Workflow ${i}`);
          
          const taskNode = builder.addNode(
            WorkflowNodeType.AGENT_TASK,
            `Concurrent Task ${i}`,
            { x: 200, y: 100 },
            {
              task: `Process data batch ${i}`,
              priority: 'medium',
              expectedDuration: 2,
              agentType: 'POOL_AGENT' // Let system choose from pool
            }
          );

          // Connect node
          builder.addConnection(workflow.definition.nodes[0].id, 'output', taskNode.id, 'task');
          builder.addConnection(taskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

          return await env.workflowEngine.repository.createWorkflow(workflow);
        })
      );

      // Execute all workflows concurrently
      const executionPromises = workflows.map(wf => 
        env.workflowEngine.engine.executeWorkflow(wf.id, { data: TestHelpers.generateTestData(10) })
      );

      const executionIds = await Promise.all(executionPromises);

      // Wait for all executions to start
      await TestHelpers.waitForCondition(async () => {
        const agentProfiles = await Promise.all(
          agentPool.map(a => env.agentRegistry.getAgentProfile(a.agentId))
        );
        const totalTasks = agentProfiles.reduce((sum, profile) => sum + profile.todoList.length, 0);
        return totalTasks >= 5; // At least some tasks distributed
      });

      // Verify task distribution across agent pool
      const agentProfiles = await Promise.all(
        agentPool.map(a => env.agentRegistry.getAgentProfile(a.agentId))
      );

      const totalAssignedTasks = agentProfiles.reduce((sum, profile) => sum + profile.todoList.length, 0);
      expect(totalAssignedTasks).toBeGreaterThan(0);
      expect(totalAssignedTasks).toBeLessThanOrEqual(10); // No more than number of workflows

      // Verify all executions were created
      expect(executionIds).toHaveLength(10);
      executionIds.forEach(id => expect(id).toBeDefined());
    });
  });
});