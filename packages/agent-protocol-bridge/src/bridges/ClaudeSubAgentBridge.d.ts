import { ClaudeSubAgent, ClaudeSubAgentBridge, ClaudeBridgeConfig, ClaudeTaskStatus } from '../integrations/claude-subagent-types';
export declare class ClaudeSubAgentBridgeImplementation implements ClaudeSubAgentBridge {
    private readonly config;
    private readonly anthropicApiUrl;
    constructor(config: ClaudeBridgeConfig);
    createSubAgent(config: Omit<ClaudeSubAgent, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ClaudeSubAgent>;
    subAgentId: any;
    status: ClaudeTaskStatus.IN_PROGRESS;
    conversation: [];
    toolCalls: [];
    terminalSessions: [];
    createdAt: new () => Date;
    task: any;
}
//# sourceMappingURL=ClaudeSubAgentBridge.d.ts.map