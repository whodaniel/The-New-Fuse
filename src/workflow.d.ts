/**
 * Workflow-related type definitions
 */

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  results: Record<string, unknown>;
  error?: string;
}
