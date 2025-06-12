import { z } from 'zod';

// A2A Protocol Version
export const A2A_PROTOCOL_VERSION = '1.0.0';

// Agent Status Types
export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  IDLE = 'idle',
  ERROR = 'error'
}

// Message Types
export enum MessageType {
  HANDSHAKE = 'handshake',
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
  BROADCAST = 'broadcast'
}

// Priority Levels
export enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4
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
  type: z.string(),
  version: z.string(),
  description: z.string().optional(),
  capabilities: z.array(AgentCapabilitySchema),
  metadata: z.record(z.any()).optional(),
  endpoints: z.object({
    websocket: z.string().url().optional(),
    http: z.string().url().optional(),
    redis: z.string().optional()
  }).optional(),
  authentication: z.object({
    type: z.enum(['none', 'token', 'certificate']),
    credentials: z.record(z.string()).optional()
  }).optional()
});

// A2A Message Schema
export const A2AMessageSchema = z.object({
  id: z.string().uuid(),
  protocolVersion: z.string().default(A2A_PROTOCOL_VERSION),
  timestamp: z.string().datetime(),
  fromAgent: z.string().uuid(),
  toAgent: z.string().uuid().optional(), // Optional for broadcasts
  type: z.nativeEnum(MessageType),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  conversationId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(), // For request-response correlation
  ttl: z.number().positive().optional(), // Time to live in seconds
  
  // Message content
  payload: z.record(z.any()),
  
  // Routing and delivery
  routing: z.object({
    channel: z.string().optional(),
    topic: z.string().optional(),
    targetCapability: z.string().optional()
  }).optional(),
  
  // Security and validation
  signature: z.string().optional(),
  checksum: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
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
export type A2AMessage = z.infer<typeof A2AMessageSchema>;
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
    priority?: Priority;
    conversationId?: string;
  }): Promise<A2AMessage>;
  broadcast(fromAgent: string, payload: any, options?: {
    channel?: string;
    topic?: string;
    priority?: Priority;
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
