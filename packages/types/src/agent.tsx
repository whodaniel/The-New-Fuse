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
  capabilities: string[];
  systemPrompt?: string;
  status?: AgentStatus;
  configuration?: Record<string, unknown>;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  capabilities?: string[];
  status?: AgentStatus;
  configuration?: Record<string, unknown>;
}

// Add agent role and capability types
export enum AgentRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export interface AgentCapability {
  id: string;
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
