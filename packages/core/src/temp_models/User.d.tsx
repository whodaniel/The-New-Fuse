import { Agent } from './Agent.js';
import { Pipeline } from './Pipeline.js';
export declare class User {
    id: string;
    username: string;
    email: string;
    hashedPassword?: string;
    isActive: boolean;
    emailVerified: boolean;
    roles?: string[];
    createdAt: Date;
    updatedAt: Date;
    agents?: Agent[];
    pipelines?: Pipeline[];
    hasRole?(role: string): boolean;
}
