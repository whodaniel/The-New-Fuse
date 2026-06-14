import { Logger } from '@nestjs/common';
import { LLMProvider } from '../LLMProvider.js';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';
export interface GoogleADKConfig extends LLMConfig {
    baseURL?: string;
    gatewayApiKey?: string;
    workspaceId?: string;
    agentId?: string;
}
/**
 * Google ADK Provider
 *
 * Adapter provider that routes TNF LLM calls through the ADK gateway service.
 * The gateway handles ADK runtime integration and returns TNF-normalized envelopes.
 */
export declare class GoogleADKProvider extends LLMProvider {
    private readonly config;
    protected readonly logger: Logger;
    private readonly baseURL;
    constructor(config: GoogleADKConfig);
    generate(prompt: string): Promise<string>;
    chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
    streamChat(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncGenerator<string, void, unknown>;
    healthCheck(): Promise<boolean>;
    private normalizeMessages;
    private buildHeaders;
    private callGateway;
    private fetchWithTimeout;
    private estimateTokens;
}
//# sourceMappingURL=GoogleADKProvider.d.ts.map