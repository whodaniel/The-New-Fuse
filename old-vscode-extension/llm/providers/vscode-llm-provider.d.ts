import { LLMProviderInterface } from '../LLMProviderManager.js';
export declare class VSCodeLLMProvider implements LLMProviderInterface {
    constructor();
    generateText(prompt: string, options?: any): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=vscode-llm-provider.d.ts.map