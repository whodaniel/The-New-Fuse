// Comprehensive Prisma client TypeScript definitions
import { PrismaClient as BasePrismaClient } from '@prisma/client';

export { PrismaClient } from '@prisma/client';

// Enums from schema
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE'
}

export enum AgentType {
  GENERIC = 'GENERIC',
  CODER = 'CODER',
  ANALYZER = 'ANALYZER',
  COORDINATOR = 'COORDINATOR',
  COMMUNICATOR = 'COMMUNICATOR'
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT'
}

export enum A2AAgentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  IDLE = 'IDLE',
  ERROR = 'ERROR'
}

export enum A2AMessageType {
  HANDSHAKE = 'HANDSHAKE',
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  NOTIFICATION = 'NOTIFICATION',
  HEARTBEAT = 'HEARTBEAT',
  ERROR = 'ERROR',
  BROADCAST = 'BROADCAST'
}

export enum A2AMessagePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum A2AConversationStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum MarketplaceStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum OfferStatus {
  ACTIVE = 'ACTIVE',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// JSON value types
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// Type definitions for models
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null;
  assignedTo?: string | null;
  createdBy: string;
  metadata?: JsonValue | null;
  tags: string[];
  dependencies: string[];
  error?: string | null;
  completedAt?: Date | null;
}

export interface Agent {
  id: string;
  name: string;
  description?: string | null;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  provider: string;
  lastActive: Date;
  metadata?: JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  userId?: string | null;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisteredEntity {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  metadata?: JsonValue | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: string;
  userId: string;
  sessionId?: string | null;
  metadata?: JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  status: WorkflowStatus;
  definition: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  input?: JsonValue | null;
  output?: JsonValue | null;
  error?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create operations
export interface TaskCreateInput {
  id?: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type: string;
  dueDate?: Date | null;
  assignedTo?: string | null;
  createdBy: string;
  metadata?: JsonValue | null;
  tags?: string[];
  dependencies?: string[];
  error?: string | null;
  completedAt?: Date | null;
}

export interface AgentCreateInput {
  id?: string;
  name: string;
  description?: string | null;
  type?: AgentType;
  status?: AgentStatus;
  capabilities?: string[];
  provider: string;
  lastActive?: Date;
  metadata?: JsonValue | null;
  userId?: string | null;
}

export interface UserCreateInput {
  id?: string;
  email: string;
  name?: string | null;
  passwordHash: string;
  role?: UserRole;
}

// Update input types
export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: string;
  dueDate?: Date | null;
  assignedTo?: string | null;
  metadata?: JsonValue | null;
  tags?: string[];
  dependencies?: string[];
  error?: string | null;
  completedAt?: Date | null;
}

export interface AgentUpdateInput {
  name?: string;
  description?: string | null;
  type?: AgentType;
  status?: AgentStatus;
  capabilities?: string[];
  provider?: string;
  lastActive?: Date;
  metadata?: JsonValue | null;
  userId?: string | null;
}

// Where input types for queries
export interface TaskWhereInput {
  id?: string;
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: string;
  assignedTo?: string;
  createdBy?: string;
  AND?: TaskWhereInput[];
  OR?: TaskWhereInput[];
  NOT?: TaskWhereInput;
}

export interface AgentWhereInput {
  id?: string;
  name?: string;
  type?: AgentType;
  status?: AgentStatus;
  provider?: string;
  userId?: string;
  AND?: AgentWhereInput[];
  OR?: AgentWhereInput[];
  NOT?: AgentWhereInput;
}

export interface RegisteredEntityWhereInput {
  id?: string;
  name?: string;
  type?: string;
  status?: EntityStatus;
  AND?: RegisteredEntityWhereInput[];
  OR?: RegisteredEntityWhereInput[];
  NOT?: RegisteredEntityWhereInput;
}

export interface WorkflowWhereInput {
  id?: string;
  name?: string;
  status?: WorkflowStatus;
  AND?: WorkflowWhereInput[];
  OR?: WorkflowWhereInput[];
  NOT?: WorkflowWhereInput;
}

export interface WorkflowExecutionWhereInput {
  id?: string;
  workflowId?: string;
  status?: WorkflowExecutionStatus;
  AND?: WorkflowExecutionWhereInput[];
  OR?: WorkflowExecutionWhereInput[];
  NOT?: WorkflowExecutionWhereInput;
}

// Unique where inputs
export interface TaskWhereUniqueInput {
  id?: string;
}

export interface AgentWhereUniqueInput {
  id?: string;
}

export interface UserWhereUniqueInput {
  id?: string;
  email?: string;
}

export interface RegisteredEntityWhereUniqueInput {
  id?: string;
}

export interface WorkflowWhereUniqueInput {
  id?: string;
}

export interface WorkflowExecutionWhereUniqueInput {
  id?: string;
}

// Order by inputs
export interface TaskOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  title?: 'asc' | 'desc';
  status?: 'asc' | 'desc';
  priority?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
}

export interface AgentOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  name?: 'asc' | 'desc';
  type?: 'asc' | 'desc';
  status?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
}

export interface RegisteredEntityOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  name?: 'asc' | 'desc';
  type?: 'asc' | 'desc';
  status?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
}

// Prisma namespace with all required types
export namespace Prisma {
  export {
    TaskStatus,
    TaskPriority,
    AgentStatus,
    AgentType,
    EntityStatus,
    UserRole,
    A2AAgentStatus,
    A2AMessageType,
    A2AMessagePriority,
    A2AConversationStatus,
    MarketplaceStatus,
    OfferStatus,
    WorkflowStatus,
    WorkflowExecutionStatus,
    JsonValue,
    JsonObject,
    JsonArray
  };

  // Export input types
  export type {
    TaskCreateInput,
    AgentCreateInput,
    UserCreateInput,
    TaskUpdateInput,
    AgentUpdateInput,
    TaskWhereInput,
    AgentWhereInput,
    RegisteredEntityWhereInput,
    WorkflowWhereInput,
    WorkflowExecutionWhereInput,
    TaskWhereUniqueInput,
    AgentWhereUniqueInput,
    UserWhereUniqueInput,
    RegisteredEntityWhereUniqueInput,
    WorkflowWhereUniqueInput,
    WorkflowExecutionWhereUniqueInput,
    TaskOrderByWithRelationInput,
    AgentOrderByWithRelationInput,
    RegisteredEntityOrderByWithRelationInput
  };

  // Special Prisma values
  export const JsonNull: JsonValue;
  export const DbNull: JsonValue;
  export const AnyNull: JsonValue;

  // Error classes
  export class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, unknown>;
    constructor(message: string, code: string, clientVersion: string, meta?: Record<string, unknown>);
  }

  export class PrismaClientUnknownRequestError extends Error {
    constructor(message: string, clientVersion: string);
  }

  export class PrismaClientRustPanicError extends Error {
    constructor(message: string, clientVersion: string);
  }

  export class PrismaClientInitializationError extends Error {
    constructor(message: string, clientVersion: string);
  }

  export class PrismaClientValidationError extends Error {
    constructor(message: string, clientVersion: string);
  }
}