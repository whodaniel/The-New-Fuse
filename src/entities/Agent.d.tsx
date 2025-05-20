import { User } from './User.js';
import { Pipeline } from './Pipeline.js';
export declare class Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  capabilities: string[];
  status: string;
  config?: Record<string, any>;
  configuration?: Record<string, any>;
  user?: User;
  userId: string;
  type?: string;
  pipelines?: Pipeline[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
