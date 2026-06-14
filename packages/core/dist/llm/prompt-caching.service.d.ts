export type AnthropicModel = 'claude-3-5-sonnet-20240620' | 'claude-3-opus-20240229';
export interface PromptParts {
    systemContext: string;
    documentation: string;
    actualQuery: string;
    model: AnthropicModel;
}
export interface CacheControl {
    type: 'ephemeral';
}
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    cache_control?: CacheControl;
}
export declare class PromptCachingService {
    buildCacheablePrompt(parts: PromptParts): Message[];
    cacheSystemPrompt(systemContext: string): Message;
    cacheDocumentation(documentation: string): Message;
    buildDynamicQuery(actualQuery: string): Message;
}
//# sourceMappingURL=prompt-caching.service.d.ts.map