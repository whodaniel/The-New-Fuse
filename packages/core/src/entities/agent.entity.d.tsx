import { AgentLLMConfig } from '../types/llm.types.js';
export declare class Agent {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    config: {
        llm: AgentLLMConfig;
        memory: {
            enabled: boolean;
            maxSize: number;
            ttl: number;
        };
        tools: {
            allowed: string[];
            config: Record<string, unknown>;
        };
    };
    metadata: Record<string, unknown>;
    metrics?: {
        requests: number;
        tokensUsed: number;
        averageResponseTime: number;
        lastActive: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<Agent>);
}
