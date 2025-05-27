import { TheFuseAPI } from '../thefuse-api.js';
export declare class LLMProviderService {
    private api;
    private logger;
    constructor(api: TheFuseAPI);
    generateText(prompt: string, options?: any): Promise<string>;
    summarizeContent(content: string, level?: string): Promise<string>;
    analyzeSentiment(content: string): Promise<string>;
}
//# sourceMappingURL=llm-provider.service.d.ts.map