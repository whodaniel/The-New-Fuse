/**
 * Workflow-related type definitions
 */
import { UUID, ISODateTime } from './common';
export declare enum WorkflowStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ACTIVE = "active",
    ARCHIVED = "archived",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed",
    RUNNING = "running",
    CANCELLED = "cancelled",
    STOPPED = "stopped",
    PENDING = "pending",
    IDLE = "idle"
}
export declare enum WorkflowStepType {
    ACTION = "action",
    CONDITION = "condition",
    TRIGGER = "trigger",
    WAIT = "wait",
    SUB_WORKFLOW = "sub-workflow",
    AGENT_TASK = "agent_task",
    API_CALL = "api_call",
    HUMAN_INPUT = "human_input",
    TRANSFORMATION = "transformation",
    LOOP = "loop"
}
export declare enum WorkflowExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface WorkflowCondition {
    nextStepId: string;
    expression: string;
}
export interface WorkflowStepDefinition {
    id: string;
    workflowId?: string;
    name: string;
    type: WorkflowStepType;
    action?: string;
    parameters?: Record<string, any>;
    dependencies?: string[];
    conditions?: WorkflowCondition[];
    next?: WorkflowStepDefinition;
    branches?: Array<{
        condition: string;
        nextStep: WorkflowStepDefinition;
    }>;
    description?: string;
    config?: Record<string, any>;
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    error?: string;
    metadata?: Record<string, any>;
    startTime?: ISODateTime;
    endTime?: ISODateTime;
    position?: {
        x: number;
        y: number;
    };
    connections?: Array<{
        stepId: string;
        inputName?: string;
        outputName?: string;
    }>;
    order?: number;
    result?: Record<string, unknown>;
    retryConfig?: {
        maxRetries: number;
        backoffFactor: number;
        initialDelay: number;
    };
}
export interface WorkflowModel {
    id: UUID;
    name: string;
    description?: string;
    status: WorkflowStatus;
    triggerType?: 'manual' | 'scheduled' | 'event';
    triggerConfig?: Record<string, any>;
    steps: Record<string, WorkflowStepDefinition>;
    firstStepId?: string;
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
    metadata?: Record<string, any>;
    userId?: UUID;
    deletedAt?: ISODateTime | null;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export interface WorkflowExecutionModel {
    id: UUID;
    workflowId: UUID;
    status: 'running' | 'completed' | 'failed';
    startedAt: ISODateTime;
    completedAt?: ISODateTime | null;
    input?: Record<string, any>;
    result?: Record<string, any>;
    stepResults: Record<string, unknown>;
    currentStepId?: string;
    error?: string;
    deletedAt?: ISODateTime | null;
    metrics?: WorkflowMetrics;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export interface WorkflowMetrics {
    startTime?: number;
    endTime?: number;
    duration?: number;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    stepMetrics: Record<string, {
        id: string;
        status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
        attempts: number;
        startTime?: number;
        endTime?: number;
        duration?: number;
        type?: string;
    }>;
}
export interface WorkflowError {
    message: string;
    code?: string;
    details?: Record<string, any>;
}
export interface WorkflowState {
    status: WorkflowStatus;
    currentStepId?: string;
    error?: WorkflowError;
    completedSteps: string[];
}
export interface StepMetrics {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    attempts: number;
    startTime?: number;
    endTime?: number;
    duration?: number;
    type?: string;
}
export interface WorkflowContext {
    variables: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface WorkflowInstance {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    context: WorkflowContext;
    startTime: ISODateTime;
    endTime?: ISODateTime;
    error?: any;
    result?: any;
}
export interface ExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    context?: WorkflowContext;
    metrics?: any;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
    type?: string;
}
export interface MonitoringEvent {
    type: string;
    timestamp: number;
    data: any;
    workflowId?: string;
    stepId?: string;
}
export interface WorkflowExecutionResult {
    success: boolean;
    result?: any;
    error?: string;
    metrics?: WorkflowMetrics;
    output?: any;
}
export interface CreateWorkflowDto {
    name: string;
    description?: string;
    triggerType?: 'manual' | 'scheduled' | 'event';
    triggerConfig?: Record<string, any>;
    steps: Record<string, WorkflowStepDefinition>;
    firstStepId?: string;
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface UpdateWorkflowDto {
    name?: string;
    description?: string;
    status?: WorkflowStatus;
    triggerType?: 'manual' | 'scheduled' | 'event';
    triggerConfig?: Record<string, any>;
    steps?: Record<string, WorkflowStepDefinition>;
    firstStepId?: string;
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface ExecuteWorkflowDto {
    input: Record<string, any>;
}
//# sourceMappingURL=workflow.d.ts.map