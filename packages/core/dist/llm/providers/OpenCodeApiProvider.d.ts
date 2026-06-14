import { Logger } from '@nestjs/common';
import { LLMProvider } from '../LLMProvider.js';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';
export interface OpenCodeApiConfig extends LLMConfig {
    baseURL?: string;
    serverPassword?: string;
}
/**
 * OpenCode API Provider
 *
 * Uses the OpenCode server HTTP API to generate completions.
 * Requires OpenCode server to be running (opencode serve).
 *
 * Supported models:
 * - anthropic/claude-sonnet-4-5
 * - anthropic/claude-haiku-4-5
 * - openai/gpt-4
 * - And many more via OpenCode's provider system
 *
 * Features:
 * - Full IDE integration (LSP, formatters)
 * - File editing capabilities
 * - Multi-session support
 * - Tool execution
 * - Provider management
 */
export declare class OpenCodeApiProvider extends LLMProvider {
    private readonly config;
    protected readonly logger: Logger;
    private client;
    private sessionId;
    constructor(config: OpenCodeApiConfig);
    /**
     * Check if the OpenCode server is available
     */
    healthCheck(): Promise<boolean>;
    /**
     * Initialize a new session with OpenCode
     */
    private createSession;
    /**
     * Get or create a session
     */
    private getSession;
    /**
     * Generate completion from prompt using OpenCode API
     */
    generate(prompt: string): Promise<string>;
    /**
     * Chat completion with message history
     */
    chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
    /**
     * Parse the response from OpenCode API
     */
    private parseResponse;
    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens;
    /**
     * Abort the current running operation
     */
    abort(): Promise<void>;
    /**
     * Dispose the session
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=OpenCodeApiProvider.d.ts.map