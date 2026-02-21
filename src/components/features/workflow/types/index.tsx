import { Node, Edge } from "reactflow";

export type ExecutionState = "idle" | "running" | "completed" | "error";

export interface ExecutionLog {
  nodeId: string;
  timestamp: number;
  message: string;
  level?: "info" | "warning" | "error";
  data?: unknown;
}

export interface ExecutionUpdate {
  nodeId: string;
  state: ExecutionState;
  message: string;
  result?: unknown;
}

export interface NodeCategory {
  id: string;
  label: string;
  nodes: NodeType[];
}

export interface NodeType {
  type: string;
  label: string;
  icon?: React.ComponentType<any>;
  category: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  configSchema: Record<string, FieldDefinition>;
}

export interface PortDefinition {
  id: string;
  label: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
}

export interface FieldDefinition {
  type: "text" | "number" | "select" | "boolean" | "code";
  label: string;
  default?: unknown;
  options?: { label: string; value: unknown }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  created: Date;
  modified: Date;
  tags?: string[];
}

export interface WorkflowData {
  metadata: WorkflowMetadata;
  nodes: Node[];
  edges: Edge[];
  config: Record<string, any>;
}

export interface NodeExecutionContext {
  nodeId: string;
  inputs: Record<string, any>;
  config: Record<string, any>;
  logger: (message: string, level?: string) => void;
}
