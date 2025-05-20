/**
 * Agent-related type definitions
 */
import { UUID, ISODateTime } from './common.js';

export enum AgentType {
  ASSISTANT = 'assistant',
  WORKER = 'worker',
  SUPERVISOR = 'supervisor',
  SPECIALIST = 'specialist'
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRAINING = 'training'
}

export type AgentCapability =
  | 'text-generation'
  | 'code-generation'
  | 'image-generation'
  | 'data-analysis'
  | 'research'
  | 'task-planning'
  | 'task-execution'
  | 'task-monitoring';

export interface AgentModel {
  id: UUID;
  name: string;
  description?: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: AgentCapability[];
  settings: Record<string, any>;
  metadata?: Record<string, any>;
  createdBy: UUID;
  userId: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  type: AgentType;
  capabilities: AgentCapability[];
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  type?: AgentType;
  status?: AgentStatus;
  capabilities?: AgentCapability[];
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}