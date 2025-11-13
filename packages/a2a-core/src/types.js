import { z } from 'zod';
// A2A Protocol Version
export const A2A_PROTOCOL_VERSION = '1.0.0';
// Agent Status Types
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ONLINE"] = "online";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
// Message Types
export var A2AMessageType;
(function (A2AMessageType) {
    A2AMessageType["TASK_ASSIGNMENT"] = "task_assignment";
    A2AMessageType["STATUS_UPDATE"] = "status_update";
    A2AMessageType["DATA_REQUEST"] = "data_request";
    A2AMessageType["DATA_RESPONSE"] = "data_response";
    A2AMessageType["COLLABORATION_REQUEST"] = "collaboration_request";
    A2AMessageType["WORKFLOW_COORDINATION"] = "workflow_coordination";
    A2AMessageType["RESOURCE_SHARING"] = "resource_sharing";
    A2AMessageType["ERROR_NOTIFICATION"] = "error_notification";
    A2AMessageType["HEARTBEAT"] = "heartbeat";
    A2AMessageType["CAPABILITY_ANNOUNCEMENT"] = "capability_announcement";
})(A2AMessageType || (A2AMessageType = {}));
// Priority Levels
export var A2APriority;
(function (A2APriority) {
    A2APriority[A2APriority["CRITICAL"] = 1] = "CRITICAL";
    A2APriority[A2APriority["HIGH"] = 2] = "HIGH";
    A2APriority[A2APriority["MEDIUM"] = 3] = "MEDIUM";
    A2APriority[A2APriority["LOW"] = 4] = "LOW";
    A2APriority[A2APriority["BATCH"] = 5] = "BATCH";
})(A2APriority || (A2APriority = {}));
export var AgentType;
(function (AgentType) {
    AgentType["COORDINATOR"] = "coordinator";
    AgentType["WORKER"] = "worker";
    AgentType["SPECIALIST"] = "specialist";
    AgentType["MONITOR"] = "monitor";
    AgentType["GATEWAY"] = "gateway";
})(AgentType || (AgentType = {}));
export var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_LOADED"] = "least_loaded";
    LoadBalancingStrategy["FASTEST_RESPONSE"] = "fastest_response";
    LoadBalancingStrategy["CAPABILITY_MATCH"] = "capability_match";
    LoadBalancingStrategy["GEOGRAPHIC"] = "geographic";
})(LoadBalancingStrategy || (LoadBalancingStrategy = {}));
// Agent Capabilities Schema
export const AgentCapabilitySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    version: z.string(),
    parameters: z.record(z.string(), z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional()
});
// Agent Registration Schema
export const AgentRegistrationSchema = z.object({
    agentId: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: z.nativeEnum(AgentType), // Updated to use AgentType enum
    version: z.string(),
    description: z.string().optional(),
    capabilities: z.array(z.string()), // Changed to string array for simplicity
    metadata: z.record(z.string(), z.any()).optional(),
    endpoints: z.object({
        websocket: z.string().url().optional(),
        http: z.string().url().optional(),
        redis: z.string().optional()
    }).optional(),
    authentication: z.object({
        type: z.enum(['none', 'token', 'certificate']),
        credentials: z.record(z.string(), z.string()).optional()
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
    metadata: z.record(z.string(), z.any()).optional(),
});
// Agent Heartbeat Schema
export const AgentHeartbeatSchema = z.object({
    agentId: z.string().uuid(),
    timestamp: z.string().datetime(),
    status: z.nativeEnum(AgentStatus),
    load: z.number().min(0).max(1).optional(), // CPU/resource load 0-1
    activeConnections: z.number().nonnegative().optional(),
    lastActivity: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.any()).optional()
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
    metadata: z.record(z.string(), z.any()).optional()
});
// Error types
export class A2AError extends Error {
    code;
    agentId;
    messageId;
    constructor(message, code, agentId, messageId) {
        super(message);
        this.code = code;
        this.agentId = agentId;
        this.messageId = messageId;
        this.name = 'A2AError';
    }
}
export class A2AValidationError extends A2AError {
    validationErrors;
    constructor(message, validationErrors) {
        super(message, 'VALIDATION_ERROR');
        this.validationErrors = validationErrors;
        this.name = 'A2AValidationError';
    }
}
export class A2ATimeoutError extends A2AError {
    constructor(message, agentId) {
        super(message, 'TIMEOUT_ERROR', agentId);
        this.name = 'A2ATimeoutError';
    }
}
export class A2AConnectionError extends A2AError {
    constructor(message, agentId) {
        super(message, 'CONNECTION_ERROR', agentId);
        this.name = 'A2AConnectionError';
    }
}
//# sourceMappingURL=types.js.map