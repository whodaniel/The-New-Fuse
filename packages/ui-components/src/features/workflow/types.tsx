// Basic workflow types
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  action: string;
  params?: Record<string, any>;
  dependencies: string[];
  conditions: WorkflowCondition[];
  status?: WorkflowStatus;
  result?: any;
  error?: WorkflowError;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCondition {
  condition: string;
  nextStepId: string;
}

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

export interface WorkflowState {
  status: WorkflowStatus;
  currentStepId?: string;
  completedSteps: string[];
  failedSteps: string[];
  results: Record<string, any>;
  errors: Record<string, WorkflowError>;
  startTime?: number;
  endTime?: number;
}

export interface WorkflowContext {
  state: WorkflowState;
  definition: WorkflowDefinition;
  variables: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: WorkflowError;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: WorkflowStatus;
  results: Record<string, any>;
  errors: Record<string, WorkflowError>;
  metrics: WorkflowMetrics;
}

export interface WorkflowError {
  stepId: string;
  message: string;
  code: string;
  details?: any;
  timestamp: number;
}

export interface WorkflowMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  runningSteps: number;
  pendingSteps: number;
  totalDuration: number;
  stepMetrics: StepMetrics[];
}

export interface StepMetrics {
  stepId: string;
  status: WorkflowStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  retries: number;
}

export interface MonitoringEvent {
  type: string;
  stepId: string;
  timestamp: number;
  data: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  stepId?: string;
  message: string;
  code: string;
}

export interface Workflow {
  id: string;
  definition: WorkflowDefinition;
  state: WorkflowState;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  state: WorkflowState;
  startTime: number;
  endTime?: number;
  createdAt: string;
  updatedAt: string;
}
