import { Department } from './departments.js';
import { AgentAction } from './agent_action.js';
import { APIModel } from './api_model.js';
export declare enum AgentType {
    HUMAN = "human",
    AI = "ai"
}
export declare enum IntegrationLevel {
    STANDALONE = "standalone",
    BASIC = "basic",
    ADVANCED = "advanced",
    FULL = "full"
}
export declare enum AgentStatus {
    ACTIVE = "active",
    IDLE = "idle",
    BUSY = "busy",
    OFFLINE = "offline",
    LEARNING = "learning"
}
export declare class Agent {
    : any;
    name: string;
    role: string;
    : string;
    channel: string;
    capabilities: string[];
    : object;
    status: AgentStatus;
    : string;
    : object;
    : object;
    : object;
    created_at: Date;
    last_active: Date;
    is_available: boolean;
    max_concurrent_tasks: number;
    current_tasks: number;
    agent_type: AgentType;
    integration_level: IntegrationLevel;
    department: Department;
    : any;
    apis: APIModel[];
    actions: AgentAction[];
    constructor(name: string, role: string, channel: string, capabilities?: string[], description?: string, personality?: object, specialization?: string, language_proficiency?: object, agent_type?: AgentType, integration_level?: IntegrationLevel);
}
