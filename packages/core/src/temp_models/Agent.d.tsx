import { User } from './User.js';
import { AgentConfig } from './AgentConfig.js'; // Assuming this import exists or is needed
import { SomeOtherType } from './SomeOtherType.js'; // Placeholder for other types

export declare class Agent {
    id: string; // Added property name
    name: string; // Added property name
    description?: string; // Added property name
    config: AgentConfig; // Added property name, assuming AgentConfig type
    // Example of other properties that might exist:
    status: 'active' | 'inactive' | 'error';
    createdAt: Date;
    updatedAt: Date;
    someMethod?(param: SomeOtherType): Promise<void>; // Example method declaration
    constructor(partial?: Partial<Agent>);
}
