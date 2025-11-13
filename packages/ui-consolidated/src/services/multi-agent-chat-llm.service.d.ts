export declare class MultiAgentChatLLMService {
    private apiKeys;
    constructor(apiKeys?: Record<string, string>);
    callTextAPI(prompt: string, systemPrompt: string, llm?: string): Promise<string>;
    private callGeminiAPI;
}
//# sourceMappingURL=multi-agent-chat-llm.service.d.ts.map