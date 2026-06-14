export {};
export interface LLMConfig {
    apiKey?: string;
    baseURL?: string;
    model?: string;
    maxTokens?: number;
    defaultHeaders?: Record<string, string>;
}
export declare abstract class BaseLLMProvider {
    protected apiKey: string;
    protected baseURL: string;
    protected model: string;
    protected maxTokens: number;
    protected client: any;
    protected defaultHeaders: Record<string, string>;
    constructor(config?: LLMConfig);
    protected initClient(): void;
    abstract getDefaultApiKey(): string;
    abstract getDefaultBaseURL(): string;
    abstract getDefaultModel(): string;
    abstract getDefaultMaxTokens(): number;
    abstract getDefaultHeaders(): Record<string, string>;
}
//# sourceMappingURL=base.d.ts.map