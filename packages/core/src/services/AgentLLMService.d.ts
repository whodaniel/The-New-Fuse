import { ConfigService } from '../config/ConfigService';
import { Agent } from '@the-new-fuse/types';
export interface LLMResponse {
    content: string;
    provider: string;
    model?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export declare class AgentLLMService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    processMessage(message: string, agent?: Agent): Promise<string>;
    getAgentResponse(prompt: string, agent?: Agent): Promise<LLMResponse>;
    private processLocalAIMessage;
    private getLocalAIResponse;
    private executeClaudeCodeCLI;
    private executeGeminiCLI;
    private executeOllama;
    private executeGenericCommand;
    /**
     * Get available local AI agents for a user
     */
    getAvailableLocalAIAgents(userId: string): Promise<Agent[]>;
    /**
     * Test connectivity to a local AI agent
     */
    testLocalAIAgent(agent: Agent): Promise<boolean>;
}
//# sourceMappingURL=AgentLLMService.d.ts.map