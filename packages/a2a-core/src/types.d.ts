import { z } from 'zod';
export declare const A2A_PROTOCOL_VERSION = "1.0.0";
export declare enum AgentStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    BUSY = "busy",
    IDLE = "idle",
    ERROR = "error"
}
export declare enum A2AMessageType {
    TASK_ASSIGNMENT = "task_assignment",
    STATUS_UPDATE = "status_update",
    DATA_REQUEST = "data_request",
    DATA_RESPONSE = "data_response",
    COLLABORATION_REQUEST = "collaboration_request",
    WORKFLOW_COORDINATION = "workflow_coordination",
    RESOURCE_SHARING = "resource_sharing",
    ERROR_NOTIFICATION = "error_notification",
    HEARTBEAT = "heartbeat",
    CAPABILITY_ANNOUNCEMENT = "capability_announcement"
}
export declare enum A2APriority {
    CRITICAL = 1,// System critical, emergency responses
    HIGH = 2,// Real-time coordination, urgent tasks
    MEDIUM = 3,// Normal operations, status updates
    LOW = 4,// Background sync, analytics
    BATCH = 5
}
export declare enum AgentType {
    COORDINATOR = "coordinator",
    WORKER = "worker",
    SPECIALIST = "specialist",
    MONITOR = "monitor",
    GATEWAY = "gateway"
}
export declare enum LoadBalancingStrategy {
    ROUND_ROBIN = "round_robin",
    LEAST_LOADED = "least_loaded",
    FASTEST_RESPONSE = "fastest_response",
    CAPABILITY_MATCH = "capability_match",
    GEOGRAPHIC = "geographic"
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
export declare const AgentCapabilitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const AgentRegistrationSchema: z.ZodObject<{
    agentId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<typeof AgentType>;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodArray<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    endpoints: z.ZodOptional<z.ZodObject<{
        websocket: z.ZodOptional<z.ZodString>;
        http: z.ZodOptional<z.ZodString>;
        redis: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    authentication: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<{
            none: "none";
            token: "token";
            certificate: "certificate";
        }>;
        credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    maxConcurrentRequests: z.ZodOptional<z.ZodNumber>;
    averageResponseTime: z.ZodOptional<z.ZodNumber>;
    reliability: z.ZodOptional<z.ZodNumber>;
    lastSeen: z.ZodOptional<z.ZodNumber>;
    isOnline: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const A2AMessageSchema: z.ZodObject<{
    id: z.ZodString;
    protocolVersion: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodNumber;
    fromAgent: z.ZodString;
    toAgent: z.ZodString;
    type: z.ZodEnum<typeof A2AMessageType>;
    payload: z.ZodAny;
    priority: z.ZodEnum<typeof A2APriority>;
    ttl: z.ZodOptional<z.ZodNumber>;
    retryCount: z.ZodOptional<z.ZodNumber>;
    requiresResponse: z.ZodOptional<z.ZodBoolean>;
    conversationId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const AgentHeartbeatSchema: z.ZodObject<{
    agentId: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<typeof AgentStatus>;
    load: z.ZodOptional<z.ZodNumber>;
    activeConnections: z.ZodOptional<z.ZodNumber>;
    lastActivity: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodString;
    participants: z.ZodArray<z.ZodString>;
    initiator: z.ZodString;
    topic: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        active: "active";
        completed: "completed";
        failed: "failed";
        paused: "paused";
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;
export type A2AMessageZod = z.infer<typeof A2AMessageSchema>;
export type AgentHeartbeat = z.infer<typeof AgentHeartbeatSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export interface IA2ACommunicator {
    registerAgent(registration: AgentRegistration): Promise<void>;
    unregisterAgent(agentId: string): Promise<void>;
    updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>;
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
    startConversation(initiator: string, participants: string[], topic?: string): Promise<string>;
    joinConversation(conversationId: string, agentId: string): Promise<void>;
    leaveConversation(conversationId: string, agentId: string): Promise<void>;
    discoverAgents(criteria?: {
        type?: string;
        capabilities?: string[];
        status?: AgentStatus;
    }): Promise<AgentRegistration[]>;
    sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void>;
    getAgentHealth(agentId: string): Promise<AgentHeartbeat | null>;
}
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
export declare class A2AError extends Error {
    code: string;
    agentId?: string | undefined;
    messageId?: string | undefined;
    constructor(message: string, code: string, agentId?: string | undefined, messageId?: string | undefined);
}
export declare class A2AValidationError extends A2AError {
    validationErrors: any;
    constructor(message: string, validationErrors: any);
}
export declare class A2ATimeoutError extends A2AError {
    constructor(message: string, agentId?: string);
}
export declare class A2AConnectionError extends A2AError {
    constructor(message: string, agentId?: string);
}
//# sourceMappingURL=types.d.ts.map