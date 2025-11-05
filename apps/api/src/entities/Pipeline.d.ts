import { Agent } from './Agent';
import { Task } from './Task';
import { User } from './User';
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
//# sourceMappingURL=Pipeline.d.ts.map