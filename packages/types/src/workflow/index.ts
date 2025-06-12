export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  context?: WorkflowContext; // Add optional context
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  parameters: WorkflowParameters; // Use proper type instead of Record<string, any>
  next?: string;
  _unused?: never; // Type-safe way to handle unused variables
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
}

export interface WorkflowOutput {
  stepId: string;
  result: Record<string, unknown>;
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED'
}

export enum WorkflowStepType {
  TASK = 'TASK',
  CONDITION = 'CONDITION',
}

export interface WorkflowParameters {
  readonly [key: string]: string | number | boolean | null | undefined;
}

export interface WorkflowError {
  message: string;
  code: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowContext {
  readonly [key: string]: unknown;
}
