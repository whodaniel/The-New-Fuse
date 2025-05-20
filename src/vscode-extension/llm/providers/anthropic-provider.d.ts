import { LLMProviderInterface } from '../LLMProviderManager.js';
export declare class AnthropicProvider implements LLMProviderInterface {
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateText(prompt: string, options?: any): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=anthropic-provider.d.ts.map