import { BaseLLMProvider, LLMConfig } from '../LLMProvider.js';
export declare class OpenAIProvider extends BaseLLMProvider {
    private client;
    constructor(config: LLMConfig);
}
