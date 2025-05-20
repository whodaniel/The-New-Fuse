import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logging.js';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge,
  WorkflowExecutionResult,
  NodeExecutionResult,
  ExecutionContext,
  NodeHandler
} from './types.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { SmartAPIGateway } from '../api-management/SmartAPIGateway.js';
import { pluginManager } from '../extensibility/plugin-manager.js';

export class WorkflowExecutor extends EventEmitter {
  private logger: Logger;
  private toolRegistry: ToolRegistry;
  private apiGateway: SmartAPIGateway;
  private nodeHandlers: Map<string, NodeHandler> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private runningExecutions: Map<string, boolean> = new Map();
  
  constructor(
    logger: Logger, 
    toolRegistry: ToolRegistry,
    apiGateway: SmartAPIGateway
  ) {
    super();
    this.logger = logger;
    this.toolRegistry = toolRegistry;
    this.apiGateway = apiGateway;
    
    // Register built-in node handlers
    this.registerBuiltinHandlers();
  }
  
  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    this.logger.info(`Registered workflow: ${workflow.name} (${workflow.id})`);
  }
  
  /**
   * Register a node handler
   */
  registerNodeHandler(type: string, handler: NodeHandler): void {
    this.nodeHandlers.set(type, handler);
    this.logger.info(`Registered node handler: ${type}`);
  }
  
  /**
   * Execute a workflow by ID
   */
  async executeWorkflow(
    workflowId: string, 
    inputs: Record<string, any> = {}
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    return this.execute(workflow, inputs);
  }
  
  /**
   * Execute a workflow directly
   */
  async execute(
    workflow: Workflow,
    inputs: Record<string, any> = {}
  ): Promise<WorkflowExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();
    
    this.logger.info(`Starting workflow execution: ${workflow.name} (${executionId})`);
    this.emit('workflow:start', { workflowId: workflow.id, executionId });
    
    // Check if workflow is valid
    this.validateWorkflow(workflow);
    
    // Create execution context
    const context: ExecutionContext = {
      executionId,
      workflowId: workflow.id,
      inputs,
      outputs: {},
      nodeResults: new Map(),
      state: {},
      logger: this.logger,
      tools: this.toolRegistry,
      llm: this.apiGateway
    };
    
    try {
      // Track this execution
      this.runningExecutions.set(executionId, true);
      
      // Find start nodes (nodes with no incoming edges)
      const startNodes = this.findStartNodes(workflow);
      
      // Execute the workflow starting from each start node
      const results = await Promise.all(
        startNodes.map(node => this.executeNode(node, workflow, context))
      );
      
      // Merge results from all start nodes
      const finalOutputs = {};
      for (const result of results) {
        Object.assign(finalOutputs, result.outputs);
      }
      
      // Create execution result
      const executionResult: WorkflowExecutionResult = {
        executionId,
        workflowId: workflow.id,
        success: true,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        outputs: finalOutputs,
        nodeResults: Array.from(context.nodeResults.entries()).map(([id, result]) => ({
          nodeId: id,
          ...result
        }))
      };
      
      this.logger.info(`Workflow execution completed: ${workflow.name} (${executionId})`, {
        duration: executionResult.duration,
        nodeCount: executionResult.nodeResults.length
      });
      
      this.emit('workflow:complete', executionResult);
      return executionResult;
    } catch (error) {
      const executionResult: WorkflowExecutionResult = {
        executionId,
        workflowId: workflow.id,
        success: false,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        error: error.message,
        outputs: {},
        nodeResults: Array.from(context.nodeResults.entries()).map(([id, result]) => ({
          nodeId: id,
          ...result
        }))
      };
      
      this.logger.error(`Workflow execution failed: ${workflow.name} (${executionId})`, error);
      this.emit('workflow:error', executionResult);
      return executionResult;
    } finally {
      this.runningExecutions.delete(executionId);
    }
  }
  
  /**
   * Execute a single node in the workflow
   */
  private async executeNode(
    node: WorkflowNode,
    workflow: Workflow,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    this.logger.debug(`Executing node: ${node.id} (${node.type})`, { data: node.data });
    
    try {
      // Emit before-step hooks
      await pluginManager.emitBeforeStep(node, context);

      // Check if this node has any dependencies that haven't been executed yet
      const dependencies = this.getNodeDependencies(node.id, workflow);
      for (const depId of dependencies) {
        if (!context.nodeResults.has(depId)) {
          throw new Error(`Dependency node ${depId} has not been executed yet`);
        }
      }
      
      // Get the handler for this node type
      const handler = this.nodeHandlers.get(node.type);
      if (!handler) {
        throw new Error(`No handler registered for node type: ${node.type}`);
      }
      
      // Execute the node
      const resultData = await handler.execute(node, context);
      
      // Prepare node result record
      const nodeResult: NodeExecutionResult = {
        nodeId: node.id,
        success: true,
        outputs: resultData,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime
      };

      // Store in context
      context.nodeResults.set(node.id, nodeResult);
      Object.assign(context.outputs, resultData);

      // Emit after-step hooks
      await pluginManager.emitAfterStep(node, context, nodeResult);
      
      this.logger.debug(`Node execution completed: ${node.id}`, { 
        duration: Date.now() - startTime,
        outputs: resultData
      });
      
      // Get output edges from this node
      const outputEdges = workflow.edges.filter(edge => edge.source === node.id);
      
      // Execute all downstream nodes
      const childResults = await Promise.all(
        outputEdges.map(edge => {
          const targetNode = workflow.nodes.find(n => n.id === edge.target);
          if (!targetNode) {
            throw new Error(`Target node not found: ${edge.target}`);
          }
          return this.executeNode(targetNode, workflow, context);
        })
      );
      
      // Merge results from all child nodes
      const outputs = { ...resultData };
      for (const childResult of childResults) {
        Object.assign(outputs, childResult.outputs);
      }
      
      return {
        nodeId: node.id,
        success: true,
        outputs,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      const nodeResult = {
        success: false,
        error: error.message,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime
      };
      
      context.nodeResults.set(node.id, nodeResult);
      
      this.logger.error(`Node execution failed: ${node.id}`, error);
      
      return {
        nodeId: node.id,
        success: false,
        outputs: {},
        error: error.message,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Find nodes with no incoming edges (start nodes)
   */
  private findStartNodes(workflow: Workflow): WorkflowNode[] {
    const nodesWithIncomingEdges = new Set<string>();
    
    for (const edge of workflow.edges) {
      nodesWithIncomingEdges.add(edge.target);
    }
    
    return workflow.nodes.filter(node => !nodesWithIncomingEdges.has(node.id));
  }
  
  /**
   * Get dependencies for a node (nodes with edges pointing to this node)
   */
  private getNodeDependencies(nodeId: string, workflow: Workflow): string[] {
    return workflow.edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source);
  }
  
  /**
   * Validate workflow structure
   */
  private validateWorkflow(workflow: Workflow): void {
    // Check for cycles
    try {
      this.detectCycles(workflow);
    } catch (error) {
      throw new Error(`Invalid workflow: ${error.message}`);
    }
    
    // Check that all edge nodes exist
    for (const edge of workflow.edges) {
      const sourceExists = workflow.nodes.some(node => node.id === edge.source);
      const targetExists = workflow.nodes.some(node => node.id === edge.target);
      
      if (!sourceExists) {
        throw new Error(`Invalid workflow: Edge source node not found: ${edge.source}`);
      }
      
      if (!targetExists) {
        throw new Error(`Invalid workflow: Edge target node not found: ${edge.target}`);
      }
    }
    
    // Check that all node types have handlers
    for (const node of workflow.nodes) {
      if (!this.nodeHandlers.has(node.type)) {
        throw new Error(`Invalid workflow: No handler for node type: ${node.type}`);
      }
    }
  }
  
  /**
   * Detect cycles in workflow
   */
  private detectCycles(workflow: Workflow): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    // DFS to detect cycles
    const dfs = (nodeId: string): any => {
      if (recursionStack.has(nodeId)) {
        throw new Error(`Cycle detected involving node ${nodeId}`);
      }
      
      if (visited.has(nodeId)) {
        return;
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        dfs(edge.target);
      }
      
      recursionStack.delete(nodeId);
    };
    
    // Run DFS from all start nodes
    for (const node of this.findStartNodes(workflow)) {
      dfs(node.id);
    }
  }
  
  /**
   * Register built-in node handlers
   */
  private registerBuiltinHandlers(): void {
    // Tool Execution Node
    this.registerNodeHandler('tool', {
      execute: async (node, context) => {
        const { toolName, params } = node.data;
        
        // Evaluate params against context
        const evaluatedParams = this.evaluateParams(params, context);
        
        // Execute the tool
        const result = await context.tools.executeTool(toolName, evaluatedParams);
        
        if (!result.success) {
          throw new Error(`Tool execution failed: ${result.error}`);
        }
        
        return { result: result.result };
      }
    });
    
    // LLM Completion Node
    this.registerNodeHandler('llm', {
      execute: async (node, context) => {
        const { prompt, model, options } = node.data;
        
        // Evaluate prompt template with variables from context
        const evaluatedPrompt = this.evaluateTemplate(prompt, context);
        
        // Call LLM
        const result = await context.llm.callLLM({
          prompt: evaluatedPrompt,
          model,
          ...options
        });
        
        return { completion: result.completion };
      }
    });
    
    // Conditional Node
    this.registerNodeHandler('condition', {
      execute: async (node, context) => {
        const { condition, path } = node.data;
        const result = this.evaluateCondition(condition, context);
        return { condition: result, path: result ? 'true' : 'false' };
      }
    });
    
    // Transform Node
    this.registerNodeHandler('transform', {
      execute: async (node, context) => {
        const { transformation, input } = node.data;
        
        // Get input value from context
        const inputValue = this.evaluateVariable(input, context);
        
        // Apply transformation
        let result;
        switch (transformation) {
          case 'toUpperCase':
            result = typeof inputValue === 'string' ? inputValue.toUpperCase() : String(inputValue).toUpperCase();
            break;
          case 'toLowerCase':
            result = typeof inputValue === 'string' ? inputValue.toLowerCase() : String(inputValue).toLowerCase();
            break;
          case 'parseJson':
            result = typeof inputValue === 'string' ? JSON.parse(inputValue) : inputValue;
            break;
          case 'stringify':
            result = JSON.stringify(inputValue);
            break;
          default:
            throw new Error(`Unknown transformation: ${transformation}`);
        }
        
        return { result };
      }
    });

    // Parallel Node
    this.registerNodeHandler('parallel', {
      execute: async (node, context) => {
        // Parallel node: outputs pass-through (execution order handled by executor)
        return {};
      }
    });

    // Loop Node
    this.registerNodeHandler('loop', {
      execute: async (node, context) => {
        // Loop node: stub, actual control in executor
        return {};
      }
    });

    // Error Handler Node
    this.registerNodeHandler('error-handler', {
      execute: async (node, context) => {
        // Error-handler: stub, invoked internally on failure
        return {};
      }
    });
  }
  
  /**
   * Evaluate condition against context
   */
  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    // Simple implementation - in a real system this should be more robust
    try {
      // Replace variable references with actual values
      const conditionWithValues = condition.replace(
        /\$\{([^}]+)\}/g,
        (match, variable) => {
          const value = this.evaluateVariable(variable, context);
          if (typeof value === 'string') {
            return `"${value}"`;
          }
          return JSON.stringify(value);
        }
      );
      
      // Evaluate the condition (careful with security here in a real implementation)
      return new Function(`return ${conditionWithValues}`)();
    } catch (error) {
      this.logger.error(`Error evaluating condition: ${condition}`, error);
      return false;
    }
  }
  
  /**
   * Evaluate params object against context
   */
  private evaluateParams(params: Record<string, any>, context: ExecutionContext): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // It's a variable reference
        const variableName = value.substring(2, value.length - 1);
        result[key] = this.evaluateVariable(variableName, context);
      } else if (typeof value === 'string' && value.includes('${')) {
        // It's a template with embedded variables
        result[key] = this.evaluateTemplate(value, context);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively evaluate nested objects
        result[key] = this.evaluateParams(value, context);
      } else {
        // Use the value as-is
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Evaluate a variable reference against context
   */
  private evaluateVariable(variableName: string, context: ExecutionContext): any {
    const parts = variableName.trim().split('.');
    
    let current: any;
    if (parts[0] === 'inputs') {
      current = context.inputs;
      parts.shift();
    } else if (parts[0] === 'outputs') {
      current = context.outputs;
      parts.shift();
    } else if (parts[0] === 'state') {
      current = context.state;
      parts.shift();
    } else {
      // Look in all possible places
      const fromOutputs = this.getNestedValue(context.outputs, variableName);
      if (fromOutputs !== undefined) return fromOutputs;
      
      const fromInputs = this.getNestedValue(context.inputs, variableName);
      if (fromInputs !== undefined) return fromInputs;
      
      const fromState = this.getNestedValue(context.state, variableName);
      if (fromState !== undefined) return fromState;
      
      return undefined;
    }
    
    // Navigate the object path
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Evaluate a template string against context
   */
  private evaluateTemplate(template: string, context: ExecutionContext): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, variable) => {
      const value = this.evaluateVariable(variable, context);
      return value === undefined ? match : String(value);
    });
  }
}
