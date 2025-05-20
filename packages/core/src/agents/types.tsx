export interface AgentWorkflow {
    id: string;
    name: string;
    description?: string;
    tasks: WorkflowTask[];
    metadata: WorkflowMetadata;
    configuration: WorkflowConfiguration;
}

export interface WorkflowTask {
    id: string;
    type: TaskType;
    name: string;
    description?: string;
    dependencies: string[];
    configuration: TaskConfiguration;
    timeout?: number;
    retryPolicy?: RetryPolicy;
}

export interface WorkflowState {
    workflow: AgentWorkflow;
    status: WorkflowStatus;
    startTime: number;
    endTime?: number;
    completedTasks: number;
    errors?: WorkflowError[];
}

export interface TaskConfiguration {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    requirements: TaskRequirements;
    constraints?: TaskConstraints;
}

export interface WorkflowMetadata {
    version: string;
    creator: string;
    createdAt: number;
    tags?: string[];
    priority: low' | 'medium' | 'high';
}

export interface WorkflowConfiguration {
    maxConcurrentTasks: number;
    timeout: number;
    retryPolicy: RetryPolicy;
    notificationConfig?: NotificationConfig;
}

export interface RetryPolicy {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
}

export interface TaskRequirements {
    memory?: number;
    cpu?: number;
    gpu?: boolean;
    capabilities: string[];
}

export interface TaskConstraints {
    timeout?: number;
    maxRetries?: number;
    dependencies?: string[];
}

export interface WorkflowError {
    taskId?: string;
    errorCode: string;
    message: string;
    timestamp: number;
    context?: Record<string, unknown>;
}

export type WorkflowStatus = 
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'paused'
    | 'cancelled';

export type TaskType =
    | 'data_processing'
    | 'ml_inference'
    | 'api_call'
    | 'notification'
    | 'validation'
    | 'transformation';

export interface NotificationConfig {
    endpoints: string[];
    events: ('start' | 'complete' | 'fail' | 'pause')[];
    format: json' | 'plain';
}

export enum AgentRole {
  PLANNER = 'planner',
  EXECUTOR = 'executor',
  RESEARCHER = 'researcher',
  CRITIC = 'critic',
  WRITER = 'writer',
  CODER = 'coder'
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  capabilities: string[];
  model: string;
  provider: string;
  systemPrompt: string;
  executeTask: (task: Task, memory: Memory) => Promise<ExecutionResult>;
  receiveMessage: (message: AgentCommunication, sender: Agent) => Promise<any>;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority?: number;
  requiredCapabilities?: string[];
  preferredRole?: AgentRole;
  assignedAgentId?: string;
  result?: ExecutionResult;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  executionTime: number;
  error?: Error;
  artifacts?: any[];
}

export interface MemoryItem {
  id: string;
  agentId: string;
  taskId?: string;
  targetAgentId?: string;
  timestamp: string;
  content: string;
  type?: 'thought' | 'action' | 'observation' | 'communication';
  metadata?: Record<string, any>;
}

export interface AgentCommunication {
  content: string;
  type: 'question' | 'answer' | 'suggestion' | 'instruction' | 'feedback';
  metadata?: Record<string, any>;
}

export interface Memory {
  store: (item: MemoryItem) => Promise<void>;
  retrieve: (filter: Partial<MemoryItem>, limit?: number) => Promise<MemoryItem[]>;
  clear: (agentId?: string, taskId?: string) => Promise<void>;
}

export interface AgentFactory {
  createAgent: (config: Partial<Agent>) => Agent;
}