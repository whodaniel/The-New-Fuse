import { BaseLLMProvider, LLMConfig } from '../LLMProvider/;';
export declare class OpenAIProvider extends BaseLLMProvider {
    private client;
    constructor(config: LLMConfig);
}
