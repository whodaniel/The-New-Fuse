/**
 * N8N Workflow Integration Types
 *
 * Comprehensive type definitions for N8N workflow automation integration
 * with The New Fuse AI Agent framework.
 */
import { NamedEntity } from '../types/common-types';
export interface N8NWorkflowConfig extends NamedEntity {
    agentId: string;
    userId: string;
    organizationId?: string;
    workflowId: string;
    n8nInstanceUrl: string;
    apiKey?: string;
    webhookUrl?: string;
    triggerType: N8NTriggerType;
    triggerConfig: Record<string, any>;
    executionSettings: {
        timeout?: number;
        retryOnFailure?: boolean;
        retryAttempts?: number;
        retryDelay?: number;
        saveExecutionProgress?: boolean;
    };
    agentIntegration: {
        inputMapping: Record<string, string>;
        outputMapping: Record<string, string>;
        errorHandling: N8NErrorHandling;
    };
    status: N8NWorkflowStatus;
    isActive: boolean;
    tags: string[];
    metadata?: Record<string, any>;
    lastExecuted?: Date;
}
export interface N8NExecution {
    id: string;
    workflowId: string;
    agentId?: string;
    n8nExecutionId: string;
    status: N8NExecutionStatus;
    mode: N8NExecutionMode;
    inputData?: Record<string, any>;
    outputData?: Record<string, any>;
    errorData?: Record<string, any>;
    startedAt: Date;
    stoppedAt?: Date;
    duration?: number;
    retryAttempt: number;
    isRetry: boolean;
    metadata?: Record<string, any>;
}
export interface N8NWebhookEvent {
    id: string;
    workflowId: string;
    eventType: string;
    payload: Record<string, any>;
    headers: Record<string, string>;
    sourceIp?: string;
    userAgent?: string;
    status: N8NWebhookStatus;
    processedAt?: Date;
    error?: string;
    receivedAt: Date;
}
export declare enum N8NTriggerType {
    WEBHOOK = "WEBHOOK",
    SCHEDULE = "SCHEDULE",
    MANUAL = "MANUAL",
    HTTP_REQUEST = "HTTP_REQUEST",
    EMAIL = "EMAIL",
    FILE_SYSTEM = "FILE_SYSTEM",
    DATABASE = "DATABASE",
    API_POLLING = "API_POLLING"
}
export declare enum N8NWorkflowStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    ERROR = "ERROR",
    DEPRECATED = "DEPRECATED"
}
export declare enum N8NExecutionStatus {
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
    CANCELED = "CANCELED",
    WAITING = "WAITING",
    CRASHED = "CRASHED"
}
export declare enum N8NExecutionMode {
    MANUAL = "MANUAL",
    TRIGGER = "TRIGGER",
    RETRY = "RETRY",
    WEBHOOK = "WEBHOOK",
    INTERNAL = "INTERNAL"
}
export declare enum N8NWebhookStatus {
    RECEIVED = "RECEIVED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    IGNORED = "IGNORED"
}
export declare enum N8NErrorHandling {
    STOP = "STOP",
    CONTINUE = "CONTINUE",
    RETRY = "RETRY",
    SKIP = "SKIP",
    NOTIFY = "NOTIFY"
}
export interface N8NAgentBridge {
    /**
     * Execute an N8N workflow from an agent
     */
    executeWorkflow(workflowId: string, agentId: string, inputData?: Record<string, any>): Promise<N8NExecution>;
    /**
     * Get workflow execution status
     */
    getExecutionStatus(executionId: string): Promise<N8NExecution>;
    /**
     * Cancel a running workflow execution
     */
    cancelExecution(executionId: string): Promise<boolean>;
    /**
     * Get workflow execution history
     */
    getExecutionHistory(workflowId: string, limit?: number, offset?: number): Promise<N8NExecution[]>;
    /**
     * Register webhook for workflow
     */
    registerWebhook(workflowId: string, webhookPath: string, config: Record<string, any>): Promise<string>;
    /**
     * Handle incoming webhook event
     */
    handleWebhookEvent(webhookPath: string, payload: Record<string, any>, headers: Record<string, string>): Promise<N8NWebhookEvent>;
    /**
     * Get workflow metrics
     */
    getWorkflowMetrics(workflowId: string): Promise<N8NWorkflowMetrics>;
}
export interface N8NWorkflowMetrics {
    workflowId: string;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecutionTime?: Date;
    successRate: number;
    executionsToday: number;
    executionsThisWeek: number;
    executionsThisMonth: number;
    commonErrors: Array<{
        error: string;
        count: number;
        lastOccurred: Date;
    }>;
    averageMemoryUsage?: number;
    averageCpuUsage?: number;
}
export interface N8NNodeExecutionData {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: N8NExecutionStatus;
    inputData?: Record<string, any>;
    outputData?: Record<string, any>;
    error?: string;
}
export interface N8NWorkflowTemplate extends NamedEntity {
    category: string;
    tags: string[];
    workflowData: Record<string, any>;
    requiredConnections: string[];
    parameterSchema?: Record<string, any>;
    agentCompatibility: {
        supportedAgentTypes: string[];
        inputRequirements: Record<string, any>;
        outputFormat: Record<string, any>;
    };
    usageCount: number;
    rating?: number;
}
//# sourceMappingURL=n8n-types.d.ts.map