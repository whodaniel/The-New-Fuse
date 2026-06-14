/**
 * @title A2A (Agent2Agent) Protocol
 * @description This file defines the interfaces and types for the Agent2Agent (A2A) specification.
 * The A2A specification facilitates interoperability between AI agents and clients.
 */
/**
 * Represents the service provider of an agent.
 *
 * @TJS-examples [{ "organization": "Google", "url": "https://ai.google.dev" }]
 */
export interface AgentProvider {
    /** The name of the agent provider's organization. */
    organization: string;
    /** A URL for the agent provider's website or relevant documentation. */
    url: string;
}
/**
 * Defines optional capabilities supported by an agent.
 */
export interface AgentCapabilities {
    /** Indicates if the agent supports Server-Sent Events (SSE) for streaming responses. */
    streaming?: boolean;
    /** Indicates if the agent supports sending push notifications for asynchronous task updates. */
    pushNotifications?: boolean;
    /** Indicates if the agent provides a history of state transitions for a task. */
    stateTransitionHistory?: boolean;
    /** A list of protocol extensions supported by the agent. */
    extensions?: AgentExtension[];
}
/**
 * A declaration of a protocol extension supported by an Agent.
 *
 * @TJS-examples [{"uri": "https://developers.google.com/identity/protocols/oauth2", "description": "Google OAuth 2.0 authentication", "required": false}]
 */
export interface AgentExtension {
    /** The unique URI identifying the extension. */
    uri: string;
    /** A human-readable description of how this agent uses the extension. */
    description?: string;
    /**
     * If true, the client must understand and comply with the extension's requirements
     * to interact with the agent.
     */
    required?: boolean;
    /** Optional, extension-specific configuration parameters. */
    params?: {
        [key: string]: any;
    };
}
/**
 * Defines a security scheme that can be used to secure an agent's endpoints.
 * This is a discriminated union type based on the OpenAPI 3.0 Security Scheme Object.
 *
 * @see {@link https://swagger.io/specification/#security-scheme-object}
 */
export type SecurityScheme = APIKeySecurityScheme | HTTPAuthSecurityScheme | OAuth2SecurityScheme | OpenIdConnectSecurityScheme | MutualTLSSecurityScheme;
/**
 * Defines base properties shared by all security scheme objects.
 */
export interface SecuritySchemeBase {
    /** An optional description for the security scheme. */
    description?: string;
}
/**
 * Defines a security scheme using an API key.
 */
export interface APIKeySecurityScheme extends SecuritySchemeBase {
    /** The type of the security scheme. Must be 'apiKey'. */
    readonly type: "apiKey";
    /** The location of the API key. */
    readonly in: "query" | "header" | "cookie";
    /** The name of the header, query, or cookie parameter to be used. */
    name: string;
}
/**
 * Defines a security scheme using HTTP authentication.
 */
export interface HTTPAuthSecurityScheme extends SecuritySchemeBase {
    /** The type of the security scheme. Must be 'http'. */
    readonly type: "http";
    /**
     * The name of the HTTP Authentication scheme to be used in the Authorization header,
     * as defined in RFC7235 (e.g., "Bearer").
     * This value should be registered in the IANA Authentication Scheme registry.
     */
    scheme: string;
    /**
     * A hint to the client to identify how the bearer token is formatted (e.g., "JWT").
     * This is primarily for documentation purposes.
     */
    bearerFormat?: string;
}
/**
 * Defines a security scheme using mTLS authentication.
 */
export interface MutualTLSSecurityScheme extends SecuritySchemeBase {
    /** The type of the security scheme. Must be 'mutualTLS'. */
    readonly type: "mutualTLS";
}
/**
 * Defines a security scheme using OAuth 2.0.
 */
export interface OAuth2SecurityScheme extends SecuritySchemeBase {
    /** The type of the security scheme. Must be 'oauth2'. */
    readonly type: "oauth2";
    /** An object containing configuration information for the supported OAuth 2.0 flows. */
    flows: OAuthFlows;
    /**
     * URL to the oauth2 authorization server metadata
     * [RFC8414](https://datatracker.ietf.org/doc/html/rfc8414). TLS is required.
     */
    oauth2MetadataUrl?: string;
}
/**
 * Defines a security scheme using OpenID Connect.
 */
export interface OpenIdConnectSecurityScheme extends SecuritySchemeBase {
    /** The type of the security scheme. Must be 'openIdConnect'. */
    readonly type: "openIdConnect";
    /**
     * The OpenID Connect Discovery URL for the OIDC provider's metadata.
     * @see {@link https://openid.net/specs/openid-connect-discovery-1_0.html}
     */
    openIdConnectUrl: string;
}
/**
 * Defines the configuration for the supported OAuth 2.0 flows.
 */
export interface OAuthFlows {
    /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
    authorizationCode?: AuthorizationCodeOAuthFlow;
    /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
    clientCredentials?: ClientCredentialsOAuthFlow;
    /** Configuration for the OAuth Implicit flow. */
    implicit?: ImplicitOAuthFlow;
    /** Configuration for the OAuth Resource Owner Password flow. */
    password?: PasswordOAuthFlow;
}
/**
 * Defines configuration details for the OAuth 2.0 Authorization Code flow.
 */
export interface AuthorizationCodeOAuthFlow {
    /**
     * The authorization URL to be used for this flow.
     * This MUST be a URL and use TLS.
     */
    authorizationUrl: string;
    /**
     * The token URL to be used for this flow.
     * This MUST be a URL and use TLS.
     */
    tokenUrl: string;
    /**
     * The URL to be used for obtaining refresh tokens.
     * This MUST be a URL and use TLS.
     */
    refreshUrl?: string;
    /**
     * The available scopes for the OAuth2 security scheme. A map between the scope
     * name and a short description for it.
     */
    scopes: {
        [name: string]: string;
    };
}
/**
 * Defines configuration details for the OAuth 2.0 Client Credentials flow.
 */
export interface ClientCredentialsOAuthFlow {
    /**
     * The token URL to be used for this flow. This MUST be a URL.
     */
    tokenUrl: string;
    /**
     * The URL to be used for obtaining refresh tokens. This MUST be a URL.
     */
    refreshUrl?: string;
    /**
     * The available scopes for the OAuth2 security scheme. A map between the scope
     * name and a short description for it.
     */
    scopes: {
        [name: string]: string;
    };
}
/**
 * Defines configuration details for the OAuth 2.0 Implicit flow.
 */
export interface ImplicitOAuthFlow {
    /**
     * The authorization URL to be used for this flow. This MUST be a URL.
     */
    authorizationUrl: string;
    /**
     * The URL to be used for obtaining refresh tokens. This MUST be a URL.
     */
    refreshUrl?: string;
    /**
     * The available scopes for the OAuth2 security scheme. A map between the scope
     * name and a short description for it.
     */
    scopes: {
        [name: string]: string;
    };
}
/**
 * Defines configuration details for the OAuth 2.0 Resource Owner Password flow.
 */
export interface PasswordOAuthFlow {
    /**
     * The token URL to be used for this flow. This MUST be a URL.
     */
    tokenUrl: string;
    /**
     * The URL to be used for obtaining refresh tokens. This MUST be a URL.
     */
    refreshUrl?: string;
    /**
     * The available scopes for the OAuth2 security scheme. A map between the scope
     * name and a short description for it.
     */
    scopes: {
        [name: string]: string;
    };
}
/**
 * Represents a distinct capability or function that an agent can perform.
 */
export interface AgentSkill {
    /** A unique identifier for the agent's skill. */
    id: string;
    /** A human-readable name for the skill. */
    name: string;
    /**
     * A detailed description of the skill, intended to help clients or users
     * understand its purpose and functionality.
     */
    description: string;
    /**
     * A set of keywords describing the skill's capabilities.
     *
     * @TJS-examples [["cooking", "customer support", "billing"]]
     */
    tags: string[];
    /**
     * Example prompts or scenarios that this skill can handle. Provides a hint to
     * the client on how to use the skill.
     *
     * @TJS-examples [["I need a recipe for bread"]]
     */
    examples?: string[];
    /**
     * The set of supported input MIME types for this skill, overriding the agent's defaults.
     */
    inputModes?: string[];
    /**
     * The set of supported output MIME types for this skill, overriding the agent's defaults.
     */
    outputModes?: string[];
    /**
     * Security schemes necessary for the agent to leverage this skill.
     * As in the overall AgentCard.security, this list represents a logical OR of security
     * requirement objects. Each object is a set of security schemes that must be used together
     * (a logical AND).
     *
     * @TJS-examples [[{"google": ["oidc"]}]]
     */
    security?: {
        [scheme: string]: string[];
    }[];
}
/**
 * Supported A2A transport protocols.
 */
export declare enum TransportProtocol {
    JSONRPC = "JSONRPC",// JSON-RPC 2.0 over HTTP (mandatory)
    GRPC = "GRPC",// gRPC over HTTP/2 (optional)
    HTTP_JSON = "HTTP+JSON"
}
/**
 * Declares a combination of a target URL and a transport protocol for interacting with the agent.
 * This allows agents to expose the same functionality over multiple transport mechanisms.
 */
export interface AgentInterface {
    /**
     * The URL where this interface is available. Must be a valid absolute HTTPS URL in production.
     * @TJS-examples ["https://api.example.com/a2a/v1", "https://grpc.example.com/a2a", "https://rest.example.com/v1"]
     */
    url: string;
    /**
     * The transport protocol supported at this URL.
     *
     * @TJS-examples ["JSONRPC", "GRPC", "HTTP+JSON"]
     */
    transport: TransportProtocol | string;
}
/**
 * AgentCardSignature represents a JWS signature of an AgentCard.
 * This follows the JSON format of an RFC 7515 JSON Web Signature (JWS).
 */
export interface AgentCardSignature {
    /**
     * The protected JWS header for the signature. This is a Base64url-encoded
     * JSON object, as per RFC 7515.
     */
    protected: string;
    /** The computed signature, Base64url-encoded. */
    signature: string;
    /** The unprotected JWS header values. */
    header?: {
        [key: string]: any;
    };
}
/**
 * The AgentCard is a self-describing manifest for an agent. It provides essential
 * metadata including the agent's identity, capabilities, skills, supported
 * communication methods, and security requirements.
 */
export interface AgentCard {
    /**
     * The version of the A2A protocol this agent supports.
     * @default "0.3.0"
     */
    protocolVersion: string;
    /**
     * A human-readable name for the agent.
     *
     * @TJS-examples ["Recipe Agent"]
     */
    name: string;
    /**
     * A human-readable description of the agent, assisting users and other agents
     * in understanding its purpose.
     *
     * @TJS-examples ["Agent that helps users with recipes and cooking."]
     */
    description: string;
    /**
     * The preferred endpoint URL for interacting with the agent.
     * This URL MUST support the transport specified by 'preferredTransport'.
     *
     * @TJS-examples ["https://api.example.com/a2a/v1"]
     */
    url: string;
    /**
     * The transport protocol for the preferred endpoint (the main 'url' field).
     * If not specified, defaults to 'JSONRPC'.
     *
     * IMPORTANT: The transport specified here MUST be available at the main 'url'.
     * This creates a binding between the main URL and its supported transport protocol.
     * Clients should prefer this transport and URL combination when both are supported.
     *
     * @default "JSONRPC"
     * @TJS-examples ["JSONRPC", "GRPC", "HTTP+JSON"]
     */
    preferredTransport?: TransportProtocol | string;
    /**
     * A list of additional supported interfaces (transport and URL combinations).
     * This allows agents to expose multiple transports, potentially at different URLs.
     *
     * Best practices:
     * - SHOULD include all supported transports for completeness
     * - SHOULD include an entry matching the main 'url' and 'preferredTransport'
     * - MAY reuse URLs if multiple transports are available at the same endpoint
     * - MUST accurately declare the transport available at each URL
     *
     * Clients can select any interface from this list based on their transport capabilities
     * and preferences. This enables transport negotiation and fallback scenarios.
     */
    additionalInterfaces?: AgentInterface[];
    /** An optional URL to an icon for the agent. */
    iconUrl?: string;
    /** Information about the agent's service provider. */
    provider?: AgentProvider;
    /**
     * The agent's own version number. The format is defined by the provider.
     *
     * @TJS-examples ["1.0.0"]
     */
    version: string;
    /** An optional URL to the agent's documentation. */
    documentationUrl?: string;
    /** A declaration of optional capabilities supported by the agent. */
    capabilities: AgentCapabilities;
    /**
     * A declaration of the security schemes available to authorize requests. The key is the
     * scheme name. Follows the OpenAPI 3.0 Security Scheme Object.
     */
    securitySchemes?: {
        [scheme: string]: SecurityScheme;
    };
    /**
     * A list of security requirement objects that apply to all agent interactions. Each object
     * lists security schemes that can be used. Follows the OpenAPI 3.0 Security Requirement Object.
     * This list can be seen as an OR of ANDs. Each object in the list describes one possible
     * set of security requirements that must be present on a request. This allows specifying,
     * for example, "callers must either use OAuth OR an API Key AND mTLS."
     *
     * @TJS-examples [[{"oauth": ["read"]}, {"api-key": [], "mtls": []}]]
     */
    security?: {
        [scheme: string]: string[];
    }[];
    /**
     * Default set of supported input MIME types for all skills, which can be
     * overridden on a per-skill basis.
     */
    defaultInputModes: string[];
    /**
     * Default set of supported output MIME types for all skills, which can be
     * overridden on a per-skill basis.
     */
    defaultOutputModes: string[];
    /** The set of skills, or distinct capabilities, that the agent can perform. */
    skills: AgentSkill[];
    /**
     * If true, the agent can provide an extended agent card with additional details
     * to authenticated users. Defaults to false.
     */
    supportsAuthenticatedExtendedCard?: boolean;
    /** JSON Web Signatures computed for this AgentCard. */
    signatures?: AgentCardSignature[];
}
/**
 * Represents a single, stateful operation or conversation between a client and an agent.
 */
export interface Task {
    /** A unique identifier for the task, generated by the server for a new task. */
    id: string;
    /** A server-generated identifier for maintaining context across multiple related tasks or interactions. */
    contextId: string;
    /** The current status of the task, including its state and a descriptive message. */
    status: TaskStatus;
    /** An array of messages exchanged during the task, representing the conversation history. */
    history?: Message[];
    /** A collection of artifacts generated by the agent during the execution of the task. */
    artifacts?: Artifact[];
    /** Optional metadata for extensions. The key is an extension-specific identifier. */
    metadata?: {
        [key: string]: any;
    };
    /** The type of this object, used as a discriminator. Always 'task' for a Task. */
    readonly kind: "task";
}
/**
 * Represents the status of a task at a specific point in time.
 */
export interface TaskStatus {
    /** The current state of the task's lifecycle. */
    state: TaskState;
    /** An optional, human-readable message providing more details about the current status. */
    message?: Message;
    /**
     * An ISO 8601 datetime string indicating when this status was recorded.
     *
     * @TJS-examples ["2023-10-27T10:00:00Z"]
     */
    timestamp?: string;
}
/**
 * An event sent by the agent to notify the client of a change in a task's status.
 * This is typically used in streaming or subscription models.
 */
export interface TaskStatusUpdateEvent {
    /** The ID of the task that was updated. */
    taskId: string;
    /** The context ID associated with the task. */
    contextId: string;
    /** The type of this event, used as a discriminator. Always 'status-update'. */
    readonly kind: "status-update";
    /** The new status of the task. */
    status: TaskStatus;
    /** If true, this is the final event in the stream for this interaction. */
    final: boolean;
    /** Optional metadata for extensions. */
    metadata?: {
        [key: string]: any;
    };
}
/**
 * An event sent by the agent to notify the client that an artifact has been
 * generated or updated. This is typically used in streaming models.
 */
export interface TaskArtifactUpdateEvent {
    /** The ID of the task this artifact belongs to. */
    taskId: string;
    /** The context ID associated with the task. */
    contextId: string;
    /** The type of this event, used as a discriminator. Always 'artifact-update'. */
    readonly kind: "artifact-update";
    /** The artifact that was generated or updated. */
    artifact: Artifact;
    /** If true, the content of this artifact should be appended to a previously sent artifact with the same ID. */
    append?: boolean;
    /** If true, this is the final chunk of the artifact. */
    lastChunk?: boolean;
    /** Optional metadata for extensions. */
    metadata?: {
        [key: string]: any;
    };
}
/**
 * Defines parameters containing a task ID, used for simple task operations.
 */
export interface TaskIdParams {
    /** The unique identifier of the task. */
    id: string;
    /** Optional metadata associated with the request. */
    metadata?: {
        [key: string]: any;
    };
}
/**
 * Defines parameters for querying a task, with an option to limit history length.
 */
export interface TaskQueryParams extends TaskIdParams {
    /** The number of most recent messages from the task's history to retrieve. */
    historyLength?: number;
}
/**
 * Defines parameters for fetching a specific push notification configuration for a task.
 */
export interface GetTaskPushNotificationConfigParams extends TaskIdParams {
    /** The ID of the push notification configuration to retrieve. */
    pushNotificationConfigId?: string;
}
/**
 * Defines parameters for listing all push notification configurations associated with a task.
 */
export interface ListTaskPushNotificationConfigParams extends TaskIdParams {
}
/**
 * Defines parameters for deleting a specific push notification configuration for a task.
 */
export interface DeleteTaskPushNotificationConfigParams extends TaskIdParams {
    /** The ID of the push notification configuration to delete. */
    pushNotificationConfigId: string;
}
/**
 * Defines configuration options for a `message/send` or `message/stream` request.
 */
export interface MessageSendConfiguration {
    /** A list of output MIME types the client is prepared to accept in the response. */
    acceptedOutputModes?: string[];
    /** The number of most recent messages from the task's history to retrieve in the response. */
    historyLength?: number;
    /** Configuration for the agent to send push notifications for updates after the initial response. */
    pushNotificationConfig?: PushNotificationConfig;
    /** If true, the client will wait for the task to complete. The server may reject this if the task is long-running. */
    blocking?: boolean;
}
/**
 * Defines the parameters for a request to send a message to an agent. This can be used
 * to create a new task, continue an existing one, or restart a task.
 */
export interface MessageSendParams {
    /** The message object being sent to the agent. */
    message: Message;
    /** Optional configuration for the send request. */
    configuration?: MessageSendConfiguration;
    /** Optional metadata for extensions. */
    metadata?: {
        [key: string]: any;
    };
}
/**
 * Defines the lifecycle states of a Task.
 */
export declare enum TaskState {
    /** The task has been submitted and is awaiting execution. */
    Submitted = "submitted",
    /** The agent is actively working on the task. */
    Working = "working",
    /** The task is paused and waiting for input from the user. */
    InputRequired = "input-required",
    /** The task has been successfully completed. */
    Completed = "completed",
    /** The task has been canceled by the user. */
    Canceled = "canceled",
    /** The task failed due to an error during execution. */
    Failed = "failed",
    /** The task was rejected by the agent and was not started. */
    Rejected = "rejected",
    /** The task requires authentication to proceed. */
    AuthRequired = "auth-required",
    /** The task is in an unknown or indeterminate state. */
    Unknown = "unknown"
}
/**
 * Represents a file, data structure, or other resource generated by an agent during a task.
 */
export interface Artifact {
    /** A unique identifier for the artifact within the scope of the task. */
    artifactId: string;
    /** An optional, human-readable name for the artifact. */
    name?: string;
    /** An optional, human-readable description of the artifact. */
    description?: string;
    /** An array of content parts that make up the artifact. */
    parts: Part[];
    /** Optional metadata for extensions. The key is an extension-specific identifier. */
    metadata?: {
        [key: string]: any;
    };
    /** The URIs of extensions that are relevant to this artifact. */
    extensions?: string[];
}
/**
 * Represents a single message in the conversation between a user and an agent.
 */
export interface Message {
    /** Identifies the sender of the message. `user` for the client, `agent` for the service. */
    readonly role: "user" | "agent";
    /**
     * An array of content parts that form the message body. A message can be
     * composed of multiple parts of different types (e.g., text and files).
     */
    parts: Part[];
    /** Optional metadata for extensions. The key is an extension-specific identifier. */
    metadata?: {
        [key: string]: any;
    };
    /** The URIs of extensions that are relevant to this message. */
    extensions?: string[];
    /** A list of other task IDs that this message references for additional context. */
    referenceTaskIds?: string[];
    /** A unique identifier for the message, typically a UUID, generated by the sender. */
    messageId: string;
    /** The identifier of the task this message is part of. Can be omitted for the first message of a new task. */
    taskId?: string;
    /** The context identifier for this message, used to group related interactions. */
    contextId?: string;
    /** The type of this object, used as a discriminator. Always 'message' for a Message. */
    readonly kind: "message";
}
/**
 * Defines base properties common to all message or artifact parts.
 */
export interface PartBase {
    /** Optional metadata associated with this part. */
    metadata?: {
        [key: string]: any;
    };
}
/**
 * Represents a text segment within a message or artifact.
 */
export interface TextPart extends PartBase {
    /** The type of this part, used as a discriminator. Always 'text'. */
    readonly kind: "text";
    /** The string content of the text part. */
    text: string;
}
/**
 * Defines base properties for a file.
 */
export interface FileBase {
    /** An optional name for the file (e.g., "document.pdf"). */
    name?: string;
    /** The MIME type of the file (e.g., "application/pdf"). */
    mimeType?: string;
}
/**
 * Represents a file with its content provided directly as a base64-encoded string.
 */
export interface FileWithBytes extends FileBase {
    /** The base64-encoded content of the file. */
    bytes: string;
    /** The `uri` property must be absent when `bytes` is present. */
    uri?: never;
}
/**
 * Represents a file with its content located at a specific URI.
 */
export interface FileWithUri extends FileBase {
    /** A URL pointing to the file's content. */
    uri: string;
    /** The `bytes` property must be absent when `uri` is present. */
    bytes?: never;
}
/**
 * Represents a file segment within a message or artifact. The file content can be
 * provided either directly as bytes or as a URI.
 */
export interface FilePart extends PartBase {
    /** The type of this part, used as a discriminator. Always 'file'. */
    readonly kind: "file";
    /** The file content, represented as either a URI or as base64-encoded bytes. */
    file: FileWithBytes | FileWithUri;
}
/**
 * Represents a structured data segment (e.g., JSON) within a message or artifact.
 */
export interface DataPart extends PartBase {
    /** The type of this part, used as a discriminator. Always 'data'. */
    readonly kind: "data";
    /** The structured data content. */
    data: {
        [key: string]: any;
    };
}
/**
 * A discriminated union representing a part of a message or artifact, which can
 * be text, a file, or structured data.
 */
export type Part = TextPart | FilePart | DataPart;
/**
 * Defines authentication details for a push notification endpoint.
 */
export interface PushNotificationAuthenticationInfo {
    /** A list of supported authentication schemes (e.g., 'Basic', 'Bearer'). */
    schemes: string[];
    /** Optional credentials required by the push notification endpoint. */
    credentials?: string;
}
/**
 * Defines the configuration for setting up push notifications for task updates.
 */
export interface PushNotificationConfig {
    /**
     * A unique ID for the push notification configuration, set by the client
     * to support multiple notification callbacks.
     */
    id?: string;
    /** The callback URL where the agent should send push notifications. */
    url: string;
    /** A unique token for this task or session to validate incoming push notifications. */
    token?: string;
    /** Optional authentication details for the agent to use when calling the notification URL. */
    authentication?: PushNotificationAuthenticationInfo;
}
/**
 * A container associating a push notification configuration with a specific task.
 */
export interface TaskPushNotificationConfig {
    /** The ID of the task. */
    taskId: string;
    /** The push notification configuration for this task. */
    pushNotificationConfig: PushNotificationConfig;
}
/**
 * Defines the base structure for any JSON-RPC 2.0 request, response, or notification.
 */
export interface JSONRPCMessage {
    /**
     * The version of the JSON-RPC protocol. MUST be exactly "2.0".
     */
    readonly jsonrpc: "2.0";
    /**
     * A unique identifier established by the client. It must be a String, a Number, or null.
     * The server must reply with the same value in the response. This property is omitted for notifications.
     *
     * @nullable
     */
    id?: number | string | null;
}
/**
 * Represents a JSON-RPC 2.0 Request object.
 */
export interface JSONRPCRequest extends JSONRPCMessage {
    /**
     * A string containing the name of the method to be invoked.
     */
    method: string;
    /**
     * A structured value holding the parameter values to be used during the method invocation.
     */
    params?: {
        [key: string]: any;
    };
}
/**
 * Represents a JSON-RPC 2.0 Error object, included in an error response.
 */
export interface JSONRPCError {
    /**
     * A number that indicates the error type that occurred.
     */
    code: number;
    /**
     * A string providing a short description of the error.
     */
    message: string;
    /**
     * A primitive or structured value containing additional information about the error.
     * This may be omitted.
     */
    data?: any;
}
/**
 * Represents a successful JSON-RPC 2.0 Response object.
 */
export interface JSONRPCSuccessResponse extends JSONRPCMessage {
    /**
     * The identifier established by the client.
     * @nullable
     */
    id: number | string | null;
    /**
     * The value of this member is determined by the method invoked on the Server.
     */
    result: any;
    /**
     * This field MUST NOT exist in a success response.
     */
    error?: never;
}
/**
 * Represents a JSON-RPC 2.0 Error Response object.
 */
export interface JSONRPCErrorResponse extends JSONRPCMessage {
    /**
     * The identifier established by the client.
     * @nullable
     */
    id: number | string | null;
    /**
     * This field MUST NOT exist in an error response.
     */
    result?: never;
    /**
     * An object describing the error that occurred.
     */
    error: JSONRPCError | A2AError;
}
/**
 * A discriminated union representing all possible JSON-RPC 2.0 responses
 * for the A2A specification methods.
 */
export type JSONRPCResponse = SendMessageResponse | SendStreamingMessageResponse | GetTaskResponse | CancelTaskResponse | SetTaskPushNotificationConfigResponse | GetTaskPushNotificationConfigResponse | ListTaskPushNotificationConfigResponse | DeleteTaskPushNotificationConfigResponse | GetAuthenticatedExtendedCardResponse;
/**
 * Represents a JSON-RPC request for the `message/send` method.
 */
export interface SendMessageRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'message/send'. */
    readonly method: "message/send";
    /** The parameters for sending a message. */
    params: MessageSendParams;
}
/**
 * Represents a successful JSON-RPC response for the `message/send` method.
 */
export interface SendMessageSuccessResponse extends JSONRPCSuccessResponse {
    /** The result, which can be a direct reply Message or the initial Task object. */
    result: Message | Task;
}
/**
 * Represents a JSON-RPC response for the `message/send` method.
 */
export type SendMessageResponse = SendMessageSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `message/stream` method.
 */
export interface SendStreamingMessageRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'message/stream'. */
    readonly method: "message/stream";
    /** The parameters for sending a message. */
    params: MessageSendParams;
}
/**
 * Represents a successful JSON-RPC response for the `message/stream` method.
 * The server may send multiple response objects for a single request.
 */
export interface SendStreamingMessageSuccessResponse extends JSONRPCSuccessResponse {
    /** The result, which can be a Message, Task, or a streaming update event. */
    result: Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
}
/**
 * Represents a JSON-RPC response for the `message/stream` method.
 */
export type SendStreamingMessageResponse = SendStreamingMessageSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `tasks/get` method.
 */
export interface GetTaskRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'tasks/get'. */
    readonly method: "tasks/get";
    /** The parameters for querying a task. */
    params: TaskQueryParams;
}
/**
 * Represents a successful JSON-RPC response for the `tasks/get` method.
 */
export interface GetTaskSuccessResponse extends JSONRPCSuccessResponse {
    /** The result, containing the requested Task object. */
    result: Task;
}
/**
 * Represents a JSON-RPC response for the `tasks/get` method.
 */
export type GetTaskResponse = GetTaskSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `tasks/cancel` method.
 */
export interface CancelTaskRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'tasks/cancel'. */
    readonly method: "tasks/cancel";
    /** The parameters identifying the task to cancel. */
    params: TaskIdParams;
}
/**
 * Represents a successful JSON-RPC response for the `tasks/cancel` method.
 */
export interface CancelTaskSuccessResponse extends JSONRPCSuccessResponse {
    /** The result, containing the final state of the canceled Task object. */
    result: Task;
}
/**
 * Represents a JSON-RPC response for the `tasks/cancel` method.
 */
export type CancelTaskResponse = CancelTaskSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `tasks/pushNotificationConfig/set` method.
 */
export interface SetTaskPushNotificationConfigRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'tasks/pushNotificationConfig/set'. */
    readonly method: "tasks/pushNotificationConfig/set";
    /** The parameters for setting the push notification configuration. */
    params: TaskPushNotificationConfig;
}
/**
 * Represents a successful JSON-RPC response for the `tasks/pushNotificationConfig/set` method.
 */
export interface SetTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
    /** The result, containing the configured push notification settings. */
    result: TaskPushNotificationConfig;
}
/**
 * Represents a JSON-RPC response for the `tasks/pushNotificationConfig/set` method.
 */
export type SetTaskPushNotificationConfigResponse = SetTaskPushNotificationConfigSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `tasks/pushNotificationConfig/get` method.
 */
export interface GetTaskPushNotificationConfigRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'tasks/pushNotificationConfig/get'. */
    readonly method: "tasks/pushNotificationConfig/get";
    /**
     * The parameters for getting a push notification configuration.
     *
     * @deprecated The `TaskIdParams` type is deprecated for this method. Use `GetTaskPushNotificationConfigParams` instead.
     */
    params: GetTaskPushNotificationConfigParams | TaskIdParams;
}
/**
 * Represents a successful JSON-RPC response for the `tasks/pushNotificationConfig/get` method.
 */
export interface GetTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
    /** The result, containing the requested push notification configuration. */
    result: TaskPushNotificationConfig;
}
/**
 * Represents a JSON-RPC response for the `tasks/pushNotificationConfig/get` method.
 */
export type GetTaskPushNotificationConfigResponse = GetTaskPushNotificationConfigSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `tasks/resubscribe` method, used to resume a streaming connection.
 */
export interface TaskResubscriptionRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'tasks/resubscribe'. */
    readonly method: "tasks/resubscribe";
    /** The parameters identifying the task to resubscribe to. */
    params: TaskIdParams;
}
/**
 * Represents a JSON-RPC request for the `tasks/pushNotificationConfig/list` method.
 */
export interface ListTaskPushNotificationConfigRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'tasks/pushNotificationConfig/list'. */
    readonly method: "tasks/pushNotificationConfig/list";
    /** The parameters identifying the task whose configurations are to be listed. */
    params: ListTaskPushNotificationConfigParams;
}
/**
 * Represents a successful JSON-RPC response for the `tasks/pushNotificationConfig/list` method.
 */
export interface ListTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
    /** The result, containing an array of all push notification configurations for the task. */
    result: TaskPushNotificationConfig[];
}
/**
 * Represents a JSON-RPC response for the `tasks/pushNotificationConfig/list` method.
 */
export type ListTaskPushNotificationConfigResponse = ListTaskPushNotificationConfigSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `tasks/pushNotificationConfig/delete` method.
 */
export interface DeleteTaskPushNotificationConfigRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'tasks/pushNotificationConfig/delete'. */
    readonly method: "tasks/pushNotificationConfig/delete";
    /** The parameters identifying the push notification configuration to delete. */
    params: DeleteTaskPushNotificationConfigParams;
}
/**
 * Represents a successful JSON-RPC response for the `tasks/pushNotificationConfig/delete` method.
 */
export interface DeleteTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
    /** The result is null on successful deletion. */
    result: null;
}
/**
 * Represents a JSON-RPC response for the `tasks/pushNotificationConfig/delete` method.
 */
export type DeleteTaskPushNotificationConfigResponse = DeleteTaskPushNotificationConfigSuccessResponse | JSONRPCErrorResponse;
/**
 * Represents a JSON-RPC request for the `agent/getAuthenticatedExtendedCard` method.
 */
export interface GetAuthenticatedExtendedCardRequest extends JSONRPCRequest {
    /** The identifier for this request. */
    id: number | string;
    /** The method name. Must be 'agent/getAuthenticatedExtendedCard'. */
    readonly method: "agent/getAuthenticatedExtendedCard";
    /** This method does not accept parameters. */
    params?: never;
}
/**
 * Represents a successful JSON-RPC response for the `agent/getAuthenticatedExtendedCard` method.
 */
export interface GetAuthenticatedExtendedCardSuccessResponse extends JSONRPCSuccessResponse {
    /** The result is an Agent Card object. */
    result: AgentCard;
}
/**
 * Represents a JSON-RPC response for the `agent/getAuthenticatedExtendedCard` method.
 */
export type GetAuthenticatedExtendedCardResponse = GetAuthenticatedExtendedCardSuccessResponse | JSONRPCErrorResponse;
/**
 * A discriminated union representing all possible JSON-RPC 2.0 requests supported by the A2A specification.
 */
export type A2ARequest = SendMessageRequest | SendStreamingMessageRequest | GetTaskRequest | CancelTaskRequest | SetTaskPushNotificationConfigRequest | GetTaskPushNotificationConfigRequest | TaskResubscriptionRequest | ListTaskPushNotificationConfigRequest | DeleteTaskPushNotificationConfigRequest | GetAuthenticatedExtendedCardRequest;
/**
 * An error indicating that the server received invalid JSON.
 */
export interface JSONParseError extends JSONRPCError {
    /** The error code for a JSON parse error. */
    readonly code: -32700;
    /**
     * The error message.
     * @default "Invalid JSON payload"
     */
    message: string;
}
/**
 * An error indicating that the JSON sent is not a valid Request object.
 */
export interface InvalidRequestError extends JSONRPCError {
    /** The error code for an invalid request. */
    readonly code: -32600;
    /**
     * The error message.
     * @default "Request payload validation error"
     */
    message: string;
}
/**
 * An error indicating that the requested method does not exist or is not available.
 */
export interface MethodNotFoundError extends JSONRPCError {
    /** The error code for a method not found error. */
    readonly code: -32601;
    /**
     * The error message.
     * @default "Method not found"
     */
    message: string;
}
/**
 * An error indicating that the method parameters are invalid.
 */
export interface InvalidParamsError extends JSONRPCError {
    /** The error code for an invalid parameters error. */
    readonly code: -32602;
    /**
     * The error message.
     * @default "Invalid parameters"
     */
    message: string;
}
/**
 * An error indicating an internal error on the server.
 */
export interface InternalError extends JSONRPCError {
    /** The error code for an internal server error. */
    readonly code: -32603;
    /**
     * The error message.
     * @default "Internal error"
     */
    message: string;
}
/**
 * An A2A-specific error indicating that the requested task ID was not found.
 */
export interface TaskNotFoundError extends JSONRPCError {
    /** The error code for a task not found error. */
    readonly code: -32001;
    /**
     * The error message.
     * @default "Task not found"
     */
    message: string;
}
/**
 * An A2A-specific error indicating that the task is in a state where it cannot be canceled.
 */
export interface TaskNotCancelableError extends JSONRPCError {
    /** The error code for a task that cannot be canceled. */
    readonly code: -32002;
    /**
     * The error message.
     * @default "Task cannot be canceled"
     */
    message: string;
}
/**
 * An A2A-specific error indicating that the agent does not support push notifications.
 */
export interface PushNotificationNotSupportedError extends JSONRPCError {
    /** The error code for when push notifications are not supported. */
    readonly code: -32003;
    /**
     * The error message.
     * @default "Push Notification is not supported"
     */
    message: string;
}
/**
 * An A2A-specific error indicating that the requested operation is not supported by the agent.
 */
export interface UnsupportedOperationError extends JSONRPCError {
    /** The error code for an unsupported operation. */
    readonly code: -32004;
    /**
     * The error message.
     * @default "This operation is not supported"
     */
    message: string;
}
/**
 * An A2A-specific error indicating an incompatibility between the requested
 * content types and the agent's capabilities.
 */
export interface ContentTypeNotSupportedError extends JSONRPCError {
    /** The error code for an unsupported content type. */
    readonly code: -32005;
    /**
     * The error message.
     * @default "Incompatible content types"
     */
    message: string;
}
/**
 * An A2A-specific error indicating that the agent returned a response that
 * does not conform to the specification for the current method.
 */
export interface InvalidAgentResponseError extends JSONRPCError {
    /** The error code for an invalid agent response. */
    readonly code: -32006;
    /**
     * The error message.
     * @default "Invalid agent response"
     */
    message: string;
}
/**
 * An A2A-specific error indicating that the agent does not have an Authenticated Extended Card configured
 */
export interface AuthenticatedExtendedCardNotConfiguredError extends JSONRPCError {
    /** The error code for when an authenticated extended card is not configured. */
    readonly code: -32007;
    /**
     * The error message.
     * @default "Authenticated Extended Card is not configured"
     */
    message: string;
}
/**
 * A discriminated union of all standard JSON-RPC and A2A-specific error types.
 */
export type A2AError = JSONParseError | InvalidRequestError | MethodNotFoundError | InvalidParamsError | InternalError | TaskNotFoundError | TaskNotCancelableError | PushNotificationNotSupportedError | UnsupportedOperationError | ContentTypeNotSupportedError | InvalidAgentResponseError | AuthenticatedExtendedCardNotConfiguredError;
