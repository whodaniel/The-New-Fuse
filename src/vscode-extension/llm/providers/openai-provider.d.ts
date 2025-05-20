import { LLMProviderInterface } from '../LLMProviderManager.js';
export declare class OpenAIProvider implements LLMProviderInterface {
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateText(prompt: string, options?: any): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=openai-provider.d.ts.map