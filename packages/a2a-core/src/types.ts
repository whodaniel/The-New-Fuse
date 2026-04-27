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
export enum TransportProtocol {
  JSONRPC = 'JSONRPC', // JSON-RPC 2.0 over HTTP
  GRPC = 'GRPC', // gRPC over HTTP/2
  HTTP_JSON = 'HTTP+JSON', // REST-style HTTP with JSON
}

// ============================================================================
// Security Schemes
// ============================================================================

/**
 * Defines base properties shared by all security scheme objects.
 */
export interface SecuritySchemeBase {
  description?: string;
}

/**
 * Defines a security scheme using an API key.
 */
export interface APIKeySecurityScheme extends SecuritySchemeBase {
  readonly type: 'apiKey';
  readonly in: 'query' | 'header' | 'cookie';
  name: string;
}

/**
 * Defines a security scheme using HTTP authentication.
 */
export interface HTTPAuthSecurityScheme extends SecuritySchemeBase {
  readonly type: 'http';
  scheme: string;
  bearerFormat?: string;
}

/**
 * Defines a security scheme using mTLS authentication.
 */
export interface MutualTLSSecurityScheme extends SecuritySchemeBase {
  readonly type: 'mutualTLS';
}

/**
 * Defines a security scheme using OAuth 2.0.
 */
export interface OAuth2SecurityScheme extends SecuritySchemeBase {
  readonly type: 'oauth2';
  flows: OAuthFlows;
  oauth2MetadataUrl?: string;
}

/**
 * Defines a security scheme using OpenID Connect.
 */
export interface OpenIdConnectSecurityScheme extends SecuritySchemeBase {
  readonly type: 'openIdConnect';
  openIdConnectUrl: string;
}

/**
 * Defines the configuration for the supported OAuth 2.0 flows.
 */
export interface OAuthFlows {
  authorizationCode?: AuthorizationCodeOAuthFlow;
  clientCredentials?: ClientCredentialsOAuthFlow;
  implicit?: ImplicitOAuthFlow;
  password?: PasswordOAuthFlow;
}

export interface AuthorizationCodeOAuthFlow {
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

export interface ClientCredentialsOAuthFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

export interface ImplicitOAuthFlow {
  authorizationUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

export interface PasswordOAuthFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes: { [name: string]: string };
}

/**
 * Defines a security scheme that can be used to secure an agent's endpoints.
 */
export type SecurityScheme =
  | APIKeySecurityScheme
  | HTTPAuthSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme;

// ============================================================================
// Agent Discovery and Metadata
// ============================================================================

/**
 * Represents the service provider of an agent.
 */
export interface AgentProvider {
  organization: string;
  url: string;
}

/**
 * A declaration of a protocol extension supported by an Agent.
 */
export interface AgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
  params?: { [key: string]: any };
}

/**
 * Defines optional capabilities supported by an agent.
 */
// NOTE: This name collides with legacy runtime AgentCapabilities used by services.
// To avoid conflicts, we rename the AgentCard capability shape to A2AAgentCapabilities.
export interface A2AAgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
  extensions?: AgentExtension[];
}

/**
 * Declares a combination of a target URL and a transport protocol.
 */
export interface AgentInterface {
  url: string;
  transport: TransportProtocol | string;
}

/**
 * Represents a distinct capability or function that an agent can perform.
 */
export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
  security?: { [scheme: string]: string[] }[];
}

/**
 * AgentCardSignature represents a JWS signature of an AgentCard.
 */
export interface AgentCardSignature {
  protected: string;
  signature: string;
  header?: { [key: string]: any };
}

/**
 * The AgentCard is a self-describing manifest for an agent.
 */
export interface AgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  preferredTransport?: TransportProtocol | string;
  additionalInterfaces?: AgentInterface[];
  iconUrl?: string;
  provider?: AgentProvider;
  version: string;
  documentationUrl?: string;
  capabilities: A2AAgentCapabilities;
  securitySchemes?: { [scheme: string]: SecurityScheme };
  security?: { [scheme: string]: string[] }[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  supportsAuthenticatedExtendedCard?: boolean;
  signatures?: AgentCardSignature[];
}

// ============================================================================
// Task Lifecycle and States
// ============================================================================

/**
 * Defines the lifecycle states of a Task.
 */
export enum TaskState {
  Submitted = 'submitted',
  Working = 'working',
  InputRequired = 'input-required',
  Completed = 'completed',
  Canceled = 'canceled',
  Failed = 'failed',
  Rejected = 'rejected',
  AuthRequired = 'auth-required',
  Unknown = 'unknown',
}

// ============================================================================
// Message Parts
// ============================================================================

/**
 * Defines base properties common to all message or artifact parts.
 */
export interface PartBase {
  metadata?: { [key: string]: any };
}

/**
 * Represents a text segment within a message or artifact.
 */
export interface TextPart extends PartBase {
  readonly kind: 'text';
  text: string;
}

/**
 * Defines base properties for a file.
 */
export interface FileBase {
  name?: string;
  mimeType?: string;
}

/**
 * Represents a file with its content provided directly as a base64-encoded string.
 */
export interface FileWithBytes extends FileBase {
  bytes: string;
  uri?: never;
}

/**
 * Represents a file with its content located at a specific URI.
 */
export interface FileWithUri extends FileBase {
  uri: string;
  bytes?: never;
}

/**
 * Represents a file segment within a message or artifact.
 */
export interface FilePart extends PartBase {
  readonly kind: 'file';
  file: FileWithBytes | FileWithUri;
}

/**
 * Represents a structured data segment (e.g., JSON) within a message or artifact.
 */
export interface DataPart extends PartBase {
  readonly kind: 'data';
  data: { [key: string]: any };
}

/**
 * A discriminated union representing a part of a message or artifact.
 */
export type Part = TextPart | FilePart | DataPart;

// ============================================================================
// Messages and Artifacts
// ============================================================================

/**
 * Represents a single message in the conversation between a user and an agent.
 */
export interface Message {
  readonly role: 'user' | 'agent';
  parts: Part[];
  metadata?: { [key: string]: any };
  extensions?: string[];
  referenceTaskIds?: string[];
  messageId: string;
  taskId?: string;
  contextId?: string;
  readonly kind: 'message';
}

/**
 * Represents a file, data structure, or other resource generated by an agent during a task.
 */
export interface Artifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: { [key: string]: any };
  extensions?: string[];
}

/**
 * Represents the status of a task at a specific point in time.
 */
export interface TaskStatus {
  state: TaskState;
  message?: Message;
  timestamp?: string;
}

/**
 * Represents a single, stateful operation or conversation between a client and an agent.
 */
export interface Task {
  id: string;
  contextId: string;
  status: TaskStatus;
  history?: Message[];
  artifacts?: Artifact[];
  metadata?: { [key: string]: any };
  readonly kind: 'task';
}

// ============================================================================
// Streaming Events
// ============================================================================

/**
 * An event sent by the agent to notify the client of a change in a task's status.
 */
export interface TaskStatusUpdateEvent {
  taskId: string;
  contextId: string;
  readonly kind: 'status-update';
  status: TaskStatus;
  final: boolean;
  metadata?: { [key: string]: any };
}

/**
 * An event sent by the agent to notify the client that an artifact has been generated or updated.
 */
export interface TaskArtifactUpdateEvent {
  taskId: string;
  contextId: string;
  readonly kind: 'artifact-update';
  artifact: Artifact;
  append?: boolean;
  lastChunk?: boolean;
  metadata?: { [key: string]: any };
}

// ============================================================================
// Push Notifications
// ============================================================================

/**
 * Defines authentication details for a push notification endpoint.
 */
export interface PushNotificationAuthenticationInfo {
  schemes: string[];
  credentials?: string;
}

/**
 * Defines the configuration for setting up push notifications for task updates.
 */
export interface PushNotificationConfig {
  id?: string;
  url: string;
  token?: string;
  authentication?: PushNotificationAuthenticationInfo;
}

/**
 * A container associating a push notification configuration with a specific task.
 */
export interface TaskPushNotificationConfig {
  taskId: string;
  pushNotificationConfig: PushNotificationConfig;
}

// ============================================================================
// Request Parameters
// ============================================================================

/**
 * Defines parameters containing a task ID.
 */
export interface TaskIdParams {
  id: string;
  metadata?: { [key: string]: any };
}

/**
 * Defines parameters for querying a task.
 */
export interface TaskQueryParams extends TaskIdParams {
  historyLength?: number;
}

/**
 * Defines configuration options for a message/send or message/stream request.
 */
export interface MessageSendConfiguration {
  acceptedOutputModes?: string[];
  historyLength?: number;
  pushNotificationConfig?: PushNotificationConfig;
  blocking?: boolean;
}

/**
 * Defines the parameters for a request to send a message to an agent.
 */
export interface MessageSendParams {
  message: Message;
  configuration?: MessageSendConfiguration;
  metadata?: { [key: string]: any };
}

/**
 * Defines parameters for fetching a specific push notification configuration.
 */
export interface GetTaskPushNotificationConfigParams extends TaskIdParams {
  pushNotificationConfigId?: string;
}

/**
 * Defines parameters for listing all push notification configurations.
 */
export interface ListTaskPushNotificationConfigParams extends TaskIdParams {}

/**
 * Defines parameters for deleting a specific push notification configuration.
 */
export interface DeleteTaskPushNotificationConfigParams extends TaskIdParams {
  pushNotificationConfigId: string;
}

// ============================================================================
// JSON-RPC 2.0 Base Types
// ============================================================================

/**
 * Defines the base structure for any JSON-RPC 2.0 message.
 */
export interface JSONRPCMessage {
  readonly jsonrpc: '2.0';
  id?: number | string | null;
}

/**
 * Represents a JSON-RPC 2.0 Request object.
 */
export interface JSONRPCRequest extends JSONRPCMessage {
  method: string;
  params?: { [key: string]: any };
}

/**
 * Represents a JSON-RPC 2.0 Error object.
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

/**
 * Represents a successful JSON-RPC 2.0 Response object.
 */
export interface JSONRPCSuccessResponse extends JSONRPCMessage {
  id: number | string | null;
  result: any;
  error?: never;
}

/**
 * Represents a JSON-RPC 2.0 Error Response object.
 */
export interface JSONRPCErrorResponse extends JSONRPCMessage {
  id: number | string | null;
  result?: never;
  error: JSONRPCError | ProtoA2AError;
}

// ============================================================================
// A2A Method Requests and Responses
// ============================================================================

// message/send
export interface SendMessageRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'message/send';
  params: MessageSendParams;
}

export interface SendMessageSuccessResponse extends JSONRPCSuccessResponse {
  result: Message | Task;
}

export type SendMessageResponse = SendMessageSuccessResponse | JSONRPCErrorResponse;

// message/stream
export interface SendStreamingMessageRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'message/stream';
  params: MessageSendParams;
}

export interface SendStreamingMessageSuccessResponse extends JSONRPCSuccessResponse {
  result: Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
}

export type SendStreamingMessageResponse =
  | SendStreamingMessageSuccessResponse
  | JSONRPCErrorResponse;

// tasks/get
export interface GetTaskRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/get';
  params: TaskQueryParams;
}

export interface GetTaskSuccessResponse extends JSONRPCSuccessResponse {
  result: Task;
}

export type GetTaskResponse = GetTaskSuccessResponse | JSONRPCErrorResponse;

// tasks/cancel
export interface CancelTaskRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/cancel';
  params: TaskIdParams;
}

export interface CancelTaskSuccessResponse extends JSONRPCSuccessResponse {
  result: Task;
}

export type CancelTaskResponse = CancelTaskSuccessResponse | JSONRPCErrorResponse;

// tasks/resubscribe
export interface TaskResubscriptionRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/resubscribe';
  params: TaskIdParams;
}

// tasks/pushNotificationConfig/set
export interface SetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/pushNotificationConfig/set';
  params: TaskPushNotificationConfig;
}

export interface SetTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: TaskPushNotificationConfig;
}

export type SetTaskPushNotificationConfigResponse =
  | SetTaskPushNotificationConfigSuccessResponse
  | JSONRPCErrorResponse;

// tasks/pushNotificationConfig/get
export interface GetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/pushNotificationConfig/get';
  params: GetTaskPushNotificationConfigParams | TaskIdParams;
}

export interface GetTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: TaskPushNotificationConfig;
}

export type GetTaskPushNotificationConfigResponse =
  | GetTaskPushNotificationConfigSuccessResponse
  | JSONRPCErrorResponse;

// tasks/pushNotificationConfig/list
export interface ListTaskPushNotificationConfigRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/pushNotificationConfig/list';
  params: ListTaskPushNotificationConfigParams;
}

export interface ListTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: TaskPushNotificationConfig[];
}

export type ListTaskPushNotificationConfigResponse =
  | ListTaskPushNotificationConfigSuccessResponse
  | JSONRPCErrorResponse;

// tasks/pushNotificationConfig/delete
export interface DeleteTaskPushNotificationConfigRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/pushNotificationConfig/delete';
  params: DeleteTaskPushNotificationConfigParams;
}

export interface DeleteTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: { success: boolean };
}

export type DeleteTaskPushNotificationConfigResponse =
  | DeleteTaskPushNotificationConfigSuccessResponse
  | JSONRPCErrorResponse;

// agent/getAuthenticatedExtendedCard
export interface GetAuthenticatedExtendedCardRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'agent/getAuthenticatedExtendedCard';
  params?: { metadata?: { [key: string]: any } };
}

export interface GetAuthenticatedExtendedCardResponse extends JSONRPCSuccessResponse {
  result: AgentCard;
}

// All possible JSON-RPC responses
export type JSONRPCResponse =
  | SendMessageResponse
  | SendStreamingMessageResponse
  | GetTaskResponse
  | CancelTaskResponse
  | SetTaskPushNotificationConfigResponse
  | GetTaskPushNotificationConfigResponse
  | ListTaskPushNotificationConfigResponse
  | DeleteTaskPushNotificationConfigResponse
  | GetAuthenticatedExtendedCardResponse;

// ============================================================================
// Error Handling (A2A v0.3.0)
// ============================================================================

/**
 * A2A Error Codes based on JSON-RPC 2.0 and A2A extensions
 */
export enum A2AErrorCode {
  // JSON-RPC 2.0 Standard Errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // A2A-Specific Errors (using -32000 to -32099 range)
  TASK_NOT_FOUND = -32001,
  TASK_ALREADY_CANCELED = -32002,
  TASK_NOT_CANCELABLE = -32003,
  AUTHENTICATION_REQUIRED = -32004,
  AUTHORIZATION_FAILED = -32005,
  RATE_LIMIT_EXCEEDED = -32006,
  RESOURCE_EXHAUSTED = -32007,
  INVALID_TASK_STATE = -32008,
  PUSH_NOTIFICATION_CONFIG_NOT_FOUND = -32009,
  UNSUPPORTED_OPERATION = -32010,
  AGENT_UNAVAILABLE = -32011,
  TIMEOUT = -32012,
}

/**
 * Base A2A Error class
 */
export class ProtoA2AError extends Error implements JSONRPCError {
  constructor(
    message: string,
    public code: A2AErrorCode,
    public data?: any
  ) {
    super(message);
    this.name = 'ProtoA2AError';
  }

  toJSON(): JSONRPCError {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

export class ProtoA2AValidationError extends ProtoA2AError {
  constructor(
    message: string,
    public validationErrors: any
  ) {
    super(message, A2AErrorCode.INVALID_PARAMS, validationErrors);
    this.name = 'ProtoA2AValidationError';
  }
}

export class ProtoA2ATimeoutError extends ProtoA2AError {
  constructor(message: string, data?: any) {
    super(message, A2AErrorCode.TIMEOUT, data);
    this.name = 'ProtoA2ATimeoutError';
  }
}

export class ProtoA2AAuthenticationError extends ProtoA2AError {
  constructor(message: string, data?: any) {
    super(message, A2AErrorCode.AUTHENTICATION_REQUIRED, data);
    this.name = 'ProtoA2AAuthenticationError';
  }
}

export class ProtoA2AAuthorizationError extends ProtoA2AError {
  constructor(message: string, data?: any) {
    super(message, A2AErrorCode.AUTHORIZATION_FAILED, data);
    this.name = 'ProtoA2AAuthorizationError';
  }
}

export class ProtoA2ATaskNotFoundError extends ProtoA2AError {
  constructor(taskId: string) {
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
    .array(
      z.object({
        url: z.string().url(),
        transport: z.string(),
      })
    )
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
      .array(
        z.object({
          uri: z.string(),
          description: z.string().optional(),
          required: z.boolean().optional(),
          params: z.record(z.string(), z.any()).optional(),
        })
      )
      .optional(),
  }),
  securitySchemes: z.record(z.string(), z.any()).optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  defaultInputModes: z.array(z.string()),
  defaultOutputModes: z.array(z.string()),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      examples: z.array(z.string()).optional(),
      inputModes: z.array(z.string()).optional(),
      outputModes: z.array(z.string()).optional(),
      security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
    })
  ),
  supportsAuthenticatedExtendedCard: z.boolean().optional(),
  signatures: z
    .array(
      z.object({
        protected: z.string(),
        signature: z.string(),
        header: z.record(z.string(), z.any()).optional(),
      })
    )
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
export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  IDLE = 'idle',
  ERROR = 'error',
}

/**
 * @deprecated Use appropriate A2A v0.3.0 types instead
 */
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
  REQUEST = 'request',
  NOTIFICATION = 'notification',
}

/**
 * @deprecated Use A2A v0.3.0 priority in metadata instead
 */
export enum A2APriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  BATCH = 5,
}

// ============================================================================
// Configuration
// ============================================================================

export interface A2AConfig {
  redis?: {
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
  agentCard?: AgentCard;
}

// ============================================================================
// Legacy A2A (v1.0 style) Types used by current services/adapters
// ============================================================================

// Agent runtime type
export enum AgentType {
  COORDINATOR = 'coordinator',
  WORKER = 'worker',
  SPECIALIST = 'specialist',
  MONITOR = 'monitor',
  GATEWAY = 'gateway',
  COMMUNICATOR = 'communicator',
  ASSISTANT = 'assistant',
  ANALYZER = 'analyzer',
}

// Load balancing strategies
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_LOADED = 'least_loaded',
  FASTEST_RESPONSE = 'fastest_response',
  CAPABILITY_MATCH = 'capability_match',
  GEOGRAPHIC = 'geographic',
}

// Message shape used by A2A services
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
  resourcePointers?: Record<string, any>;
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

// Runtime capabilities tracked per agent by services
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
  resourcePointers: z.record(z.string(), z.any()).optional(),
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

export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;
export type A2AMessageZod = z.infer<typeof A2AMessageSchema>;
export type AgentHeartbeat = z.infer<typeof AgentHeartbeatSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;

// Interface implemented by Redis/WebSocket adapters
export interface IA2ACommunicator {
  registerAgent(registration: AgentRegistration): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>;
  sendMessage(message: A2AMessage): Promise<void>;
  sendRequest(
    fromAgent: string,
    toAgent: string,
    payload: any,
    options?: { timeout?: number; priority?: A2APriority; conversationId?: string }
  ): Promise<A2AMessage>;
  broadcast(
    fromAgent: string,
    payload: any,
    options?: { channel?: string; topic?: string; priority?: A2APriority }
  ): Promise<void>;
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

// Error classes (string code variants) expected by adapters
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
  constructor(
    message: string,
    public validationErrors: any
  ) {
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
