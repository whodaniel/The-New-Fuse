/**
 * Comprehensive Drag and Drop Workflow Builder Tests
 * 
 * Tests the complete workflow builder functionality including:
 * - Drag and drop operations
 * - Node creation and management
 * - Connection handling
 * - Canvas interactions
 * - Validation and error handling
 * - Performance and scalability
 */

import { getTestEnvironment, TestHelpers } from '../setup/test-setup';
import { WorkflowBuilder } from '@the-new-fuse/workflow-engine/builder';
import { WorkflowNodeType } from '@the-new-fuse/workflow-engine/types';
import { performance } from 'perf_hooks';

describe('Drag and Drop Workflow Builder Tests', () => {
  let env: any;
  let builder: WorkflowBuilder;

  beforeAll(async () => {
    env = getTestEnvironment();
  });

  beforeEach(async () => {
    // Create a fresh builder instance for each test
    builder = new WorkflowBuilder();
    await builder.initialize();
  });

  afterEach(async () => {
    // Clean up builder resources
    if (builder) {
      await builder.cleanup();
    }
  });

  describe('Workflow Builder Initialization', () => {
    test('should initialize workflow builder with default settings', async () => {
      expect(builder).toBeDefined();
      expect(builder.getWorkflow()).toBeDefined();
      expect(builder.getNodes()).toHaveLength(0);
      expect(builder.getConnections()).toHaveLength(0);
    });

    test('should initialize with custom configuration', async () => {
      const customBuilder = new WorkflowBuilder({
        enableAutoSave: true,
        autoSaveInterval: 5000,
        maxUndoSteps: 50,
        enableValidation: true,
        strictMode: true
      });

      await customBuilder.initialize();

      expect(customBuilder.getConfiguration().enableAutoSave).toBe(true);
      expect(customBuilder.getConfiguration().maxUndoSteps).toBe(50);
      
      await customBuilder.cleanup();
    });

    test('should load existing workflow into builder', async () => {
      // Create a workflow with some nodes
      const { workflow } = await TestHelpers.createTestWorkflow('Load Test Workflow');
      
      const loadBuilder = new WorkflowBuilder();
      await loadBuilder.initialize();
      await loadBuilder.loadWorkflow(workflow);

      expect(loadBuilder.getWorkflow().name).toBe('Load Test Workflow');
      expect(loadBuilder.getNodes().length).toBeGreaterThan(0);
      
      await loadBuilder.cleanup();
    });
  });

  describe('Node Creation and Management', () => {
    test('should create basic workflow nodes', async () => {
      // Add start node
      const startNode = builder.addNode(
        WorkflowNodeType.START,
        'Start Node',
        { x: 100, y: 100 }
      );

      expect(startNode).toBeDefined();
      expect(startNode.type).toBe(WorkflowNodeType.START);
      expect(startNode.position.x).toBe(100);
      expect(startNode.position.y).toBe(100);
      expect(builder.getNodes()).toHaveLength(1);
    });

    test('should create agent task nodes with configuration', async () => {
      // Create test agent first
      const agent = await TestHelpers.createTestAgent('TestAgent', 'TASK_PROCESSOR');

      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Process Data',
        { x: 200, y: 150 },
        {
          agentId: agent.agentId,
          task: 'Process the input data',
          priority: 'high',
          expectedDuration: 10,
          timeout: 60000
        }
      );

      expect(taskNode.type).toBe(WorkflowNodeType.AGENT_TASK);
      expect(taskNode.config.agentId).toBe(agent.agentId);
      expect(taskNode.config.task).toBe('Process the input data');
      expect(taskNode.config.priority).toBe('high');
    });

    test('should create conditional nodes with logic', async () => {
      const conditionNode = builder.addNode(
        WorkflowNodeType.CONDITION,
        'Data Check',
        { x: 300, y: 200 },
        {
          condition: 'input.value > 100',
          conditionType: 'javascript',
          trueLabel: 'High Value',
          falseLabel: 'Low Value'
        }
      );

      expect(conditionNode.type).toBe(WorkflowNodeType.CONDITION);
      expect(conditionNode.config.condition).toBe('input.value > 100');
      expect(conditionNode.config.conditionType).toBe('javascript');
    });

    test('should create parallel execution nodes', async () => {
      const parallelNode = builder.addNode(
        WorkflowNodeType.PARALLEL,
        'Parallel Processing',
        { x: 400, y: 250 },
        {
          branches: [
            { name: 'Branch A', maxConcurrency: 2 },
            { name: 'Branch B', maxConcurrency: 3 }
          ],
          waitForAll: true,
          timeout: 300000
        }
      );

      expect(parallelNode.type).toBe(WorkflowNodeType.PARALLEL);
      expect(parallelNode.config.branches).toHaveLength(2);
      expect(parallelNode.config.waitForAll).toBe(true);
    });

    test('should update node properties', async () => {
      const node = builder.addNode(
        WorkflowNodeType.START,
        'Original Name',
        { x: 100, y: 100 }
      );

      const updatedNode = builder.updateNode(node.id, {
        name: 'Updated Name',
        position: { x: 150, y: 120 },
        config: { newProperty: 'test value' }
      });

      expect(updatedNode.name).toBe('Updated Name');
      expect(updatedNode.position.x).toBe(150);
      expect(updatedNode.position.y).toBe(120);
      expect(updatedNode.config.newProperty).toBe('test value');
    });

    test('should remove nodes and clean up connections', async () => {
      // Create nodes and connection
      const node1 = builder.addNode(WorkflowNodeType.START, 'Node 1', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'Node 2', { x: 200, y: 100 });
      
      builder.addConnection(node1.id, 'output', node2.id, 'input');
      
      expect(builder.getNodes()).toHaveLength(2);
      expect(builder.getConnections()).toHaveLength(1);

      // Remove node1
      const removed = builder.removeNode(node1.id);
      
      expect(removed).toBe(true);
      expect(builder.getNodes()).toHaveLength(1);
      expect(builder.getConnections()).toHaveLength(0); // Connection should be removed
    });

    test('should duplicate nodes with new positions', async () => {
      const originalNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Original Task',
        { x: 100, y: 100 },
        { task: 'Do something', priority: 'medium' }
      );

      const duplicatedNode = builder.duplicateNode(originalNode.id, { x: 200, y: 150 });

      expect(duplicatedNode).toBeDefined();
      expect(duplicatedNode.id).not.toBe(originalNode.id);
      expect(duplicatedNode.name).toBe('Original Task (Copy)');
      expect(duplicatedNode.position.x).toBe(200);
      expect(duplicatedNode.position.y).toBe(150);
      expect(duplicatedNode.config.task).toBe('Do something');
      expect(builder.getNodes()).toHaveLength(2);
    });
  });

  describe('Connection Management', () => {
    test('should create valid connections between nodes', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      const connection = builder.addConnection(node1.id, 'output', node2.id, 'input');

      expect(connection).toBeDefined();
      expect(connection.source).toBe(node1.id);
      expect(connection.sourceHandle).toBe('output');
      expect(connection.target).toBe(node2.id);
      expect(connection.targetHandle).toBe('input');
      expect(builder.getConnections()).toHaveLength(1);
    });

    test('should validate connection compatibility', async () => {
      const dataNode = builder.addNode(
        WorkflowNodeType.DATA_TRANSFORM,
        'Transform Data',
        { x: 100, y: 100 }
      );
      
      const conditionNode = builder.addNode(
        WorkflowNodeType.CONDITION,
        'Check Condition',
        { x: 300, y: 100 }
      );

      // Valid connection
      const validConnection = builder.addConnection(
        dataNode.id, 'data_output', 
        conditionNode.id, 'condition_input'
      );
      expect(validConnection).toBeDefined();

      // Invalid connection (wrong handle types)
      const invalidConnection = builder.addConnection(
        dataNode.id, 'invalid_output',
        conditionNode.id, 'invalid_input'
      );
      expect(invalidConnection).toBeNull();
    });

    test('should prevent circular dependencies', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Node 1', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Node 2', { x: 200, y: 100 });
      const node3 = builder.addNode(WorkflowNodeType.END, 'Node 3', { x: 300, y: 100 });

      // Create valid chain
      builder.addConnection(node1.id, 'output', node2.id, 'input');
      builder.addConnection(node2.id, 'output', node3.id, 'input');

      // Attempt to create circular dependency
      const circularConnection = builder.addConnection(node3.id, 'output', node1.id, 'input');

      expect(circularConnection).toBeNull();
      expect(builder.getConnections()).toHaveLength(2);
    });

    test('should update connection properties', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      const connection = builder.addConnection(node1.id, 'output', node2.id, 'input');
      
      const updatedConnection = builder.updateConnection(connection.id, {
        label: 'Main Flow',
        style: { stroke: '#ff0000', strokeWidth: 2 },
        animated: true
      });

      expect(updatedConnection.label).toBe('Main Flow');
      expect(updatedConnection.style.stroke).toBe('#ff0000');
      expect(updatedConnection.animated).toBe(true);
    });

    test('should remove connections', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      const connection = builder.addConnection(node1.id, 'output', node2.id, 'input');
      expect(builder.getConnections()).toHaveLength(1);

      const removed = builder.removeConnection(connection.id);
      expect(removed).toBe(true);
      expect(builder.getConnections()).toHaveLength(0);
    });

    test('should handle multiple connections from single node', async () => {
      const sourceNode = builder.addNode(WorkflowNodeType.PARALLEL, 'Parallel', { x: 100, y: 100 });
      const target1 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 1', { x: 300, y: 50 });
      const target2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 2', { x: 300, y: 150 });

      const connection1 = builder.addConnection(sourceNode.id, 'branch1', target1.id, 'input');
      const connection2 = builder.addConnection(sourceNode.id, 'branch2', target2.id, 'input');

      expect(connection1).toBeDefined();
      expect(connection2).toBeDefined();
      expect(builder.getConnections()).toHaveLength(2);
    });
  });

  describe('Canvas Operations', () => {
    test('should handle drag and drop positioning', async () => {
      const startTime = performance.now();
      
      // Simulate drag and drop by creating multiple nodes with positions
      const nodes = [];
      for (let i = 0; i < 10; i++) {
        const node = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Task ${i}`,
          { x: i * 150, y: i * 100 },
          { task: `Process data ${i}` }
        );
        nodes.push(node);
      }

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      expect(nodes).toHaveLength(10);
      expect(operationTime).toBeLessThan(100); // Should be fast
      
      // Verify positions are correctly set
      nodes.forEach((node, index) => {
        expect(node.position.x).toBe(index * 150);
        expect(node.position.y).toBe(index * 100);
      });
    });

    test('should snap nodes to grid when enabled', async () => {
      builder.setGridSnap(true, { size: 20 });

      const node = builder.addNode(
        WorkflowNodeType.START,
        'Start',
        { x: 127, y: 143 } // Non-grid-aligned position
      );

      // Should snap to nearest grid position
      expect(node.position.x).toBe(120); // Snapped to 20px grid
      expect(node.position.y).toBe(140);
    });

    test('should handle zoom and pan operations', async () => {
      // Add some nodes to work with
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 500, y: 300 });

      // Set viewport
      builder.setViewport({ x: -50, y: -25, zoom: 1.5 });
      const viewport = builder.getViewport();

      expect(viewport.x).toBe(-50);
      expect(viewport.y).toBe(-25);
      expect(viewport.zoom).toBe(1.5);

      // Zoom to fit all nodes
      builder.zoomToFit();
      const fittedViewport = builder.getViewport();
      
      expect(fittedViewport.zoom).toBeGreaterThan(0);
      expect(fittedViewport.zoom).toBeLessThanOrEqual(1);
    });

    test('should handle node selection and multi-select', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 });
      const node3 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      // Select single node
      builder.selectNode(node1.id);
      expect(builder.getSelectedNodes()).toEqual([node1.id]);

      // Add to selection
      builder.selectNode(node2.id, { addToSelection: true });
      expect(builder.getSelectedNodes()).toEqual([node1.id, node2.id]);

      // Select area (simulate drag selection)
      builder.selectArea({ x: 50, y: 50, width: 200, height: 100 });
      expect(builder.getSelectedNodes()).toContain(node1.id);
      expect(builder.getSelectedNodes()).toContain(node2.id);

      // Clear selection
      builder.clearSelection();
      expect(builder.getSelectedNodes()).toHaveLength(0);
    });

    test('should handle copy and paste operations', async () => {
      // Create original nodes with connection
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 });
      builder.addConnection(node1.id, 'output', node2.id, 'input');

      // Select and copy
      builder.selectNode(node1.id);
      builder.selectNode(node2.id, { addToSelection: true });
      const copied = builder.copySelection();

      expect(copied.nodes).toHaveLength(2);
      expect(copied.connections).toHaveLength(1);

      // Paste with offset
      const pasted = builder.paste(copied, { x: 300, y: 200 });

      expect(pasted.nodes).toHaveLength(2);
      expect(pasted.connections).toHaveLength(1);
      expect(builder.getNodes()).toHaveLength(4); // Original + pasted
      expect(builder.getConnections()).toHaveLength(2);

      // Verify pasted nodes have correct offset
      const pastedNodes = pasted.nodes;
      expect(pastedNodes[0].position.x).toBeGreaterThan(200);
      expect(pastedNodes[0].position.y).toBeGreaterThan(100);
    });
  });

  describe('Validation and Error Handling', () => {
    test('should validate complete workflow', async () => {
      // Create valid workflow
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const taskNode = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 });
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');
      builder.addConnection(taskNode.id, 'output', endNode.id, 'input');

      const validation = builder.validateWorkflow();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toBeDefined();
    });

    test('should detect validation errors', async () => {
      // Create invalid workflow (no connections)
      builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 });
      builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      const validation = builder.validateWorkflow();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => 
        error.message.includes('disconnected') || error.message.includes('isolated')
      )).toBe(true);
    });

    test('should validate node configurations', async () => {
      // Create agent task without required configuration
      const invalidTaskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Invalid Task',
        { x: 100, y: 100 },
        {} // Missing required agentId and task
      );

      const nodeValidation = builder.validateNode(invalidTaskNode.id);

      expect(nodeValidation.isValid).toBe(false);
      expect(nodeValidation.errors.length).toBeGreaterThan(0);
    });

    test('should validate connections between incompatible nodes', async () => {
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const conditionNode = builder.addNode(WorkflowNodeType.CONDITION, 'Condition', { x: 200, y: 100 });

      // Try invalid connection
      const invalidConnection = builder.addConnection(
        startNode.id, 'invalid_handle',
        conditionNode.id, 'invalid_input'
      );

      expect(invalidConnection).toBeNull();

      // Create valid connection
      const validConnection = builder.addConnection(
        startNode.id, 'output',
        conditionNode.id, 'input'
      );

      expect(validConnection).toBeDefined();
    });

    test('should handle missing agent references', async () => {
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Task with Missing Agent',
        { x: 100, y: 100 },
        {
          agentId: 'non-existent-agent-id',
          task: 'Do something'
        }
      );

      const validation = builder.validateNode(taskNode.id);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.message.includes('agent') && error.message.includes('not found')
      )).toBe(true);
    });

    test('should detect circular dependencies in complex workflows', async () => {
      // Create complex workflow with potential circular dependency
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task A', { x: 200, y: 100 });
      const node3 = builder.addNode(WorkflowNodeType.CONDITION, 'Condition', { x: 300, y: 100 });
      const node4 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task B', { x: 400, y: 50 });
      const node5 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task C', { x: 400, y: 150 });
      const node6 = builder.addNode(WorkflowNodeType.END, 'End', { x: 500, y: 100 });

      // Create valid connections
      builder.addConnection(node1.id, 'output', node2.id, 'input');
      builder.addConnection(node2.id, 'output', node3.id, 'input');
      builder.addConnection(node3.id, 'true', node4.id, 'input');
      builder.addConnection(node3.id, 'false', node5.id, 'input');
      builder.addConnection(node4.id, 'output', node6.id, 'input');
      builder.addConnection(node5.id, 'output', node6.id, 'input');

      // Attempt circular connection
      const circularConnection = builder.addConnection(node4.id, 'output', node2.id, 'input');

      expect(circularConnection).toBeNull();
      
      const validation = builder.validateWorkflow();
      expect(validation.isValid).toBe(true); // Should be valid without circular connection
    });
  });

  describe('Undo/Redo Operations', () => {
    test('should support undo and redo for node operations', async () => {
      expect(builder.canUndo()).toBe(false);
      expect(builder.canRedo()).toBe(false);

      // Add node
      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      expect(builder.getNodes()).toHaveLength(1);
      expect(builder.canUndo()).toBe(true);

      // Undo
      builder.undo();
      expect(builder.getNodes()).toHaveLength(0);
      expect(builder.canRedo()).toBe(true);

      // Redo
      builder.redo();
      expect(builder.getNodes()).toHaveLength(1);
      expect(builder.getNodes()[0].id).toBe(node.id);
    });

    test('should support undo and redo for connection operations', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      // Add connection
      const connection = builder.addConnection(node1.id, 'output', node2.id, 'input');
      expect(builder.getConnections()).toHaveLength(1);

      // Undo connection
      builder.undo();
      expect(builder.getConnections()).toHaveLength(0);

      // Redo connection
      builder.redo();
      expect(builder.getConnections()).toHaveLength(1);
      expect(builder.getConnections()[0].id).toBe(connection.id);
    });

    test('should support undo and redo for complex operations', async () => {
      // Complex operation: create multiple nodes and connections
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 });
      const node3 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });
      
      builder.addConnection(node1.id, 'output', node2.id, 'input');
      builder.addConnection(node2.id, 'output', node3.id, 'input');

      expect(builder.getNodes()).toHaveLength(3);
      expect(builder.getConnections()).toHaveLength(2);

      // Undo multiple times
      builder.undo(); // Undo last connection
      expect(builder.getConnections()).toHaveLength(1);

      builder.undo(); // Undo first connection
      expect(builder.getConnections()).toHaveLength(0);

      builder.undo(); // Undo end node
      expect(builder.getNodes()).toHaveLength(2);

      // Redo multiple times
      builder.redo(); // Redo end node
      expect(builder.getNodes()).toHaveLength(3);

      builder.redo(); // Redo first connection
      expect(builder.getConnections()).toHaveLength(1);

      builder.redo(); // Redo last connection
      expect(builder.getConnections()).toHaveLength(2);
    });

    test('should limit undo history size', async () => {
      const maxUndoSteps = 5;
      builder.setConfiguration({ maxUndoSteps });

      // Perform more operations than the limit
      for (let i = 0; i < 10; i++) {
        builder.addNode(WorkflowNodeType.AGENT_TASK, `Task ${i}`, { x: i * 100, y: 100 });
      }

      expect(builder.getNodes()).toHaveLength(10);

      // Try to undo more than the limit
      let undoCount = 0;
      while (builder.canUndo() && undoCount < 10) {
        builder.undo();
        undoCount++;
      }

      expect(undoCount).toBeLessThanOrEqual(maxUndoSteps);
      expect(builder.getNodes().length).toBeGreaterThanOrEqual(5); // Some nodes should remain
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large workflows efficiently', async () => {
      const startTime = performance.now();
      
      // Create large workflow (100 nodes)
      const nodes = [];
      for (let i = 0; i < 100; i++) {
        const node = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Task ${i}`,
          { x: (i % 10) * 150, y: Math.floor(i / 10) * 100 },
          { task: `Process data ${i}`, priority: 'medium' }
        );
        nodes.push(node);
      }

      // Connect nodes in sequence
      for (let i = 0; i < nodes.length - 1; i++) {
        builder.addConnection(nodes[i].id, 'output', nodes[i + 1].id, 'input');
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(nodes).toHaveLength(100);
      expect(builder.getConnections()).toHaveLength(99);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should validate large workflows efficiently', async () => {
      // Create medium-sized workflow
      const nodeCount = 50;
      const nodes = [];

      for (let i = 0; i < nodeCount; i++) {
        const node = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Task ${i}`,
          { x: i * 100, y: 100 },
          { task: `Task ${i}`, priority: 'medium' }
        );
        nodes.push(node);
      }

      // Connect every node to the next
      for (let i = 0; i < nodes.length - 1; i++) {
        builder.addConnection(nodes[i].id, 'output', nodes[i + 1].id, 'input');
      }

      const startTime = performance.now();
      const validation = builder.validateWorkflow();
      const endTime = performance.now();

      expect(validation).toBeDefined();
      expect(endTime - startTime).toBeLessThan(500); // Validation should be fast
    });

    test('should handle rapid node creation and deletion', async () => {
      const operationCount = 200;
      const startTime = performance.now();

      // Rapidly create and delete nodes
      for (let i = 0; i < operationCount; i++) {
        const node = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Temp Task ${i}`,
          { x: i * 10, y: 100 }
        );

        // Delete every other node immediately
        if (i % 2 === 1) {
          builder.removeNode(node.id);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should handle rapid operations
      expect(builder.getNodes().length).toBe(operationCount / 2);
    });

    test('should maintain performance with complex selection operations', async () => {
      // Create grid of nodes
      const gridSize = 10;
      const nodes = [];

      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const node = builder.addNode(
            WorkflowNodeType.AGENT_TASK,
            `Task ${x}-${y}`,
            { x: x * 150, y: y * 100 }
          );
          nodes.push(node);
        }
      }

      expect(nodes).toHaveLength(gridSize * gridSize);

      // Perform area selections
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        builder.selectArea({
          x: i * 50,
          y: i * 50,
          width: 300,
          height: 200
        });
        
        builder.clearSelection();
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Selection should be fast
    });
  });

  describe('Template and Export Operations', () => {
    test('should export workflow as JSON', async () => {
      // Create sample workflow
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(
        WorkflowNodeType.AGENT_TASK, 
        'Process Data', 
        { x: 200, y: 100 },
        { task: 'Process input data', priority: 'high' }
      );
      const node3 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      builder.addConnection(node1.id, 'output', node2.id, 'input');
      builder.addConnection(node2.id, 'output', node3.id, 'input');

      const exported = builder.exportWorkflow('json');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.nodes).toHaveLength(3);
      expect(parsed.connections).toHaveLength(2);
      expect(parsed.metadata).toBeDefined();
    });

    test('should import workflow from JSON', async () => {
      // Create and export workflow
      const originalNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Original Task',
        { x: 100, y: 100 },
        { task: 'Original task', priority: 'medium' }
      );

      const exported = builder.exportWorkflow('json');

      // Create new builder and import
      const importBuilder = new WorkflowBuilder();
      await importBuilder.initialize();

      const imported = importBuilder.importWorkflow(exported, 'json');

      expect(imported.success).toBe(true);
      expect(importBuilder.getNodes()).toHaveLength(1);

      const importedNode = importBuilder.getNodes()[0];
      expect(importedNode.name).toBe('Original Task');
      expect(importedNode.config.task).toBe('Original task');

      await importBuilder.cleanup();
    });

    test('should create workflow template', async () => {
      // Create reusable workflow pattern
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Process {{dataType}}',
        { x: 200, y: 100 },
        {
          task: 'Process {{dataType}} data using {{algorithm}}',
          priority: '{{priority}}',
          timeout: '{{timeout}}'
        }
      );
      const endNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');
      builder.addConnection(taskNode.id, 'output', endNode.id, 'input');

      const template = builder.createTemplate({
        name: 'Data Processing Template',
        description: 'Template for data processing workflows',
        category: 'data',
        parameters: [
          { name: 'dataType', type: 'string', required: true },
          { name: 'algorithm', type: 'string', default: 'standard' },
          { name: 'priority', type: 'string', default: 'medium' },
          { name: 'timeout', type: 'number', default: 60000 }
        ]
      });

      expect(template).toBeDefined();
      expect(template.name).toBe('Data Processing Template');
      expect(template.parameters).toHaveLength(4);
      expect(template.workflow.nodes).toHaveLength(3);
    });

    test('should instantiate template with parameters', async () => {
      // Create template first
      const startNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Process {{dataType}}',
        { x: 200, y: 100 },
        { task: 'Process {{dataType}} data', priority: '{{priority}}' }
      );

      builder.addConnection(startNode.id, 'output', taskNode.id, 'input');

      const template = builder.createTemplate({
        name: 'Test Template',
        parameters: [
          { name: 'dataType', type: 'string' },
          { name: 'priority', type: 'string' }
        ]
      });

      // Create new builder and instantiate template
      const newBuilder = new WorkflowBuilder();
      await newBuilder.initialize();

      const instantiated = newBuilder.instantiateTemplate(template, {
        dataType: 'customer',
        priority: 'high'
      });

      expect(instantiated.success).toBe(true);
      expect(newBuilder.getNodes()).toHaveLength(2);

      const processNode = newBuilder.getNodes().find(n => n.name.includes('customer'));
      expect(processNode).toBeDefined();
      expect(processNode.name).toBe('Process customer');
      expect(processNode.config.task).toBe('Process customer data');
      expect(processNode.config.priority).toBe('high');

      await newBuilder.cleanup();
    });
  });

  describe('Auto-save and Recovery', () => {
    test('should auto-save workflow changes', async () => {
      builder.setConfiguration({ 
        enableAutoSave: true, 
        autoSaveInterval: 100 // 100ms for testing
      });

      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });

      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 150));

      const savedWorkflow = builder.getLastSavedState();
      expect(savedWorkflow).toBeDefined();
      expect(savedWorkflow.nodes).toHaveLength(1);
    });

    test('should recover from auto-saved state', async () => {
      builder.setConfiguration({ enableAutoSave: true, autoSaveInterval: 100 });

      // Create workflow
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });
      builder.addConnection(node1.id, 'output', node2.id, 'input');

      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 150));

      // Create new builder and recover
      const recoveryBuilder = new WorkflowBuilder();
      await recoveryBuilder.initialize();

      const recovered = recoveryBuilder.recoverFromAutoSave(builder.getLastSavedState());

      expect(recovered.success).toBe(true);
      expect(recoveryBuilder.getNodes()).toHaveLength(2);
      expect(recoveryBuilder.getConnections()).toHaveLength(1);

      await recoveryBuilder.cleanup();
    });

    test('should handle auto-save failures gracefully', async () => {
      builder.setConfiguration({ 
        enableAutoSave: true, 
        autoSaveInterval: 50,
        autoSaveCallback: () => {
          throw new Error('Save failed');
        }
      });

      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });

      // Wait for auto-save attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      // Builder should continue working despite save failure
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });
      expect(builder.getNodes()).toHaveLength(2);
    });
  });
});