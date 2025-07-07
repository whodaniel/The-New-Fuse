import { User } from './User';
import { Pipeline } from './Pipeline';
export declare class Agent {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    user: User;
    userId: string;
    pipelines: Pipeline[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
