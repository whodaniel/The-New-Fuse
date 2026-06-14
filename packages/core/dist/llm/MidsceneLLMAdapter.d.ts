import { LLMProvider } from './LLMProvider.js';
export declare class MidsceneLLMAdapter {
    private readonly llmProvider;
    private readonly logger;
    constructor(llmProvider: LLMProvider);
    generate(prompt: string): Promise<string>;
}
//# sourceMappingURL=MidsceneLLMAdapter.d.ts.map