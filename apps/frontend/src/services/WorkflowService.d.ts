/**
 * Workflow Service - Production ready service for workflow management
 */
import { Node, Edge } from 'reactflow';
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    nodes: Node[];
    edges: Edge[];
    status: 'draft' | 'active' | 'paused' | 'archived';
    version: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags?: string[];
    metadata?: Record<string, any>;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
    logs: WorkflowExecutionLog[];
    nodeExecutions: NodeExecution[];
}
export interface WorkflowExecutionLog {
    id: string;
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    nodeId?: string;
    metadata?: Record<string, any>;
}
export interface NodeExecution {
    nodeId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
    attempts: number;
    logs: string[];
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    complexity: 'low' | 'medium' | 'high';
    popularity: 'low' | 'medium' | 'high';
    nodes: Node[];
    edges: Edge[];
    metadata?: Record<string, any>;
}
declare class WorkflowService {
    private baseUrl;
    private apiKey?;
    constructor(baseUrl?: string, apiKey?: string);
    private request;
    getWorkflows(): Promise<Workflow[]>;
    getWorkflow(id: string): Promise<Workflow>;
    createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<void>;
    executeWorkflow(workflowId: string, input?: Record<string, any>): Promise<WorkflowExecution>;
    getExecution(executionId: string): Promise<WorkflowExecution>;
    getExecutions(workflowId?: string): Promise<WorkflowExecution[]>;
    cancelExecution(executionId: string): Promise<WorkflowExecution>;
    pauseExecution(executionId: string): Promise<WorkflowExecution>;
    resumeExecution(executionId: string): Promise<WorkflowExecution>;
    getTemplates(): Promise<WorkflowTemplate[]>;
    getTemplate(id: string): Promise<WorkflowTemplate>;
    createFromTemplate(templateId: string, name: string, description?: string): Promise<Workflow>;
    validateWorkflow(workflow: Workflow): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    subscribeToExecution(executionId: string, callback: (execution: WorkflowExecution) => void): () => void;
    private transformWorkflow;
    private transformExecution;
}
export declare const workflowService: WorkflowService;
export default WorkflowService;
