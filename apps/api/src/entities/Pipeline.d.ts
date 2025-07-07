import { User } from './User';
import { Agent } from './Agent';
import { Task } from './Task';
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
