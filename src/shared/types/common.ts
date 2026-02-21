/**
 * Common Type Definitions
 * Replaces 'any' types with proper TypeScript interfaces
 */

// Core primitive types
export type ID = string | number;
export type Timestamp = string | Date | number;
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

// Database and ORM types
export interface DatabaseWhere {
  [key: string]: unknown;
}

export interface DatabaseOrderBy {
  [key: string]: 'asc' | 'desc';
}

export interface DatabaseQuery {
  where?: DatabaseWhere;
  orderBy?: DatabaseOrderBy[];
  skip?: number;
  take?: number;
  include?: DatabaseInclude;
}

export interface DatabaseInclude {
  [relation: string]: boolean | DatabaseQuery;
}

export interface PrismaClient {
  [model: string]: {
    findMany: (args?: DatabaseQuery) => Promise<any[]>;
    findFirst: (args?: DatabaseQuery) => Promise<any | null>;
    findUnique: (args?: { where: { id: ID } }) => Promise<any | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<any>;
    update: (args: { where: { id: ID }; data: Record<string, unknown> }) => Promise<any>;
    delete: (args: { where: { id: ID } }) => Promise<any>;
    count: (args?: DatabaseQuery) => Promise<number>;
  };
}

// Express and HTTP types
export interface ExpressRequestQuery {
  [key: string]: string | string[] | undefined;
}

export interface ExpressRequestBody {
  [key: string]: unknown;
}

export interface ExpressRequestParams {
  [key: string]: string;
}

export interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  json: (data: unknown) => void;
  send: (data: unknown) => void;
}

// Logger types
export interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  meta?: Record<string, unknown>;
}

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

// Configuration types
export interface AppConfig {
  [key: string]: unknown;
}

export interface EnvironmentVariables {
  [key: string]: string | undefined;
}

// Event and Message types
export interface EventData {
  [key: string]: unknown;
}

export interface EventEmitter {
  emit: (event: string, data?: EventData) => boolean;
  on: (event: string, listener: (data: EventData) => void) => EventEmitter;
  off: (event: string, listener: (data: EventData) => void) => EventEmitter;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  id?: string;
  timestamp?: number;
}

export interface WebSocketConnection {
  send: (data: string) => void;
  close: () => void;
  on: (event: string, listener: (data: unknown) => void) => void;
}

// Redis types
export interface RedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: string, duration?: number) => Promise<string>;
  del: (key: string) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, string>>;
  hset: (key: string, field: string, value: string) => Promise<number>;
  xadd: (stream: string, id: string, fields: Record<string, string>) => Promise<string>;
  xread: (streams: Record<string, string>, count?: number, block?: number) => Promise<unknown[]>;
}

// Workflow types
export interface WorkflowNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Timestamp;
  completedAt?: Timestamp;
  result?: unknown;
  error?: string;
}

// MCP (Model Context Protocol) types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPRequest {
  method: string;
  params?: Record<string, unknown>;
  id: string;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

// Agent types
export interface AgentCapability {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  sender: string;
  recipient?: string;
  content: string;
  type: 'text' | 'action' | 'data';
  metadata?: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface AgentConfig {
  id?: ID;
  name: string;
  type: string;
  model: string;
  parameters: Record<string, unknown>;
  capabilities: AgentCapability[];
  status: 'active' | 'inactive' | 'error';
}

// React component types
export interface ReactComponentProps {
  [key: string]: unknown;
}

export interface ReactEventHandler<T = unknown> {
  (event: T): void;
}

export interface ReactChangeHandler {
  (value: unknown): void;
}

export interface FormOption {
  value: string | number;
  label: string;
}

export interface FormValidation {
  isValid: boolean;
  error?: string;
}

// State management types
export interface Action<T = unknown> {
  type: string;
  payload?: T;
}

export interface Reducer<T, A extends Action> {
  (state: T, action: A): T;
}

export interface AsyncAction<T = unknown> extends Action<T> {
  meta?: {
    isAsync: true;
  };
}

// Utility types for common patterns
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// File and upload types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// Theme and styling types
export interface ThemeConfig {
  [key: string]: unknown;
}

export interface StyleObject {
  [cssProperty: string]: string | number;
}

// Monitoring and metrics types
export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface PerformanceMetrics {
  [key: string]: number;
}

// Security types
export interface SecurityConfig {
  [key: string]: unknown;
}

export interface UserPermissions {
  [permission: string]: boolean;
}

// Test types
export interface TestFixture<T = unknown> {
  data: T;
  expected: T;
}

export interface MockService {
  [method: string]: jest.Mock;
}