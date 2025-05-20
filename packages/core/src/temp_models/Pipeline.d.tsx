import { User } from './User.js';
import { Agent } from './Agent.js';
import { Stage } from './Stage.js';

export declare class Pipeline {
    id: string;
    name: string;
    description?: string;
    agents?: Agent[];
    stages?: Stage[];
    status: 'active' | 'inactive' | 'archived';
    createdAt: Date;
    updatedAt: Date;

    run?(params?: any): Promise<void>;
    addAgent?(agent: Agent): void;
}
