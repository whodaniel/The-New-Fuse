import { z } from 'zod';
/**
 * Agent2Agent (A2A) Protocol v0.3.0 Types
 *
 * This file defines the TypeScript types and Zod schemas for the A2A protocol v0.3.0 specification.
 * Based on: https://github.com/a2aproject/A2A v0.3.0
 */
export declare const A2A_PROTOCOL_VERSION = '0.3.0';
/**
 * Supported A2A transport protocols.
 */
export declare enum TransportProtocol {
  JSONRPC = 'JSONRPC', // JSON-RPC 2.0 over HTTP
  GRPC = 'GRPC', // gRPC over HTTP/2
  HTTP_JSON = 'HTTP+JSON',
}
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
  scopes: {
    [name: string]: string;
  };
}
export interface ClientCredentialsOAuthFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes: {
    [name: string]: string;
  };
}
export interface ImplicitOAuthFlow {
  authorizationUrl: string;
  refreshUrl?: string;
  scopes: {
    [name: string]: string;
  };
}
export interface PasswordOAuthFlow {
  tokenUrl: string;
  refreshUrl?: string;
  scopes: {
    [name: string]: string;
  };
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
  params?: {
    [key: string]: any;
  };
}
/**
 * Defines optional capabilities supported by an agent.
 */
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
  security?: {
    [scheme: string]: string[];
  }[];
}
/**
 * AgentCardSignature represents a JWS signature of an AgentCard.
 */
export interface AgentCardSignature {
  protected: string;
  signature: string;
  header?: {
    [key: string]: any;
  };
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
  securitySchemes?: {
    [scheme: string]: SecurityScheme;
  };
  security?: {
    [scheme: string]: string[];
  }[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  supportsAuthenticatedExtendedCard?: boolean;
  signatures?: AgentCardSignature[];
}
/**
 * Defines the lifecycle states of a Task.
 */
export declare enum TaskState {
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
/**
 * Defines base properties common to all message or artifact parts.
 */
export interface PartBase {
  metadata?: {
    [key: string]: any;
  };
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
  data: {
    [key: string]: any;
  };
}
/**
 * A discriminated union representing a part of a message or artifact.
 */
export type Part = TextPart | FilePart | DataPart;
/**
 * Represents a single message in the conversation between a user and an agent.
 */
export interface Message {
  readonly role: 'user' | 'agent';
  parts: Part[];
  metadata?: {
    [key: string]: any;
  };
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
  metadata?: {
    [key: string]: any;
  };
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
  metadata?: {
    [key: string]: any;
  };
  readonly kind: 'task';
}
/**
 * An event sent by the agent to notify the client of a change in a task's status.
 */
export interface TaskStatusUpdateEvent {
  taskId: string;
  contextId: string;
  readonly kind: 'status-update';
  status: TaskStatus;
  final: boolean;
  metadata?: {
    [key: string]: any;
  };
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
  metadata?: {
    [key: string]: any;
  };
}
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
/**
 * Defines parameters containing a task ID.
 */
export interface TaskIdParams {
  id: string;
  metadata?: {
    [key: string]: any;
  };
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
  metadata?: {
    [key: string]: any;
  };
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
  params?: {
    [key: string]: any;
  };
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
export interface SendMessageRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'message/send';
  params: MessageSendParams;
}
export interface SendMessageSuccessResponse extends JSONRPCSuccessResponse {
  result: Message | Task;
}
export type SendMessageResponse = SendMessageSuccessResponse | JSONRPCErrorResponse;
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
export interface GetTaskRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/get';
  params: TaskQueryParams;
}
export interface GetTaskSuccessResponse extends JSONRPCSuccessResponse {
  result: Task;
}
export type GetTaskResponse = GetTaskSuccessResponse | JSONRPCErrorResponse;
export interface CancelTaskRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/cancel';
  params: TaskIdParams;
}
export interface CancelTaskSuccessResponse extends JSONRPCSuccessResponse {
  result: Task;
}
export type CancelTaskResponse = CancelTaskSuccessResponse | JSONRPCErrorResponse;
export interface TaskResubscriptionRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/resubscribe';
  params: TaskIdParams;
}
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
export interface DeleteTaskPushNotificationConfigRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'tasks/pushNotificationConfig/delete';
  params: DeleteTaskPushNotificationConfigParams;
}
export interface DeleteTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: {
    success: boolean;
  };
}
export type DeleteTaskPushNotificationConfigResponse =
  | DeleteTaskPushNotificationConfigSuccessResponse
  | JSONRPCErrorResponse;
export interface GetAuthenticatedExtendedCardRequest extends JSONRPCRequest {
  id: number | string;
  readonly method: 'agent/getAuthenticatedExtendedCard';
  params?: {
    metadata?: {
      [key: string]: any;
    };
  };
}
export interface GetAuthenticatedExtendedCardResponse extends JSONRPCSuccessResponse {
  result: AgentCard;
}
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
/**
 * A2A Error Codes based on JSON-RPC 2.0 and A2A extensions
 */
export declare enum A2AErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
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
export declare class ProtoA2AError extends Error implements JSONRPCError {
  code: A2AErrorCode;
  data?: any | undefined;
  constructor(message: string, code: A2AErrorCode, data?: any | undefined);
  toJSON(): JSONRPCError;
}
export declare class ProtoA2AValidationError extends ProtoA2AError {
  validationErrors: any;
  constructor(message: string, validationErrors: any);
}
export declare class ProtoA2ATimeoutError extends ProtoA2AError {
  constructor(message: string, data?: any);
}
export declare class ProtoA2AAuthenticationError extends ProtoA2AError {
  constructor(message: string, data?: any);
}
export declare class ProtoA2AAuthorizationError extends ProtoA2AError {
  constructor(message: string, data?: any);
}
export declare class ProtoA2ATaskNotFoundError extends ProtoA2AError {
  constructor(taskId: string);
}
export declare const TaskStateSchema: z.ZodEnum<typeof TaskState>;
export declare const TextPartSchema: z.ZodObject<
  {
    kind: z.ZodLiteral<'text'>;
    text: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
export declare const FilePartSchema: z.ZodObject<
  {
    kind: z.ZodLiteral<'file'>;
    file: z.ZodUnion<
      readonly [
        z.ZodObject<
          {
            bytes: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            mimeType: z.ZodOptional<z.ZodString>;
          },
          z.core.$strip
        >,
        z.ZodObject<
          {
            uri: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            mimeType: z.ZodOptional<z.ZodString>;
          },
          z.core.$strip
        >,
      ]
    >;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
export declare const DataPartSchema: z.ZodObject<
  {
    kind: z.ZodLiteral<'data'>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
export declare const PartSchema: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        kind: z.ZodLiteral<'text'>;
        text: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        kind: z.ZodLiteral<'file'>;
        file: z.ZodUnion<
          readonly [
            z.ZodObject<
              {
                bytes: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                mimeType: z.ZodOptional<z.ZodString>;
              },
              z.core.$strip
            >,
            z.ZodObject<
              {
                uri: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                mimeType: z.ZodOptional<z.ZodString>;
              },
              z.core.$strip
            >,
          ]
        >;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        kind: z.ZodLiteral<'data'>;
        data: z.ZodRecord<z.ZodString, z.ZodAny>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
      },
      z.core.$strip
    >,
  ]
>;
export declare const MessageSchema: z.ZodObject<
  {
    role: z.ZodEnum<{
      user: 'user';
      agent: 'agent';
    }>;
    parts: z.ZodArray<
      z.ZodUnion<
        readonly [
          z.ZodObject<
            {
              kind: z.ZodLiteral<'text'>;
              text: z.ZodString;
              metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            },
            z.core.$strip
          >,
          z.ZodObject<
            {
              kind: z.ZodLiteral<'file'>;
              file: z.ZodUnion<
                readonly [
                  z.ZodObject<
                    {
                      bytes: z.ZodString;
                      name: z.ZodOptional<z.ZodString>;
                      mimeType: z.ZodOptional<z.ZodString>;
                    },
                    z.core.$strip
                  >,
                  z.ZodObject<
                    {
                      uri: z.ZodString;
                      name: z.ZodOptional<z.ZodString>;
                      mimeType: z.ZodOptional<z.ZodString>;
                    },
                    z.core.$strip
                  >,
                ]
              >;
              metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            },
            z.core.$strip
          >,
          z.ZodObject<
            {
              kind: z.ZodLiteral<'data'>;
              data: z.ZodRecord<z.ZodString, z.ZodAny>;
              metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            },
            z.core.$strip
          >,
        ]
      >
    >;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    referenceTaskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    messageId: z.ZodString;
    taskId: z.ZodOptional<z.ZodString>;
    contextId: z.ZodOptional<z.ZodString>;
    kind: z.ZodLiteral<'message'>;
  },
  z.core.$strip
>;
export declare const TaskStatusSchema: z.ZodObject<
  {
    state: z.ZodEnum<typeof TaskState>;
    message: z.ZodOptional<
      z.ZodObject<
        {
          role: z.ZodEnum<{
            user: 'user';
            agent: 'agent';
          }>;
          parts: z.ZodArray<
            z.ZodUnion<
              readonly [
                z.ZodObject<
                  {
                    kind: z.ZodLiteral<'text'>;
                    text: z.ZodString;
                    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                  },
                  z.core.$strip
                >,
                z.ZodObject<
                  {
                    kind: z.ZodLiteral<'file'>;
                    file: z.ZodUnion<
                      readonly [
                        z.ZodObject<
                          {
                            bytes: z.ZodString;
                            name: z.ZodOptional<z.ZodString>;
                            mimeType: z.ZodOptional<z.ZodString>;
                          },
                          z.core.$strip
                        >,
                        z.ZodObject<
                          {
                            uri: z.ZodString;
                            name: z.ZodOptional<z.ZodString>;
                            mimeType: z.ZodOptional<z.ZodString>;
                          },
                          z.core.$strip
                        >,
                      ]
                    >;
                    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                  },
                  z.core.$strip
                >,
                z.ZodObject<
                  {
                    kind: z.ZodLiteral<'data'>;
                    data: z.ZodRecord<z.ZodString, z.ZodAny>;
                    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                  },
                  z.core.$strip
                >,
              ]
            >
          >;
          metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
          extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
          referenceTaskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
          messageId: z.ZodString;
          taskId: z.ZodOptional<z.ZodString>;
          contextId: z.ZodOptional<z.ZodString>;
          kind: z.ZodLiteral<'message'>;
        },
        z.core.$strip
      >
    >;
    timestamp: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
export declare const ArtifactSchema: z.ZodObject<
  {
    artifactId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parts: z.ZodArray<
      z.ZodUnion<
        readonly [
          z.ZodObject<
            {
              kind: z.ZodLiteral<'text'>;
              text: z.ZodString;
              metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            },
            z.core.$strip
          >,
          z.ZodObject<
            {
              kind: z.ZodLiteral<'file'>;
              file: z.ZodUnion<
                readonly [
                  z.ZodObject<
                    {
                      bytes: z.ZodString;
                      name: z.ZodOptional<z.ZodString>;
                      mimeType: z.ZodOptional<z.ZodString>;
                    },
                    z.core.$strip
                  >,
                  z.ZodObject<
                    {
                      uri: z.ZodString;
                      name: z.ZodOptional<z.ZodString>;
                      mimeType: z.ZodOptional<z.ZodString>;
                    },
                    z.core.$strip
                  >,
                ]
              >;
              metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            },
            z.core.$strip
          >,
          z.ZodObject<
            {
              kind: z.ZodLiteral<'data'>;
              data: z.ZodRecord<z.ZodString, z.ZodAny>;
              metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            },
            z.core.$strip
          >,
        ]
      >
    >;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
  },
  z.core.$strip
>;
export declare const TaskSchema: z.ZodObject<
  {
    id: z.ZodString;
    contextId: z.ZodString;
    status: z.ZodObject<
      {
        state: z.ZodEnum<typeof TaskState>;
        message: z.ZodOptional<
          z.ZodObject<
            {
              role: z.ZodEnum<{
                user: 'user';
                agent: 'agent';
              }>;
              parts: z.ZodArray<
                z.ZodUnion<
                  readonly [
                    z.ZodObject<
                      {
                        kind: z.ZodLiteral<'text'>;
                        text: z.ZodString;
                        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                      },
                      z.core.$strip
                    >,
                    z.ZodObject<
                      {
                        kind: z.ZodLiteral<'file'>;
                        file: z.ZodUnion<
                          readonly [
                            z.ZodObject<
                              {
                                bytes: z.ZodString;
                                name: z.ZodOptional<z.ZodString>;
                                mimeType: z.ZodOptional<z.ZodString>;
                              },
                              z.core.$strip
                            >,
                            z.ZodObject<
                              {
                                uri: z.ZodString;
                                name: z.ZodOptional<z.ZodString>;
                                mimeType: z.ZodOptional<z.ZodString>;
                              },
                              z.core.$strip
                            >,
                          ]
                        >;
                        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                      },
                      z.core.$strip
                    >,
                    z.ZodObject<
                      {
                        kind: z.ZodLiteral<'data'>;
                        data: z.ZodRecord<z.ZodString, z.ZodAny>;
                        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                      },
                      z.core.$strip
                    >,
                  ]
                >
              >;
              metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
              extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
              referenceTaskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
              messageId: z.ZodString;
              taskId: z.ZodOptional<z.ZodString>;
              contextId: z.ZodOptional<z.ZodString>;
              kind: z.ZodLiteral<'message'>;
            },
            z.core.$strip
          >
        >;
        timestamp: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >;
    history: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            role: z.ZodEnum<{
              user: 'user';
              agent: 'agent';
            }>;
            parts: z.ZodArray<
              z.ZodUnion<
                readonly [
                  z.ZodObject<
                    {
                      kind: z.ZodLiteral<'text'>;
                      text: z.ZodString;
                      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                    },
                    z.core.$strip
                  >,
                  z.ZodObject<
                    {
                      kind: z.ZodLiteral<'file'>;
                      file: z.ZodUnion<
                        readonly [
                          z.ZodObject<
                            {
                              bytes: z.ZodString;
                              name: z.ZodOptional<z.ZodString>;
                              mimeType: z.ZodOptional<z.ZodString>;
                            },
                            z.core.$strip
                          >,
                          z.ZodObject<
                            {
                              uri: z.ZodString;
                              name: z.ZodOptional<z.ZodString>;
                              mimeType: z.ZodOptional<z.ZodString>;
                            },
                            z.core.$strip
                          >,
                        ]
                      >;
                      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                    },
                    z.core.$strip
                  >,
                  z.ZodObject<
                    {
                      kind: z.ZodLiteral<'data'>;
                      data: z.ZodRecord<z.ZodString, z.ZodAny>;
                      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                    },
                    z.core.$strip
                  >,
                ]
              >
            >;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
            referenceTaskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            messageId: z.ZodString;
            taskId: z.ZodOptional<z.ZodString>;
            contextId: z.ZodOptional<z.ZodString>;
            kind: z.ZodLiteral<'message'>;
          },
          z.core.$strip
        >
      >
    >;
    artifacts: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            artifactId: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            parts: z.ZodArray<
              z.ZodUnion<
                readonly [
                  z.ZodObject<
                    {
                      kind: z.ZodLiteral<'text'>;
                      text: z.ZodString;
                      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                    },
                    z.core.$strip
                  >,
                  z.ZodObject<
                    {
                      kind: z.ZodLiteral<'file'>;
                      file: z.ZodUnion<
                        readonly [
                          z.ZodObject<
                            {
                              bytes: z.ZodString;
                              name: z.ZodOptional<z.ZodString>;
                              mimeType: z.ZodOptional<z.ZodString>;
                            },
                            z.core.$strip
                          >,
                          z.ZodObject<
                            {
                              uri: z.ZodString;
                              name: z.ZodOptional<z.ZodString>;
                              mimeType: z.ZodOptional<z.ZodString>;
                            },
                            z.core.$strip
                          >,
                        ]
                      >;
                      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                    },
                    z.core.$strip
                  >,
                  z.ZodObject<
                    {
                      kind: z.ZodLiteral<'data'>;
                      data: z.ZodRecord<z.ZodString, z.ZodAny>;
                      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                    },
                    z.core.$strip
                  >,
                ]
              >
            >;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
          },
          z.core.$strip
        >
      >
    >;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    kind: z.ZodLiteral<'task'>;
  },
  z.core.$strip
>;
export declare const AgentCardSchema: z.ZodObject<
  {
    protocolVersion: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    url: z.ZodString;
    preferredTransport: z.ZodOptional<z.ZodString>;
    additionalInterfaces: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            url: z.ZodString;
            transport: z.ZodString;
          },
          z.core.$strip
        >
      >
    >;
    iconUrl: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<
      z.ZodObject<
        {
          organization: z.ZodString;
          url: z.ZodString;
        },
        z.core.$strip
      >
    >;
    version: z.ZodString;
    documentationUrl: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodObject<
      {
        streaming: z.ZodOptional<z.ZodBoolean>;
        pushNotifications: z.ZodOptional<z.ZodBoolean>;
        stateTransitionHistory: z.ZodOptional<z.ZodBoolean>;
        extensions: z.ZodOptional<
          z.ZodArray<
            z.ZodObject<
              {
                uri: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                required: z.ZodOptional<z.ZodBoolean>;
                params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
              },
              z.core.$strip
            >
          >
        >;
      },
      z.core.$strip
    >;
    securitySchemes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    security: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>>;
    defaultInputModes: z.ZodArray<z.ZodString>;
    defaultOutputModes: z.ZodArray<z.ZodString>;
    skills: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          name: z.ZodString;
          description: z.ZodString;
          tags: z.ZodArray<z.ZodString>;
          examples: z.ZodOptional<z.ZodArray<z.ZodString>>;
          inputModes: z.ZodOptional<z.ZodArray<z.ZodString>>;
          outputModes: z.ZodOptional<z.ZodArray<z.ZodString>>;
          security: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>>;
        },
        z.core.$strip
      >
    >;
    supportsAuthenticatedExtendedCard: z.ZodOptional<z.ZodBoolean>;
    signatures: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            protected: z.ZodString;
            signature: z.ZodString;
            header: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
          },
          z.core.$strip
        >
      >
    >;
  },
  z.core.$strip
>;
export declare const MessageSendParamsSchema: z.ZodObject<
  {
    message: z.ZodObject<
      {
        role: z.ZodEnum<{
          user: 'user';
          agent: 'agent';
        }>;
        parts: z.ZodArray<
          z.ZodUnion<
            readonly [
              z.ZodObject<
                {
                  kind: z.ZodLiteral<'text'>;
                  text: z.ZodString;
                  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                },
                z.core.$strip
              >,
              z.ZodObject<
                {
                  kind: z.ZodLiteral<'file'>;
                  file: z.ZodUnion<
                    readonly [
                      z.ZodObject<
                        {
                          bytes: z.ZodString;
                          name: z.ZodOptional<z.ZodString>;
                          mimeType: z.ZodOptional<z.ZodString>;
                        },
                        z.core.$strip
                      >,
                      z.ZodObject<
                        {
                          uri: z.ZodString;
                          name: z.ZodOptional<z.ZodString>;
                          mimeType: z.ZodOptional<z.ZodString>;
                        },
                        z.core.$strip
                      >,
                    ]
                  >;
                  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                },
                z.core.$strip
              >,
              z.ZodObject<
                {
                  kind: z.ZodLiteral<'data'>;
                  data: z.ZodRecord<z.ZodString, z.ZodAny>;
                  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                },
                z.core.$strip
              >,
            ]
          >
        >;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        extensions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        referenceTaskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        messageId: z.ZodString;
        taskId: z.ZodOptional<z.ZodString>;
        contextId: z.ZodOptional<z.ZodString>;
        kind: z.ZodLiteral<'message'>;
      },
      z.core.$strip
    >;
    configuration: z.ZodOptional<
      z.ZodObject<
        {
          acceptedOutputModes: z.ZodOptional<z.ZodArray<z.ZodString>>;
          historyLength: z.ZodOptional<z.ZodNumber>;
          pushNotificationConfig: z.ZodOptional<
            z.ZodObject<
              {
                id: z.ZodOptional<z.ZodString>;
                url: z.ZodString;
                token: z.ZodOptional<z.ZodString>;
                authentication: z.ZodOptional<
                  z.ZodObject<
                    {
                      schemes: z.ZodArray<z.ZodString>;
                      credentials: z.ZodOptional<z.ZodString>;
                    },
                    z.core.$strip
                  >
                >;
              },
              z.core.$strip
            >
          >;
          blocking: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
/**
 * @deprecated Use TaskState instead
 */
export declare enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  IDLE = 'idle',
  ERROR = 'error',
}
/**
 * @deprecated Use appropriate A2A v0.3.0 types instead
 */
export declare enum A2AMessageType {
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
/**
 * @deprecated Use A2A v0.3.0 priority in metadata instead
 */
export declare enum A2APriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  BATCH = 5,
}
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
export declare enum AgentType {
  COORDINATOR = 'coordinator',
  WORKER = 'worker',
  SPECIALIST = 'specialist',
  MONITOR = 'monitor',
  GATEWAY = 'gateway',
}
export declare enum LoadBalancingStrategy {
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
export declare const AgentCapabilitySchema: z.ZodObject<
  {
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
export declare const AgentRegistrationSchema: z.ZodObject<
  {
    agentId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<typeof AgentType>;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodArray<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    endpoints: z.ZodOptional<
      z.ZodObject<
        {
          websocket: z.ZodOptional<z.ZodString>;
          http: z.ZodOptional<z.ZodString>;
          redis: z.ZodOptional<z.ZodString>;
        },
        z.core.$strip
      >
    >;
    authentication: z.ZodOptional<
      z.ZodObject<
        {
          type: z.ZodEnum<{
            none: 'none';
            token: 'token';
            certificate: 'certificate';
          }>;
          credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        },
        z.core.$strip
      >
    >;
    maxConcurrentRequests: z.ZodOptional<z.ZodNumber>;
    averageResponseTime: z.ZodOptional<z.ZodNumber>;
    reliability: z.ZodOptional<z.ZodNumber>;
    lastSeen: z.ZodOptional<z.ZodNumber>;
    isOnline: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
>;
export declare const A2AMessageSchema: z.ZodObject<
  {
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
  },
  z.core.$strip
>;
export declare const AgentHeartbeatSchema: z.ZodObject<
  {
    agentId: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<typeof AgentStatus>;
    load: z.ZodOptional<z.ZodNumber>;
    activeConnections: z.ZodOptional<z.ZodNumber>;
    lastActivity: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
export declare const ConversationSchema: z.ZodObject<
  {
    id: z.ZodString;
    participants: z.ZodArray<z.ZodString>;
    initiator: z.ZodString;
    topic: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
      active: 'active';
      completed: 'completed';
      paused: 'paused';
      failed: 'failed';
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
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
  sendRequest(
    fromAgent: string,
    toAgent: string,
    payload: any,
    options?: {
      timeout?: number;
      priority?: A2APriority;
      conversationId?: string;
    }
  ): Promise<A2AMessage>;
  broadcast(
    fromAgent: string,
    payload: any,
    options?: {
      channel?: string;
      topic?: string;
      priority?: A2APriority;
    }
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
export declare class A2AError extends Error {
  code: string;
  agentId?: string | undefined;
  messageId?: string | undefined;
  constructor(
    message: string,
    code: string,
    agentId?: string | undefined,
    messageId?: string | undefined
  );
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
