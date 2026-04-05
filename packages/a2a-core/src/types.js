import { z } from 'zod';
/**
 * Agent2Agent (A2A) Protocol v0.3.0 Types
 *
 * This file defines the TypeScript types and Zod schemas for the A2A protocol v0.3.0 specification.
 * Based on: https://github.com/a2aproject/A2A v0.3.0
 */
// ============================================================================
// Protocol Version
// ============================================================================
export const A2A_PROTOCOL_VERSION = '0.3.0';
// ============================================================================
// Transport Protocols
// ============================================================================
/**
 * Supported A2A transport protocols.
 */
export var TransportProtocol;
(function (TransportProtocol) {
    TransportProtocol["JSONRPC"] = "JSONRPC";
    TransportProtocol["GRPC"] = "GRPC";
    TransportProtocol["HTTP_JSON"] = "HTTP+JSON";
})(TransportProtocol || (TransportProtocol = {}));
// ============================================================================
// Task Lifecycle and States
// ============================================================================
/**
 * Defines the lifecycle states of a Task.
 */
export var TaskState;
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
})(TaskState || (TaskState = {}));
// ============================================================================
// Error Handling (A2A v0.3.0)
// ============================================================================
/**
 * A2A Error Codes based on JSON-RPC 2.0 and A2A extensions
 */
export var A2AErrorCode;
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
})(A2AErrorCode || (A2AErrorCode = {}));
/**
 * Base A2A Error class
 */
export class ProtoA2AError extends Error {
    constructor(message, code, data) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: code
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: data
        });
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
export class ProtoA2AValidationError extends ProtoA2AError {
    constructor(message, validationErrors) {
        super(message, A2AErrorCode.INVALID_PARAMS, validationErrors);
        Object.defineProperty(this, "validationErrors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: validationErrors
        });
        this.name = 'ProtoA2AValidationError';
    }
}
export class ProtoA2ATimeoutError extends ProtoA2AError {
    constructor(message, data) {
        super(message, A2AErrorCode.TIMEOUT, data);
        this.name = 'ProtoA2ATimeoutError';
    }
}
export class ProtoA2AAuthenticationError extends ProtoA2AError {
    constructor(message, data) {
        super(message, A2AErrorCode.AUTHENTICATION_REQUIRED, data);
        this.name = 'ProtoA2AAuthenticationError';
    }
}
export class ProtoA2AAuthorizationError extends ProtoA2AError {
    constructor(message, data) {
        super(message, A2AErrorCode.AUTHORIZATION_FAILED, data);
        this.name = 'ProtoA2AAuthorizationError';
    }
}
export class ProtoA2ATaskNotFoundError extends ProtoA2AError {
    constructor(taskId) {
        super(`Task not found: ${taskId}`, A2AErrorCode.TASK_NOT_FOUND, { taskId });
        this.name = 'ProtoA2ATaskNotFoundError';
    }
}
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
export const TaskStateSchema = z.nativeEnum(TaskState);
export const TextPartSchema = z.object({
    kind: z.literal('text'),
    text: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
});
export const FilePartSchema = z.object({
    kind: z.literal('file'),
    file: z.union([
        z.object({
            bytes: z.string(),
            name: z.string().optional(),
            mimeType: z.string().optional(),
        }),
        z.object({
            uri: z.string().url(),
            name: z.string().optional(),
            mimeType: z.string().optional(),
        }),
    ]),
    metadata: z.record(z.string(), z.any()).optional(),
});
export const DataPartSchema = z.object({
    kind: z.literal('data'),
    data: z.record(z.string(), z.any()),
    metadata: z.record(z.string(), z.any()).optional(),
});
export const PartSchema = z.union([TextPartSchema, FilePartSchema, DataPartSchema]);
export const MessageSchema = z.object({
    role: z.enum(['user', 'agent']),
    parts: z.array(PartSchema),
    metadata: z.record(z.string(), z.any()).optional(),
    extensions: z.array(z.string()).optional(),
    referenceTaskIds: z.array(z.string()).optional(),
    messageId: z.string(),
    taskId: z.string().optional(),
    contextId: z.string().optional(),
    kind: z.literal('message'),
});
export const TaskStatusSchema = z.object({
    state: TaskStateSchema,
    message: MessageSchema.optional(),
    timestamp: z.string().optional(),
});
export const ArtifactSchema = z.object({
    artifactId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    parts: z.array(PartSchema),
    metadata: z.record(z.string(), z.any()).optional(),
    extensions: z.array(z.string()).optional(),
});
export const TaskSchema = z.object({
    id: z.string(),
    contextId: z.string(),
    status: TaskStatusSchema,
    history: z.array(MessageSchema).optional(),
    artifacts: z.array(ArtifactSchema).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    kind: z.literal('task'),
});
export const AgentCardSchema = z.object({
    protocolVersion: z.string(),
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    preferredTransport: z.string().optional(),
    additionalInterfaces: z
        .array(z.object({
        url: z.string().url(),
        transport: z.string(),
    }))
        .optional(),
    iconUrl: z.string().url().optional(),
    provider: z
        .object({
        organization: z.string(),
        url: z.string().url(),
    })
        .optional(),
    version: z.string(),
    documentationUrl: z.string().url().optional(),
    capabilities: z.object({
        streaming: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        stateTransitionHistory: z.boolean().optional(),
        extensions: z
            .array(z.object({
            uri: z.string(),
            description: z.string().optional(),
            required: z.boolean().optional(),
            params: z.record(z.string(), z.any()).optional(),
        }))
            .optional(),
    }),
    securitySchemes: z.record(z.string(), z.any()).optional(),
    security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
    defaultInputModes: z.array(z.string()),
    defaultOutputModes: z.array(z.string()),
    skills: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        tags: z.array(z.string()),
        examples: z.array(z.string()).optional(),
        inputModes: z.array(z.string()).optional(),
        outputModes: z.array(z.string()).optional(),
        security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
    })),
    supportsAuthenticatedExtendedCard: z.boolean().optional(),
    signatures: z
        .array(z.object({
        protected: z.string(),
        signature: z.string(),
        header: z.record(z.string(), z.any()).optional(),
    }))
        .optional(),
});
export const MessageSendParamsSchema = z.object({
    message: MessageSchema,
    configuration: z
        .object({
        acceptedOutputModes: z.array(z.string()).optional(),
        historyLength: z.number().optional(),
        pushNotificationConfig: z
            .object({
            id: z.string().optional(),
            url: z.string().url(),
            token: z.string().optional(),
            authentication: z
                .object({
                schemes: z.array(z.string()),
                credentials: z.string().optional(),
            })
                .optional(),
        })
            .optional(),
        blocking: z.boolean().optional(),
    })
        .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});
// ============================================================================
// Legacy Type Compatibility (for backward compatibility during migration)
// ============================================================================
/**
 * @deprecated Use TaskState instead
 */
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ONLINE"] = "online";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
/**
 * @deprecated Use appropriate A2A v0.3.0 types instead
 */
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
    A2AMessageType["REQUEST"] = "request";
    A2AMessageType["NOTIFICATION"] = "notification";
})(A2AMessageType || (A2AMessageType = {}));
/**
 * @deprecated Use A2A v0.3.0 priority in metadata instead
 */
export var A2APriority;
(function (A2APriority) {
    A2APriority[A2APriority["CRITICAL"] = 1] = "CRITICAL";
    A2APriority[A2APriority["HIGH"] = 2] = "HIGH";
    A2APriority[A2APriority["MEDIUM"] = 3] = "MEDIUM";
    A2APriority[A2APriority["LOW"] = 4] = "LOW";
    A2APriority[A2APriority["BATCH"] = 5] = "BATCH";
})(A2APriority || (A2APriority = {}));
// ============================================================================
// Legacy A2A (v1.0 style) Types used by current services/adapters
// ============================================================================
// Agent runtime type
export var AgentType;
(function (AgentType) {
    AgentType["COORDINATOR"] = "coordinator";
    AgentType["WORKER"] = "worker";
    AgentType["SPECIALIST"] = "specialist";
    AgentType["MONITOR"] = "monitor";
    AgentType["GATEWAY"] = "gateway";
    AgentType["COMMUNICATOR"] = "communicator";
    AgentType["ASSISTANT"] = "assistant";
    AgentType["ANALYZER"] = "analyzer";
})(AgentType || (AgentType = {}));
// Load balancing strategies
export var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_LOADED"] = "least_loaded";
    LoadBalancingStrategy["FASTEST_RESPONSE"] = "fastest_response";
    LoadBalancingStrategy["CAPABILITY_MATCH"] = "capability_match";
    LoadBalancingStrategy["GEOGRAPHIC"] = "geographic";
})(LoadBalancingStrategy || (LoadBalancingStrategy = {}));
// ============================================================================
// Zod Schemas for legacy types (used by Redis adapter and services)
// ============================================================================
export const AgentCapabilitySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    version: z.string(),
    parameters: z.record(z.string(), z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});
export const AgentRegistrationSchema = z.object({
    agentId: z.string(),
    name: z.string(),
    type: z.nativeEnum(AgentType),
    version: z.string(),
    description: z.string().optional(),
    capabilities: z.array(z.string()),
    metadata: z.record(z.string(), z.any()).optional(),
    endpoints: z
        .object({
        websocket: z.string().optional(),
        http: z.string().optional(),
        redis: z.string().optional(),
    })
        .optional(),
    authentication: z
        .object({
        type: z.enum(['none', 'token', 'certificate']),
        credentials: z.record(z.string(), z.string()).optional(),
    })
        .optional(),
    maxConcurrentRequests: z.number().optional(),
    averageResponseTime: z.number().optional(),
    reliability: z.number().optional(),
    lastSeen: z.number().optional(),
    isOnline: z.boolean().optional(),
});
export const A2AMessageSchema = z.object({
    id: z.string(),
    protocolVersion: z.string().default(A2A_PROTOCOL_VERSION),
    timestamp: z.number(),
    fromAgent: z.string(),
    toAgent: z.string(),
    type: z.nativeEnum(A2AMessageType),
    payload: z.any(),
    priority: z.nativeEnum(A2APriority),
    ttl: z.number().optional(),
    retryCount: z.number().optional(),
    requiresResponse: z.boolean().optional(),
    conversationId: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});
export const AgentHeartbeatSchema = z.object({
    agentId: z.string(),
    timestamp: z.string(),
    status: z.nativeEnum(AgentStatus),
    load: z.number().optional(),
    activeConnections: z.number().optional(),
    lastActivity: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});
export const ConversationSchema = z.object({
    id: z.string(),
    participants: z.array(z.string()).min(2),
    initiator: z.string(),
    topic: z.string().optional(),
    status: z.enum(['active', 'paused', 'completed', 'failed']),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
});
// Error classes (string code variants) expected by adapters
export class A2AError extends Error {
    constructor(message, code, agentId, messageId) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: code
        });
        Object.defineProperty(this, "agentId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: agentId
        });
        Object.defineProperty(this, "messageId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: messageId
        });
        this.name = 'A2AError';
    }
}
export class A2AValidationError extends A2AError {
    constructor(message, validationErrors) {
        super(message, 'VALIDATION_ERROR');
        Object.defineProperty(this, "validationErrors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: validationErrors
        });
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
