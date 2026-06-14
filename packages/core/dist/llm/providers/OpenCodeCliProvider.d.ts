import { Logger } from '@nestjs/common';
import { LLMProvider } from '../LLMProvider.js';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';
export interface OpenCodeCliConfig extends LLMConfig {
    cliPath?: string;
}
/**
 * OpenCode CLI Provider
 *
 * Uses the opencode CLI tool to generate completions.
 * The CLI must be installed and available in PATH.
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
 */
export declare class OpenCodeCliProvider extends LLMProvider {
    private readonly config;
    protected readonly logger: Logger;
    constructor(config: OpenCodeCliConfig);
    /**
     * Generate completion from prompt using OpenCode CLI
     */
    generate(prompt: string): Promise<string>;
    /**
     * Chat completion with message history
     */
    chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
    /**
     * Convert messages to OpenCode CLI prompt format
     */
    private messagesToPrompt;
    /**
     * Parse JSON response from OpenCode CLI
     */
    private parseResponse;
    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens;
}
//# sourceMappingURL=OpenCodeCliProvider.d.ts.map