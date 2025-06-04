import { AgentLLMService, MemorySystem, PromptService } from '@the-new-fuse/core';
import { MemoryContent, MemoryQuery } from '@the-new-fuse/core';
export declare class NeuralController {
    private readonly agentService;
    private readonly memorySystem;
    private readonly promptService;
    constructor(agentService: AgentLLMService, memorySystem: MemorySystem, promptService: PromptService);
    searchMemories(query: MemoryQuery): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    addMemory(content: MemoryContent): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    addMemoryBatch(body: {
        memories: MemoryContent[];
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    renderPrompt(data: {
        templateId: string;
        variables: Record<string, any>;
        agentId?: string;
    }): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
}
