// Comprehensive Placeholder Prisma Client types

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
  capabilities: string[];
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

// Prisma namespace
export namespace Prisma {
  export type TypeMap = any;
  export type PrismaPromise<T> = Promise<T>;
}

export namespace $Enums {
  export {UserRole};
  export {AgentType};
  export {AgentStatus};
  export {TaskStatus};
  export {TaskPriority};
  export {WorkflowStatus};
  export {WorkflowExecutionStatus};
  export {MessageRole};
}

// PrismaClient class
export class PrismaClient {
  constructor(options?: any);
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $executeRaw(query: any, ...values: any[]): Promise<any>;
  $queryRaw(query: any, ...values: any[]): Promise<any>;
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
}

export default PrismaClient;
export { Prisma };
