/**
 * Data Transfer Objects (DTOs) for API requests and responses
 */
import { AgentCapability, AgentRole, AgentStatus } from './enums.js';
export interface CreateAgentDto {
    name: string;
    description?: string;
    type: string;
    capabilities: AgentCapability[] | string[];
    systemPrompt?: string;
    status?: AgentStatus;
    role?: AgentRole;
    configuration?: Record<string, unknown>;
}
export interface UpdateAgentDto {
    name?: string;
    description?: string;
    type?: string;
    systemPrompt?: string;
    capabilities?: AgentCapability[] | string[];
    status?: AgentStatus;
    role?: AgentRole;
    configuration?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export interface AgentResponseDto {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: AgentStatus;
    role?: AgentRole;
    capabilities: AgentCapability[] | string[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateWorkflowDto {
    name: string;
    description?: string;
    metadata?: Record<string, unknown>;
    steps?: Array<{
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
    }>;
}
export interface UpdateWorkflowDto {
    name?: string;
    description?: string;
    status?: string;
    metadata?: Record<string, unknown>;
    steps?: Array<{
        id?: string;
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
    }>;
}
export interface WorkflowResponseDto {
    id: string;
    name: string;
    description?: string;
    status: string;
    steps: Array<{
        id: string;
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
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowExecutionResponseDto {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    result?: unknown;
    error?: string;
    stepResults: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateTaskDto {
    title: string;
    description?: string;
    type: string;
    priority?: string;
    assignedTo?: string;
    dependencies?: string[];
    metadata?: Record<string, unknown>;
}
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    dependencies?: string[];
    metadata?: Record<string, unknown>;
}
export interface TaskResponseDto {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    priority: string;
    assignedTo?: string;
    dependencies: string[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T | null;
    error?: string | null;
    message?: string;
}
