/**
 * @fileoverview Agent-related type definitions
 */

// Agent Status and Lifecycle
export enum AgentStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE',
  INITIALIZING = 'INITIALIZING',
  TERMINATING = 'TERMINATING',
}

export enum AgentType {
  WORKER = 'WORKER',
  COORDINATOR = 'COORDINATOR',
  SPECIALIST = 'SPECIALIST',
  MONITOR = 'MONITOR',
}

// Agent Configuration
export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  maxConcurrentTasks: number;
  timeout: number;
  retryAttempts: number;
  resources: AgentResources;
  metadata?: Record<string, any>;
}

export interface AgentResources {
  memory: number; // MB
  cpu: number; // percentage
  storage: number; // MB
  networkBandwidth?: number; // Mbps
}

// Agent Runtime Information
export interface Agent {
  id: string;
  name: string;
  config: ExtendedAgentConfig;
  status: AgentStatus;
  capabilities: string[];
  currentTasks: string[];
  completedTasks: number;
  failedTasks: number;
  uptime: number;
  lastHeartbeat: Date;
  performance: AgentPerformance;
  createdAt: Date;
  updatedAt: Date;
  tasks: AgentTask[];
}

export interface AgentPerformance {
  averageTaskTime: number;
  successRate: number;
  resourceUtilization: {
    memory: number;
    cpu: number;
    storage: number;
  };
  throughput: number; // tasks per hour
}

// Agent Communication
export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string; // undefined for broadcast
  type: AgentMessageType;
  payload: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requiresResponse?: boolean;
  correlationId?: string;
}

export enum AgentMessageType {
  TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
  TASK_RESULT = 'TASK_RESULT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  HEARTBEAT = 'HEARTBEAT',
  ERROR_REPORT = 'ERROR_REPORT',
  RESOURCE_REQUEST = 'RESOURCE_REQUEST',
  COORDINATION = 'COORDINATION',
  BROADCAST = 'BROADCAST',
}

// Agent Execution Context
export interface AgentExecutionContext {
  agentId: string;
  taskId: string;
  workflowId?: string;
  startTime: Date;
  timeout: number;
  resources: AgentResources;
  environment: Record<string, any>;
  dependencies: string[];
}

// Agent Registry
export interface AgentRegistration {
  agent: Agent;
  registeredAt: Date;
  lastSeen: Date;
  endpoint?: string;
  healthCheckUrl?: string;
}

// Swarm Orchestration
export interface SwarmExecution {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  tasks: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  results: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SwarmCoordinationStrategy {
  type: 'sequential' | 'parallel' | 'pipeline' | 'hierarchical';
  parameters: Record<string, any>;
  failureHandling: 'abort' | 'continue' | 'retry';
  resourceAllocation: 'balanced' | 'priority' | 'custom';
}

// Additional types for AgentProcessor compatibility
export interface ExtendedAgentConfig extends AgentConfig {
  llmConfig?: Record<string, any>;
}

export interface AgentState {
  status: 'idle' | 'busy' | 'error' | 'offline';
  lastUpdated: Date;
  currentTask?: string;
}

export interface AgentTask {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: string;
  payload?: any;
  createdAt: Date;
  updatedAt: Date;
}

