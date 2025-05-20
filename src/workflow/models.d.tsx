export interface WorkflowInstance {
  id: string;
  templateId: string;
  name: string;
  status: string;
  steps: Record<string, any>;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  startTime: Date;
  endTime: Date | null;
  error: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  version: string;
  createdAt: Date;
  createdBy: string;
}
export interface WorkflowContext {
  workflowId: string;
  instanceId: string;
  stepId: string;
  input: Record<string, unknown>;
  state: Record<string, unknown>;
}
export declare const WorkflowStatus: {
  PENDING: string;
  RUNNING: string;
  COMPLETED: string;
  FAILED: string;
  CANCELLED: string;
};
export declare const WorkflowError: {
  VALIDATION: string;
  EXECUTION: string;
  TIMEOUT: string;
  DEPENDENCY: string;
  CANCELLED: string;
};
