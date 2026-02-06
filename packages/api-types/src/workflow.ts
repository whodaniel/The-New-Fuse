/**
 * Workflow-related type definitions
 */
import { ISODateTime, UUID } from './common';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  PENDING = 'pending',
  IDLE = 'idle',
}

export enum WorkflowStepType {
  ACTION = 'action',
  CONDITION = 'condition',
  TRIGGER = 'trigger',
  WAIT = 'wait',
  SUB_WORKFLOW = 'sub-workflow',
  AGENT_TASK = 'agent_task',
  API_CALL = 'api_call',
  HUMAN_INPUT = 'human_input',
  TRANSFORMATION = 'transformation',
  LOOP = 'loop',
}

export interface WorkflowCondition {
  nextStepId: string;
  expression: string;
}

export interface WorkflowStepDefinition {
  id: string;
  workflowId?: string; // Added from api-core
  name: string;
  type: WorkflowStepType;
  action?: string; // Added from ui-components
  parameters?: Record<string, any>; // Added from ui-components
  dependencies?: string[]; // IDs of steps this step depends on
  conditions?: WorkflowCondition[]; // Conditions for branching logic
  next?: WorkflowStepDefinition; // For runtime execution tracking
  branches?: Array<{ condition: string; nextStep: WorkflowStepDefinition }>;
  description?: string; // Added from api-core
  config?: Record<string, any>; // Added from api-core
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'; // Added from ui-components
  error?: string; // Added from ui-components
  metadata?: Record<string, any>; // Added from api-core
  startTime?: ISODateTime; // Added from ui-components
  endTime?: ISODateTime; // Added from ui-components
  position?: { x: number; y: number }; // Added from api-core
  connections?: Array<{
    stepId: string;
    inputName?: string;
    outputName?: string;
  }>; // Added from api-core
  order?: number; // Added from api-core
  result?: Record<string, unknown>; // Added from api-core
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
  triggerType?: 'manual' | 'scheduled' | 'event'; // Made optional
  triggerConfig?: Record<string, any>;
  steps: Record<string, WorkflowStepDefinition>; // Changed to Record for consistency
  firstStepId?: string; // Made optional
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  metadata?: Record<string, any>;
  userId?: UUID; // Made optional
  deletedAt?: ISODateTime | null; // Added from api-core
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface WorkflowExecutionModel {
  id: UUID;
  workflowId: UUID;
  status: 'running' | 'completed' | 'failed';
  startedAt: ISODateTime; // Changed to ISODateTime
  completedAt?: ISODateTime | null; // Changed to ISODateTime
  input?: Record<string, any>; // Made optional
  result?: Record<string, any>;
  stepResults: Record<string, unknown>;
  currentStepId?: string;
  error?: string;
  deletedAt?: ISODateTime | null; // Added from api-core
  metrics?: WorkflowMetrics; // Added from ui-components
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
  stepMetrics: Record<
    string,
    {
      id: string;
      status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
      attempts: number;
      startTime?: number;
      endTime?: number;
      duration?: number;
      type?: string;
    }
  >;
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
