import { LLMProvider, LLMResult } from '../src/types/llm.js';
export declare class AnthropicProvider implements LLMProvider {
    readonly id = "anthropic";
    readonly name = "Anthropic";
    modelName: string;
    private apiKey;
    private logger;
    constructor();
    generate(prompt: string, options?: any): Promise<LLMResult>;
    configure(): Promise<void>;
    getAvailableModels(): Promise<string[]>;
    setModel(model: string): Promise<void>;
}
//# sourceMappingURL=AnthropicProvider.d.ts.map