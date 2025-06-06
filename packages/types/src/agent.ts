export interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  capabilities: string[];
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  config?: Record<string, unknown>;
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  DELETED = 'DELETED'
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  type: string;
  role?: AgentRole;
  capabilities: string[];
  systemPrompt?: string;
  status?: AgentStatus;
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  type?: string;
  role?: AgentRole;
  systemPrompt?: string;
  capabilities?: string[];
  status?: AgentStatus;
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Add agent role and capability types
export enum AgentRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

// Define capability types as enum for validation
export enum AgentCapability {
  CHAT = 'CHAT',
  FILE_PROCESSING = 'FILE_PROCESSING',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  CODE_GENERATION = 'CODE_GENERATION',
  WORKFLOW_ORCHESTRATION = 'WORKFLOW_ORCHESTRATION',
  API_INTEGRATION = 'API_INTEGRATION',
  DATABASE_OPERATIONS = 'DATABASE_OPERATIONS',
  MONITORING = 'MONITORING',
  SECURITY = 'SECURITY',
  TESTING = 'TESTING'
}

// Interface for detailed capability configuration
export interface AgentCapabilityConfig {
  id: string;
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
