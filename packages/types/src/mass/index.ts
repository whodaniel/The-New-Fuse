export interface MassOptimizationConfig {
  agentId: string;
  optimizationType: 'prompt' | 'workflow' | 'topology';
  targetMetrics: string[];
  validationDataset?: ValidationDataset;
  constraints?: Record<string, any>;
  maxIterations?: number;
  timeout?: number;
}

export interface TopologyOptimizationConfig {
  workflowId: string;
  topology: WorkflowTopology;
  optimizationGoals: string[];
  constraints?: Record<string, any>;
  maxIterations?: number;
}

export interface ValidationDataset {
  id: string;
  name: string;
  data: any[];
  expectedOutputs: any[];
  metrics: string[];
}

export interface PerformanceMetrics {
  accuracy: number;
  latency: number;
  cost: number;
  reliability: number;
  userSatisfaction: number;
}

export interface PromptDefinition {
  id: string;
  name: string;
  template: string;
  variables: string[];
  version: number;
}

export interface AgentPromptVersion {
  id: string;
  agentId: string;
  promptId: string;
  version: number;
  content: string;
  performance: PerformanceMetrics;
  status: 'draft' | 'testing' | 'optimized' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizationJob {
  id: string;
  type: 'block_level' | 'topology_level' | 'workflow_level';
  agentId?: string;
  workflowId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: MassOptimizationConfig | TopologyOptimizationConfig;
  results?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTopology {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

export enum MassBlockType {
  AGGREGATE = 'aggregate',
  REFLECT = 'reflect',
  DEBATE = 'debate',
  CUSTOM = 'custom',
  TOOL_USE = 'tool-use'
}

export interface MassBlockExecution {
  id: string;
  agentId: string;
  blockType: MassBlockType;
  input: any;
  output: any;
  metrics: PerformanceMetrics;
  timestamp: Date;
}