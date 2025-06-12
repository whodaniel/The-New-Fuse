import { BaseLLMProvider, LLMConfig } from '../LLMProvider.tsx';
export declare class OpenAIProvider extends BaseLLMProvider {
    private client;
    constructor(config: LLMConfig);
}
