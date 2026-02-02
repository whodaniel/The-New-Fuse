/**
 * TNF CLI Types - A2A Protocol Compliant
 *
 * This file defines the TypeScript types aligned with A2A protocol v0.3.0
 * and extends them with TNF-specific functionality.
 */

import { z } from 'zod';

// ============================================================================
// A2A Protocol v0.3.0 Types
// ============================================================================

export const A2A_PROTOCOL_VERSION = '0.3.0';

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

export enum TransportProtocol {
  JSONRPC = 'JSONRPC',
  GRPC = 'GRPC',
  HTTP_JSON = 'HTTP+JSON',
  REDIS = 'REDIS',
  WEBSOCKET = 'WEBSOCKET',
}

// ============================================================================
// Security Types
// ============================================================================

export interface SecuritySchemeBase {
  description?: string;
}

export interface APIKeySecurityScheme extends SecuritySchemeBase {
  readonly type: 'apiKey';
  readonly in: 'query' | 'header' | 'cookie';
  name: string;
}

export interface HTTPAuthSecurityScheme extends SecuritySchemeBase {
  readonly type: 'http';
  scheme: string;
  bearerFormat?: string;
}

export interface OAuth2SecurityScheme extends SecuritySchemeBase {
  readonly type: 'oauth2';
  flows: OAuthFlows;
}

export interface OAuthFlows {
  authorizationCode?: {
    authorizationUrl: string;
    tokenUrl: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
  };
  clientCredentials?: {
    tokenUrl: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
  };
}

export type SecurityScheme = APIKeySecurityScheme | HTTPAuthSecurityScheme | OAuth2SecurityScheme;

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentProvider {
  organization: string;
  url: string;
}

export interface AgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
  params?: Record<string, any>;
}

export interface A2AAgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
  extensions?: AgentExtension[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
  security?: Record<string, string[]>[];
}

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
  securitySchemes?: Record<string, SecurityScheme>;
  security?: Record<string, string[]>[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
}

export interface AgentInterface {
  url: string;
  transport: TransportProtocol | string;
}

// ============================================================================
// Legacy Agent Types (backward compatibility)
// ============================================================================

export type AgentRole = 'orchestrator' | 'broker' | 'worker' | 'participant';
export type AgentPlatform =
  | 'antigravity'
  | 'gemini'
  | 'claude'
  | 'jules'
  | 'vscode'
  | 'browser'
  | string;

export interface AgentInfo {
  id: string;
  name: string;
  role: AgentRole;
  platform: AgentPlatform;
  status: 'active' | 'idle' | 'offline' | 'error';
  capabilities: string[];
  registeredAt: string;
  lastSeen: string;
  isOnline?: boolean;
  agentCard?: AgentCard;
  authToken?: string;
  permissions?: AgentPermission[];
}

export type AgentPermission =
  | 'read:agents'
  | 'write:agents'
  | 'read:messages'
  | 'write:messages'
  | 'read:tasks'
  | 'write:tasks'
  | 'admin:*';

// ============================================================================
// Message Types
// ============================================================================

export interface PartBase {
  metadata?: Record<string, any>;
}

export interface TextPart extends PartBase {
  readonly kind: 'text';
  text: string;
}

export interface FileBase {
  name?: string;
  mimeType?: string;
}

export interface FileWithBytes extends FileBase {
  bytes: string;
  uri?: never;
}

export interface FileWithUri extends FileBase {
  uri: string;
  bytes?: never;
}

export interface FilePart extends PartBase {
  readonly kind: 'file';
  file: FileWithBytes | FileWithUri;
}

export interface DataPart extends PartBase {
  readonly kind: 'data';
  data: Record<string, any>;
}

export type Part = TextPart | FilePart | DataPart;

export type MessageType =
  | 'message'
  | 'command'
  | 'response'
  | 'heartbeat'
  | 'status'
  | 'ack'
  | 'nack'
  | 'error';

export interface AgentMessage {
  id: string;
  traceId: string;
  timestamp: string;
  from: {
    agentId: string;
    agentName: string;
    role: string;
    platform: string;
  };
  to?: {
    agentId?: string;
    channel?: string;
    role?: string;
    broadcast?: boolean;
  };
  type: MessageType;
  content: string;
  parts?: Part[];
  conversationId?: string;
  replyTo?: string;
  expectsResponse?: boolean;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;
    retryCount?: number;
    maxRetries?: number;
    event?: string;
    [key: string]: any;
  };
}

export interface MessageAck {
  messageId: string;
  traceId: string;
  timestamp: string;
  status: 'acknowledged' | 'rejected';
  reason?: string;
  processedAt?: string;
}

// ============================================================================
// Task Types
// ============================================================================

export interface TaskStatus {
  state: TaskState;
  message?: string;
  timestamp?: string;
  progress?: number;
  error?: TaskError;
}

export interface TaskError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stackTrace?: string;
}

export interface Artifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Task {
  id: string;
  contextId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo?: string;
  createdBy: string;
  history: AgentMessage[];
  artifacts: Artifact[];
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    tags?: string[];
    deadline?: string;
    dependencies?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  tags?: string[];
  deadline?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// Workflow Types
// ============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  task: string;
  dependsOn?: string[];
  condition?: string;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  metadata?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep?: string;
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  stepResults: Map<string, StepResult>;
  startedAt: string;
  completedAt?: string;
}

export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: any;
  error?: TaskError;
  startedAt?: string;
  completedAt?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface CLIConfig {
  agent: {
    name: string;
    role: AgentRole;
    platform: AgentPlatform;
    capabilities: string[];
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    tls?: {
      enabled: boolean;
      ca?: string;
      cert?: string;
      key?: string;
    };
    keyPrefix: string;
  };
  auth: {
    type: 'none' | 'apiKey' | 'jwt' | 'oauth2';
    apiKey?: string;
    jwtSecret?: string;
    oauth2?: OAuth2Config;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
    output: 'console' | 'file' | 'both';
    filePath?: string;
    includeTraceId: boolean;
  };
  reliability: {
    messageTimeoutMs: number;
    maxRetries: number;
    retryDelayMs: number;
    enableAcks: boolean;
    deadLetterQueue: boolean;
  };
  heartbeat: {
    intervalMs: number;
    timeoutMs: number;
    maxRetries: number;
  };
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
}

export interface Profile {
  name: string;
  config: CLIConfig;
}

// ============================================================================
// Logging Types
// ============================================================================

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  traceId?: string;
  agentId?: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// ============================================================================
// Circuit Breaker Types
// ============================================================================

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  halfOpenMaxCalls: number;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const AgentInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['orchestrator', 'broker', 'worker', 'participant']),
  platform: z.string(),
  status: z.enum(['active', 'idle', 'offline', 'error']),
  capabilities: z.array(z.string()),
  registeredAt: z.string(),
  lastSeen: z.string(),
  isOnline: z.boolean().optional(),
});

export const TaskCreateRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  tags: z.array(z.string()).optional(),
  deadline: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const CLIConfigSchema = z.object({
  agent: z.object({
    name: z.string(),
    role: z.enum(['orchestrator', 'broker', 'worker', 'participant']),
    platform: z.string(),
    capabilities: z.array(z.string()),
  }),
  redis: z.object({
    host: z.string(),
    port: z.number(),
    password: z.string().optional(),
    tls: z
      .object({
        enabled: z.boolean(),
        ca: z.string().optional(),
        cert: z.string().optional(),
        key: z.string().optional(),
      })
      .optional(),
    keyPrefix: z.string(),
  }),
  auth: z.object({
    type: z.enum(['none', 'apiKey', 'jwt', 'oauth2']),
    apiKey: z.string().optional(),
    jwtSecret: z.string().optional(),
    oauth2: z
      .object({
        clientId: z.string(),
        clientSecret: z.string(),
        tokenUrl: z.string(),
        scope: z.string().optional(),
      })
      .optional(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    format: z.enum(['json', 'pretty']),
    output: z.enum(['console', 'file', 'both']),
    filePath: z.string().optional(),
    includeTraceId: z.boolean(),
  }),
  reliability: z.object({
    messageTimeoutMs: z.number(),
    maxRetries: z.number(),
    retryDelayMs: z.number(),
    enableAcks: z.boolean(),
    deadLetterQueue: z.boolean(),
  }),
  heartbeat: z.object({
    intervalMs: z.number(),
    timeoutMs: z.number(),
    maxRetries: z.number(),
  }),
});
