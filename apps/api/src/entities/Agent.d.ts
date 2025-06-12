import { User } from './User.js';
import { Pipeline } from './Pipeline.tsx';
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
