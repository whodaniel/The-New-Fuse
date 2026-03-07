import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { LLMProvider } from '../LLMProvider';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';

export interface OpenCodeApiConfig extends LLMConfig {
  baseURL?: string;
  serverPassword?: string;
}

interface OpenCodeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenCodeSessionResponse {
  id: string;
}

interface OpenCodeMessageResponse {
  info: {
    id: string;
  };
  parts: Array<{
    type: string;
    text?: string;
  }>;
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
@Injectable()
export class OpenCodeApiProvider extends LLMProvider {
  protected readonly logger = new Logger(OpenCodeApiProvider.name);
  private client: AxiosInstance;
  private sessionId: string | null = null;

  constructor(private readonly config: OpenCodeApiConfig) {
    super();

    const baseURL = this.config.baseURL || 'http://localhost:4096';

    this.client = axios.create({
      baseURL,
      timeout: this.config.timeout || 600000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.config.serverPassword) {
      this.client.defaults.auth = {
        username: 'opencode',
        password: this.config.serverPassword,
      };
    }
  }

  /**
   * Check if the OpenCode server is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/global/health');
      return response.data?.healthy === true;
    } catch (error) {
      this.logger.error('OpenCode server health check failed', error);
      return false;
    }
  }

  /**
   * Initialize a new session with OpenCode
   */
  private async createSession(): Promise<string> {
    try {
      const response = await this.client.post<OpenCodeSessionResponse>('/session', {
        title: 'The New Fuse Session',
      });
      this.sessionId = response.data.id;
      return this.sessionId;
    } catch (error) {
      this.logger.error('Failed to create OpenCode session', error);
      throw error;
    }
  }

  /**
   * Get or create a session
   */
  private async getSession(): Promise<string> {
    if (!this.sessionId) {
      return this.createSession();
    }
    return this.sessionId;
  }

  /**
   * Generate completion from prompt using OpenCode API
   */
  async generate(prompt: string): Promise<string> {
    try {
      const sessionId = await this.getSession();
      const model = this.config.modelName || 'anthropic/claude-sonnet-4-5';

      const messages: OpenCodeMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.client.post<OpenCodeMessageResponse>(
        `/session/${sessionId}/message`,
        {
          parts: messages,
          model,
        },
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.logger.error('Failed to generate completion from OpenCode API', error);
      throw error;
    }
  }

  /**
   * Chat completion with message history
   */
  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const mergedConfig = { ...this.config, ...config };

    try {
      const sessionId = await this.getSession();

      const opencodeMessages: OpenCodeMessage[] = messages.map((msg) => ({
        role: msg.role === 'system' ? 'system' : msg.role,
        content: msg.content,
      }));

      const response = await this.client.post<OpenCodeMessageResponse>(
        `/session/${sessionId}/message`,
        {
          parts: opencodeMessages,
          model: mergedConfig.modelName,
        },
      );

      const content = this.parseResponse(response.data);
      const promptText = messages.map((m) => m.content).join(' ');

      return {
        content,
        usage: {
          promptTokens: this.estimateTokens(promptText),
          completionTokens: this.estimateTokens(content),
          totalTokens: this.estimateTokens(promptText) + this.estimateTokens(content),
        },
        metadata: {
          provider: 'opencode-api',
          model: mergedConfig.modelName,
          sessionId,
        },
      };
    } catch (error) {
      this.logger.error('Failed to chat with OpenCode API', error);
      throw error;
    }
  }

  /**
   * Parse the response from OpenCode API
   */
  private parseResponse(response: OpenCodeMessageResponse): string {
    const textParts = response.parts
      .filter((part) => part.type === 'text' && part.text)
      .map((part) => part.text);

    return textParts.join('\n');
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Abort the current running operation
   */
  async abort(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.client.post(`/session/${this.sessionId}/abort`);
      } catch (error) {
        this.logger.warn('Failed to abort OpenCode session', error);
      }
    }
  }

  /**
   * Dispose the session
   */
  async dispose(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.client.delete(`/session/${this.sessionId}`);
      } catch (error) {
        this.logger.warn('Failed to dispose OpenCode session', error);
      }
      this.sessionId = null;
    }
  }
}
