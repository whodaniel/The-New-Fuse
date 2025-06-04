import { User } from './User.js';
import { Agent } from './Agent.js';
import { Task } from './Task.js';
export declare class Pipeline {
    id: string;
    name: string;
    description: string;
    configuration: Record<string, any>;
    user: User;
    userId: string;
    agent: Agent;
    agentId: string;
    tasks: Task[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
