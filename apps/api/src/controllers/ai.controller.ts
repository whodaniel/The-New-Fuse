import {
  BadGatewayException,
  Body,
  Controller,
  HttpException,
  Logger,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { assertDevLoopBudget } from '../utils/dev-loop-guard';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly db: DatabaseService) {}

  @Post('text-completion')
  async textCompletion(@Body() body: { prompt: string; systemPrompt?: string }) {
    assertDevLoopBudget('ai.text-completion', body);
    const { prompt, systemPrompt } = body;
    const provider = await this.getPreferredProvider();
    const providerName = provider.provider.trim().toLowerCase();

    const endpoint = this.resolveTextEndpoint(
      providerName,
      provider.modelName,
      provider.apiEndpoint ?? undefined
    );
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
    assertDevLoopBudget('ai.image-generation', body);
    const provider = await this.getPreferredProvider();
    const providerName = provider.provider.trim().toLowerCase();

    if (!this.isOpenAIProvider(providerName)) {
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

    const preferred = [...enabled]
      .sort((a, b) => a.priority - b.priority)
      .find((config) => this.isUsableApiKey(config.apiKey));
    if (!preferred) {
      const fallback = this.getEnvFallbackProvider();
      if (fallback) {
        this.logger.warn('Configured LLM providers have no usable API key, using env fallback');
        return fallback;
      }

      throw new ServiceUnavailableException('Configured LLM providers have no usable API key.');
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
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (this.isUsableApiKey(openaiKey)) {
      return {
        provider: 'openai',
        modelName: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        apiKey: openaiKey,
        apiEndpoint: process.env.OPENAI_API_BASE?.trim() || null,
        priority: 1,
      };
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
    if (this.isUsableApiKey(geminiKey)) {
      return {
        provider: 'gemini',
        modelName: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
        apiKey: geminiKey,
        apiEndpoint: process.env.GEMINI_API_BASE?.trim() || null,
        priority: 2,
      };
    }

    return null;
  }

  private resolveTextEndpoint(provider: string, model: string, apiEndpoint?: string): string {
    if (provider === 'gemini' || provider === 'google') {
      const encodedModel = encodeURIComponent(model);
      if (apiEndpoint && apiEndpoint.trim()) {
        const trimmed = apiEndpoint.trim();
        if (trimmed.includes('{model}')) {
          return trimmed.replace('{model}', encodedModel);
        }
        if (trimmed.includes(':generateContent')) {
          return trimmed;
        }
        return `${trimmed.replace(/\/$/, '')}/v1beta/models/${encodedModel}:generateContent`;
      }
      return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`;
    }

    if (apiEndpoint && apiEndpoint.trim()) {
      return apiEndpoint.trim();
    }

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
    if (provider === 'gemini' || provider === 'google') {
      return {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      };
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
    if (provider === 'gemini' || provider === 'google') {
      const parts = [systemPrompt, prompt]
        .filter((part): part is string => Boolean(part && part.trim()))
        .map((text) => ({ text }));

      return {
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          maxOutputTokens: 800,
        },
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

    if (provider === 'anthropic') {
      const text = payload?.content?.find?.((item: any) => item?.type === 'text')?.text;
      return typeof text === 'string' ? text : null;
    }

    if (provider === 'gemini' || provider === 'google') {
      const parts = payload?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) {
        return null;
      }

      const text = parts.map((part: any) => part?.text).filter(Boolean).join('');
      return text || null;
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

  private isOpenAIProvider(provider: string): boolean {
    return provider === 'openai' || provider === 'openai-codex';
  }

  private isUsableApiKey(apiKey: string | undefined | null): apiKey is string {
    const normalized = apiKey?.trim();
    if (!normalized) {
      return false;
    }

    return !this.isPlaceholderApiKey(normalized);
  }

  private isPlaceholderApiKey(apiKey: string): boolean {
    const normalized = apiKey.toLowerCase();
    return [
      'placeholder',
      'changeme',
      'change-me',
      'dummy',
      'example',
      'your-api-key',
      'your_api_key',
      'your-openai',
      'your_openai',
      'sk-your',
      'test-key',
    ].some((token) => normalized.includes(token));
  }

  private tryParseJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
