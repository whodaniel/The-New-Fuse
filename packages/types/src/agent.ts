import { BaseEntity } from './core/base-types';

export enum AgentType {
  BASIC = "BASIC",
  CHAT = "CHAT",
  WORKFLOW = "WORKFLOW",
  TASK = "TASK",
  ASSISTANT = "ASSISTANT"
}

export enum AgentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  IDLE = "IDLE",
  BUSY = "BUSY",
  ERROR = "ERROR"
}

export enum AgentRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM",
  OPTIMIZATION = "OPTIMIZATION"
}

export enum AgentCapability {
  CHAT = "CHAT",
  CODE_GENERATION = "CODE_GENERATION",
  FILE_MANAGEMENT = "FILE_MANAGEMENT",
  DATA_ANALYSIS = "DATA_ANALYSIS",
  WORKFLOW_EXECUTION = "WORKFLOW_EXECUTION",
  API_INTEGRATION = "API_INTEGRATION",
  MONITORING = "MONITORING",
  AUTOMATION = "AUTOMATION"
}

// Changed from interface to class that implements BaseEntity
export class Agent implements BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapabilityConfig[];
  configuration?: unknown;

  constructor(data: Partial<Agent>) {
    this.id = data.id || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.name = data.name || '';
    this.type = data.type || AgentType.ASSISTANT;
    this.status = data.status || AgentStatus.INACTIVE;
    this.description = data.description;
    this.systemPrompt = data.systemPrompt;
    this.capabilities = data.capabilities;
    this.configuration = data.configuration;
  }
}

// Changed from interface to class
export class CreateAgentDto {
  name: string;
  type: AgentType;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapabilityConfig[];
  configuration?: unknown;
  metadata?: unknown;
  role?: AgentRole;
  provider?: string;

  constructor(data: Partial<CreateAgentDto>) {
    this.name = data.name || '';
    this.type = data.type || AgentType.ASSISTANT;
    this.description = data.description;
    this.systemPrompt = data.systemPrompt;
    this.capabilities = data.capabilities;
    this.configuration = data.configuration;
    this.metadata = data.metadata;
    this.role = data.role;
    this.provider = data.provider || 'default';
  }
}

// Changed from interface to class
export class UpdateAgentDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapabilityConfig[];
  configuration?: unknown;
  status?: AgentStatus;
  metadata?: unknown;
  type?: AgentType;
  role?: AgentRole;

  constructor(data: Partial<UpdateAgentDto> = {}) {
    this.name = data.name;
    this.description = data.description;
    this.systemPrompt = data.systemPrompt;
    this.capabilities = data.capabilities;
    this.configuration = data.configuration;
    this.status = data.status;
    this.metadata = data.metadata;
    this.type = data.type;
    this.role = data.role;
  }
}

export class AgentResponseDto {
  id: string;
  name: string;
  type: AgentType;
  description?: string;
  status: AgentStatus;
  capabilities?: AgentCapabilityConfig[];
  provider?: string;
  lastActive?: Date;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<AgentResponseDto>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.type = data.type || AgentType.ASSISTANT;
    this.description = data.description;
    this.status = data.status || AgentStatus.INACTIVE;
    this.capabilities = data.capabilities;
    this.provider = data.provider;
    this.lastActive = data.lastActive;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

export interface AgentCapabilityConfig {
  name: string;
  description?: string;
  parameters?: unknown;
}
