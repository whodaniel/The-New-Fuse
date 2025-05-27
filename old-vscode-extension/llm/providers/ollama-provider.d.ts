import { LLMProviderInterface } from '../LLMProviderManager.js';
export declare class OllamaProvider implements LLMProviderInterface {
    private baseUrl;
    private model;
    constructor(model?: string, baseUrl?: string);
    generateText(prompt: string, options?: any): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=ollama-provider.d.ts.map