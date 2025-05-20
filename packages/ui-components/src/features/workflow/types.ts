// Workflow types for UI components

/**
 * Workflow Step Type
 */
export type WorkflowStepType = 'action' | 'condition' | 'trigger' | 'wait';

/**
 * Workflow Status
 */
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

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
  startTime?: string;
  endTime?: string;
  duration?: number;
  stepMetrics: Record<string, {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    attempts: number;
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