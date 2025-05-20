import { v4 as uuidv4 } from 'uuid';
import { Database } from './database.js';
import { ApiUsageTracker } from './api-usage-tracker.js';
import { ZapierWebhook } from './zapier-webhook.js';
import { NodeFactory } from './node-factory.js';
import { 
  Workflow, 
  Node, 
  NodeConnection, 
  NodeInput, 
  NodeOutput, 
  WorkflowExecution,
  WorkflowExecutionOptions,
  WorkflowSchedule
} from './types.js';

interface QueuedNode {
  node: Node;
  inputs: Record<string, any>;
  dependencies: string[];
  dependents: string[];
  executed: boolean;
  result?: NodeOutput;
}

export class WorkflowEngine {
  private db: Database;
  private apiUsageTracker: ApiUsageTracker;
  private zapierWebhook: ZapierWebhook;
  private nodeFactory: NodeFactory;
  private runningWorkflows: Map<string, { 
    execution: WorkflowExecution, 
    abortController: AbortController 
  }> = new Map();
  
  constructor(
    db: Database, 
    apiUsageTracker: ApiUsageTracker, 
    zapierWebhook: ZapierWebhook,
    nodeFactory: NodeFactory
  ) {
    this.db = db;
    this.apiUsageTracker = apiUsageTracker;
    this.zapierWebhook = zapierWebhook;
    this.nodeFactory = nodeFactory;
  }
  
  async createWorkflow(userId: string, workflowData: Partial<Workflow>): Promise<Workflow> {
    const now = new Date();
    
    const workflow: Workflow = {
      id: uuidv4(),
      userId,
      name: workflowData.name || 'Untitled Workflow',
      description: workflowData.description || '',
      nodes: workflowData.nodes || [],
      connections: workflowData.connections || [],
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: workflowData.tags || []
    };
    
    await this.db.collection('workflows').insertOne(workflow);
    return workflow;
  }
  
  async getWorkflow(id: string): Promise<Workflow | null> {
    return await this.db.collection('workflows').findOne({ id });
  }
  
  async getUserWorkflows(userId: string): Promise<Workflow[]> {
    return await this.db.collection('workflows').find({ userId }).toArray();
  }
  
  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const workflow = await this.getWorkflow(id);
    if (!workflow) return null;
    
    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
      version: workflow.version + 1
    };
    
    await this.db.collection('workflows').updateOne({ id }, { $set: updatedWorkflow });
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: string): Promise<boolean> {
    const result = await this.db.collection('workflows').deleteOne({ id });
    return result.deletedCount === 1;
  }
  
  async executeWorkflow(
    workflowId: string, 
    userId: string, 
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    // Create execution record
    const execution: WorkflowExecution = {
      id: uuidv4(),
      workflowId,
      userId,
      startTime: new Date(),
      status: 'running',
      logs: options.debugMode ? [] : undefined,
      metrics: {
        totalDuration: 0,
        nodeExecutions: []
      }
    };
    
    await this.db.collection('workflowExecutions').insertOne(execution);
    
    // Create abort controller for timeout handling
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, options.timeout || 300000); // Default 5 minutes timeout
    
    // Store running workflow info
    this.runningWorkflows.set(execution.id, { execution, abortController });
    
    // Execute workflow asynchronously
    this.runWorkflowExecution(workflow, execution, options, abortController.signal)
      .catch(error => {
        this.completeExecution(execution.id, 'failed', { error: error.message });
      })
      .finally(() => {
        clearTimeout(timeoutId);
        this.runningWorkflows.delete(execution.id);
      });
    
    return execution;
  }
  
  private async runWorkflowExecution(
    workflow: Workflow, 
    execution: WorkflowExecution, 
    options: WorkflowExecutionOptions,
    signal: AbortSignal
  ): Promise<void> {
    // Log start of execution if debug mode is on
    if (options.debugMode) {
      execution.logs.push(`[${new Date().toISOString()}] Starting workflow execution`);
    }
    
    try {
      // Build execution queue
      const queue = this.buildExecutionQueue(workflow, options.customInput || {});
      
      // Execute nodes
      const results = await this.executeNodes(queue, execution, options, signal);
      
      // Complete the execution
      await this.completeExecution(execution.id, 'success', { results });
      
      // Log completion if debug mode is on
      if (options.debugMode) {
        execution.logs.push(`[${new Date().toISOString()}] Workflow execution completed successfully`);
      }
    } catch (error) {
      // Log error if debug mode is on
      if (options.debugMode) {
        execution.logs.push(`[${new Date().toISOString()}] Workflow execution failed: ${error.message}`);
      }
      
      // Complete the execution with failure
      await this.completeExecution(execution.id, 'failed', { error: error.message });
      
      throw error;
    }
  }
  
  private buildExecutionQueue(workflow: Workflow, initialInput: Record<string, any>): Map<string, QueuedNode> {
    const queue = new Map<string, QueuedNode>();
    
    // Set up all nodes in the queue
    for (const node of workflow.nodes) {
      queue.set(node.id, {
        node,
        inputs: {},
        dependencies: [],
        dependents: [],
        executed: false
      });
    }
    
    // Set up connections between nodes
    for (const connection of workflow.connections) {
      const sourceNode = queue.get(connection.sourceNodeId);
      const targetNode = queue.get(connection.targetNodeId);
      
      if (sourceNode && targetNode) {
        sourceNode.dependents.push(connection.targetNodeId);
        targetNode.dependencies.push(connection.sourceNodeId);
      }
    }
    
    // Set initial input for nodes without dependencies
    for (const [nodeId, queuedNode] of queue.entries()) {
      if (queuedNode.dependencies.length === 0) {
        queuedNode.inputs = { ...initialInput };
      }
    }
    
    return queue;
  }
  
  private async executeNodes(
    queue: Map<string, QueuedNode>, 
    execution: WorkflowExecution, 
    options: WorkflowExecutionOptions,
    signal: AbortSignal
  ): Promise<Record<string, any>> {
    const finalResults: Record<string, any> = {};
    
    // Continue until all nodes are executed or an error occurs
    while (true) {
      if (signal.aborted) {
        throw new Error('Workflow execution aborted due to timeout');
      }
      
      // Find executable nodes (dependencies satisfied and not yet executed)
      const executableNodes: QueuedNode[] = [];
      
      for (const [nodeId, queuedNode] of queue.entries()) {
        if (!queuedNode.executed && 
            queuedNode.dependencies.every(depId => queue.get(depId)?.executed)) {
          executableNodes.push(queuedNode);
        }
      }
      
      // If no nodes can be executed, we're done
      if (executableNodes.length === 0) {
        const allExecuted = Array.from(queue.values()).every(n => n.executed);
        if (allExecuted) {
          break;
        } else {
          throw new Error('Circular dependency detected in workflow');
        }
      }
      
      // Execute nodes in parallel
      await Promise.all(executableNodes.map(async queuedNode => {
        const { node, inputs } = queuedNode;
        
        // Log node execution start if debug mode is on
        if (options.debugMode) {
          execution.logs.push(`[${new Date().toISOString()}] Executing node: ${node.name} (${node.id})`);
        }
        
        const startTime = Date.now();
        
        try {
          // Prepare node input
          const nodeInput: NodeInput = {
            userId: execution.userId,
            workflowId: execution.workflowId,
            executionId: execution.id,
            ...inputs
          };
          
          // Execute the node
          const result = await node.execute(nodeInput);
          
          // Store execution result
          queuedNode.result = result;
          queuedNode.executed = true;
          
          // Track node execution metrics
          execution.metrics.nodeExecutions.push({
            nodeId: node.id,
            duration: Date.now() - startTime,
            status: result.success ? 'success' : 'failed'
          });
          
          // If node failed and workflow requires successful execution of all nodes, throw error
          if (!result.success && !options.continueOnError) {
            throw new Error(`Node ${node.name} (${node.id}) failed: ${result.error}`);
          }
          
          // Log node execution result if debug mode is on
          if (options.debugMode) {
            execution.logs.push(
              `[${new Date().toISOString()}] Node ${node.name} (${node.id}) completed: ${result.success ? 'success' : 'failed'}`
            );
            if (result.warnings?.length) {
              execution.logs.push(`Warnings: ${result.warnings.join(', ')}`);
            }
          }
          
          // Update inputs for dependent nodes
          for (const dependentId of queuedNode.dependents) {
            const dependentNode = queue.get(dependentId);
            if (dependentNode) {
              dependentNode.inputs = {
                ...dependentNode.inputs,
                [node.id]: result.data
              };
            }
          }
          
          // Store result in final results
          finalResults[node.id] = result.data;
        } catch (error) {
          // Mark node as executed but failed
          queuedNode.executed = true;
          
          // Track node execution metrics
          execution.metrics.nodeExecutions.push({
            nodeId: node.id,
            duration: Date.now() - startTime,
            status: 'failed'
          });
          
          // Log node execution error if debug mode is on
          if (options.debugMode) {
            execution.logs.push(
              `[${new Date().toISOString()}] Node ${node.name} (${node.id}) failed with error: ${error.message}`
            );
          }
          
          // If workflow doesn't continue on error, rethrow
          if (!options.continueOnError) {
            throw error;
          }
        }
      }));
    }
    
    return finalResults;
  }
  
  private async completeExecution(
    executionId: string, 
    status: 'success' | 'failed' | 'timeout', 
    data: { results?: Record<string, any>, error?: string }
  ): Promise<void> {
    const now = new Date();
    
    const updates: Partial<WorkflowExecution> = {
      status,
      endTime: now,
      ...data
    };
    
    if (this.runningWorkflows.has(executionId)) {
      const { execution } = this.runningWorkflows.get(executionId);
      execution.metrics.totalDuration = now.getTime() - execution.startTime.getTime();
    }
    
    await this.db.collection('workflowExecutions').updateOne(
      { id: executionId },
      { $set: updates }
    );
  }
  
  async scheduleWorkflow(
    workflowId: string,
    schedule: WorkflowSchedule
  ): Promise<Workflow | null> {
    return this.updateWorkflow(workflowId, { schedule });
  }
  
  async getWorkflowExecutions(
    workflowId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<WorkflowExecutionData> {
    const count = await this.db.collection('workflowExecutions').count({ workflowId });
    
    const executions = await this.db.collection('workflowExecutions')
      .find({ workflowId })
      .sort({ startTime: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    return {
      executions,
      total: count
    };
  }
  
  async getExecution(id: string): Promise<WorkflowExecution | null> {
    return await this.db.collection('workflowExecutions').findOne({ id });
  }
  
  async abortExecution(id: string): Promise<boolean> {
    if (this.runningWorkflows.has(id)) {
      const { abortController } = this.runningWorkflows.get(id);
      abortController.abort();
      
      await this.completeExecution(id, 'timeout', { error: 'Execution manually aborted' });
      return true;
    }
    
    return false;
  }
  
  async cloneWorkflow(id: string, userId: string): Promise<Workflow | null> {
    const workflow = await this.getWorkflow(id);
    if (!workflow) return null;
    
    const cloned: Partial<Workflow> = {
      name: `${workflow.name} (Clone)`,
      description: workflow.description,
      nodes: workflow.nodes,
      connections: workflow.connections,
      tags: workflow.tags
    };
    
    return this.createWorkflow(userId, cloned);
  }
  
  async publishWorkflow(id: string, publish: boolean = true): Promise<Workflow | null> {
    return this.updateWorkflow(id, { published: publish });
  }
}

interface WorkflowExecutionData {
  executions: WorkflowExecution[];
  total: number;
}
