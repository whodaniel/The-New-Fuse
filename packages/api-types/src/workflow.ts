/**
 * Workflow-related type definitions
 */
import { UUID, ISODateTime } from './common.js';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum WorkflowStepType {
  AGENT_TASK = 'agent_task',
  API_CALL = 'api_call',
  CONDITION = 'condition',
  HUMAN_INPUT = 'human_input',
  TRANSFORMATION = 'transformation',
  LOOP = 'loop',
  WAIT = 'wait'
}

export interface WorkflowStepDefinition {
  id: string;
  name: string;
  type: WorkflowStepType;
  description?: string;
  config: Record<string, any>;
  next?: string | { [condition: string]: string };
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
  triggerType: 'manual' | 'scheduled' | 'event';
  triggerConfig?: Record<string, any>;
  steps: Record<string, WorkflowStepDefinition>;
  firstStepId: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  metadata?: Record<string, any>;
  userId: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface WorkflowExecutionModel {
  id: UUID;
  workflowId: UUID;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date | null;
  input: Record<string, any>;
  result?: Record<string, any>;
  stepResults: Record<string, unknown>;
  currentStepId?: string;
  error?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  triggerType: 'manual' | 'scheduled' | 'event';
  triggerConfig?: Record<string, any>;
  steps: Record<string, WorkflowStepDefinition>;
  firstStepId: string;
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