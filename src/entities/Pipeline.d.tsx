import { User } from './User.js';
import { Agent } from './Agent.js';
export declare class Pipeline {
  id: string;
  name: string;
  description?: string;
  status: string;
  config?: Record<string, any>;
  user?: User;
  userId: string;
  agent?: Agent;
  agentId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
