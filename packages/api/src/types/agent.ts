import { AgentStatus } from '@the-new-fuse/types';

export { AgentStatus };

export interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  capabilities: string[];
  status: AgentStatus;
  provider: string;
  lastActive: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AgentCreateData {
  name: string;
  type: string;
  description?: string;
  capabilities?: string[];
  status?: AgentStatus;
  provider: string;
  lastActive?: Date;
  metadata?: any;
}

export interface AgentUpdateData {
  name?: string;
  type?: string;
  description?: string;
  capabilities?: string[];
  status?: AgentStatus;
  provider?: string;
  lastActive?: Date;
  metadata?: any;
}