// Workflow types for UI components

/**
 * Workflow Step Type
 */
export type WorkflowStepType = 'action' | 'condition' | 'trigger' | 'wait' | 'sub-workflow';

/**
 * Workflow Status
 */
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  DRAFT = 'draft',
  ACTIVE = 'active',
  IDLE = 'idle',
}

/**
 * Workflow Condition
 */
export interface WorkflowCondition {
  nextStepId: string;
  expression: string;
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  action: string;
  parameters: Record<string, any>;
  dependencies?: string[]; // IDs of steps this step depends on
  conditions?: WorkflowCondition[]; // Conditions for branching logic
  next?: WorkflowStep; // For runtime execution tracking
  branches?: Array<{ condition: string; nextStep: WorkflowStep }>;
  description?: string;
  config?: Record<string, any>;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: string;
  metadata?: Record<string, any>;
  startTime?: string;
  endTime?: string;
}

/**
 * Workflow Definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

/**
 * Workflow Execution Metrics
 */
export interface WorkflowMetrics {
  startTime?: number;
  endTime?: number;
  duration?: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  stepMetrics: Record<string, {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    attempts: number;
    startTime?: number;
    endTime?: number;
    duration?: number;
    type?: string;
  }>;
}

/**
 * Workflow Error
 */
export interface WorkflowError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Workflow Execution
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startTime: string;
  endTime?: string;
  metrics?: WorkflowMetrics;
  currentStepId?: string;
  error?: WorkflowError;
}

/**
 * Additional types for compatibility with core package
 */
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
  startTime: string;
  endTime?: string;
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
  type?: string;}

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

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
}