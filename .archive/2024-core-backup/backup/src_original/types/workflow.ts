import { Task, TaskDefinition } from './task';
import { z } from 'zod';
export interface WorkflowInstance extends Omit<Workflow, 'tasks' | 'edges'
    TASK = 'TASK'';
    CONDITION = 'CONDITION'';
    PARALLEL = 'PARALLEL'';
    SEQUENCE = 'SEQUENCE'';
export type WorkflowStatus = 'draft' | 'active' | 'running' | 'completed' | 'failed' | 'cancelled';
        backoffStrategy: 'fixed' | 'exponential'
        type: 'success' | 'failure' | 'always' | 'custom'
    status: 'pending' | 'running' | 'completed' | 'failed'
export type WorkflowExecutionStatus = 'running' | 'completed' | 'failed' | ';
  status: z.enum(['draft', 'active', 'running', 'completed', 'failed', '
      backoffStrategy: z.enum(['fixed', 'exponential'
      type: z.enum(['success', 'failure', 'always', '