// MASS Framework Types and Interfaces
export interface InstructionComponent {
  roleDefinition: string;
  taskGuidance: string;
  outputFormat?: string;
}

export interface ExemplarComponent {
  input: Record<string, any>;
  output: Record<string, any>;
  explanation?: string;
}

export interface PromptDefinition {
  instruction: InstructionComponent;
  exemplars: ExemplarComponent[];
}

export interface MassOptimizationConfig {
  userId: string;
  validationDatasetId: string;
  optimizationRounds: number;
  llmConfig: {
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  metricWeights?: {
    accuracy?: number;
    latency?: number;
    cost?: number;
  };
}

export interface TopologyOptimizationConfig extends MassOptimizationConfig {
  agentIds: string[];
  maxAgents?: number;
  allowedBlocks?: MassBlockType[];
  searchStrategy?: 'exhaustive' | 'heuristic' | 'mcts';
}

export interface ValidationInputItem {
  input: Record<string, any>;
  expectedOutput: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ValidationDataset {
  id: string;
  name: string;
  description?: string;
  items: ValidationInputItem[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetrics {
  accuracy?: number;
  f1Score?: number;
  precision?: number;
  recall?: number;
  latency?: number;
  tokenUsage?: number;
  cost?: number;
  customMetrics?: Record<string, number>;
}

export interface AgentPromptVersion {
  id: string;
  agentId: string;
  versionNumber: number;
  instruction: string;
  exemplars?: any;
  performanceMetrics?: PerformanceMetrics;
  massStage?: 'block_level' | 'workflow_level';
  createdAt: Date;
}

export interface WorkflowNode {
  id: string;
  agentBlueprintId: string;
  selectedPromptVersionId?: string;
  nodeSpecificConfig?: Record<string, any>;
  type: MassBlockType;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string;
  label?: string;
}

export interface WorkflowTopology {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  performanceMetrics?: PerformanceMetrics;
  massOptimized: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizationJob {
  id: string;
  type: 'block_level' | 'topology' | 'workflow_level';
  targetId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: any;
  results?: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MassBlockType = 
  | 'predictor'
  | 'aggregate' 
  | 'reflect' 
  | 'debate' 
  | 'custom' 
  | 'tool-use';

export interface MassBlockConfig {
  type: MassBlockType;
  parameters: Record<string, any>;
}

export interface AggregateConfig extends MassBlockConfig {
  type: 'aggregate';
  parameters: {
    agentIds: string[];
    aggregationStrategy: 'majority_vote' | 'average' | 'weighted_average' | 'max_confidence';
    parallelExecution: boolean;
  };
}

export interface ReflectConfig extends MassBlockConfig {
  type: 'reflect';
  parameters: {
    predictorAgentId: string;
    reflectorAgentId: string;
    maxRounds: number;
    stopCondition?: string;
  };
}

export interface DebateConfig extends MassBlockConfig {
  type: 'debate';
  parameters: {
    debaterAgentIds: string[];
    debateRounds: number;
    moderatorAgentId?: string;
    votingStrategy: 'majority' | 'weighted' | 'consensus';
  };
}

export interface CustomConfig extends MassBlockConfig {
  type: 'custom';
  parameters: {
    agentId: string;
    customLogic: string;
    inputSchema?: any;
    outputSchema?: any;
  };
}

export interface ToolUseConfig extends MassBlockConfig {
  type: 'tool-use';
  parameters: {
    agentId: string;
    toolName: string;
    toolConfig: Record<string, any>;
    inputMapping?: Record<string, string>;
    outputParsing?: string;
  };
}

// Extended Agent interface with MASS fields
export interface AgentWithMass {
  id: string;
  name: string;
  description?: string;
  type: string;
  systemPrompt?: string;
  capabilities: string[];
  status: string;
  config?: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  massOptimized: boolean;
  parentAgentId?: string;
  optimizationMetrics?: PerformanceMetrics;
  promptVersions?: AgentPromptVersion[];
}

export interface CreateOptimizedAgentDto {
  sourceAgentId: string;
  optimizationConfig: MassOptimizationConfig;
  name?: string;
}

export interface CreateTopologyDto {
  name: string;
  description?: string;
  agentIds: string[];
  initialStructure?: 'linear' | 'parallel' | 'hierarchical' | 'custom';
}

export interface OptimizeTopologyDto {
  topologyId?: string;
  agentIds: string[];
  config: TopologyOptimizationConfig;
}
