"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AConnectionError = exports.A2ATimeoutError = exports.A2AValidationError = exports.A2AError = exports.ConversationSchema = exports.AgentHeartbeatSchema = exports.A2AMessageSchema = exports.AgentRegistrationSchema = exports.AgentCapabilitySchema = exports.Priority = exports.MessageType = exports.AgentStatus = exports.A2A_PROTOCOL_VERSION = void 0;
const zod_1 = require("zod");
// A2A Protocol Version
exports.A2A_PROTOCOL_VERSION = '1.0.0';
// Agent Status Types
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ONLINE"] = "online";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
// Message Types
var MessageType;
(function (MessageType) {
    MessageType["HANDSHAKE"] = "handshake";
    MessageType["REQUEST"] = "request";
    MessageType["RESPONSE"] = "response";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["ERROR"] = "error";
    MessageType["BROADCAST"] = "broadcast";
})(MessageType || (exports.MessageType = MessageType = {}));
// Priority Levels
var Priority;
(function (Priority) {
    Priority[Priority["LOW"] = 1] = "LOW";
    Priority[Priority["MEDIUM"] = 2] = "MEDIUM";
    Priority[Priority["HIGH"] = 3] = "HIGH";
    Priority[Priority["URGENT"] = 4] = "URGENT";
})(Priority || (exports.Priority = Priority = {}));
// Agent Capabilities Schema
exports.AgentCapabilitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    version: zod_1.z.string(),
    parameters: zod_1.z.record(zod_1.z.any()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Agent Registration Schema
exports.AgentRegistrationSchema = zod_1.z.object({
    agentId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    type: zod_1.z.string(),
    version: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    capabilities: zod_1.z.array(exports.AgentCapabilitySchema),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    endpoints: zod_1.z.object({
        websocket: zod_1.z.string().url().optional(),
        http: zod_1.z.string().url().optional(),
        redis: zod_1.z.string().optional()
    }).optional(),
    authentication: zod_1.z.object({
        type: zod_1.z.enum(['none', 'token', 'certificate']),
        credentials: zod_1.z.record(zod_1.z.string()).optional()
    }).optional()
});
// A2A Message Schema
exports.A2AMessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    protocolVersion: zod_1.z.string().default(exports.A2A_PROTOCOL_VERSION),
    timestamp: zod_1.z.string().datetime(),
    fromAgent: zod_1.z.string().uuid(),
    toAgent: zod_1.z.string().uuid().optional(), // Optional for broadcasts
    type: zod_1.z.nativeEnum(MessageType),
    priority: zod_1.z.nativeEnum(Priority).default(Priority.MEDIUM),
    conversationId: zod_1.z.string().uuid().optional(),
    requestId: zod_1.z.string().uuid().optional(), // For request-response correlation
    ttl: zod_1.z.number().positive().optional(), // Time to live in seconds
    // Message content
    payload: zod_1.z.record(zod_1.z.any()),
    // Routing and delivery
    routing: zod_1.z.object({
        channel: zod_1.z.string().optional(),
        topic: zod_1.z.string().optional(),
        targetCapability: zod_1.z.string().optional()
    }).optional(),
    // Security and validation
    signature: zod_1.z.string().optional(),
    checksum: zod_1.z.string().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Agent Heartbeat Schema
exports.AgentHeartbeatSchema = zod_1.z.object({
    agentId: zod_1.z.string().uuid(),
    timestamp: zod_1.z.string().datetime(),
    status: zod_1.z.nativeEnum(AgentStatus),
    load: zod_1.z.number().min(0).max(1).optional(), // CPU/resource load 0-1
    activeConnections: zod_1.z.number().nonnegative().optional(),
    lastActivity: zod_1.z.string().datetime().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Conversation Schema
exports.ConversationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    participants: zod_1.z.array(zod_1.z.string().uuid()).min(2),
    initiator: zod_1.z.string().uuid(),
    topic: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'paused', 'completed', 'failed']),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Error types
class A2AError extends Error {
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
exports.A2AError = A2AError;
class A2AValidationError extends A2AError {
    validationErrors;
    constructor(message, validationErrors) {
        super(message, 'VALIDATION_ERROR');
        this.validationErrors = validationErrors;
        this.name = 'A2AValidationError';
    }
}
exports.A2AValidationError = A2AValidationError;
class A2ATimeoutError extends A2AError {
    constructor(message, agentId) {
        super(message, 'TIMEOUT_ERROR', agentId);
        this.name = 'A2ATimeoutError';
    }
}
exports.A2ATimeoutError = A2ATimeoutError;
class A2AConnectionError extends A2AError {
    constructor(message, agentId) {
        super(message, 'CONNECTION_ERROR', agentId);
        this.name = 'A2AConnectionError';
    }
}
exports.A2AConnectionError = A2AConnectionError;
