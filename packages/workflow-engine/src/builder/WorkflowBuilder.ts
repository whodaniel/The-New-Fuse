/**
 * Visual Workflow Builder for The New Fuse Framework
 * 
 * Provides tools for creating, editing, and validating workflows through a builder interface
 * Integrates with existing workflow components and provides visual workflow construction
 */

import { EventEmitter } from 'events';
import { Logger } from '@tnf/relay-core';
import {
  UnifiedWorkflow,
  WorkflowNode,
  WorkflowConnection,
  WorkflowVariable,
  VariableType,
  WorkflowStatus,
  WorkflowValidationResult,
  ValidationError,
  ValidationWarning,
  WorkflowTemplate,
  WorkflowSettings,
  WorkflowNodeType,
} from '../types/WorkflowTypes.js';
import { getErrorMessage } from '../utils/errorUtils.js';

export interface BuilderConfig {
  enableAutoValidation: boolean;
  enableAutoSave: boolean;
  autoSaveIntervalMs: number;
  maxNodes: number;
  maxConnections: number;
  enableVersioning: boolean;
  debug: boolean;
}

export interface BuilderState {
  workflowId: string;
  isDirty: boolean;
  isValid: boolean;
  lastSaved: Date | null;
  version: string;
  history: BuilderAction[];
  selectedNodes: string[];
  clipboard: WorkflowNode[];
}

export interface BuilderAction {
  id: string;
  type: 'add_node' | 'remove_node' | 'add_connection' | 'remove_connection' | 'update_node' | 'update_variable';
  timestamp: Date;
  data: any;
  undoable: boolean;
}

export class WorkflowBuilder extends EventEmitter {
  private logger: Logger;
  private config: BuilderConfig;
  private currentWorkflow: UnifiedWorkflow | null = null;
  private builderState: BuilderState;
  private validationRules: Map<string, (workflow: UnifiedWorkflow) => ValidationError[]> = new Map();
  private nodeTemplates: Map<WorkflowNodeType, Partial<WorkflowNode>> = new Map();

  constructor(config: BuilderConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    
    this.builderState = {
      workflowId: '',
      isDirty: false,
      isValid: true,
      lastSaved: null,
      version: '1.0.0',
      history: [],
      selectedNodes: [],
      clipboard: []
    };

    this.initializeNodeTemplates();
    this.initializeValidationRules();
    
    if (config.enableAutoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Create new workflow
   */
  createWorkflow(name: string, description?: string): UnifiedWorkflow {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentWorkflow = {
      id: workflowId,
      name,
      description,
      definition: {
        version: '1.0.0',
        nodes: [],
        connections: [],
        variables: [],
        triggers: [],
        settings: this.getDefaultSettings()
      },
      status: WorkflowStatus.DRAFT,
      version: '1.0.0',
      tags: [],
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
        performance: {
          averageCpuUsage: 0,
          averageMemoryUsage: 0,
          peakMemoryUsage: 0,
          throughput: 0,
          bottleneckNodes: []
        }
      },
      metadata: {
        category: 'general',
        tags: [],
        author: 'workflow-builder',
        dependencies: [],
        integrations: [],
        customProperties: {}
      }
    };

    this.builderState.workflowId = workflowId;
    this.builderState.isDirty = true;
    this.builderState.version = '1.0.0';
    
    // Add default start and end nodes
    this.addStartNode();
    this.addEndNode();
    
    this.emit('workflowCreated', this.currentWorkflow);
    this.logger.info(`📋 Workflow created: ${name} (${workflowId})`);
    
    return this.currentWorkflow!;
  }

  /**
   * Load existing workflow for editing
   */
  loadWorkflow(workflow: UnifiedWorkflow): void {
    this.currentWorkflow = { ...workflow };
    this.builderState.workflowId = workflow.id;
    this.builderState.isDirty = false;
    this.builderState.version = workflow.version;
    this.builderState.lastSaved = workflow.updatedAt;
    
    this.emit('workflowLoaded', workflow);
    this.logger.info(`📂 Workflow loaded: ${workflow.name} (${workflow.id})`);
  }

  /**
   * Add node to workflow
   */
  addNode(
    type: WorkflowNodeType,
    name: string,
    position: { x: number; y: number },
    config?: any
  ): WorkflowNode {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    if (this.currentWorkflow.definition.nodes.length >= this.config.maxNodes) {
      throw new Error(`Maximum nodes limit reached (${this.config.maxNodes})`);
    }

    const nodeTemplate = this.nodeTemplates.get(type);
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const node: WorkflowNode = {
      id: nodeId,
      type,
      name,
      position,
      config: { ...nodeTemplate?.config, ...config },
      inputs: nodeTemplate?.inputs || [],
      outputs: nodeTemplate?.outputs || [],
      conditions: nodeTemplate?.conditions || [],
      retry: nodeTemplate?.retry,
      timeout: nodeTemplate?.timeout,
      metadata: {
        createdAt: new Date(),
        createdBy: 'workflow-builder'
      }
    };

    this.currentWorkflow.definition.nodes.push(node);
    this.markDirty();
    this.recordAction('add_node', { node });
    
    if (this.config.enableAutoValidation) {
      this.validateWorkflow();
    }

    this.emit('nodeAdded', node);
    this.logger.debug(`➕ Node added: ${name} (${type})`);
    
    return node;
  }

  /**
   * Remove node from workflow
   */
  removeNode(nodeId: string): boolean {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    const nodeIndex = this.currentWorkflow.definition.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      return false;
    }

    const node = this.currentWorkflow.definition.nodes[nodeIndex];
    
    // Remove connected connections
    this.currentWorkflow.definition.connections = this.currentWorkflow.definition.connections.filter(
      c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );

    // Remove the node
    this.currentWorkflow.definition.nodes.splice(nodeIndex, 1);
    
    this.markDirty();
    this.recordAction('remove_node', { node });
    
    if (this.config.enableAutoValidation) {
      this.validateWorkflow();
    }

    this.emit('nodeRemoved', node);
    this.logger.debug(`➖ Node removed: ${node.name} (${nodeId})`);
    
    return true;
  }

  /**
   * Update node configuration
   */
  updateNode(nodeId: string, updates: Partial<WorkflowNode>): boolean {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    const node = this.currentWorkflow.definition.nodes.find(n => n.id === nodeId);
    if (!node) {
      return false;
    }

    const oldNode = { ...node };
    Object.assign(node, updates);
    node.metadata = { ...node.metadata, updatedAt: new Date() };
    
    this.markDirty();
    this.recordAction('update_node', { oldNode, newNode: node });
    
    if (this.config.enableAutoValidation) {
      this.validateWorkflow();
    }

    this.emit('nodeUpdated', node);
    this.logger.debug(`📝 Node updated: ${node.name} (${nodeId})`);
    
    return true;
  }

  /**
   * Add connection between nodes
   */
  addConnection(
    sourceNodeId: string,
    sourceOutputId: string,
    targetNodeId: string,
    targetInputId: string,
    condition?: string
  ): WorkflowConnection {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    if (this.currentWorkflow.definition.connections.length >= this.config.maxConnections) {
      throw new Error(`Maximum connections limit reached (${this.config.maxConnections})`);
    }

    // Validate connection
    const sourceNode = this.currentWorkflow.definition.nodes.find(n => n.id === sourceNodeId);
    const targetNode = this.currentWorkflow.definition.nodes.find(n => n.id === targetNodeId);
    
    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found');
    }

    // Check for circular connections
    if (this.wouldCreateCircle(sourceNodeId, targetNodeId)) {
      throw new Error('Connection would create a circular dependency');
    }

    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connection: WorkflowConnection = {
      id: connectionId,
      sourceNodeId,
      sourceOutputId,
      targetNodeId,
      targetInputId,
      condition,
      metadata: {
        createdAt: new Date(),
        createdBy: 'workflow-builder'
      }
    };

    this.currentWorkflow.definition.connections.push(connection);
    this.markDirty();
    this.recordAction('add_connection', { connection });
    
    if (this.config.enableAutoValidation) {
      this.validateWorkflow();
    }

    this.emit('connectionAdded', connection);
    this.logger.debug(`🔗 Connection added: ${sourceNodeId} → ${targetNodeId}`);
    
    return connection;
  }

  /**
   * Remove connection
   */
  removeConnection(connectionId: string): boolean {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    const connectionIndex = this.currentWorkflow.definition.connections.findIndex(c => c.id === connectionId);
    if (connectionIndex === -1) {
      return false;
    }

    const connection = this.currentWorkflow.definition.connections[connectionIndex];
    this.currentWorkflow.definition.connections.splice(connectionIndex, 1);
    
    this.markDirty();
    this.recordAction('remove_connection', { connection });
    
    if (this.config.enableAutoValidation) {
      this.validateWorkflow();
    }

    this.emit('connectionRemoved', connection);
    this.logger.debug(`🔗 Connection removed: ${connectionId}`);
    
    return true;
  }

  /**
   * Add workflow variable
   */
  addVariable(variable: Omit<WorkflowVariable, 'id'>): WorkflowVariable {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    const variableId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newVariable: WorkflowVariable = {
      id: variableId,
      ...variable
    };

    this.currentWorkflow.definition.variables.push(newVariable);
    this.markDirty();
    this.recordAction('update_variable', { action: 'add', variable: newVariable });

    this.emit('variableAdded', newVariable);
    this.logger.debug(`📊 Variable added: ${variable.name}`);
    
    return newVariable;
  }

  /**
   * Update workflow variable
   */
  updateVariable(variableId: string, updates: Partial<WorkflowVariable>): boolean {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    const variable = this.currentWorkflow.definition.variables.find(v => v.id === variableId);
    if (!variable) {
      return false;
    }

    const oldVariable = { ...variable };
    Object.assign(variable, updates);
    
    this.markDirty();
    this.recordAction('update_variable', { action: 'update', oldVariable, newVariable: variable });

    this.emit('variableUpdated', variable);
    this.logger.debug(`📊 Variable updated: ${variable.name}`);
    
    return true;
  }

  /**
   * Remove workflow variable
   */
  removeVariable(variableId: string): boolean {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    const variableIndex = this.currentWorkflow.definition.variables.findIndex(v => v.id === variableId);
    if (variableIndex === -1) {
      return false;
    }

    const variable = this.currentWorkflow.definition.variables[variableIndex];
    this.currentWorkflow.definition.variables.splice(variableIndex, 1);
    
    this.markDirty();
    this.recordAction('update_variable', { action: 'remove', variable });

    this.emit('variableRemoved', variable);
    this.logger.debug(`📊 Variable removed: ${variable.name}`);
    
    return true;
  }

  /**
   * Validate workflow
   */
  validateWorkflow(): WorkflowValidationResult {
    if (!this.currentWorkflow) {
      return { valid: false, errors: [{ code: 'NO_WORKFLOW', message: 'No workflow loaded', severity: 'error' }], warnings: [] };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Run all validation rules
    for (const [ruleName, rule] of this.validationRules.entries()) {
      try {
        const ruleErrors = rule(this.currentWorkflow);
        errors.push(...ruleErrors);
      } catch (error) {
        this.logger.error(`Validation rule ${ruleName} failed: ${getErrorMessage(error)}`);
      }
    }

    // Check for warnings
    warnings.push(...this.checkWarnings());

    const result: WorkflowValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings
    };

    this.builderState.isValid = result.valid;
    this.emit('validationResult', result);

    if (!result.valid) {
      this.logger.warn(`❌ Workflow validation failed: ${errors.length} errors, ${warnings.length} warnings`);
    }

    return result;
  }

  /**
   * Export workflow
   */
  exportWorkflow(): UnifiedWorkflow {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    return JSON.parse(JSON.stringify(this.currentWorkflow));
  }

  /**
   * Export as template
   */
  exportAsTemplate(): WorkflowTemplate {
    if (!this.currentWorkflow) {
      throw new Error('No workflow loaded');
    }

    return {
      metadata: {
        id: this.currentWorkflow.id,
        name: this.currentWorkflow.name,
        description: this.currentWorkflow.description || '',
        category: this.currentWorkflow.metadata.category,
        tags: this.currentWorkflow.metadata.tags,
        author: this.currentWorkflow.metadata.author,
        version: this.currentWorkflow.version,
        compatibility: ['1.0.0'],
        difficulty: 'intermediate',
        estimatedTime: 30
      },
      definition: this.currentWorkflow.definition,
      documentation: 'Generated from workflow builder',
      examples: []
    };
  }

  /**
   * Import from template
   */
  importFromTemplate(template: WorkflowTemplate): UnifiedWorkflow {
    const workflow = this.createWorkflow(template.metadata.name, template.metadata.description);
    
    // Clear default nodes
    workflow.definition.nodes = [];
    workflow.definition.connections = [];
    
    // Import definition
    workflow.definition = { ...template.definition };
    workflow.metadata.category = template.metadata.category;
    workflow.metadata.tags = template.metadata.tags;
    
    this.markDirty();
    this.emit('templateImported', template);
    
    return workflow;
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    const lastAction = this.builderState.history.filter(a => a.undoable).pop();
    if (!lastAction) {
      return false;
    }

    // Implement undo logic based on action type
    switch (lastAction.type) {
      case 'add_node':
        this.removeNode(lastAction.data.node.id);
        break;
      case 'remove_node':
        this.currentWorkflow?.definition.nodes.push(lastAction.data.node);
        break;
      // Add more undo cases as needed
    }

    this.emit('actionUndone', lastAction);
    return true;
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats() {
    if (!this.currentWorkflow) {
      return null;
    }

    const nodes = this.currentWorkflow.definition.nodes;
    const connections = this.currentWorkflow.definition.connections;
    
    const nodesByType = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<WorkflowNodeType, number>);

    return {
      totalNodes: nodes.length,
      totalConnections: connections.length,
      totalVariables: this.currentWorkflow.definition.variables.length,
      totalTriggers: this.currentWorkflow.definition.triggers.length,
      nodesByType,
      complexity: this.calculateComplexity(),
      estimatedExecutionTime: this.estimateExecutionTime()
    };
  }

  /**
   * Private helper methods
   */
  private initializeNodeTemplates(): void {
    // Initialize templates for each node type
    this.nodeTemplates.set(WorkflowNodeType.START, {
      inputs: [],
      outputs: [{ id: 'output', name: 'Start', type: VariableType.OBJECT, description: 'Workflow started' }],
      config: {}
    });

    this.nodeTemplates.set(WorkflowNodeType.END, {
      inputs: [{ id: 'input', name: 'End', type: VariableType.OBJECT, required: false, description: 'Workflow result' }],
      outputs: [],
      config: {}
    });

    this.nodeTemplates.set(WorkflowNodeType.AGENT_TASK, {
      inputs: [
        { id: 'task', name: 'Task', type: VariableType.STRING, required: true, description: 'Task description' },
        { id: 'context', name: 'Context', type: VariableType.OBJECT, required: false, description: 'Task context' }
      ],
      outputs: [
        { id: 'result', name: 'Result', type: VariableType.OBJECT, description: 'Task result' },
        { id: 'agentId', name: 'Agent ID', type: VariableType.STRING, description: 'Executing agent ID' }
      ],
      config: {
        priority: 'medium',
        expectedDuration: 30
      }
    });

    // Add more node templates...
  }

  private initializeValidationRules(): void {
    // Must have start node
    this.validationRules.set('must_have_start', (workflow) => {
      const hasStart = workflow.definition.nodes.some(n => n.type === WorkflowNodeType.START);
      return hasStart ? [] : [{
        code: 'MISSING_START_NODE',
        message: 'Workflow must have a start node',
        severity: 'error' as const
      }];
    });

    // Must have end node
    this.validationRules.set('must_have_end', (workflow) => {
      const hasEnd = workflow.definition.nodes.some(n => n.type === WorkflowNodeType.END);
      return hasEnd ? [] : [{
        code: 'MISSING_END_NODE',
        message: 'Workflow must have an end node',
        severity: 'error' as const
      }];
    });

    // No orphaned nodes
    this.validationRules.set('no_orphaned_nodes', (workflow) => {
      const errors: ValidationError[] = [];
      const connections = workflow.definition.connections;
      
      for (const node of workflow.definition.nodes) {
        if (node.type === WorkflowNodeType.START) continue;
        
        const hasIncoming = connections.some(c => c.targetNodeId === node.id);
        if (!hasIncoming) {
          errors.push({
            code: 'ORPHANED_NODE',
            message: `Node "${node.name}" has no incoming connections`,
            nodeId: node.id,
            severity: 'error'
          });
        }
      }
      
      return errors;
    });

    // Add more validation rules...
  }

  private checkWarnings(): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (!this.currentWorkflow) return warnings;

    // Check for nodes without names
    for (const node of this.currentWorkflow.definition.nodes) {
      if (!node.name || node.name.trim() === '') {
        warnings.push({
          code: 'UNNAMED_NODE',
          message: `Node of type "${node.type}" has no name`,
          nodeId: node.id,
          suggestion: 'Consider adding a descriptive name for better clarity'
        });
      }
    }

    return warnings;
  }

  private wouldCreateCircle(sourceNodeId: string, targetNodeId: string): boolean {
    if (!this.currentWorkflow) return false;
    
    // Simple cycle detection - could be improved
    const visited = new Set<string>();
    const stack = [targetNodeId];
    
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (currentId === sourceNodeId) return true;
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      
      const outgoingConnections = this.currentWorkflow.definition.connections.filter(
        c => c.sourceNodeId === currentId
      );
      
      for (const conn of outgoingConnections) {
        stack.push(conn.targetNodeId);
      }
    }
    
    return false;
  }

  private addStartNode(): void {
    this.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
  }

  private addEndNode(): void {
    this.addNode(WorkflowNodeType.END, 'End', { x: 500, y: 100 });
  }

  private getDefaultSettings(): WorkflowSettings {
    return {
      parallel: false,
      maxConcurrentExecutions: 1,
      timeoutMs: 300000, // 5 minutes
      retryPolicy: {
        enabled: true,
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000
      },
      errorHandling: {
        onError: 'stop',
        captureErrors: true,
        notifyOnError: true
      },
      logging: {
        level: 'info',
        includeInputs: true,
        includeOutputs: true,
        includeTiming: true,
        retentionDays: 30
      },
      notifications: {
        onStart: false,
        onComplete: true,
        onError: true,
        channels: []
      }
    };
  }

  private markDirty(): void {
    this.builderState.isDirty = true;
    this.builderState.lastSaved = null;
    if (this.currentWorkflow) {
      this.currentWorkflow.updatedAt = new Date();
    }
    this.emit('workflowChanged');
  }

  private recordAction(type: BuilderAction['type'], data: any): void {
    const action: BuilderAction = {
      id: `action_${Date.now()}`,
      type,
      timestamp: new Date(),
      data,
      undoable: true
    };
    
    this.builderState.history.push(action);
    
    // Keep only last 50 actions
    if (this.builderState.history.length > 50) {
      this.builderState.history = this.builderState.history.slice(-50);
    }
  }

  private calculateComplexity(): number {
    if (!this.currentWorkflow) return 0;
    
    const nodes = this.currentWorkflow.definition.nodes.length;
    const connections = this.currentWorkflow.definition.connections.length;
    const variables = this.currentWorkflow.definition.variables.length;
    
    return nodes + connections * 0.5 + variables * 0.3;
  }

  private estimateExecutionTime(): number {
    if (!this.currentWorkflow) return 0;
    
    // Simple estimation based on node types
    let totalTime = 0;
    
    for (const node of this.currentWorkflow.definition.nodes) {
      switch (node.type) {
        case WorkflowNodeType.AGENT_TASK:
          totalTime += (node.config as any)?.expectedDuration || 30;
          break;
        case WorkflowNodeType.API_CALL:
          totalTime += 5;
          break;
        case WorkflowNodeType.LLM_PROMPT:
          totalTime += 10;
          break;
        default:
          totalTime += 1;
      }
    }
    
    return totalTime;
  }

  private startAutoSave(): void {
    setInterval(() => {
      if (this.builderState.isDirty && this.currentWorkflow) {
        this.emit('autoSave', this.currentWorkflow);
        this.builderState.lastSaved = new Date();
        this.builderState.isDirty = false;
      }
    }, this.config.autoSaveIntervalMs);
  }

  /**
   * Public API
   */
  getCurrentWorkflow(): UnifiedWorkflow | null {
    return this.currentWorkflow;
  }

  getBuilderState(): BuilderState {
    return { ...this.builderState };
  }

  isDirty(): boolean {
    return this.builderState.isDirty;
  }

  isValid(): boolean {
    return this.builderState.isValid;
  }
}