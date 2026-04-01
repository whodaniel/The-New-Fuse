import {
  BadGatewayException,
  Body,
  Controller,
  HttpException,
  Logger,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly db: DatabaseService) {}

  @Post('text-completion')
  async textCompletion(@Body() body: { prompt: string; systemPrompt?: string }) {
    const { prompt, systemPrompt } = body;
    const provider = await this.getPreferredProvider();
    const providerName = provider.provider.trim().toLowerCase();

    const endpoint = this.resolveTextEndpoint(providerName, provider.apiEndpoint ?? undefined);
    const headers = this.buildProviderHeaders(providerName, provider.apiKey);
    const payload = this.buildTextPayload(providerName, provider.modelName, prompt, systemPrompt);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      const parsed = this.tryParseJson(raw);
      if (!response.ok) {
        this.logger.error(
          `AI text completion provider call failed: provider=${providerName} status=${response.status}`
        );
        throw new BadGatewayException('Text generation provider request failed');
      }

      const text = this.extractTextContent(providerName, parsed);
      if (!text) {
        throw new BadGatewayException('Provider returned no text content');
      }

      return {
        text,
        provider: providerName,
        model: provider.modelName,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `AI text completion transport failed: provider=${providerName} error=${(error as Error).message}`
      );
      throw new ServiceUnavailableException('Text generation provider is currently unavailable');
    }
  }

  @Post('image-generation')
  async imageGeneration(@Body() body: { prompt: string }) {
    const provider = await this.getPreferredProvider();
    const providerName = provider.provider.trim().toLowerCase();

    if (!this.isOpenAICompatible(providerName)) {
      throw new ServiceUnavailableException(
        'Image generation requires an OpenAI-compatible provider configured as default.'
      );
    }

    const endpoint = this.resolveImageEndpoint(provider.apiEndpoint ?? undefined);
    const headers = this.buildProviderHeaders(providerName, provider.apiKey);
    const payload = {
      model: this.resolveImageModel(provider.modelName),
      prompt: body.prompt,
      size: '1024x1024',
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      const parsed = this.tryParseJson(raw);
      if (!response.ok) {
        this.logger.error(
          `AI image generation provider call failed: provider=${providerName} status=${response.status}`
        );
        throw new BadGatewayException('Image generation provider request failed');
      }

      const imageUrl = parsed?.data?.[0]?.url;
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new BadGatewayException('Provider returned no image URL');
      }

      return {
        imageUrl,
        provider: providerName,
        model: payload.model,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `AI image generation transport failed: provider=${providerName} error=${(error as Error).message}`
      );
      throw new ServiceUnavailableException('Image generation provider is currently unavailable');
    }
  }

  private async getPreferredProvider(): Promise<{
    provider: string;
    modelName: string;
    apiKey: string;
    apiEndpoint: string | null;
    priority: number;
  }> {
    let enabled: Array<{
      provider: string;
      modelName: string;
      apiKey: string;
      apiEndpoint: string | null;
      priority: number;
    }> = [];

    try {
      enabled = (await this.db.llmConfigs.findEnabled()) as Array<{
        provider: string;
        modelName: string;
        apiKey: string;
        apiEndpoint: string | null;
        priority: number;
      }>;
    } catch (error) {
      const fallback = this.getEnvFallbackProvider();
      if (fallback) {
        this.logger.warn(
          `LLM DB config unavailable, using env fallback provider=${fallback.provider}`
        );
        return fallback;
      }

      this.logger.error(`Unable to load LLM provider config from DB: ${(error as Error).message}`);
      throw new ServiceUnavailableException(
        'LLM provider configuration is unavailable. Check database connectivity and provider setup.'
      );
    }

    if (!enabled.length) {
      const fallback = this.getEnvFallbackProvider();
      if (fallback) {
        return fallback;
      }

      throw new ServiceUnavailableException(
        'No enabled LLM provider is configured. Configure one in admin settings.'
      );
    }

    const preferred = [...enabled].sort((a, b) => a.priority - b.priority)[0];
    const providerName = preferred.provider.trim().toLowerCase();
    if (!preferred.apiKey?.trim() && !this.providerAllowsMissingApiKey(providerName)) {
      throw new ServiceUnavailableException('Configured LLM provider has no API key.');
    }

    return preferred as {
      provider: string;
      modelName: string;
      apiKey: string;
      apiEndpoint: string | null;
      priority: number;
    };
  }

  private getEnvFallbackProvider(): {
    provider: string;
    modelName: string;
    apiKey: string;
    apiEndpoint: string | null;
    priority: number;
  } | null {
    const requestedProvider = process.env.LLM_PROVIDER?.trim().toLowerCase();
    const openAIKey = process.env.OPENAI_API_KEY?.trim();
    const adkBase = process.env.GOOGLE_ADK_BASE_URL?.trim() || process.env.ADK_GATEWAY_URL?.trim();
    const adkGatewayKey =
      process.env.GOOGLE_ADK_API_KEY?.trim() || process.env.ADK_GATEWAY_API_KEY?.trim() || '';

    if (requestedProvider === 'google-adk' || (!openAIKey && adkBase)) {
      return {
        provider: 'google-adk',
        modelName: process.env.GOOGLE_ADK_MODEL?.trim() || 'gemini-2.5-pro',
        apiKey: adkGatewayKey,
        apiEndpoint: adkBase || 'http://localhost:8089',
        priority: 1,
      };
    }

    const apiKey = openAIKey;
    if (!apiKey) {
      return null;
    }

    return {
      provider: 'openai',
      modelName: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      apiKey,
      apiEndpoint: process.env.OPENAI_API_BASE?.trim() || null,
      priority: 1,
    };
  }

  private resolveTextEndpoint(provider: string, apiEndpoint?: string): string {
    if (provider === 'google-adk') return this.resolveGoogleADKExecuteEndpoint(apiEndpoint);
    if (apiEndpoint && apiEndpoint.trim()) return apiEndpoint.trim();

    if (provider === 'anthropic') {
      return 'https://api.anthropic.com/v1/messages';
    }
    if (provider === 'openrouter') {
      return 'https://openrouter.ai/api/v1/chat/completions';
    }
    if (provider === 'perplexity') {
      return 'https://api.perplexity.ai/chat/completions';
    }
    if (provider === 'groq') {
      return 'https://api.groq.com/openai/v1/chat/completions';
    }
    if (provider === 'minimax') {
      return 'https://api.minimax.chat/v1/chat/completions';
    }
    return 'https://api.openai.com/v1/chat/completions';
  }

  private resolveImageEndpoint(apiEndpoint?: string): string {
    if (apiEndpoint && apiEndpoint.trim()) {
      const normalized = apiEndpoint.trim().replace(/\/chat\/completions$/, '');
      const stripped = normalized.replace(/\/responses$/, '');
      return `${stripped}/images/generations`;
    }
    return 'https://api.openai.com/v1/images/generations';
  }

  private buildProviderHeaders(provider: string, apiKey: string): Record<string, string> {
    if (provider === 'google-adk') {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (apiKey?.trim()) {
        headers['x-adk-gateway-key'] = apiKey.trim();
      }
      return headers;
    }

    if (provider === 'anthropic') {
      return {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
    }

    return {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    };
  }

  private buildTextPayload(
    provider: string,
    model: string,
    prompt: string,
    systemPrompt?: string
  ): Record<string, unknown> {
    if (provider === 'google-adk') {
      return {
        requestId: randomUUID(),
        traceId: randomUUID(),
        workspaceId: 'tnf-default-workspace',
        agentId: 'tnf-ai-controller',
        model,
        input: {
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
        },
        tools: [],
        metadata: {
          source: 'tnf-ai-controller',
          policyProfile: 'default',
        },
        timeoutMs: 120000,
      };
    }

    if (provider === 'anthropic') {
      return {
        model,
        max_tokens: 800,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: prompt }],
      };
    }

    return {
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
    };
  }

  private extractTextContent(provider: string, payload: any): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (provider === 'google-adk') {
      const adkText = payload?.output?.content;
      return typeof adkText === 'string' ? adkText : null;
    }

    if (provider === 'anthropic') {
      const text = payload?.content?.find?.((item: any) => item?.type === 'text')?.text;
      return typeof text === 'string' ? text : null;
    }

    const text = payload?.choices?.[0]?.message?.content;
    return typeof text === 'string' ? text : null;
  }

  private resolveImageModel(modelName: string): string {
    if (!modelName || modelName.includes('gpt') || modelName.includes('claude')) {
      return 'gpt-image-1';
    }
    return modelName;
  }

  /** OpenAI-compatible providers support image generation via DALL-E proxy */
  private isOpenAICompatible(provider: string): boolean {
    return provider === 'openai' || provider === 'openai-codex' || provider === 'minimax';
  }

  private providerAllowsMissingApiKey(provider: string): boolean {
    return provider === 'google-adk';
  }

  private resolveGoogleADKExecuteEndpoint(apiEndpoint?: string | null): string {
    const raw =
      apiEndpoint?.trim() ||
      process.env.GOOGLE_ADK_BASE_URL?.trim() ||
      process.env.ADK_GATEWAY_URL?.trim() ||
      'http://localhost:8089';
    if (raw.endsWith('/v1/execute')) return raw;
    if (raw.endsWith('/v1/execute/stream')) return raw.replace(/\/stream$/, '');
    return `${raw.replace(/\/+$/, '')}/v1/execute`;
  }

  private tryParseJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
