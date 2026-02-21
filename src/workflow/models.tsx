// filepath: src/workflow/models.ts
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

export const WorkflowStatus = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

export const WorkflowError = {
  VALIDATION: "VALIDATION",
  EXECUTION: "EXECUTION",
  TIMEOUT: "TIMEOUT",
  DEPENDENCY: "DEPENDENCY",
  CANCELLED: "CANCELLED",
};
