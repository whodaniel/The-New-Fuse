// Comprehensive Placeholder Prisma Client types with input types

export * from '@prisma/client/runtime/library';

// Enums from schema
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  AGENCY_OWNER = 'AGENCY_OWNER',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  AGENCY_MANAGER = 'AGENCY_MANAGER',
  AGENT_OPERATOR = 'AGENT_OPERATOR',
}

export enum AgentType {
  BASIC = 'BASIC',
  CHAT = 'CHAT',
  WORKFLOW = 'WORKFLOW',
  TASK = 'TASK',
  ASSISTANT = 'ASSISTANT',
  ANALYSIS = 'ANALYSIS',
  CONVERSATIONAL = 'CONVERSATIONAL',
  IDE_EXTENSION = 'IDE_EXTENSION',
  API = 'API',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  TERMINATED = 'TERMINATED',
}

export enum AgentCapability {
  CODE_GENERATION = 'CODE_GENERATION',
  CODE_REVIEW = 'CODE_REVIEW',
  CODE_REFACTORING = 'CODE_REFACTORING',
  CODE_EXECUTION = 'CODE_EXECUTION',
  DEBUGGING = 'DEBUGGING',
  TESTING = 'TESTING',
  DOCUMENTATION = 'DOCUMENTATION',
  ARCHITECTURE_DESIGN = 'ARCHITECTURE_DESIGN',
  OPTIMIZATION = 'OPTIMIZATION',
  SECURITY_AUDIT = 'SECURITY_AUDIT',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  TOOL_USAGE = 'TOOL_USAGE',
  TASK_EXECUTION = 'TASK_EXECUTION',
  FILE_MANAGEMENT = 'FILE_MANAGEMENT',
  CODE_COMPLETION = 'CODE_COMPLETION',
  CODE_SUGGESTIONS = 'CODE_SUGGESTIONS',
  SYNTAX_HIGHLIGHTING = 'SYNTAX_HIGHLIGHTING',
  ERROR_DETECTION = 'ERROR_DETECTION',
  CODE_FORMATTING = 'CODE_FORMATTING',
  INTELLISENSE = 'INTELLISENSE',
  CHAT = 'CHAT',
  WORKFLOW = 'WORKFLOW',
  RESEARCH = 'RESEARCH',
  ANALYSIS = 'ANALYSIS',
  INTEGRATION = 'INTEGRATION',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum MessageRole {
  USER = 'USER',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM',
  ASSISTANT = 'ASSISTANT',
  TOOL = 'TOOL',
}

export enum PipelineStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum RegisteredEntityType {
  AGENT = 'AGENT',
  WORKFLOW = 'WORKFLOW',
  TOOL = 'TOOL',
  SERVICE = 'SERVICE',
  INTEGRATION = 'INTEGRATION',
  TEMPLATE = 'TEMPLATE',
  COMPONENT = 'COMPONENT',
  MODULE = 'MODULE',
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEPRECATED = 'DEPRECATED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

// Model types
export interface User {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
  hashedPassword: string;
  role: UserRole;
  roles: UserRole[];
  isActive: boolean;
  lastLogin?: Date | null;
  preferences?: any;
  refreshToken?: string | null;
  deletedAt?: Date | null;
  emailVerified: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description?: string | null;
  systemPrompt?: string | null;
  config?: any;
  capabilities: AgentCapability[];
  provider: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Task {
  id: string;
  title?: string | null;
  description?: string | null;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  data?: any;
  result?: any;
  error?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  pipelineId?: string | null;
  assignedToId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metadata?: any;
}

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  senderId?: string | null;
  senderName?: string | null;
  agentId?: string | null;
  chatId?: string | null;
  roomId?: string | null;
  parentMessageId?: string | null;
  metadata?: any;
  attachments: string[];
  timestamp: Date;
  updatedAt: Date;
  isEdited: boolean;
  isDeleted: boolean;
  isEphemeral: boolean;
  expiresAt?: Date | null;
  reactions?: any;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  definition?: any;
  status: WorkflowStatus;
  creatorId?: string | null;
  agentId?: string | null;
  metadata?: any;
  isActive: boolean;
  variables?: any;
  triggers?: any;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date | null;
  executionCount: number;
  statistics?: any;
  deletedAt?: Date | null;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  input?: any;
  output?: any;
  error?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
}

export interface RegisteredEntity {
  id: string;
  name: string;
  type: RegisteredEntityType;
  description?: string | null;
  metadata?: any;
  config?: any;
  status: EntityStatus;
  version: string;
  namespace?: string | null;
  tags: string[];
  capabilities: string[];
  dependencies: string[];
  isPublic: boolean;
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface AuthEvent {
  id: string;
  userId: string;
  type: string;
  details?: any;
  createdAt: Date;
}

export interface SyncState {
  id: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string | null;
  version: number;
  checksum: string;
  lastSync: Date;
  syncedBy: string;
  metadata: any;
}

export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string | null;
  conflictType: string;
  localVersion: any;
  remoteVersion: any;
  createdAt: Date;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  resolution?: any;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: string;
  output?: any;
  error?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
}

// Prisma error classes
export class PrismaClientKnownRequestError extends Error {
  code: string;
  clientVersion: string;
  meta?: Record<string, any>;
  constructor(message: string, options: { code: string; clientVersion: string; meta?: Record<string, any> });
}

export class PrismaClientUnknownRequestError extends Error {
  clientVersion: string;
  constructor(message: string, options: { clientVersion: string });
}

export class PrismaClientValidationError extends Error {
  constructor(message: string);
}

// Prisma namespace with input types
export namespace Prisma {
  export type TypeMap = any;
  export type PrismaPromise<T> = Promise<T>;

  // JSON types and special values
  export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
  export type JsonObject = { [key: string]: JsonValue };
  export type JsonArray = JsonValue[];
  export type InputJsonValue = string | number | boolean | null | InputJsonObject | InputJsonArray;
  export type InputJsonObject = { [key: string]: InputJsonValue };
  export type InputJsonArray = InputJsonValue[];

  export const JsonNull: symbol;
  export const DbNull: symbol;

  // Error classes
  export { PrismaClientKnownRequestError };
  export { PrismaClientUnknownRequestError };
  export { PrismaClientValidationError };

  // Where input types
  export type UserWhereInput = Partial<User> & { [key: string]: any };
  export type AgentWhereInput = Partial<Agent> & { [key: string]: any };
  export type TaskWhereInput = Partial<Task> & { [key: string]: any };
  export type MessageWhereInput = Partial<Message> & { [key: string]: any };
  export type WorkflowWhereInput = Partial<Workflow> & { [key: string]: any };
  export type WorkflowExecutionWhereInput = Partial<WorkflowExecution> & { [key: string]: any };
  export type RegisteredEntityWhereInput = Partial<RegisteredEntity> & { [key: string]: any };
  export type AuthEventWhereInput = Partial<AuthEvent> & { [key: string]: any };
  export type SyncStateWhereInput = Partial<SyncState> & { [key: string]: any };
  export type SyncConflictWhereInput = Partial<SyncConflict> & { [key: string]: any };
  export type TaskExecutionWhereInput = Partial<TaskExecution> & { [key: string]: any };

  // WhereUniqueInput types
  export type UserWhereUniqueInput = { id: string } | { email: string } | { [key: string]: any };
  export type AgentWhereUniqueInput = { id: string } | { [key: string]: any };
  export type TaskWhereUniqueInput = { id: string } | { [key: string]: any };
  export type MessageWhereUniqueInput = { id: string } | { [key: string]: any };
  export type WorkflowWhereUniqueInput = { id: string } | { [key: string]: any };
  export type WorkflowExecutionWhereUniqueInput = { id: string } | { [key: string]: any };
  export type RegisteredEntityWhereUniqueInput = { id: string } | { [key: string]: any };
  export type AuthEventWhereUniqueInput = { id: string } | { [key: string]: any };
  export type SyncStateWhereUniqueInput = { id: string } | { [key: string]: any };
  export type SyncConflictWhereUniqueInput = { id: string } | { [key: string]: any };
  export type TaskExecutionWhereUniqueInput = { id: string } | { [key: string]: any };

  // OrderBy input types
  export type SortOrder = 'asc' | 'desc';
  export type UserOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type AgentOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type TaskOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type MessageOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type WorkflowOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type WorkflowExecutionOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type RegisteredEntityOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type AuthEventOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type SyncStateOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type SyncConflictOrderByWithRelationInput = { [key: string]: SortOrder | any };
  export type TaskExecutionOrderByWithRelationInput = { [key: string]: SortOrder | any };

  // Create input types
  export type UserCreateInput = Partial<User> & { [key: string]: any };
  export type AgentCreateInput = Partial<Agent> & { [key: string]: any };
  export type TaskCreateInput = Partial<Task> & { [key: string]: any };
  export type MessageCreateInput = Partial<Message> & { [key: string]: any };
  export type WorkflowCreateInput = Partial<Workflow> & { [key: string]: any };
  export type WorkflowExecutionCreateInput = Partial<WorkflowExecution> & { [key: string]: any };
  export type RegisteredEntityCreateInput = Partial<RegisteredEntity> & { [key: string]: any };
  export type AuthEventCreateInput = Partial<AuthEvent> & { [key: string]: any };
  export type SyncStateCreateInput = Partial<SyncState> & { [key: string]: any };
  export type SyncConflictCreateInput = Partial<SyncConflict> & { [key: string]: any };
  export type TaskExecutionCreateInput = Partial<TaskExecution> & { [key: string]: any };

  // Update input types
  export type UserUpdateInput = Partial<User> & { [key: string]: any };
  export type AgentUpdateInput = Partial<Agent> & { [key: string]: any };
  export type TaskUpdateInput = Partial<Task> & { [key: string]: any };
  export type MessageUpdateInput = Partial<Message> & { [key: string]: any };
  export type WorkflowUpdateInput = Partial<Workflow> & { [key: string]: any };
  export type WorkflowExecutionUpdateInput = Partial<WorkflowExecution> & { [key: string]: any };
  export type RegisteredEntityUpdateInput = Partial<RegisteredEntity> & { [key: string]: any };
  export type AuthEventUpdateInput = Partial<AuthEvent> & { [key: string]: any };
  export type SyncStateUpdateInput = Partial<SyncState> & { [key: string]: any };
  export type SyncConflictUpdateInput = Partial<SyncConflict> & { [key: string]: any };
  export type TaskExecutionUpdateInput = Partial<TaskExecution> & { [key: string]: any };

  // Unchecked input types
  export type TaskUncheckedUpdateInput = Partial<Task> & { [key: string]: any };
  export type MessageUncheckedCreateInput = Partial<Message> & { [key: string]: any };
  export type MessageUncheckedUpdateInput = Partial<Message> & { [key: string]: any };
}

export namespace $Enums {
  export { UserRole };
  export { AgentType };
  export { AgentStatus };
  export { AgentCapability };
  export { TaskStatus };
  export { TaskPriority };
  export { WorkflowStatus };
  export { WorkflowExecutionStatus };
  export { MessageRole };
  export { PipelineStatus };
  export { RegisteredEntityType };
  export { EntityStatus };
}

// PrismaClient class
export class PrismaClient {
  constructor(options?: any);
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $executeRaw<T = any>(query: any, ...values: any[]): Promise<T>;
  $queryRaw<T = any>(query: any, ...values: any[]): Promise<T>;
  $transaction<R>(fn: (prisma: PrismaClient) => Promise<R>): Promise<R>;
  $on(eventType: string, callback: Function): void;
  
  user: any;
  agent: any;
  chat: any;
  message: any;
  workflow: any;
  task: any;
  pipeline: any;
  authSession: any;
  codeExecutionSession: any;
  workflowExecution: any;
  registeredEntity: any;
  authEvent: any;
  syncState: any;
  syncConflict: any;
  taskExecution: any;
}

export default PrismaClient;
export { Prisma };
