import { Task, TaskDefinition } from './task';
import { z } from 'zod';
export interface WorkflowInstance extends Omit<Workflow, 'tasks' | 'edges'> {
  currentStep?: string;
  executionLog: string[];
}

export enum WorkflowNodeType {
  TASK = 'TASK',
  CONDITION = 'CONDITION',
  PARALLEL = 'PARALLEL',
  SEQUENCE = 'SEQUENCE',
}

export type WorkflowStatus = 'draft' | 'active' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowRetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential';
  backoffDelayMs: number;
}

export interface WorkflowStepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  output?: any;
  error?: string;
  retryCount: number;
}

export type WorkflowExecutionStatus = 'running' | 'completed' | 'failed' | 'pending' | 'cancelled';

export const WorkflowSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  definition: z.record(z.any()),
  version: z.string().default('1.0.0'),
  isEnabled: z.boolean().default(true),
  status: z.enum(['draft', 'active', 'running', 'completed', 'failed', 'cancelled']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  lastExecutedAt: z.date().optional().nullable(),
  agentId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

export const WorkflowRetryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).default(0),
  backoffStrategy: z.enum(['fixed', 'exponential']).default('fixed'),
  backoffDelayMs: z.number().int().min(0).default(1000),
});

export const WorkflowStepExecutionSchema = z.object({
  stepId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startTime: z.date(),
  endTime: z.date().optional(),
  output: z.any().optional(),
  error: z.string().optional(),
  retryCount: z.number().int().min(0).default(0),
});
