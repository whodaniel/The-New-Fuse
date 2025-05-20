import { TaskStatusType, TaskPriorityType, TaskTypeValue, TaskMetadata } from '@fuse/types';

export interface Task {
    id: string;
    title: string;
    description?: string;
    type: typeof TaskTypeValue;
    status: TaskStatusType;
    priority: TaskPriorityType;
    dependencies?: string[];
    userId: string;
    metadata: TaskMetadata;
    createdAt: Date;
    scheduledAt?: Date;
    started?: Date;
    completed?: Date;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    data?: Record<string, unknown>;
}

export interface TaskExecution {
    id: string;
    taskId: string;
    executorId: string;
    status: TaskExecutionStatus;
    startTime: Date;
    endTime?: Date;
    result?: unknown;
    error?: string;
    metrics?: {
        duration: number;
        resourceUsage?: {
            cpu: number;
            memory: number;
            tokens: number;
        };
    };
    logs?: TaskExecutionLog[];
}

export type TaskExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskExecutionLog {
    timestamp: Date;
    level: "info" | "warning" | "error";
    message: string;
    metadata?: Record<string, unknown>;
}

export interface TaskDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    constraints?: {
        timeout?: number;
        maxRetries?: number;
        resources?: {
            minCpu?: number;
            minMemory?: number;
            maxTokens?: number;
        };
    };
    metadata?: Record<string, unknown>;
}

export interface TaskQueue {
    id: string;
    name: string;
    tasks: Task[];
    config: {
        maxSize?: number;
        priorityLevels: number;
        processingStrategy: "fifo" | "lifo" | "priority";
    };
    metrics: {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        averageProcessingTime: number;
    };
}
