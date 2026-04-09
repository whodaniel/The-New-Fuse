/**
 * Common type definitions to replace 'any' usage across the codebase
 */

// Generic JSON object type
export type JsonObject = Record<string, unknown>;

// Configuration type for various services
export interface ServiceConfig {
  [key: string]: unknown;
}

// Data entity type for database records
export interface DataEntity {
  id: string;
  [key: string]: unknown;
}

// Generic metadata type
export type Metadata = Record<string, unknown>;

// Agent configuration type
export interface AgentConfig {
  name: string;
  description?: string;
  capabilities?: string[];
  settings?: Record<string, unknown>;
  metadata?: Metadata;
}

// Message content type
export interface MessageContent {
  text?: string;
  type?: string;
  data?: Record<string, unknown>;
}

// Workflow step configuration
export interface WorkflowStepConfig {
  name: string;
  type: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  condition?: string | Record<string, unknown>;
  settings?: Record<string, unknown>;
}

// Task data type
export interface TaskData {
  id: string;
  type: string;
  status: string;
  data: Record<string, unknown>;
  metadata?: Metadata;
}
