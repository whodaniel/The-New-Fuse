// @ts-nocheck
/**
 * Visual Workflow Builder for The New Fuse Framework
 *
 * Provides tools for creating, editing, and validating workflows through a builder interface
 * Integrates with existing workflow components and provides visual workflow construction
 */
import { EventEmitter } from 'events';
import { Logger } from '@the-new-fuse/relay-core';
import { UnifiedWorkflow, WorkflowNode, WorkflowConnection, WorkflowVariable, WorkflowValidationResult, WorkflowTemplate, WorkflowNodeType } from '../types/WorkflowTypes.js';
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
export declare class WorkflowBuilder extends EventEmitter {
    private logger;
    private config;
    private currentWorkflow;
    private builderState;
    private validationRules;
    private nodeTemplates;
    constructor(config: BuilderConfig, logger: Logger);
    /**
     * Create new workflow
     */
    createWorkflow(name: string, description?: string): UnifiedWorkflow;
    /**
     * Load existing workflow for editing
     */
    loadWorkflow(workflow: UnifiedWorkflow): void;
    /**
     * Add node to workflow
     */
    addNode(type: WorkflowNodeType, name: string, position: {
        x: number;
        y: number;
    }, config?: any): WorkflowNode;
    /**
     * Remove node from workflow
     */
    removeNode(nodeId: string): boolean;
    /**
     * Update node configuration
     */
    updateNode(nodeId: string, updates: Partial<WorkflowNode>): boolean;
    /**
     * Add connection between nodes
     */
    addConnection(sourceNodeId: string, sourceOutputId: string, targetNodeId: string, targetInputId: string, condition?: string): WorkflowConnection;
    /**
     * Remove connection
     */
    removeConnection(connectionId: string): boolean;
    /**
     * Add workflow variable
     */
    addVariable(variable: Omit<WorkflowVariable, 'id'>): WorkflowVariable;
    /**
     * Update workflow variable
     */
    updateVariable(variableId: string, updates: Partial<WorkflowVariable>): boolean;
    /**
     * Remove workflow variable
     */
    removeVariable(variableId: string): boolean;
    /**
     * Validate workflow
     */
    validateWorkflow(): WorkflowValidationResult;
    /**
     * Export workflow
     */
    exportWorkflow(): UnifiedWorkflow;
    /**
     * Export as template
     */
    exportAsTemplate(): WorkflowTemplate;
    /**
     * Import from template
     */
    importFromTemplate(template: WorkflowTemplate): UnifiedWorkflow;
    /**
     * Undo last action
     */
    undo(): boolean;
    /**
     * Get workflow statistics
     */
    getWorkflowStats(): {
        totalNodes: number;
        totalConnections: number;
        totalVariables: number;
        totalTriggers: number;
        nodesByType: Record<WorkflowNodeType, number>;
        complexity: number;
        estimatedExecutionTime: number;
    } | null;
    /**
     * Private helper methods
     */
    private initializeNodeTemplates;
    private initializeValidationRules;
    private checkWarnings;
    private wouldCreateCircle;
    private addStartNode;
    private addEndNode;
    private getDefaultSettings;
    private markDirty;
    private recordAction;
    private calculateComplexity;
    private estimateExecutionTime;
    private startAutoSave;
    /**
     * Public API
     */
    getCurrentWorkflow(): UnifiedWorkflow | null;
    getBuilderState(): BuilderState;
    isDirty(): boolean;
    isValid(): boolean;
}
//# sourceMappingURL=WorkflowBuilder.d.ts.map