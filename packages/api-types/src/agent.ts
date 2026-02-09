/**
 * Agent-related type definitions
 */
import { UUID, ISODateTime } from './common';

export enum AgentType {
  HUMAN = 'human',
  AI = 'ai',
  ASSISTANT = 'assistant',
  WORKER = 'worker',
  SUPERVISOR = 'supervisor',
  SPECIALIST = 'specialist'
}

export enum IntegrationLevel {
  STANDALONE = 'standalone',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  FULL = 'full',
}

export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  LEARNING = 'learning',
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
  role: string; // Added from agent.ts
  description?: string;
  type: AgentType;
  channel: string; // Added from agent.ts
  capabilities: AgentCapability[];
  integrationLevel: IntegrationLevel; // Added from agent.ts
  status: AgentStatus;
  isActive: boolean; // Added from agent.ts
  lastSeen?: ISODateTime; // Changed to ISODateTime from Date
  departmentId?: string; // Added from agent.ts
  taskCount: number; // Added from agent.ts
  successCount: number; // Added from agent.ts
  failureCount: number; // Added from agent.ts
  apiKey?: string; // Added from agent.ts
  modelId?: string; // Added from agent.ts
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  createdBy?: UUID; // Made optional
  userId?: UUID; // Made optional
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
