import { TaskType, TaskStatus, TaskPriority, AgentStatus, AgentRole, AgentCapability, EventType } from './enums.js';
import { BaseEntity } from './base-types.js';
export interface Agent extends BaseEntity {
    name: string;
    description?: string;
    type: string;
    status: AgentStatus;
    role?: AgentRole;
    capabilities: AgentCapability[] | string[];
    metadata: Record<string, unknown>;
    userId?: string;
    deletedAt?: Date | null;
}
export interface AgentConfig {
    id: string;
    name: string;
    description?: string;
    type: string;
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    contextWindow?: number;
    capabilities?: AgentCapability[] | string[];
    rateLimit?: {
        requests: number;
        window: number;
    };
    timeout?: number;
    retries?: number;
    maxConcurrentTasks?: number;
    taskTimeout?: number;
    memoryLimit?: number;
    constraints?: {
        maxTokensPerRequest?: number;
        maxRequestsPerMinute?: number;
        maxCostPerDay?: number;
    };
}
export interface AgentMessage {
    id: string;
    type: 'task' | 'notification' | 'command';
    content: unknown;
    metadata?: Record<string, unknown>;
    timestamp: string;
    priority?: 'low' | 'medium' | 'high';
}
export interface AgentErrorContext {
    messageId: string;
    messageType: 'task' | 'notification' | 'command';
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export interface Event extends BaseEntity {
    type: EventType;
    data: Record<string, unknown>;
    source: string;
    timestamp: Date;
}
export interface Task extends BaseEntity {
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    title: string;
    description?: string;
    metadata: Record<string, unknown>;
    assignedTo?: string;
    dependencies: string[];
}
export interface WorkflowStep extends BaseEntity {
    workflowId: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    position: {
        x: number;
        y: number;
    };
    connections: Array<{
        stepId: string;
        inputName?: string;
        outputName?: string;
    }>;
    order?: number;
    status?: TaskStatus;
    result?: Record<string, unknown>;
}
export interface Workflow extends BaseEntity {
    name: string;
    description?: string;
    status: string;
    steps: WorkflowStep[];
    metadata?: Record<string, unknown>;
    deletedAt?: Date | null;
}
export interface WorkflowExecution extends BaseEntity {
    workflowId: string;
    status: 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date | null;
    result?: unknown;
    error?: string | null;
    stepResults: Record<string, unknown>;
    deletedAt?: Date | null;
}
export type WorkflowExecutionStatus = {
    id: string;
    status: 'running' | 'completed' | 'failed';
    progress?: number;
    startedAt: string;
    completedAt?: string;
    error?: string;
    result?: unknown;
};
export type WorkflowInput = Record<string, unknown>;
export interface User {
    id: string;
    username: string;
    email: string;
    name?: string;
    roles: string[];
    createdAt: Date;
    updatedAt: Date;
}
