import { UnifiedBridge } from '../config/redis_config.js';
export declare class AgentState {
    agent_id: string;
    version: number;
    last_updated: Date;
    conversation_history: unknown[];
    memory: Record<string, unknown>;
    active_tasks: Record<string, unknown>;
    relationships: Record<string, number>;
    preferences: Record<string, unknown>;
    performance_metrics: Record<string, number>;
    constructor(agent_id: string);
    toDict(): AgentStateData;
    static fromDict(data: AgentStateData): AgentState;
    private locks;
    private recoveryAttempts;
    private readonly MAX_RECOVERY_ATTEMPTS;
    state: any;
    version: number;
    state: any;
    last_updated: Date;
    state: any;
    conversation_history: unknown[];
    state: any;
    memory: Record<string, unknown>;
    state: any;
    active_tasks: Record<string, unknown>;
    state: any;
    relationships: Record<string, number>;
    state: any;
    preferences: Record<string, unknown>;
    state: any;
    performance_metrics: Record<string, number>;
}
export declare class StateManager {
    private readonly bridge;
    private states;
    3: any;
    constructor(bridge: UnifiedBridge);
}
