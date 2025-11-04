/**
 * API-specific Type Definitions
 * Replaces 'any' types in API-related code
 */

import { ApiResponse, ExpressRequestBody, ExpressRequestQuery, ExpressRequestParams, WebSocketMessage, EventData } from '../common';

// API Message types
export interface ApiMessage {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConversation {
  id: string;
  userId: string;
  messages: ApiMessage[];
  createdAt: string;
  updatedAt: string;
}

// API Transform functions
export interface TransformFunction<T, U = unknown> {
  (input: T): U;
}

// HTTP Request/Response wrappers
export interface RequestWithBody extends ExpressRequestQuery {
  body: ExpressRequestBody;
  params: ExpressRequestParams;
  user?: User;
  headers: Record<string, string | string[] | undefined>;
}

export interface ResponseWithJson extends ExpressRequestParams {
  status: (code: number) => ResponseWithJson;
  json: (data: ApiResponse) => void;
  send: (data: string | object) => void;
  end: () => void;
}

// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest'
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  data: EventData;
  timestamp: number;
  signature?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// WebSocket Gateway types
export interface SocketData {
  userId: string;
  roomId?: string;
  metadata?: Record<string, unknown>;
}

export interface RoomMember {
  id: string;
  userId: string;
  joinedAt: string;
  role: 'owner' | 'admin' | 'member';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  members: RoomMember[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Service types for specific domains
export interface AgentService {
  findById: (id: string) => Promise<Agent | null>;
  findMany: (criteria: Record<string, unknown>) => Promise<Agent[]>;
  create: (data: Record<string, unknown>) => Promise<Agent>;
  update: (id: string, data: Record<string, unknown>) => Promise<Agent>;
  delete: (id: string) => Promise<void>;
  execute: (id: string, input: unknown) => Promise<unknown>;
}

export interface WorkflowService {
  findById: (id: string) => Promise<Workflow | null>;
  findMany: (criteria: Record<string, unknown>) => Promise<Workflow[]>;
  create: (data: Record<string, unknown>) => Promise<Workflow>;
  update: (id: string, data: Record<string, unknown>) => Promise<Workflow>;
  delete: (id: string) => Promise<void>;
  execute: (id: string, input: unknown) => Promise<unknown>;
  validate: (workflow: Workflow) => Promise<ValidationResult>;
}

export interface TaskService {
  findById: (id: string) => Promise<Task | null>;
  findMany: (criteria: Record<string, unknown>) => Promise<Task[]>;
  create: (data: Record<string, unknown>) => Promise<Task>;
  update: (id: string, data: Record<string, unknown>) => Promise<Task>;
  delete: (id: string) => Promise<void>;
  execute: (id: string) => Promise<TaskExecution>;
}

export interface ValidationService {
  validate: (data: unknown, schema: Record<string, unknown>) => ValidationResult;
  sanitize: (data: unknown, rules: Record<string, unknown>) => unknown;
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string) => boolean;
}

export interface EmailService {
  send: (options: EmailOptions) => Promise<EmailResult>;
  sendBulk: (options: EmailOptions[]) => Promise<EmailResult[]>;
  validate: (email: string) => Promise<boolean>;
  render: (template: string, data: Record<string, unknown>) => string;
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
}

export interface AuditService {
  log: (action: string, userId: string, data: Record<string, unknown>) => Promise<void>;
  findByUser: (userId: string, limit?: number) => Promise<AuditEntry[]>;
  findByAction: (action: string, limit?: number) => Promise<AuditEntry[]>;
  findByDateRange: (start: Date, end: Date) => Promise<AuditEntry[]>;
}

export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  data: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface RoleService {
  findById: (id: string) => Promise<Role | null>;
  findByName: (name: string) => Promise<Role | null>;
  findMany: (criteria: Record<string, unknown>) => Promise<Role[]>;
  create: (data: Record<string, unknown>) => Promise<Role>;
  update: (id: string, data: Record<string, unknown>) => Promise<Role>;
  delete: (id: string) => Promise<void>;
  assignToUser: (roleId: string, userId: string) => Promise<void>;
  removeFromUser: (roleId: string, userId: string) => Promise<void>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// Entity types
export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface Task extends Entity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  createdBy: string;
  dueDate?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TaskExecution extends Entity {
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface Agent extends Entity {
  name: string;
  type: string;
  description?: string;
  configuration: Record<string, unknown>;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  lastActivity?: string;
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: number;
}

export interface Workflow extends Entity {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: 'draft' | 'active' | 'inactive' | 'error';
  version: string;
  triggers: WorkflowTrigger[];
  variables: Record<string, unknown>;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  entryPoint?: string;
  exitPoints?: string[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'webhook' | 'event';
  config: Record<string, unknown>;
}

// Validation results
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Controller response types
export interface ControllerResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}