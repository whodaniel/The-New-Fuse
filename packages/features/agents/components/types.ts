export type AgentStatus = 'active' | 'inactive' | 'error' | 'idle' | 'offline';

export type AgentType = 'chat' | 'task' | 'code' | 'data-analysis' | 'custom';

export interface AgentCapabilities {
  conversation?: boolean;
  taskExecution?: boolean;
  codeGeneration?: boolean;
  dataAnalysis?: boolean;
  learning?: boolean;
  [key: string]: boolean | undefined;
}

export interface AgentConfiguration {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  stopSequences?: string[];
  customInstructions?: string;
  [key: string]: unknown;
}

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface AgentMetrics {
  totalCalls: number;
  successRate: number;
  averageResponseTime: number;
  completedTasks: number;
  failedTasks: number;
  totalTasks: number;
  lastActive: string;
  resourceUsage: {
    cpu: number;
    memory: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  status: AgentStatus;
  type: AgentType;
  capabilities: string[];
  configuration: AgentConfiguration;
  personality?: PersonalityTraits;
  customInstructions?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  metrics?: AgentMetrics;
}

export interface AgentFilters {
  status?: AgentStatus;
  capability?: string;
  model?: string;
  performance?: number;
  search?: string;
}

export interface AgentLog {
  id: string;
  agentId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
}

export interface AgentConfig {
  name: string;
  type: AgentType;
  settings: {
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
  capabilities?: string[];
  customInstructions?: string;
}
