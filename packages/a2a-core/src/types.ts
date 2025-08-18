import { z } from 'zod';

// A2A Protocol Version
export const A2A_PROTOCOL_VERSION = '1.0.0';

// Agent Status Types
export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  IDLE = 'idle',
  ERROR = 'error',
}

// Message Types
export enum A2AMessageType {
  TASK_ASSIGNMENT = 'task_assignment',
  STATUS_UPDATE = 'status_update',
  DATA_REQUEST = 'data_request',
  DATA_RESPONSE = 'data_response',
  COLLABORATION_REQUEST = 'collaboration_request',
  WORKFLOW_COORDINATION = 'workflow_coordination',
  RESOURCE_SHARING = 'resource_sharing',
  ERROR_NOTIFICATION = 'error_notification',
  HEARTBEAT = 'heartbeat',
  CAPABILITY_ANNOUNCEMENT = 'capability_announcement',
}

// Priority Levels
export enum A2APriority {
  CRITICAL = 1,    // System critical, emergency responses
  HIGH = 2,        // Real-time coordination, urgent tasks
  MEDIUM = 3,      // Normal operations, status updates
  LOW = 4,         // Background sync, analytics
  BATCH = 5,       // Bulk operations, data transfers
}

export enum AgentType {
  COORDINATOR = 'coordinator',
  WORKER = 'worker',
  SPECIALIST = 'specialist',
  MONITOR = 'monitor',
  GATEWAY = 'gateway',
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_LOADED = 'least_loaded',
  FASTEST_RESPONSE = 'fastest_response',
  CAPABILITY_MATCH = 'capability_match',
  GEOGRAPHIC = 'geographic',
}

export interface A2AMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: A2AMessageType;
  payload: any;
  priority: A2APriority;
  timestamp: number;
  ttl?: number;
  retryCount?: number;
  requiresResponse?: boolean;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface A2AResponse {
  messageId: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  agentStatus: AgentStatus;
}

export interface AgentCapabilities {
  id: string;
  type: AgentType;
  capabilities: string[];
  maxConcurrentRequests: number;
  averageResponseTime: number;
  reliability: number;
  lastSeen: number;
  isOnline: boolean;
}

export interface RoutingRule {
  messageType: A2AMessageType;
  priority: A2APriority;
  preferredAgents: string[];
  fallbackAgents: string[];
  loadBalancingStrategy: LoadBalancingStrategy;
  timeoutMs: number;
}

// Agent Capabilities Schema
export const AgentCapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  parameters: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

// Agent Registration Schema
export const AgentRegistrationSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AgentType), // Updated to use AgentType enum
  version: z.string(),
  description: z.string().optional(),
  capabilities: z.array(z.string()), // Changed to string array for simplicity
  metadata: z.record(z.any()).optional(),
  endpoints: z.object({
    websocket: z.string().url().optional(),
    http: z.string().url().optional(),
    redis: z.string().optional()
  }).optional(),
  authentication: z.object({
    type: z.enum(['none', 'token', 'certificate']),
    credentials: z.record(z.string()).optional()
  }).optional(),
  maxConcurrentRequests: z.number().optional(), // Added from AgentCapabilities
  averageResponseTime: z.number().optional(), // Added from AgentCapabilities
  reliability: z.number().optional(), // Added from AgentCapabilities
  lastSeen: z.number().optional(), // Added from AgentCapabilities
  isOnline: z.boolean().optional(), // Added from AgentCapabilities
});

// A2A Message Schema
export const A2AMessageSchema = z.object({
  id: z.string(), // Changed from uuid to string as per A2AMessage interface
  protocolVersion: z.string().default(A2A_PROTOCOL_VERSION),
  timestamp: z.number(), // Changed from datetime to number as per A2AMessage interface
  fromAgent: z.string(), // Changed from uuid to string
  toAgent: z.string(), // Changed from uuid to string
  type: z.nativeEnum(A2AMessageType),
  payload: z.any(), // Changed to z.any() as per A2AMessage interface
  priority: z.nativeEnum(A2APriority),
  ttl: z.number().optional(),
  retryCount: z.number().optional(),
  requiresResponse: z.boolean().optional(),
  conversationId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Agent Heartbeat Schema
export const AgentHeartbeatSchema = z.object({
  agentId: z.string().uuid(),
  timestamp: z.string().datetime(),
  status: z.nativeEnum(AgentStatus),
  load: z.number().min(0).max(1).optional(), // CPU/resource load 0-1
  activeConnections: z.number().nonnegative().optional(),
  lastActivity: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

// Conversation Schema
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  participants: z.array(z.string().uuid()).min(2),
  initiator: z.string().uuid(),
  topic: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'failed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.record(z.any()).optional()
});

// Type exports from schemas
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;
export type A2AMessageZod = z.infer<typeof A2AMessageSchema>; // Renamed to avoid conflict
export type AgentHeartbeat = z.infer<typeof AgentHeartbeatSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;

// A2A Communication Interface
export interface IA2ACommunicator {
  // Registration
  registerAgent(registration: AgentRegistration): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>;
  
  // Messaging
  sendMessage(message: A2AMessage): Promise<void>;
  sendRequest(fromAgent: string, toAgent: string, payload: any, options?: {
    timeout?: number;
    priority?: A2APriority;
    conversationId?: string;
  }): Promise<A2AMessage>;
  broadcast(fromAgent: string, payload: any, options?: {
    channel?: string;
    topic?: string;
    priority?: A2APriority;
  }): Promise<void>;
  
  // Conversations
  startConversation(initiator: string, participants: string[], topic?: string): Promise<string>;
  joinConversation(conversationId: string, agentId: string): Promise<void>;
  leaveConversation(conversationId: string, agentId: string): Promise<void>;
  
  // Discovery
  discoverAgents(criteria?: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  }): Promise<AgentRegistration[]>;
  
  // Health
  sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void>;
  getAgentHealth(agentId: string): Promise<AgentHeartbeat | null>;
}

// Event types for A2A communication
export interface A2AEvents {
  'agent:registered': (registration: AgentRegistration) => void;
  'agent:unregistered': (agentId: string) => void;
  'agent:status_changed': (agentId: string, status: AgentStatus) => void;
  'message:received': (message: A2AMessage) => void;
  'conversation:started': (conversation: Conversation) => void;
  'conversation:ended': (conversationId: string) => void;
  'heartbeat:received': (heartbeat: AgentHeartbeat) => void;
  'error': (error: Error) => void;
}

// A2A Configuration
export interface A2AConfig {
  redis: {
    url: string;
    keyPrefix?: string;
    ttl?: number;
  };
  websocket?: {
    port?: number;
    cors?: any;
  };
  security?: {
    enableSignatures?: boolean;
    secretKey?: string;
    enableEncryption?: boolean;
  };
  monitoring?: {
    enableMetrics?: boolean;
    heartbeatInterval?: number;
    connectionTimeout?: number;
  };
}

// Error types
export class A2AError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentId?: string,
    public messageId?: string
  ) {
    super(message);
    this.name = 'A2AError';
  }
}

export class A2AValidationError extends A2AError {
  constructor(message: string, public validationErrors: any) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'A2AValidationError';
  }
}

export class A2ATimeoutError extends A2AError {
  constructor(message: string, agentId?: string) {
    super(message, 'TIMEOUT_ERROR', agentId);
    this.name = 'A2ATimeoutError';
  }
}

export class A2AConnectionError extends A2AError {
  constructor(message: string, agentId?: string) {
    super(message, 'CONNECTION_ERROR', agentId);
    this.name = 'A2AConnectionError';
  }
}