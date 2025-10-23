/**
 * Workflow Validation and Execution Tests
 * 
 * Tests workflow validation, execution, and real-time feedback features:
 * - Comprehensive workflow validation
 * - Real-time validation during editing
 * - Execution simulation and monitoring
 * - Error handling and debugging
 * - Performance validation
 * - Integration with agent system
 */

import { getTestEnvironment, TestHelpers } from '../setup/test-setup';
// import { WorkflowBuilder } from '@the-new-fuse/workflow-engine/builder'; // Removed workflow-engine dependency
// import { WorkflowNodeType, WorkflowExecutionStatus } from '@the-new-fuse/workflow-engine/types'; // Removed workflow-engine dependency

describe('Workflow Validation and Execution Tests', () => {
  let env: any;
  let builder: WorkflowBuilder;

  beforeAll(async () => {
    env = getTestEnvironment();
  });

  beforeEach(async () => {
    builder = new WorkflowBuilder();
    await builder.initialize();
  });

  afterEach(async () => {
    if (builder) {
      await builder.cleanup();
    }
  });

  describe('Comprehensive Workflow Validation', () => {
    test('should validate complete workflow structure', async () => {
      // Create valid workflow
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK, 
        'Process Data', 
        { x: 200, y: 100 },
        { 
          agentId: 'test-agent-id',
          task: 'Process the input data',
          priority: 'high',
          expectedDuration: 10
        }
      );
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');
      builder.addConnection(taskNode.id, 'output', endNode.id, 'input');

      const validation = builder.validateWorkflow();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toBeDefined();
      expect(validation.score).toBeGreaterThan(80); // High score for valid workflow
    });

    test('should detect missing start node', async () => {
      // Create workflow without start node
      const taskNode = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 100, y: 100 });
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 200, y: 100 });
      builder.addConnection(taskNode.id, 'output', endNode.id, 'input');

      const validation = builder.validateWorkflow();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.type === 'missing_start_node' && error.severity === 'error'
      )).toBe(true);
    });

    test('should detect missing end node', async () => {
      // Create workflow without end node
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const taskNode = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 });
      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');

      const validation = builder.validateWorkflow();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.type === 'missing_end_node' && error.severity === 'error'
      )).toBe(true);
    });

    test('should detect disconnected nodes', async () => {
      // Create workflow with disconnected nodes
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });
      const isolatedNode = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Isolated Task', { x: 200, y: 200 });

      builder.addConnection(startNode.id, 'output', endNode.id, 'input');
      // isolatedNode is not connected to anything

      const validation = builder.validateWorkflow();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.type === 'disconnected_node' && 
        error.nodeId === isolatedNode.id
      )).toBe(true);
    });

    test('should detect circular dependencies', async () => {
      // Create workflow with circular dependency
      const node1 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task A', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task B', { x: 200, y: 100 });
      const node3 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task C', { x: 300, y: 100 });

      // Create circular connection: A -> B -> C -> A
      builder.addConnection(node1.id, 'output', node2.id, 'input');
      builder.addConnection(node2.id, 'output', node3.id, 'input');
      
      // This should be prevented during connection creation
      const circularConnection = builder.addConnection(node3.id, 'output', node1.id, 'input');
      expect(circularConnection).toBeNull();

      const validation = builder.validateWorkflow();
      expect(validation.isValid).toBe(true); // Should be valid since circular connection was prevented
    });

    test('should validate node configurations', async () => {
      // Create agent task without required configuration
      const invalidTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Invalid Task',
        { x: 100, y: 100 },
        {} // Missing required fields
      );

      const nodeValidation = builder.validateNode(invalidTask.id);

      expect(nodeValidation.isValid).toBe(false);
      expect(nodeValidation.errors.some(error => 
        error.field === 'agentId' && error.type === 'required'
      )).toBe(true);
      expect(nodeValidation.errors.some(error => 
        error.field === 'task' && error.type === 'required'
      )).toBe(true);
    });

    test('should validate condition node logic', async () => {
      // Create condition node with invalid logic
      const invalidCondition = builder.addNode(
        WorkflowNodeType.CONDITION,
        'Invalid Condition',
        { x: 100, y: 100 },
        {
          condition: 'invalid javascript syntax ===',
          conditionType: 'javascript'
        }
      );

      const nodeValidation = builder.validateNode(invalidCondition.id);

      expect(nodeValidation.isValid).toBe(false);
      expect(nodeValidation.errors.some(error => 
        error.type === 'syntax_error' && error.field === 'condition'
      )).toBe(true);
    });

    test('should validate parallel node configuration', async () => {
      // Create parallel node with invalid configuration
      const invalidParallel = builder.addNode(
        WorkflowNodeType.PARALLEL,
        'Invalid Parallel',
        { x: 100, y: 100 },
        {
          branches: [], // Empty branches array
          maxConcurrency: -1 // Invalid negative value
        }
      );

      const nodeValidation = builder.validateNode(invalidParallel.id);

      expect(nodeValidation.isValid).toBe(false);
      expect(nodeValidation.errors.some(error => 
        error.field === 'branches' && error.type === 'empty_array'
      )).toBe(true);
      expect(nodeValidation.errors.some(error => 
        error.field === 'maxConcurrency' && error.type === 'invalid_value'
      )).toBe(true);
    });

    test('should validate connection compatibility', async () => {
      const dataNode = builder.addNode(
        WorkflowNodeType.DATA_TRANSFORM,
        'Data Transform',
        { x: 100, y: 100 }
      );
      
      const conditionNode = builder.addNode(
        WorkflowNodeType.CONDITION,
        'Condition Check',
        { x: 200, y: 100 }
      );

      // Valid connection
      const validConnection = builder.addConnection(
        dataNode.id, 'data_output',
        conditionNode.id, 'condition_input'
      );

      expect(validConnection).toBeDefined();

      const connectionValidation = builder.validateConnection(validConnection.id);
      expect(connectionValidation.isValid).toBe(true);

      // Test invalid connection types
      const anotherDataNode = builder.addNode(
        WorkflowNodeType.DATA_TRANSFORM,
        'Another Transform',
        { x: 300, y: 100 }
      );

      const invalidConnection = builder.addConnection(
        dataNode.id, 'invalid_output',
        anotherDataNode.id, 'invalid_input'
      );

      expect(invalidConnection).toBeNull(); // Should be prevented during creation
    });

    test('should provide validation warnings for performance issues', async () => {
      // Create workflow with potential performance issues
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      
      // Create many parallel branches
      const parallelNode = builder.addNode(
        WorkflowNodeType.PARALLEL,
        'Heavy Parallel',
        { x: 200, y: 100 },
        {
          branches: Array.from({ length: 50 }, (_, i) => ({ name: `Branch ${i}` })),
          maxConcurrency: 50 // High concurrency
        }
      );

      // Add many task nodes
      const taskNodes = [];
      for (let i = 0; i < 20; i++) {
        const taskNode = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Task ${i}`,
          { x: 300, y: i * 50 },
          {
            task: `Heavy computation task ${i}`,
            expectedDuration: 3600 // 1 hour each
          }
        );
        taskNodes.push(taskNode);
      }

      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 500, y: 100 });

      // Connect workflow
      builder.addConnection(startNode.id, 'output', parallelNode.id, 'input');
      builder.addConnection(parallelNode.id, 'output', endNode.id, 'input');

      const validation = builder.validateWorkflow();

      expect(validation.warnings.some(warning => 
        warning.type === 'high_concurrency' && warning.severity === 'warning'
      )).toBe(true);
      expect(validation.warnings.some(warning => 
        warning.type === 'long_execution_time' && warning.severity === 'warning'
      )).toBe(true);
      expect(validation.warnings.some(warning => 
        warning.type === 'complex_workflow' && warning.severity === 'info'
      )).toBe(true);
    });
  });

  describe('Real-Time Validation', () => {
    test('should validate workflow in real-time during editing', async () => {
      const validationEvents: any[] = [];
      builder.onValidationChange = (validation: WorkflowValidationResult) => {
        validationEvents.push(validation);
      };

      // Enable real-time validation
      builder.setConfiguration({ enableRealTimeValidation: true });

      // Start with empty workflow (invalid)
      expect(validationEvents[0]?.isValid).toBe(false);

      // Add start node
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      expect(validationEvents[validationEvents.length - 1]?.errors.some(e => 
        e.type === 'missing_start_node'
      )).toBe(false);

      // Add task node
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Task',
        { x: 200, y: 100 },
        { task: 'Process data', priority: 'medium' }
      );

      // Should still have errors (missing agent, no connections)
      expect(validationEvents[validationEvents.length - 1]?.isValid).toBe(false);

      // Update task with agent
      builder.updateNode(taskNode.id, {
        config: { 
          agentId: 'test-agent-id',
          task: 'Process data',
          priority: 'medium'
        }
      });

      // Add end node
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      // Connect nodes
      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');
      builder.addConnection(taskNode.id, 'output', endNode.id, 'input');

      // Should now be valid
      expect(validationEvents[validationEvents.length - 1]?.isValid).toBe(true);
    });

    test('should highlight validation errors on canvas', async () => {
      builder.setConfiguration({ 
        enableRealTimeValidation: true,
        highlightErrors: true 
      });

      // Create invalid task node
      const invalidTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Invalid Task',
        { x: 100, y: 100 },
        {} // Missing required configuration
      );

      // Check that node is highlighted with error
      const nodeHighlight = builder.getNodeHighlight(invalidTask.id);
      expect(nodeHighlight.type).toBe('validation-error');
      expect(nodeHighlight.visible).toBe(true);
      expect(nodeHighlight.color).toBe('#f44336'); // Red for errors

      // Add required configuration
      builder.updateNode(invalidTask.id, {
        config: {
          agentId: 'test-agent-id',
          task: 'Valid task',
          priority: 'medium'
        }
      });

      // Error highlight should be removed
      const updatedHighlight = builder.getNodeHighlight(invalidTask.id);
      expect(updatedHighlight.type).not.toBe('validation-error');
    });

    test('should provide inline validation feedback', async () => {
      builder.setConfiguration({ enableInlineValidation: true });

      // Create condition node with invalid syntax
      const conditionNode = builder.addNode(
        WorkflowNodeType.CONDITION,
        'Condition',
        { x: 100, y: 100 },
        {
          condition: 'input.value > invalid_syntax ===',
          conditionType: 'javascript'
        }
      );

      // Get inline validation feedback
      const inlineFeedback = builder.getInlineValidation(conditionNode.id, 'condition');
      expect(inlineFeedback.hasError).toBe(true);
      expect(inlineFeedback.message).toContain('syntax error');
      expect(inlineFeedback.suggestions).toContain('Check JavaScript syntax');

      // Fix the condition
      builder.updateNode(conditionNode.id, {
        config: {
          condition: 'input.value > 100',
          conditionType: 'javascript'
        }
      });

      // Inline feedback should show success
      const fixedFeedback = builder.getInlineValidation(conditionNode.id, 'condition');
      expect(fixedFeedback.hasError).toBe(false);
      expect(fixedFeedback.message).toContain('valid');
    });

    test('should validate dependencies and agent availability', async () => {
      // Create test agent
      const agent = await TestHelpers.createTestAgent('TestAgent', 'DATA_PROCESSOR');

      // Create task that references the agent
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Agent Task',
        { x: 100, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Process data',
          priority: 'high'
        }
      );

      const validation = builder.validateNode(taskNode.id);
      expect(validation.isValid).toBe(true);

      // Test with non-existent agent
      builder.updateNode(taskNode.id, {
        config: {
          agentId: 'non-existent-agent',
          task: 'Process data',
          priority: 'high'
        }
      });

      const invalidValidation = builder.validateNode(taskNode.id);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.some(error => 
        error.type === 'agent_not_found'
      )).toBe(true);
    });
  });

  describe('Execution Simulation and Monitoring', () => {
    test('should simulate workflow execution', async () => {
      // Create valid workflow
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Simulation Task',
        { x: 200, y: 100 },
        {
          agentId: 'test-agent-id',
          task: 'Simulate data processing',
          priority: 'medium',
          expectedDuration: 5
        }
      );
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');
      builder.addConnection(taskNode.id, 'output', endNode.id, 'input');

      // Start simulation
      const simulation = await builder.simulateExecution({
        mode: 'step-by-step',
        delay: 100, // Fast simulation
        mockData: { input: 'test data' }
      });

      expect(simulation.started).toBe(true);
      expect(simulation.executionId).toBeDefined();

      // Monitor simulation progress
      const progressEvents: any[] = [];
      builder.onSimulationProgress = (event) => {
        progressEvents.push(event);
      };

      // Wait for simulation to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0].nodeId).toBe(startNode.id);
      expect(progressEvents[progressEvents.length - 1].status).toBe('completed');
    });

    test('should provide execution visualization', async () => {
      // Create workflow
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 1', { x: 200, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 2', { x: 300, y: 100 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 400, y: 100 })
      ];

      // Connect nodes
      for (let i = 0; i < nodes.length - 1; i++) {
        builder.addConnection(nodes[i].id, 'output', nodes[i + 1].id, 'input');
      }

      // Start execution visualization
      const executionViz = builder.startExecutionVisualization();
      expect(executionViz.active).toBe(true);

      // Simulate execution steps
      builder.simulateNodeExecution(nodes[0].id, 'completed', { output: 'start data' });
      
      let nodeState = builder.getNodeExecutionState(nodes[0].id);
      expect(nodeState.status).toBe('completed');
      expect(nodeState.output).toEqual({ output: 'start data' });

      builder.simulateNodeExecution(nodes[1].id, 'processing');
      nodeState = builder.getNodeExecutionState(nodes[1].id);
      expect(nodeState.status).toBe('processing');

      // Check visual indicators
      const processingHighlight = builder.getNodeHighlight(nodes[1].id);
      expect(processingHighlight.type).toBe('executing');
      expect(processingHighlight.animated).toBe(true);

      const completedHighlight = builder.getNodeHighlight(nodes[0].id);
      expect(completedHighlight.type).toBe('completed');
      expect(completedHighlight.color).toBe('#4caf50'); // Green for completed
    });

    test('should handle execution errors and debugging', async () => {
      // Create workflow with potential error
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const errorNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Error Task',
        { x: 200, y: 100 },
        {
          agentId: 'error-agent-id',
          task: 'Task that will fail',
          priority: 'high'
        }
      );
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      builder.addConnection(startNode.id, 'output', errorNode.id, 'input');
      builder.addConnection(errorNode.id, 'output', endNode.id, 'input');

      // Simulate execution with error
      builder.simulateNodeExecution(startNode.id, 'completed');
      builder.simulateNodeExecution(errorNode.id, 'error', {
        error: 'Agent not available',
        errorCode: 'AGENT_UNAVAILABLE',
        stackTrace: 'Error in task execution...'
      });

      // Check error state
      const errorState = builder.getNodeExecutionState(errorNode.id);
      expect(errorState.status).toBe('error');
      expect(errorState.error.errorCode).toBe('AGENT_UNAVAILABLE');

      // Check error visualization
      const errorHighlight = builder.getNodeHighlight(errorNode.id);
      expect(errorHighlight.type).toBe('error');
      expect(errorHighlight.color).toBe('#f44336'); // Red for errors

      // Get debugging information
      const debugInfo = builder.getExecutionDebugInfo(errorNode.id);
      expect(debugInfo.nodeId).toBe(errorNode.id);
      expect(debugInfo.error).toBeDefined();
      expect(debugInfo.recommendations).toContain('Check agent availability');
    });

    test('should track execution performance metrics', async () => {
      // Create workflow
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Performance Task',
        { x: 200, y: 100 },
        {
          agentId: 'perf-agent-id',
          task: 'Performance test task',
          expectedDuration: 5
        }
      );
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');
      builder.addConnection(taskNode.id, 'output', endNode.id, 'input');

      // Start performance tracking
      const perfTracker = builder.startPerformanceTracking();
      expect(perfTracker.active).toBe(true);

      // Simulate execution with timing
      const startTime = Date.now();
      builder.simulateNodeExecution(startNode.id, 'completed', null, { duration: 100 });
      builder.simulateNodeExecution(taskNode.id, 'completed', null, { duration: 7000 }); // Longer than expected
      builder.simulateNodeExecution(endNode.id, 'completed', null, { duration: 50 });
      const endTime = Date.now();

      // Get performance metrics
      const metrics = builder.getExecutionMetrics();
      expect(metrics.totalDuration).toBeGreaterThan(0);
      expect(metrics.nodeMetrics[taskNode.id].actualDuration).toBe(7000);
      expect(metrics.nodeMetrics[taskNode.id].expectedDuration).toBe(5000);
      expect(metrics.nodeMetrics[taskNode.id].performanceRatio).toBeGreaterThan(1); // Slower than expected

      // Should generate performance warning
      expect(metrics.warnings.some(warning => 
        warning.type === 'slow_execution' && warning.nodeId === taskNode.id
      )).toBe(true);
    });

    test('should support step-by-step debugging', async () => {
      // Create complex workflow
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const conditionNode = builder.addNode(
        WorkflowNodeType.CONDITION,
        'Decision',
        { x: 200, y: 100 },
        {
          condition: 'input.value > 50',
          conditionType: 'javascript'
        }
      );
      const trueTask = builder.addNode(WorkflowNodeType.AGENT_TASK, 'True Branch', { x: 300, y: 50 });
      const falseTask = builder.addNode(WorkflowNodeType.AGENT_TASK, 'False Branch', { x: 300, y: 150 });
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 400, y: 100 });

      // Connect workflow
      builder.addConnection(startNode.id, 'output', conditionNode.id, 'input');
      builder.addConnection(conditionNode.id, 'true', trueTask.id, 'input');
      builder.addConnection(conditionNode.id, 'false', falseTask.id, 'input');
      builder.addConnection(trueTask.id, 'output', endNode.id, 'input');
      builder.addConnection(falseTask.id, 'output', endNode.id, 'input');

      // Start debug session
      const debugSession = builder.startDebugSession({
        mode: 'step-by-step',
        breakpoints: [conditionNode.id],
        watchVariables: ['input.value']
      });

      expect(debugSession.active).toBe(true);
      expect(debugSession.breakpoints).toContain(conditionNode.id);

      // Execute until breakpoint
      builder.executeToBreakpoint({ input: { value: 75 } });

      // Should stop at condition node
      const debugState = builder.getDebugState();
      expect(debugState.currentNode).toBe(conditionNode.id);
      expect(debugState.variables['input.value']).toBe(75);

      // Step through condition evaluation
      builder.debugStep();

      // Should take true branch
      const nextDebugState = builder.getDebugState();
      expect(nextDebugState.nextNode).toBe(trueTask.id);
      expect(nextDebugState.conditionResult).toBe(true);

      // Continue execution
      builder.debugContinue();

      // Should complete workflow
      const finalState = builder.getDebugState();
      expect(finalState.status).toBe('completed');
    });
  });

  describe('Integration with Agent System', () => {
    test('should validate agent capabilities against task requirements', async () => {
      // Create agent with specific capabilities
      const agent = await TestHelpers.createTestAgent('SpecializedAgent', 'DATA_PROCESSOR');
      await env.agentRegistry.updateAgentCapabilities(agent.agentId, {
        dataProcessing: true,
        fileOperations: false,
        apiCalls: true
      });

      // Create task that requires specific capabilities
      const compatibleTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Compatible Task',
        { x: 100, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Process data using API',
          requiredCapabilities: ['dataProcessing', 'apiCalls']
        }
      );

      const validation = builder.validateNode(compatibleTask.id);
      expect(validation.isValid).toBe(true);

      // Create task that requires missing capabilities
      const incompatibleTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Incompatible Task',
        { x: 200, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Process files',
          requiredCapabilities: ['fileOperations'] // Agent doesn't have this
        }
      );

      const incompatibleValidation = builder.validateNode(incompatibleTask.id);
      expect(incompatibleValidation.isValid).toBe(false);
      expect(incompatibleValidation.errors.some(error => 
        error.type === 'missing_capability' && error.capability === 'fileOperations'
      )).toBe(true);
    });

    test('should suggest alternative agents for tasks', async () => {
      // Create multiple agents with different capabilities
      const dataAgent = await TestHelpers.createTestAgent('DataAgent', 'DATA_PROCESSOR');
      const fileAgent = await TestHelpers.createTestAgent('FileAgent', 'FILE_PROCESSOR');
      const apiAgent = await TestHelpers.createTestAgent('APIAgent', 'API_CONNECTOR');

      await env.agentRegistry.updateAgentCapabilities(dataAgent.agentId, {
        dataProcessing: true,
        fileOperations: false,
        apiCalls: false
      });

      await env.agentRegistry.updateAgentCapabilities(fileAgent.agentId, {
        dataProcessing: false,
        fileOperations: true,
        apiCalls: false
      });

      await env.agentRegistry.updateAgentCapabilities(apiAgent.agentId, {
        dataProcessing: true,
        fileOperations: false,
        apiCalls: true
      });

      // Create task without assigned agent
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Unassigned Task',
        { x: 100, y: 100 },
        {
          task: 'Process data from API',
          requiredCapabilities: ['dataProcessing', 'apiCalls']
        }
      );

      // Get agent suggestions
      const suggestions = await builder.getAgentSuggestions(taskNode.id);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(suggestion => 
        suggestion.agentId === apiAgent.agentId && suggestion.compatibility > 0.8
      )).toBe(true);
      expect(suggestions.some(suggestion => 
        suggestion.agentId === dataAgent.agentId && suggestion.compatibility < 0.8
      )).toBe(true);
    });

    test('should validate agent workload and availability', async () => {
      // Create agent
      const agent = await TestHelpers.createTestAgent('BusyAgent', 'WORKER');

      // Simulate agent with high workload
      for (let i = 0; i < 10; i++) {
        await env.agentRegistry.addTaskToAgent(agent.agentId, {
          id: `task-${i}`,
          content: `Heavy task ${i}`,
          priority: 'high',
          status: 'in_progress'
        });
      }

      // Create task for busy agent
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'New Task',
        { x: 100, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Additional task',
          priority: 'high'
        }
      );

      const validation = builder.validateNode(taskNode.id);
      expect(validation.warnings.some(warning => 
        warning.type === 'agent_overloaded'
      )).toBe(true);

      // Get workload information
      const workloadInfo = await builder.getAgentWorkload(agent.agentId);
      expect(workloadInfo.currentTasks).toBe(10);
      expect(workloadInfo.recommendedLoad).toBeLessThan(10);
      expect(workloadInfo.status).toBe('overloaded');
    });

    test('should integrate with agent heartbeat monitoring', async () => {
      // Create agent
      const agent = await TestHelpers.createTestAgent('MonitoredAgent', 'MONITORED');

      // Create task for agent
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Monitored Task',
        { x: 100, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Task with monitoring',
          expectedDuration: 5
        }
      );

      // Simulate agent going offline
      await env.agentRegistry.updateAgentStatus(agent.agentId, 'OFFLINE');

      const validation = builder.validateNode(taskNode.id);
      expect(validation.warnings.some(warning => 
        warning.type === 'agent_offline'
      )).toBe(true);

      // Check health status
      const healthStatus = await builder.getAgentHealth(agent.agentId);
      expect(healthStatus.status).toBe('offline');
      expect(healthStatus.lastSeen).toBeDefined();

      // Bring agent back online
      await env.agentRegistry.updateAgentStatus(agent.agentId, 'ACTIVE');

      const updatedValidation = builder.validateNode(taskNode.id);
      expect(updatedValidation.warnings.some(warning => 
        warning.type === 'agent_offline'
      )).toBe(false);
    });
  });

  describe('Performance Validation', () => {
    test('should validate workflow performance characteristics', async () => {
      // Create performance-intensive workflow
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      
      // Create parallel processing with many branches
      const parallelNode = builder.addNode(
        WorkflowNodeType.PARALLEL,
        'Heavy Parallel',
        { x: 200, y: 100 },
        {
          branches: Array.from({ length: 100 }, (_, i) => ({ name: `Branch ${i}` })),
          maxConcurrency: 100
        }
      );

      // Create many sequential tasks
      const taskNodes = [];
      for (let i = 0; i < 50; i++) {
        const taskNode = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Heavy Task ${i}`,
          { x: 300, y: i * 20 },
          {
            task: `CPU intensive task ${i}`,
            expectedDuration: 300, // 5 minutes each
            resourceRequirements: {
              cpu: 'high',
              memory: 'high',
              disk: 'medium'
            }
          }
        );
        taskNodes.push(taskNode);
      }

      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 500, y: 100 });

      // Performance validation
      const perfValidation = builder.validatePerformance();

      expect(perfValidation.warnings.some(warning => 
        warning.type === 'high_concurrency'
      )).toBe(true);
      expect(perfValidation.warnings.some(warning => 
        warning.type === 'long_execution_time'
      )).toBe(true);
      expect(perfValidation.warnings.some(warning => 
        warning.type === 'resource_intensive'
      )).toBe(true);

      // Get performance estimates
      const estimates = builder.getPerformanceEstimates();
      expect(estimates.estimatedDuration).toBeGreaterThan(15000); // Over 4 hours
      expect(estimates.resourceUsage.cpu).toBe('very_high');
      expect(estimates.resourceUsage.memory).toBe('very_high');
      expect(estimates.bottlenecks.length).toBeGreaterThan(0);
    });

    test('should suggest performance optimizations', async () => {
      // Create inefficient workflow
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      
      // Sequential tasks that could be parallelized
      const sequentialTasks = [];
      for (let i = 0; i < 10; i++) {
        const taskNode = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Sequential Task ${i}`,
          { x: (i + 1) * 100, y: 100 },
          {
            task: `Independent task ${i}`,
            canBeParallelized: true
          }
        );
        sequentialTasks.push(taskNode);
      }

      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 1200, y: 100 });

      // Connect sequentially
      builder.addConnection(startNode.id, 'output', sequentialTasks[0].id, 'input');
      for (let i = 0; i < sequentialTasks.length - 1; i++) {
        builder.addConnection(sequentialTasks[i].id, 'output', sequentialTasks[i + 1].id, 'input');
      }
      builder.addConnection(sequentialTasks[sequentialTasks.length - 1].id, 'output', endNode.id, 'input');

      // Get optimization suggestions
      const optimizations = builder.getOptimizationSuggestions();

      expect(optimizations.some(opt => 
        opt.type === 'parallelize_independent_tasks'
      )).toBe(true);
      expect(optimizations.some(opt => 
        opt.type === 'reduce_sequential_chain'
      )).toBe(true);

      // Apply automatic optimization
      const optimizedWorkflow = builder.applyOptimization('parallelize_independent_tasks');
      expect(optimizedWorkflow.applied).toBe(true);
      expect(optimizedWorkflow.changes.nodesAdded).toBeGreaterThan(0); // Parallel node added
      expect(optimizedWorkflow.estimatedImprovement.duration).toBeGreaterThan(50); // Significant improvement
    });
  });
});