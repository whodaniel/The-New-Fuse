import { BaseLLMProvider, LLMConfig } from './base.js';
interface HuggingFaceConfig extends LLMConfig {
    task?: 'text-generation' | 'text2text-generation' | 'conversational';
}
export declare class HuggingFaceProvider extends BaseLLMProvider {
    protected apiKey: string;
    constructor(config?: HuggingFaceConfig);
    getDefaultApiKey(): string;
    getDefaultBaseURL(): string;
    getDefaultModel(): string;
    getDefaultMaxTokens(): number;
    getDefaultHeaders(): Record<string, string>;
    chat(messages: Array<{
        role: string;
        content: string;
    }>): Promise<{
        content: string;
        model: string;
    }>;
    complete(prompt: string): Promise<{
        content: string;
        model: string;
    }>;
    stream(prompt: string): AsyncGenerator<{
        content: string;
        done: boolean;
    }, void, unknown>;
}
export {};
//# sourceMappingURL=huggingface.d.ts.map