import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LLMProvider } from '../LLMProvider';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';

export interface GoogleADKConfig extends LLMConfig {
  baseURL?: string;
  gatewayApiKey?: string;
  workspaceId?: string;
  agentId?: string;
}

interface GoogleADKExecuteResponse {
  requestId: string;
  traceId: string;
  status: 'ok' | 'error';
  output?: {
    content?: string;
    parts?: unknown[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  toolCalls?: unknown[];
  latencyMs?: number;
  provider?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Google ADK Provider
 *
 * Adapter provider that routes TNF LLM calls through the ADK gateway service.
 * The gateway handles ADK runtime integration and returns TNF-normalized envelopes.
 */
@Injectable()
export class GoogleADKProvider extends LLMProvider {
  protected readonly logger = new Logger(GoogleADKProvider.name);
  private readonly baseURL: string;

  constructor(private readonly config: GoogleADKConfig) {
    super();
    this.baseURL = (config.baseURL || 'http://localhost:8089').replace(/\/+$/, '');
  }

  async generate(prompt: string): Promise<string> {
    const response = await this.chat([
      {
        role: 'user',
        content: prompt,
      },
    ]);
    return response.content;
  }

  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const mergedConfig = { ...this.config, ...config };
    const payload = {
      requestId: randomUUID(),
      traceId: randomUUID(),
      workspaceId: this.config.workspaceId || 'tnf-default-workspace',
      agentId: this.config.agentId || 'tnf-google-adk-provider',
      model: mergedConfig.modelName || 'gemini-2.5-pro',
      input: {
        messages: this.normalizeMessages(messages),
      },
      tools: [],
      metadata: {
        source: 'tnf-google-adk-provider',
        policyProfile: 'default',
      },
      timeoutMs: mergedConfig.timeout || 120000,
    };

    const result = await this.callGateway('/v1/execute', payload, payload.timeoutMs);

    const content = result.output?.content || '';
    const promptText = messages.map((m) => m.content).join('\n');

    return {
      content,
      usage: {
        promptTokens: result.usage?.inputTokens ?? this.estimateTokens(promptText),
        completionTokens: result.usage?.outputTokens ?? this.estimateTokens(content),
        totalTokens:
          result.usage?.totalTokens ??
          this.estimateTokens(promptText) + this.estimateTokens(content),
      },
      metadata: {
        requestId: result.requestId,
        traceId: result.traceId,
        status: result.status,
        provider: result.provider || 'google-adk',
        model: result.model || payload.model,
        latencyMs: result.latencyMs,
        gateway: this.baseURL,
        ...result.metadata,
      },
    };
  }

  async *streamChat(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>,
  ): AsyncGenerator<string, void, unknown> {
    const mergedConfig = { ...this.config, ...config };
    const payload = {
      requestId: randomUUID(),
      traceId: randomUUID(),
      workspaceId: this.config.workspaceId || 'tnf-default-workspace',
      agentId: this.config.agentId || 'tnf-google-adk-provider',
      model: mergedConfig.modelName || 'gemini-2.5-pro',
      input: {
        messages: this.normalizeMessages(messages),
      },
      tools: [],
      metadata: {
        source: 'tnf-google-adk-provider',
        policyProfile: 'default',
      },
      timeoutMs: mergedConfig.timeout || 120000,
    };

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/v1/execute/stream`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        },
        payload.timeoutMs,
      );

      if (!response.ok || !response.body) {
        throw new Error(`ADK stream endpoint failed with status ${response.status}`);
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          let event: {
            event?: string;
            type?: string;
            content?: string;
            error?: string;
            status?: string;
          };
          try {
            event = JSON.parse(line) as {
              event?: string;
              type?: string;
              content?: string;
              error?: string;
              status?: string;
            };
          } catch {
            // Ignore malformed stream lines to keep stream resilient.
            continue;
          }

          const kind = event.event || event.type;
          if ((kind === 'chunk' || kind === 'delta') && typeof event.content === 'string') {
            yield event.content;
          }
          if (kind === 'error') {
            throw new Error(event.error || 'ADK stream error');
          }
          if (kind === 'done') {
            if (event.status === 'error') {
              throw new Error('ADK stream finished with error status');
            }
            return;
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `ADK stream unavailable, falling back to non-stream response: ${(error as Error).message}`,
      );
      const fallback = await this.chat(messages, config);
      if (fallback.content) {
        yield fallback.content;
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/v1/health`,
        {
          method: 'GET',
          headers: this.buildHeaders(),
        },
        5000,
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private normalizeMessages(messages: LLMMessage[]) {
    return messages.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : message.role,
      content: message.content,
    }));
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.gatewayApiKey) {
      headers['x-adk-gateway-key'] = this.config.gatewayApiKey;
    }
    return headers;
  }

  private async callGateway(
    path: string,
    payload: Record<string, unknown>,
    timeoutMs: number,
  ): Promise<GoogleADKExecuteResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseURL}${path}`,
      {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      },
      timeoutMs,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ADK gateway error (${response.status}): ${text}`);
    }

    return (await response.json()) as GoogleADKExecuteResponse;
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }
}
