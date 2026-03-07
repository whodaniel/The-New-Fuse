import { A2AMessage, AgentStatus, A2APriority } from '@the-new-fuse/a2a-core';

export { A2AMessage, AgentStatus, A2APriority };

/**
 * Agent coordination channels
 */
export enum CoordinationChannel {
  BROADCAST = 'agent-broadcast',
  DIRECT_MESSAGE = 'agent-direct-message',
  EVENTS = 'agent-events',
  PRESENCE = 'agent-presence',
  TASKS = 'agent-tasks',
  STATE_SYNC = 'agent-state-sync',
}

/**
 * Task status enumeration
 */
export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRY = 'retry',
}

/**
 * Serialization format options
 */
export enum SerializationFormat {
  JSON = 'json',
  MSGPACK = 'msgpack',
}

/**
 * Agent presence state
 */
export interface AgentPresence {
  agentId: string;
  status: AgentStatus;
  lastSeen: number;
  lastHeartbeat: number;
  metadata?: Record<string, any>;
}

/**
 * Agent task definition
 */
export interface AgentTask {
  id: string;
  type: string;
  assignedTo?: string;
  assignedBy: string;
  payload: any;
  priority: A2APriority;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  timeout?: number;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Broadcast message
 */
export interface BroadcastMessage {
  id: string;
  fromAgent: string;
  channel: CoordinationChannel;
  topic?: string;
  payload: any;
  priority: A2APriority;
  timestamp: number;
  ttl?: number;
  metadata?: Record<string, any>;
}

/**
 * Direct message between agents
 */
export interface DirectMessage extends A2AMessage {
  deliveryConfirmation?: boolean;
  readReceipt?: boolean;
}

/**
 * Shared state entry
 */
export interface SharedState {
  key: string;
  value: any;
  version: number;
  ownerId: string;
  lastModified: number;
  ttl?: number;
  locks?: string[];
  metadata?: Record<string, any>;
}

/**
 * State lock
 */
export interface StateLock {
  lockId: string;
  key: string;
  agentId: string;
  acquiredAt: number;
  expiresAt: number;
  renewable: boolean;
}

/**
 * Coordination event
 */
export interface CoordinationEvent {
  type: string;
  agentId: string;
  data: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  name: string;
  concurrency?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

/**
 * Redis coordinator configuration
 */
export interface RedisCoordinatorConfig {
  keyPrefix?: string;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  serializationFormat?: SerializationFormat;
  defaultTaskTimeout?: number;
  maxRetries?: number;
  enableMetrics?: boolean;
  queueConfig?: Partial<QueueConfig>;
}

/**
 * Coordination metrics
 */
export interface CoordinationMetrics {
  messagesPublished: number;
  messagesReceived: number;
  tasksCreated: number;
  tasksCompleted: number;
  tasksFailed: number;
  activeAgents: number;
  totalAgents: number;
  averageTaskDuration: number;
  averageMessageLatency: number;
}

/**
 * Message handler function type
 */
export type MessageHandler = (message: any) => Promise<void> | void;

/**
 * Task processor function type
 */
export type TaskProcessor = (task: AgentTask) => Promise<any>;

/**
 * Event listener function type
 */
export type EventListener = (event: CoordinationEvent) => Promise<void> | void;

/**
 * Retry strategy options
 */
export interface RetryOptions {
  maxRetries: number;
  backoffType: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay?: number;
  multiplier?: number;
}

/**
 * Agent coordination capabilities
 */
export interface CoordinationCapabilities {
  supportsBroadcast: boolean;
  supportsDirectMessaging: boolean;
  supportsTaskDistribution: boolean;
  supportsSharedState: boolean;
  supportsPresenceTracking: boolean;
  maxConcurrentTasks: number;
  supportedSerializationFormats: SerializationFormat[];
}
