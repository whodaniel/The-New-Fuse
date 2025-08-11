/**
 * @fileoverview Workflow system type definitions
 */

import { WorkflowError } from '../utils/errors';

// Workflow Definition Types
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  config: WorkflowStepConfig;
  dependencies: string[];
  conditions?: WorkflowCondition[];
  timeout?: number;
  retryPolicy?: RetryPolicy;
  onSuccess?: WorkflowAction[];
  onFailure?: WorkflowAction[];
}

export enum WorkflowStepType {
  TASK = 'TASK',
  DECISION = 'DECISION',
  PARALLEL = 'PARALLEL',
  LOOP = 'LOOP',
  WAIT = 'WAIT',
  WEBHOOK = 'WEBHOOK',
  SCRIPT = 'SCRIPT',
  HUMAN_INPUT = 'HUMAN_INPUT',
}

export interface WorkflowStepConfig {
  agentType?: string;
  agentId?: string;
  parameters: Record<string, any>;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  resources?: {
    memory?: number;
    cpu?: number;
    timeout?: number;
  };
}

export interface WorkflowCondition {
  type: 'expression' | 'script' | 'value';
  condition: string;
  operator?: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
  value?: any;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  retryOn: string[]; // error codes or types
}

export interface WorkflowAction {
  type: 'notify' | 'log' | 'set_variable' | 'trigger_workflow' | 'stop';
  parameters: Record<string, any>;
}

// Workflow Execution Types
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  variables: Record<string, any>;
  stepExecutions: StepExecution[];
  error?: WorkflowError;
  metadata?: Record<string, any>;
}

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

export interface StepExecution {
  stepId: string;
  status: WorkflowExecutionStatus;
  startTime: Date;
  endTime?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: WorkflowError;
  agentId?: string;
  attempts: number;
  logs: string[];
}

// WorkflowError is now exported from utils/errors as a class

// Workflow Triggers
export interface WorkflowTrigger {
  id: string;
  type: WorkflowTriggerType;
  config: WorkflowTriggerConfig;
  enabled: boolean;
  conditions?: WorkflowCondition[];
}

export enum WorkflowTriggerType {
  MANUAL = 'MANUAL',
  SCHEDULE = 'SCHEDULE',
  EVENT = 'EVENT',
  WEBHOOK = 'WEBHOOK',
  FILE_CHANGE = 'FILE_CHANGE',
  API_CALL = 'API_CALL',
}

export interface WorkflowTriggerConfig {
  schedule?: string; // cron expression
  eventType?: string;
  webhookUrl?: string;
  filePath?: string;
  apiEndpoint?: string;
  parameters?: Record<string, any>;
}

// Workflow Variables
export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  required: boolean;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

// Workflow Statistics
export interface WorkflowStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecution?: Date;
  mostCommonErrors: Array<{
    error: string;
    count: number;
  }>;
  performanceMetrics: {
    throughput: number; // executions per hour
    errorRate: number; // percentage
    averageStepTime: Record<string, number>;
  };
}