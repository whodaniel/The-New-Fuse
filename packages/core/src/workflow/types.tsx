import { WorkflowStatus, WorkflowContext } from '@the-new-fuse/types';
import { Logger } from '../logging.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { SmartAPIGateway } from '../api-management/SmartAPIGateway.js';

export { WorkflowStatus, WorkflowContext };
export enum WorkflowStepType {
  ACCESSIBILITY = 'ACCESSIBILITY',
  I18N = 'I18N',
  DATA_FLOW = 'DATA_FLOW'
}

type WorkflowParameterType = 'security' | 'performance' | 'accessibility' | 'documentation';

interface WorkflowStepParameters {
  type: WorkflowParameterType;
  metrics?: string[];
  rules?: string[];
  format?: string;
  sections?: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  description?: string;
  status: WorkflowStatus;
  startTime: Date | null;
  endTime: Date | null;
  error?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  dependencies?: string[];
  config: {
    standard?: string;
    level?: string;
    locales?: string[];
    defaultLocale?: string;
    flowType?: string;
    mapping?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
  action?: (context: WorkflowContext) => Promise<void>;
  parameters?: Record<string, unknown>;
  parameters: WorkflowStepParameters;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: number;
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  data?: Record<string, any>;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  nodeResults: Map<string, NodeResult>;
  state: Record<string, any>;
  logger: Logger;
  tools: ToolRegistry;
  llm: SmartAPIGateway;
}

export interface NodeHandler {
  execute: (node: WorkflowNode, context: ExecutionContext) => Promise<Record<string, any>>;
}

export interface NodeResult {
  success: boolean;
  outputs?: Record<string, any>;
  error?: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  outputs: Record<string, any>;
  error?: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  success: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  outputs: Record<string, any>;
  error?: string;
  nodeResults: Array<NodeResult & { nodeId: string }>;
}

export interface WorkflowError {
  code: string;
  message: string;
  details?: string;
  stack?: string;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  stepId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: WorkflowStatus;
  error?: WorkflowError;
  metadata?: Record<string, unknown>;
}

export interface WorkflowResult {
  workflowId: string;
  status: WorkflowStatus;
  output: Record<string, unknown>;
  error?: WorkflowError;
  executionTime?: number;
}

export interface WorkflowOutput {
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  startStep: string;
  version: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowInstance extends Omit<WorkflowTemplate, 'steps'> {
  steps: Array<WorkflowStep & {
    status: WorkflowStatus;
    startTime: Date | null;
    endTime: Date | null;
    error: WorkflowError | null;
  }>;
  status: WorkflowStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  startTime: Date;
  endTime: Date | null;
  error: WorkflowError | null;
  metadata: Record<string, unknown>;
}

export interface WorkflowResult {
  id: string;
  status: WorkflowStatus;
  output: Record<string, unknown>;
  error: WorkflowError | null;
  metadata: Record<string, unknown>;
  workflowId: string;
  data: Record<string, unknown>;
}
