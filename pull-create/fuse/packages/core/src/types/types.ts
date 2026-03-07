export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(parameters: any): Promise<any>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolExecutionResult {
  id: string;
  toolId: string;
  parameters: any;
  result?: any;
  error?: Error;
  timestamp: Date;
  success: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  STOPPED = 'STOPPED',
}

export enum WorkflowStepType {
  API_CALL = 'API_CALL',
  DATA_TRANSFORM = 'DATA_TRANSFORM',
  CONDITION = 'CONDITION',
  LOOP = 'LOOP',
  AGENT = 'AGENT',
  TASK = 'TASK',
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  config: any;
  dependencies?: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  templateId: string;
  templateVersion: string;
  status: WorkflowStatus;
  context: any;
  steps: Record<string, WorkflowStepExecution>;
  startedAt: string;
  completedAt?: string;
  createdBy?: string;
}

export interface WorkflowStepExecution {
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  attempts: number;
  output?: any;
  error?: string;
}

export interface WorkflowExecutionContext {
  template: WorkflowTemplate;
  execution: WorkflowExecution;
  variables: Record<string, any>;
  globalContext: any;
}