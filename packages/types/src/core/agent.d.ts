export type AgentCapability = 'communication' | 'task_processing' | 'collaboration' | 'math_solving' | 'code_analysis' | 'natural_language';
export interface AgentMessage {
    id: string;
    type: string;
    content: string;
    sender: string;
    timestamp: string;
    metadata: {
        version: string;
        priority: 'low' | 'medium' | 'high';
    };
}
export interface AgentConfig {
    id: string;
    channel: string;
    broadcastChannel: string;
    description: string;
    capabilities: AgentCapability[];
}
//# sourceMappingURL=agent.d.ts.map