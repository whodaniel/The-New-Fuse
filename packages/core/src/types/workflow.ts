import { Task, TaskDefinition } from './task.js';
import { z } from 'zod';

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    version: string;
    status: WorkflowStatus;
    tasks: WorkflowTask[];
    edges: WorkflowEdge[];
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    createdBy: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    metadata?: Record<string, unknown>;
    tags?: string[];
}

export interface WorkflowInstance extends Omit<Workflow, 'tasks' | 'edges'> {
    templateId: string;
    steps: WorkflowStep[];
    startTime: Date;
    endTime: Date | null;
    error: string | null;
}

export interface WorkflowStep {
    id: string;
    type: WorkflowStepType;
    status: WorkflowStatus;
    startTime: Date | null;
    endTime: Date | null;
    error: string | null;
    metadata?: Record<string, unknown>;
}

export enum WorkflowStepType {
    TASK = 'TASK',
    CONDITION = 'CONDITION',
    PARALLEL = 'PARALLEL',
    SEQUENCE = 'SEQUENCE'
}

export type WorkflowStatus = 'draft' | 'active' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowTask extends Task {
    workflowId: string;
    position: {
        x: number;
        y: number;
    };
    taskDefinition: TaskDefinition;
    retryPolicy?: {
        maxAttempts: number;
        backoffStrategy: 'fixed' | 'exponential';
        backoffDelay: number;
    };
}

export interface WorkflowEdge {
    id: string;
    workflowId: string;
    sourceTaskId: string;
    targetTaskId: string;
    condition?: {
        type: 'success' | 'failure' | 'always' | 'custom';
        expression?: string;
    };
    metadata?: Record<string, any>;
}

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: WorkflowExecutionStatus;
    startTime: Date;
    endTime?: Date;
    taskExecutions: Record<string, TaskExecution>;
    variables: Record<string, any>;
    error?: string;
    metrics?: {
        duration: number;
        taskSuccessRate: number;
        resourceUsage: {
            cpu: number;
            memory: number;
            tokens: number;
        };
    };
}

export interface TaskExecution {
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    result?: unknown;
    error?: string;
    retryCount: number;
}

export type WorkflowExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    version: string;
    tasks: TaskDefinition[];
    edges: WorkflowEdge[];
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    parameters?: Record<string, any>;
    constraints?: {
        timeout?: number;
        maxConcurrentTasks?: number;
        resources?: {
            minCpu?: number;
            minMemory?: number;
            maxTokens?: number;
        };
    };
    metadata?: Record<string, any>;
}

// Add a Zod validation schema for Workflow
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  status: z.enum(['draft', 'active', 'running', 'completed', 'failed', 'cancelled']),
  tasks: z.array(z.object({
    id: z.string(),
    workflowId: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    taskDefinition: z.any(), // Would be more specific in a real implementation
    retryPolicy: z.object({
      maxAttempts: z.number(),
      backoffStrategy: z.enum(['fixed', 'exponential']),
      backoffDelay: z.number()
    }).optional()
  })),
  edges: z.array(z.object({
    id: z.string(),
    workflowId: z.string(),
    sourceTaskId: z.string(),
    targetTaskId: z.string(),
    condition: z.object({
      type: z.enum(['success', 'failure', 'always', 'custom']),
      expression: z.string().optional()
    }).optional(),
    metadata: z.record(z.any()).optional()
  })),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  createdBy: z.string(),
  createdAt: z.date().or(z.string().transform(str => new Date(str))),
  startedAt: z.date().or(z.string().transform(str => new Date(str))).optional(),
  completedAt: z.date().or(z.string().transform(str => new Date(str))).optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional()
});
