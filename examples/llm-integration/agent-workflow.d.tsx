import { AgentLLMService } from '@the-new-fuse/core/services/agent-llm.service';
import { PromptService } from '@the-new-fuse/core/services/prompt.service';
import { LLMService } from '@the-new-fuse/core/services/llm.service';
import { Agent } from '@the-new-fuse/core/entities/agent.entity';
export declare class AgentWorkflowExample {
    private readonly agentLLMService;
    private readonly promptService;
    private readonly llmService;
    constructor(agentLLMService: AgentLLMService, promptService: PromptService, llmService: LLMService);
    setupAgent(agent: Agent): Promise<{
        llmConfig: AgentLLMConfig;
        systemPrompt: any;
        userPrompt: any;
        responsePrompt: any;
    }>;
    runAnalysis(agent: Agent, query: string, dataset: any, tools: Array<{
        name: string;
        description: string;
    }>): Promise<any>;
    private updateAgentMemory;
}
