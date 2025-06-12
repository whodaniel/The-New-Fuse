import { BaseEntity } from './core/base-types';

export enum AgentType {
  CHAT = "CHAT",
  WORKFLOW = "WORKFLOW",
  TASK = "TASK",
  ASSISTANT = "ASSISTANT"
}

export enum AgentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BUSY = "BUSY",
  ERROR = "ERROR"
}

export enum AgentRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM"
}

export interface AgentCapability { // Can remain an interface
  name: string;
  description?: string;
  parameters?: unknown;
}

// Changed from interface to class
export class Agent extends BaseEntity {
  name: string;
  type: AgentType;
  status: AgentStatus;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: unknown;
}

// Changed from interface to class
export class CreateAgentDto {
  name: string;
  type: AgentType;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: unknown;
}

// Changed from interface to class
export class UpdateAgentDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: unknown;
  status?: AgentStatus;
}

export interface AgentCapabilityConfig { // Can remain an interface
  [key: string]: unknown;
}
