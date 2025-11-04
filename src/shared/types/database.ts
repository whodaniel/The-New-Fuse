/**
 * Database and ORM Type Definitions
 * Replaces 'any' types in database-related code
 */

import { ID, Timestamp } from '../common';

// Base database types
export interface DatabaseEntity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SoftDeleteEntity extends DatabaseEntity {
  deletedAt?: Timestamp;
}

export interface AuditEntity extends DatabaseEntity {
  createdBy: string;
  updatedBy: string;
  version: number;
}

// User and Authentication
export interface UserEntity extends SoftDeleteEntity {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Timestamp;
  lastLoginAt?: Timestamp;
  loginAttempts: number;
  lockedUntil?: Timestamp;
  role: UserRole;
  profile: UserProfile;
  settings: UserSettings;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest'
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  company?: string;
  website?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language: string;
  skills: string[];
  interests: string[];
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  preferences: Record<string, unknown>;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  sound: boolean;
  marketing: boolean;
  security: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  activityVisible: boolean;
  allowDirectMessages: boolean;
  allowFriendRequests: boolean;
}

export interface SessionEntity extends DatabaseEntity {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Timestamp;
  userAgent?: string;
  ipAddress?: string;
  revoked: boolean;
  revokedAt?: Timestamp;
}

export interface RefreshTokenEntity extends DatabaseEntity {
  userId: string;
  token: string;
  expiresAt: Timestamp;
  used: boolean;
  usedAt?: Timestamp;
}

// Workspace and Organization
export interface WorkspaceEntity extends SoftDeleteEntity {
  name: string;
  slug: string;
  description?: string;
  settings: WorkspaceSettings;
  plan: WorkspacePlan;
  limits: WorkspaceLimits;
  billing: WorkspaceBilling;
}

export interface WorkspaceSettings {
  allowMemberInvites: boolean;
  requireEmailVerification: boolean;
  defaultRole: string;
  features: Record<string, boolean>;
  customDomain?: string;
  logo?: string;
  branding: BrandingSettings;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCSS?: string;
}

export interface WorkspacePlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: Record<string, number>;
  billing: 'monthly' | 'yearly';
  trialEndsAt?: Timestamp;
}

export interface WorkspaceLimits {
  members: number;
  workflows: number;
  executions: number;
  storage: number; // in bytes
  apiCalls: number;
}

export interface WorkspaceBilling {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  trialPeriod?: number; // in days
}

export interface WorkspaceMember extends SoftDeleteEntity {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: 'active' | 'pending' | 'invited';
  invitedBy?: string;
  joinedAt?: Timestamp;
  permissions: string[];
  metadata: Record<string, unknown>;
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
  VIEWER = 'viewer'
}

export interface WorkspaceInvitation extends DatabaseEntity {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  token: string;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  acceptedBy?: string;
}

// Agent System
export interface AgentEntity extends SoftDeleteEntity {
  name: string;
  description?: string;
  type: AgentType;
  status: AgentStatus;
  configuration: AgentConfiguration;
  capabilities: AgentCapability[];
  model: string;
  prompt: string;
  systemPrompt?: string;
  tools: AgentTool[];
  memory: AgentMemory;
  metrics: AgentMetrics;
  version: string;
  parentId?: string; // for agent variants
}

export enum AgentType {
  BASE = 'base',
  ENHANCED = 'enhanced',
  RESEARCH = 'research',
  CASCADE = 'cascade',
  WORKFLOW = 'workflow',
  CUSTOM = 'custom',
  TEMPLATE = 'template'
}

export enum AgentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export interface AgentConfiguration {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  responseFormat: 'text' | 'json' | 'markdown';
  streaming: boolean;
  timeout: number;
  retryAttempts: number;
  rateLimits: RateLimitConfig;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute: number;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AgentTool {
  name: string;
  description: string;
  type: 'api' | 'function' | 'webhook' | 'custom';
  configuration: ToolConfiguration;
  enabled: boolean;
  required: boolean;
}

export interface ToolConfiguration {
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, unknown>;
  authentication?: ToolAuth;
  rateLimit?: RateLimitConfig;
  timeout?: number;
  retryAttempts?: number;
}

export interface ToolAuth {
  type: 'bearer' | 'api-key' | 'basic' | 'oauth' | 'custom';
  credentials: Record<string, string>;
}

export interface AgentMemory {
  enabled: boolean;
  type: 'short_term' | 'long_term' | 'vector' | 'hybrid';
  config: MemoryConfig;
  maxTokens: number;
  retention: number; // in days
}

export interface MemoryConfig {
  vectorStore?: VectorStoreConfig;
  embedding?: EmbeddingConfig;
  retrieval?: RetrievalConfig;
}

export interface VectorStoreConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'custom';
  model: string;
  dimensions: number;
  similarity: 'cosine' | 'euclidean' | 'dot';
}

export interface EmbeddingConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  batchSize: number;
}

export interface RetrievalConfig {
  method: 'similarity' | 'mmr' | 'hybrid';
  topK: number;
  threshold: number;
  diversity: number;
}

export interface AgentMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  averageTokensUsed: number;
  totalTokensUsed: number;
  lastExecutionTime?: Timestamp;
  lastErrorTime?: Timestamp;
  lastErrorMessage?: string;
  uptime: number; // in seconds
  reliability: number; // 0-100
  satisfactionScore?: number; // 0-100
}

export interface AgentExecution extends DatabaseEntity {
  agentId: string;
  sessionId: string;
  trigger: ExecutionTrigger;
  input: ExecutionInput;
  output?: ExecutionOutput;
  status: ExecutionStatus;
  error?: string;
  errorStack?: string;
  duration: number; // in milliseconds
  tokensUsed: TokenUsage;
  cost: number;
  metadata: Record<string, unknown>;
  logs: ExecutionLog[];
  checkpoints: ExecutionCheckpoint[];
}

export interface ExecutionInput {
  type: 'text' | 'structured' | 'multimodal';
  data: unknown;
  attachments?: ExecutionAttachment[];
  context?: Record<string, unknown>;
}

export interface ExecutionOutput {
  type: 'text' | 'structured' | 'multimodal' | 'error';
  data: unknown;
  confidence?: number;
  reasoning?: string;
  sources?: ExecutionSource[];
}

export interface ExecutionAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionSource {
  id: string;
  type: 'internal' | 'external';
  reference: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export enum ExecutionTrigger {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  API = 'api',
  WORKFLOW = 'workflow',
  EVENT = 'event'
}

export interface ExecutionLog extends DatabaseEntity {
  executionId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface ExecutionCheckpoint extends DatabaseEntity {
  executionId: string;
  name: string;
  data: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number;
}

// Workflow System
export interface WorkflowEntity extends SoftDeleteEntity {
  name: string;
  description?: string;
  version: string;
  status: WorkflowStatus;
  definition: WorkflowDefinition;
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  settings: WorkflowSettings;
  metrics: WorkflowMetrics;
  executions: number;
  parentId?: string; // for versions
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  ARCHIVED = 'archived'
}

export interface WorkflowDefinition {
  nodes: WorkflowNodeDefinition[];
  edges: WorkflowEdgeDefinition[];
  entryPoints: string[];
  exitPoints: string[];
  variables: Record<string, unknown>;
  settings: WorkflowSettings;
}

export interface WorkflowNodeDefinition {
  id: string;
  type: string;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  inputs: WorkflowPortDefinition[];
  outputs: WorkflowPortDefinition[];
  style?: Record<string, unknown>;
}

export interface WorkflowPortDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required: boolean;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'type' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface WorkflowEdgeDefinition {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: WorkflowCondition;
  style?: Record<string, unknown>;
}

export interface WorkflowCondition {
  type: 'simple' | 'complex' | 'javascript';
  expression: string;
  variables: string[];
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'webhook' | 'event' | 'api';
  name: string;
  config: TriggerConfiguration;
  enabled: boolean;
}

export interface TriggerConfiguration {
  schedule?: CronExpression;
  webhook?: WebhookConfig;
  event?: EventConfig;
  security?: SecurityConfig;
}

export interface CronExpression {
  expression: string;
  timezone: string;
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: WebhookAuth;
}

export interface WebhookAuth {
  type: 'bearer' | 'api-key' | 'basic' | 'custom';
  credentials: Record<string, string>;
}

export interface EventConfig {
  eventType: string;
  filter?: Record<string, unknown>;
  correlationId?: string;
}

export interface SecurityConfig {
  requireAuth: boolean;
  allowedRoles?: string[];
  rateLimit?: RateLimitConfig;
  ipWhitelist?: string[];
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'secret';
  value: unknown;
  defaultValue?: unknown;
  description?: string;
  required: boolean;
  sensitive: boolean;
}

export interface WorkflowSettings {
  timeout: number;
  retryAttempts: number;
  retryDelay: number; // in milliseconds
  concurrency: number;
  memoryLimit: number; // in MB
  errorHandling: ErrorHandlingConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
}

export interface ErrorHandlingConfig {
  onError: 'continue' | 'stop' | 'retry' | 'fallback';
  fallbackNodeId?: string;
  maxRetries: number;
  retryDelay: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeInput: boolean;
  includeOutput: boolean;
  includeMetadata: boolean;
  retention: number; // in days
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
  sampleRate: number; // 0-1
}

export interface AlertConfig {
  type: 'threshold' | 'anomaly' | 'custom';
  metric: string;
  condition: string;
  threshold: number;
  duration: number; // in minutes
  recipients: string[];
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
  lastExecutionTime?: Timestamp;
  lastErrorTime?: Timestamp;
  throughput: number; // executions per minute
  cost: number; // total cost in USD
}

export interface WorkflowExecution extends DatabaseEntity {
  workflowId: string;
  trigger: ExecutionTrigger;
  input: WorkflowExecutionInput;
  output?: WorkflowExecutionOutput;
  status: ExecutionStatus;
  progress: ExecutionProgress;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration: number;
  cost: number;
  logs: WorkflowExecutionLog[];
  error?: WorkflowExecutionError;
  metadata: Record<string, unknown>;
}

export interface WorkflowExecutionInput {
  data: unknown;
  variables: Record<string, unknown>;
  context: ExecutionContext;
}

export interface ExecutionContext {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  parentExecutionId?: string;
  metadata: Record<string, unknown>;
}

export interface WorkflowExecutionOutput {
  data: unknown;
  artifacts: ExecutionArtifact[];
  logs: string[];
  metrics: Record<string, number>;
}

export interface ExecutionArtifact {
  name: string;
  type: string;
  url: string;
  metadata: Record<string, unknown>;
}

export interface ExecutionProgress {
  currentNode: string;
  completedNodes: string[];
  totalNodes: number;
  percentage: number;
  estimatedTimeRemaining?: number; // in seconds
}

export interface WorkflowExecutionLog extends DatabaseEntity {
  executionId: string;
  nodeId?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface WorkflowExecutionError extends DatabaseEntity {
  executionId: string;
  nodeId: string;
  code: string;
  message: string;
  stack?: string;
  data?: Record<string, unknown>;
  timestamp: Timestamp;
}

// Task Management
export interface TaskEntity extends SoftDeleteEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignedBy?: string;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  parentId?: string; // for subtasks
  tags: string[];
  metadata: Record<string, unknown>;
  dependencies: string[]; // task IDs
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  progress: number; // 0-100
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TaskComment extends DatabaseEntity {
  taskId: string;
  userId: string;
  content: string;
  type: 'comment' | 'note' | 'resolution';
  mentions: string[]; // user IDs
  attachments: TaskAttachment[];
  editedAt?: Timestamp;
}

export interface TaskAttachment extends DatabaseEntity {
  taskId: string;
  commentId?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
}

// Audit and Logging
export interface AuditLog extends DatabaseEntity {
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: AuditChange[];
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'create' | 'update' | 'delete' | 'restore';
}

// File and Storage
export interface FileEntity extends DatabaseEntity {
  name: string;
  originalName: string;
  type: string;
  size: number;
  path: string;
  url: string;
  mimeType: string;
  hash: string;
  uploadedBy: string;
  metadata: Record<string, unknown>;
  tags: string[];
  isPublic: boolean;
  expiresAt?: Timestamp;
}

// Notification System
export interface Notification extends DatabaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Timestamp;
  actionUrl?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  REMINDER = 'reminder',
  ALERT = 'alert'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  WEBHOOK = 'webhook'
}

// Integration and API
export interface Integration extends DatabaseEntity {
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
  status: 'active' | 'inactive' | 'error';
  credentials: IntegrationCredentials;
  webhookUrl?: string;
  lastSyncAt?: Timestamp;
  metrics: IntegrationMetrics;
}

export enum IntegrationType {
  WEBHOOK = 'webhook',
  API = 'api',
  OAUTH = 'oauth',
  CUSTOM = 'custom'
}

export interface IntegrationConfig {
  baseUrl?: string;
  authentication?: AuthenticationConfig;
  rateLimit?: RateLimitConfig;
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
}

export interface AuthenticationConfig {
  type: 'bearer' | 'api-key' | 'basic' | 'oauth' | 'custom';
  credentials: Record<string, string>;
}

export interface IntegrationCredentials {
  encrypted: boolean;
  data: Record<string, string>;
  lastRotated?: Timestamp;
}

export interface IntegrationMetrics {
  requests: number;
  successes: number;
  failures: number;
  averageResponseTime: number;
  lastRequestAt?: Timestamp;
  lastErrorAt?: Timestamp;
}

// Search and Indexing
export interface SearchIndex extends DatabaseEntity {
  type: 'agent' | 'workflow' | 'task' | 'user' | 'workspace';
  entityId: string;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, unknown>;
  status: 'active' | 'inactive' | 'archived';
}

// Common utility types for database operations
export interface DatabaseQuery<T = unknown> {
  select?: (keyof T)[];
  where?: Partial<T> | Record<string, unknown>;
  orderBy?: { [K in keyof T]?: 'asc' | 'desc' };
  skip?: number;
  take?: number;
  include?: Record<string, boolean | DatabaseQuery>;
}

export interface DatabaseResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DatabaseTransaction {
  query: string;
  params: unknown[];
}

// Type for database migration scripts
export interface Migration {
  version: string;
  name: string;
  up: (prisma: unknown) => Promise<void>;
  down: (prisma: unknown) => Promise<void>;
  timestamp: number;
}