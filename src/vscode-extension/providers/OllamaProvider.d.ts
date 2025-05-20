import { LLMProvider, LLMResult } from '../src/types/llm.js';
export declare class OllamaProvider implements LLMProvider {
    readonly id = "ollama";
    readonly name = "Ollama";
    modelName: string;
    private endpoint;
    private logger;
    constructor();
    generate(prompt: string, options?: any): Promise<LLMResult>;
    configure(): Promise<void>;
    getAvailableModels(): Promise<string[]>;
    setModel(model: string): Promise<void>;
    pullModel(modelName: string): Promise<void>;
}
//# sourceMappingURL=OllamaProvider.d.ts.map