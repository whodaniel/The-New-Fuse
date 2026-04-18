"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AConnectionError = exports.A2ATimeoutError = exports.A2AValidationError = exports.A2AError = exports.ConversationSchema = exports.AgentHeartbeatSchema = exports.A2AMessageSchema = exports.AgentRegistrationSchema = exports.AgentCapabilitySchema = exports.LoadBalancingStrategy = exports.AgentType = exports.A2APriority = exports.A2AMessageType = exports.AgentStatus = exports.MessageSendParamsSchema = exports.AgentCardSchema = exports.TaskSchema = exports.ArtifactSchema = exports.TaskStatusSchema = exports.MessageSchema = exports.PartSchema = exports.DataPartSchema = exports.FilePartSchema = exports.TextPartSchema = exports.TaskStateSchema = exports.ProtoA2ATaskNotFoundError = exports.ProtoA2AAuthorizationError = exports.ProtoA2AAuthenticationError = exports.ProtoA2ATimeoutError = exports.ProtoA2AValidationError = exports.ProtoA2AError = exports.A2AErrorCode = exports.TaskState = exports.TransportProtocol = exports.A2A_PROTOCOL_VERSION = void 0;
const zod_1 = require("zod");
/**
 * Agent2Agent (A2A) Protocol v0.3.0 Types
 *
 * This file defines the TypeScript types and Zod schemas for the A2A protocol v0.3.0 specification.
 * Based on: https://github.com/a2aproject/A2A v0.3.0
 */
// ============================================================================
// Protocol Version
// ============================================================================
exports.A2A_PROTOCOL_VERSION = '0.3.0';
// ============================================================================
// Transport Protocols
// ============================================================================
/**
 * Supported A2A transport protocols.
 */
var TransportProtocol;
(function (TransportProtocol) {
    TransportProtocol["JSONRPC"] = "JSONRPC";
    TransportProtocol["GRPC"] = "GRPC";
    TransportProtocol["HTTP_JSON"] = "HTTP+JSON";
})(TransportProtocol || (exports.TransportProtocol = TransportProtocol = {}));
// ============================================================================
// Task Lifecycle and States
// ============================================================================
/**
 * Defines the lifecycle states of a Task.
 */
var TaskState;
(function (TaskState) {
    TaskState["Submitted"] = "submitted";
    TaskState["Working"] = "working";
    TaskState["InputRequired"] = "input-required";
    TaskState["Completed"] = "completed";
    TaskState["Canceled"] = "canceled";
    TaskState["Failed"] = "failed";
    TaskState["Rejected"] = "rejected";
    TaskState["AuthRequired"] = "auth-required";
    TaskState["Unknown"] = "unknown";
})(TaskState || (exports.TaskState = TaskState = {}));
// ============================================================================
// Error Handling (A2A v0.3.0)
// ============================================================================
/**
 * A2A Error Codes based on JSON-RPC 2.0 and A2A extensions
 */
var A2AErrorCode;
(function (A2AErrorCode) {
    // JSON-RPC 2.0 Standard Errors
    A2AErrorCode[A2AErrorCode["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    A2AErrorCode[A2AErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    A2AErrorCode[A2AErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    A2AErrorCode[A2AErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    A2AErrorCode[A2AErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    // A2A-Specific Errors (using -32000 to -32099 range)
    A2AErrorCode[A2AErrorCode["TASK_NOT_FOUND"] = -32001] = "TASK_NOT_FOUND";
    A2AErrorCode[A2AErrorCode["TASK_ALREADY_CANCELED"] = -32002] = "TASK_ALREADY_CANCELED";
    A2AErrorCode[A2AErrorCode["TASK_NOT_CANCELABLE"] = -32003] = "TASK_NOT_CANCELABLE";
    A2AErrorCode[A2AErrorCode["AUTHENTICATION_REQUIRED"] = -32004] = "AUTHENTICATION_REQUIRED";
    A2AErrorCode[A2AErrorCode["AUTHORIZATION_FAILED"] = -32005] = "AUTHORIZATION_FAILED";
    A2AErrorCode[A2AErrorCode["RATE_LIMIT_EXCEEDED"] = -32006] = "RATE_LIMIT_EXCEEDED";
    A2AErrorCode[A2AErrorCode["RESOURCE_EXHAUSTED"] = -32007] = "RESOURCE_EXHAUSTED";
    A2AErrorCode[A2AErrorCode["INVALID_TASK_STATE"] = -32008] = "INVALID_TASK_STATE";
    A2AErrorCode[A2AErrorCode["PUSH_NOTIFICATION_CONFIG_NOT_FOUND"] = -32009] = "PUSH_NOTIFICATION_CONFIG_NOT_FOUND";
    A2AErrorCode[A2AErrorCode["UNSUPPORTED_OPERATION"] = -32010] = "UNSUPPORTED_OPERATION";
    A2AErrorCode[A2AErrorCode["AGENT_UNAVAILABLE"] = -32011] = "AGENT_UNAVAILABLE";
    A2AErrorCode[A2AErrorCode["TIMEOUT"] = -32012] = "TIMEOUT";
})(A2AErrorCode || (exports.A2AErrorCode = A2AErrorCode = {}));
/**
 * Base A2A Error class
 */
class ProtoA2AError extends Error {
    constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = 'ProtoA2AError';
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            data: this.data,
        };
    }
}
exports.ProtoA2AError = ProtoA2AError;
class ProtoA2AValidationError extends ProtoA2AError {
    constructor(message, validationErrors) {
        super(message, A2AErrorCode.INVALID_PARAMS, validationErrors);
        this.validationErrors = validationErrors;
        this.name = 'ProtoA2AValidationError';
    }
}
exports.ProtoA2AValidationError = ProtoA2AValidationError;
class ProtoA2ATimeoutError extends ProtoA2AError {
    constructor(message, data) {
        super(message, A2AErrorCode.TIMEOUT, data);
        this.name = 'ProtoA2ATimeoutError';
    }
}
exports.ProtoA2ATimeoutError = ProtoA2ATimeoutError;
class ProtoA2AAuthenticationError extends ProtoA2AError {
    constructor(message, data) {
        super(message, A2AErrorCode.AUTHENTICATION_REQUIRED, data);
        this.name = 'ProtoA2AAuthenticationError';
    }
}
exports.ProtoA2AAuthenticationError = ProtoA2AAuthenticationError;
class ProtoA2AAuthorizationError extends ProtoA2AError {
    constructor(message, data) {
        super(message, A2AErrorCode.AUTHORIZATION_FAILED, data);
        this.name = 'ProtoA2AAuthorizationError';
    }
}
exports.ProtoA2AAuthorizationError = ProtoA2AAuthorizationError;
class ProtoA2ATaskNotFoundError extends ProtoA2AError {
    constructor(taskId) {
        super(`Task not found: ${taskId}`, A2AErrorCode.TASK_NOT_FOUND, { taskId });
        this.name = 'ProtoA2ATaskNotFoundError';
    }
}
exports.ProtoA2ATaskNotFoundError = ProtoA2ATaskNotFoundError;
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
exports.TaskStateSchema = zod_1.z.nativeEnum(TaskState);
exports.TextPartSchema = zod_1.z.object({
    kind: zod_1.z.literal('text'),
    text: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.FilePartSchema = zod_1.z.object({
    kind: zod_1.z.literal('file'),
    file: zod_1.z.union([
        zod_1.z.object({
            bytes: zod_1.z.string(),
            name: zod_1.z.string().optional(),
            mimeType: zod_1.z.string().optional(),
        }),
        zod_1.z.object({
            uri: zod_1.z.string().url(),
            name: zod_1.z.string().optional(),
            mimeType: zod_1.z.string().optional(),
        }),
    ]),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.DataPartSchema = zod_1.z.object({
    kind: zod_1.z.literal('data'),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.PartSchema = zod_1.z.union([exports.TextPartSchema, exports.FilePartSchema, exports.DataPartSchema]);
exports.MessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'agent']),
    parts: zod_1.z.array(exports.PartSchema),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    extensions: zod_1.z.array(zod_1.z.string()).optional(),
    referenceTaskIds: zod_1.z.array(zod_1.z.string()).optional(),
    messageId: zod_1.z.string(),
    taskId: zod_1.z.string().optional(),
    contextId: zod_1.z.string().optional(),
    kind: zod_1.z.literal('message'),
});
exports.TaskStatusSchema = zod_1.z.object({
    state: exports.TaskStateSchema,
    message: exports.MessageSchema.optional(),
    timestamp: zod_1.z.string().optional(),
});
exports.ArtifactSchema = zod_1.z.object({
    artifactId: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    parts: zod_1.z.array(exports.PartSchema),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    extensions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.TaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    contextId: zod_1.z.string(),
    status: exports.TaskStatusSchema,
    history: zod_1.z.array(exports.MessageSchema).optional(),
    artifacts: zod_1.z.array(exports.ArtifactSchema).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    kind: zod_1.z.literal('task'),
});
exports.AgentCardSchema = zod_1.z.object({
    protocolVersion: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    url: zod_1.z.string().url(),
    preferredTransport: zod_1.z.string().optional(),
    additionalInterfaces: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().url(),
        transport: zod_1.z.string(),
    }))
        .optional(),
    iconUrl: zod_1.z.string().url().optional(),
    provider: zod_1.z
        .object({
        organization: zod_1.z.string(),
        url: zod_1.z.string().url(),
    })
        .optional(),
    version: zod_1.z.string(),
    documentationUrl: zod_1.z.string().url().optional(),
    capabilities: zod_1.z.object({
        streaming: zod_1.z.boolean().optional(),
        pushNotifications: zod_1.z.boolean().optional(),
        stateTransitionHistory: zod_1.z.boolean().optional(),
        extensions: zod_1.z
            .array(zod_1.z.object({
            uri: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            required: zod_1.z.boolean().optional(),
            params: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        }))
            .optional(),
    }),
    securitySchemes: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    security: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.array(zod_1.z.string()))).optional(),
    defaultInputModes: zod_1.z.array(zod_1.z.string()),
    defaultOutputModes: zod_1.z.array(zod_1.z.string()),
    skills: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        tags: zod_1.z.array(zod_1.z.string()),
        examples: zod_1.z.array(zod_1.z.string()).optional(),
        inputModes: zod_1.z.array(zod_1.z.string()).optional(),
        outputModes: zod_1.z.array(zod_1.z.string()).optional(),
        security: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.array(zod_1.z.string()))).optional(),
    })),
    supportsAuthenticatedExtendedCard: zod_1.z.boolean().optional(),
    signatures: zod_1.z
        .array(zod_1.z.object({
        protected: zod_1.z.string(),
        signature: zod_1.z.string(),
        header: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }))
        .optional(),
});
exports.MessageSendParamsSchema = zod_1.z.object({
    message: exports.MessageSchema,
    configuration: zod_1.z
        .object({
        acceptedOutputModes: zod_1.z.array(zod_1.z.string()).optional(),
        historyLength: zod_1.z.number().optional(),
        pushNotificationConfig: zod_1.z
            .object({
            id: zod_1.z.string().optional(),
            url: zod_1.z.string().url(),
            token: zod_1.z.string().optional(),
            authentication: zod_1.z
                .object({
                schemes: zod_1.z.array(zod_1.z.string()),
                credentials: zod_1.z.string().optional(),
            })
                .optional(),
        })
            .optional(),
        blocking: zod_1.z.boolean().optional(),
    })
        .optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
// ============================================================================
// Legacy Type Compatibility (for backward compatibility during migration)
// ============================================================================
/**
 * @deprecated Use TaskState instead
 */
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ONLINE"] = "online";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
/**
 * @deprecated Use appropriate A2A v0.3.0 types instead
 */
var A2AMessageType;
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
    A2AMessageType["REQUEST"] = "request";
    A2AMessageType["NOTIFICATION"] = "notification";
})(A2AMessageType || (exports.A2AMessageType = A2AMessageType = {}));
/**
 * @deprecated Use A2A v0.3.0 priority in metadata instead
 */
var A2APriority;
(function (A2APriority) {
    A2APriority[A2APriority["CRITICAL"] = 1] = "CRITICAL";
    A2APriority[A2APriority["HIGH"] = 2] = "HIGH";
    A2APriority[A2APriority["MEDIUM"] = 3] = "MEDIUM";
    A2APriority[A2APriority["LOW"] = 4] = "LOW";
    A2APriority[A2APriority["BATCH"] = 5] = "BATCH";
})(A2APriority || (exports.A2APriority = A2APriority = {}));
// ============================================================================
// Legacy A2A (v1.0 style) Types used by current services/adapters
// ============================================================================
// Agent runtime type
var AgentType;
(function (AgentType) {
    AgentType["COORDINATOR"] = "coordinator";
    AgentType["WORKER"] = "worker";
    AgentType["SPECIALIST"] = "specialist";
    AgentType["MONITOR"] = "monitor";
    AgentType["GATEWAY"] = "gateway";
    AgentType["COMMUNICATOR"] = "communicator";
    AgentType["ASSISTANT"] = "assistant";
    AgentType["ANALYZER"] = "analyzer";
})(AgentType || (exports.AgentType = AgentType = {}));
// Load balancing strategies
var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_LOADED"] = "least_loaded";
    LoadBalancingStrategy["FASTEST_RESPONSE"] = "fastest_response";
    LoadBalancingStrategy["CAPABILITY_MATCH"] = "capability_match";
    LoadBalancingStrategy["GEOGRAPHIC"] = "geographic";
})(LoadBalancingStrategy || (exports.LoadBalancingStrategy = LoadBalancingStrategy = {}));
// ============================================================================
// Zod Schemas for legacy types (used by Redis adapter and services)
// ============================================================================
exports.AgentCapabilitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    version: zod_1.z.string(),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.AgentRegistrationSchema = zod_1.z.object({
    agentId: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.nativeEnum(AgentType),
    version: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    endpoints: zod_1.z
        .object({
        websocket: zod_1.z.string().optional(),
        http: zod_1.z.string().optional(),
        redis: zod_1.z.string().optional(),
    })
        .optional(),
    authentication: zod_1.z
        .object({
        type: zod_1.z.enum(['none', 'token', 'certificate']),
        credentials: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    })
        .optional(),
    maxConcurrentRequests: zod_1.z.number().optional(),
    averageResponseTime: zod_1.z.number().optional(),
    reliability: zod_1.z.number().optional(),
    lastSeen: zod_1.z.number().optional(),
    isOnline: zod_1.z.boolean().optional(),
});
exports.A2AMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    protocolVersion: zod_1.z.string().default(exports.A2A_PROTOCOL_VERSION),
    timestamp: zod_1.z.number(),
    fromAgent: zod_1.z.string(),
    toAgent: zod_1.z.string(),
    type: zod_1.z.nativeEnum(A2AMessageType),
    payload: zod_1.z.any(),
    priority: zod_1.z.nativeEnum(A2APriority),
    ttl: zod_1.z.number().optional(),
    retryCount: zod_1.z.number().optional(),
    requiresResponse: zod_1.z.boolean().optional(),
    conversationId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.AgentHeartbeatSchema = zod_1.z.object({
    agentId: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    status: zod_1.z.nativeEnum(AgentStatus),
    load: zod_1.z.number().optional(),
    activeConnections: zod_1.z.number().optional(),
    lastActivity: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.ConversationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    participants: zod_1.z.array(zod_1.z.string()).min(2),
    initiator: zod_1.z.string(),
    topic: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'paused', 'completed', 'failed']),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
// Error classes (string code variants) expected by adapters
class A2AError extends Error {
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
//# sourceMappingURL=types.js.map