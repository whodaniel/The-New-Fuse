export enum WorkflowExecutionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  stepResults: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  type: string;
  config: any;
  position: { x: number; y: number };
  connections: any[];
  createdAt: Date;
  updatedAt: Date;
}
