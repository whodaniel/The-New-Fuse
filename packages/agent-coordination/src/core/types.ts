/**
 * Core types for the Agent Coordination Framework
 */

export enum TaskPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
  BACKGROUND = 4,
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  PIPELINE = 'pipeline',
  HYBRID = 'hybrid',
}

/**
 * Represents an agent capability
 */
export interface AgentCapability {
  name: string;
  version: string;
  parameters?: Record<string, any>;
}

/**
 * Agent metadata and configuration
 */
export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  capabilities: AgentCapability[];
  status: AgentStatus;
  currentLoad: number;
  maxConcurrentTasks: number;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  lastHeartbeat: Date;
}

/**
 * Task dependency specification
 */
export interface TaskDependency {
  taskId: string;
  type: 'completion' | 'output' | 'conditional';
  condition?: (result: any) => boolean;
}

/**
 * Task definition
 */
export interface Task {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  payload: any;
  requiredCapabilities?: string[];
  dependencies?: TaskDependency[];
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
  assignedAgentId?: string;
  parentTaskId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Task result
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: Error;
  executionTime: number;
  agentId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Task assignment
 */
export interface TaskAssignment {
  taskId: string;
  agentId: string;
  assignedAt: Date;
  expiresAt?: Date;
}

/**
 * Coordination strategy configuration
 */
export interface CoordinationConfig {
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  loadBalancing?: {
    strategy: 'round-robin' | 'least-loaded' | 'capability-based' | 'random';
    considerCapabilities: boolean;
  };
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  totalTasksProcessed: number;
  successRate: number;
  averageExecutionTime: number;
  tasksPerSecond: number;
  activeAgents: number;
  queueDepth: number;
  timestamp: Date;
}

/**
 * Agent pool configuration
 */
export interface AgentPoolConfig {
  minAgents: number;
  maxAgents: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
}
