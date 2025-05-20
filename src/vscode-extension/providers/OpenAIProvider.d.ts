import { LLMProvider, LLMResult } from '../src/types/llm.js';
export declare class OpenAIProvider implements LLMProvider {
    readonly id = "openai";
    readonly name = "OpenAI";
    modelName: string;
    private apiKey;
    private logger;
    constructor();
    generate(prompt: string, options?: any): Promise<LLMResult>;
    configure(): Promise<void>;
    getAvailableModels(): Promise<string[]>;
    setModel(model: string): Promise<void>;
}
//# sourceMappingURL=OpenAIProvider.d.ts.map