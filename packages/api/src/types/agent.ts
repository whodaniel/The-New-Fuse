import { AgentStatus } from '@the-new-fuse/database/generated/prisma';

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
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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