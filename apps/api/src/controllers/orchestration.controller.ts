// @ts-nocheck
import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpException,
  Logger,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { isPrivilegedUser } from '../auth/auth-policy';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  JwtAuth,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';

interface OrchestrationChatRequest {
  message: string;
  systemPrompt?: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  context?: {
    tenantId?: string;
    agencyId?: string;
    workspaceId?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

type AuthUser = {
  id?: string;
  tenantId?: string;
  agencyId?: string;
  roles?: string[];
  permissions?: string[];
  email?: string | null;
};

@ApiTags('orchestration')
@Controller('orchestration')
@UseGuards(SecureAuthGuard)
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class OrchestrationController {
  private readonly logger = new Logger(OrchestrationController.name);

  constructor(private readonly db: DatabaseService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Run an AI-assisted chat request with tenant-aware context validation',
  })
  @ApiResponse({ status: 200, description: 'AI response payload' })
  async chat(@Body() body: OrchestrationChatRequest, @CurrentUser() user: AuthUser) {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) {
      throw new BadRequestException('message is required');
    }

    const context = this.normalizeContext(body?.context);
    await this.assertContextAccess(context, user);

    const resolved = await this.resolveProviderForUser(user, body?.provider, body?.model);
    const response = await this.executeChatCompletion(
      resolved as any,
      message,
      body?.systemPrompt,
      body?.temperature,
      body?.maxTokens
    );

    return {
      response,
      provider: resolved.provider,
      model: resolved.modelName,
      context: {
        ...context,
        tenantId: user?.tenantId || context.tenantId,
        agencyId: user?.agencyId || context.agencyId,
        userId: user?.id || context.userId,
      },
    };
  }

  private normalizeContext(input?: OrchestrationChatRequest['context']) {
    if (!input || typeof input !== 'object') return {} as Record<string, unknown>;
    return {
      ...input,
      tenantId: typeof input.tenantId === 'string' ? input.tenantId.trim() : undefined,
      agencyId: typeof input.agencyId === 'string' ? input.agencyId.trim() : undefined,
      workspaceId: typeof input.workspaceId === 'string' ? input.workspaceId.trim() : undefined,
      userId: typeof input.userId === 'string' ? input.userId.trim() : undefined,
    };
  }

  private async assertContextAccess(
    context: { tenantId?: string; agencyId?: string; workspaceId?: string; userId?: string },
    user: AuthUser
  ) {
    const privileged = isPrivilegedUser(user || {});

    if (context.userId && user?.id && context.userId !== user.id && !privileged) {
      throw new ForbiddenException('context.userId mismatch for authenticated user');
    }

    if (context.tenantId && user?.tenantId && context.tenantId !== user.tenantId && !privileged) {
      throw new ForbiddenException('context.tenantId mismatch for authenticated user');
    }

    if (context.agencyId && user?.agencyId && context.agencyId !== user.agencyId && !privileged) {
      throw new ForbiddenException('context.agencyId mismatch for authenticated user');
    }

    if (context.workspaceId) {
      const workspace = await this.db.workspaces.findByIdWithOwner(context.workspaceId);
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }
      if (!privileged && workspace.ownerId !== user?.id) {
        const membership = user?.id
          ? await this.db.workspaceMembers.findMembership(context.workspaceId, user.id)
          : null;
        if (!membership) {
          throw new ForbiddenException('Workspace access denied');
        }
      }
    }
  }

  private normalizeProvider(value?: string): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  private async resolveProviderForUser(user: AuthUser, requested?: string, requestedModel?: string) {
    const normalizedRequested = this.normalizeProvider(requested);
    const enabledConfigs = await this.safeLoadEnabledConfigs();
    const orderedConfigs = [...enabledConfigs].sort((a, b) => a.priority - b.priority);

    const userProviders = user?.id ? await this.db.providerApiKeys.listByUser(user.id) : [];
    const userProviderSet = new Set(userProviders.map((row: any) => this.normalizeProvider(row.provider)));

    if (normalizedRequested) {
      return this.resolveSpecificProvider(
        normalizedRequested,
        requestedModel,
        orderedConfigs,
        userProviderSet as any,
        user
      );
    }

    for (const config of orderedConfigs) {
      const normalized = this.normalizeProvider(config.provider);
      if (!normalized || !userProviderSet.has(normalized)) continue;
      const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(
        user.id!,
        normalized
      );
      if (userKey?.apiKey) {
        return {
          provider: normalized,
          modelName: config.modelName,
          apiKey: userKey.apiKey,
          apiEndpoint: config.apiEndpoint ?? null,
        };
      }
    }

    if (userProviderSet.size > 0 && user?.id) {
      const provider = [...userProviderSet][0];
      const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(user.id, provider as any);
      if (userKey?.apiKey) {
        return {
          provider,
          modelName: this.defaultModelForProvider(provider),
          apiKey: userKey.apiKey,
          apiEndpoint: null,
        };
      }
    }

    if (orderedConfigs.length > 0) {
      const config = orderedConfigs[0];
      const normalizedProvider = this.normalizeProvider(config.provider);
      if (config.apiKey?.trim() || this.providerAllowsMissingApiKey(normalizedProvider)) {
        return {
          provider: normalizedProvider,
          modelName: config.modelName,
          apiKey: config.apiKey || '',
          apiEndpoint: config.apiEndpoint ?? null,
        };
      }
    }

    const fallback = this.resolveEnvProviderFallback();
    if (fallback) {
      return fallback;
    }

    throw new BadRequestException(
      'No LLM provider is configured. Add a provider key in API settings or enable a global provider.'
    );
  }

  private async resolveSpecificProvider(
    provider: string,
    requestedModel: string | undefined,
    orderedConfigs: Array<{
      provider: string;
      modelName: string;
      apiKey: string;
      apiEndpoint: string | null;
      priority: number;
    }>,
    userProviderSet: Set<string>,
    user: AuthUser
  ) {
    const config = orderedConfigs.find(
      (entry) => this.normalizeProvider(entry.provider) === provider
    );
    const modelName = requestedModel?.trim() || config?.modelName || this.defaultModelForProvider(provider);

    if (userProviderSet.has(provider) && user?.id) {
      const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(user.id, provider as any);
      if (!userKey?.apiKey) {
        throw new BadRequestException(`No API key configured for provider "${provider}"`);
      }
      return {
        provider,
        modelName,
        apiKey: userKey.apiKey,
        apiEndpoint: config?.apiEndpoint ?? null,
      };
    }

    if (config && (config.apiKey?.trim() || this.providerAllowsMissingApiKey(provider))) {
      if (!isPrivilegedUser(user || {})) {
        throw new ForbiddenException(
          `Provider "${provider}" requires a personal API key in this workspace`
        );
      }
      return {
        provider,
        modelName,
        apiKey: config.apiKey || '',
        apiEndpoint: config.apiEndpoint ?? null,
      };
    }

    throw new BadRequestException(`Provider "${provider}" is not configured`);
  }

  private async safeLoadEnabledConfigs() {
    try {
      return (await this.db.llmConfigs.findEnabled()) as Array<{
        provider: string;
        modelName: string;
        apiKey: string;
        apiEndpoint: string | null;
        priority: number;
      }>;
    } catch (error) {
      this.logger.warn(`LLM config lookup failed: ${(error as Error).message}`);
      return [];
    }
  }

  private defaultModelForProvider(provider: string): string {
    if (provider === 'anthropic') return 'claude-3-5-sonnet-20240620';
    if (provider === 'openrouter') return 'openai/gpt-4o-mini';
    if (provider === 'perplexity') return 'sonar';
    if (provider === 'groq') return 'llama-3.1-70b-versatile';
    if (provider === 'google-adk') return 'gemini-2.5-pro';
    return 'gpt-4o-mini';
  }

  private resolveChatEndpoint(provider: string, apiEndpoint?: string | null): string {
    if (provider === 'google-adk') return this.resolveGoogleADKExecuteEndpoint(apiEndpoint);
    if (apiEndpoint && apiEndpoint.trim()) return apiEndpoint.trim();
    if (provider === 'anthropic') return 'https://api.anthropic.com/v1/messages';
    if (provider === 'openrouter') return 'https://openrouter.ai/api/v1/chat/completions';
    if (provider === 'perplexity') return 'https://api.perplexity.ai/chat/completions';
    if (provider === 'groq') return 'https://api.groq.com/openai/v1/chat/completions';
    return 'https://api.openai.com/v1/chat/completions';
  }

  private buildHeaders(provider: string, apiKey: string): Record<string, string> {
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

  private buildPayload(
    provider: string,
    modelName: string,
    message: string,
    systemPrompt?: string,
    temperature?: number,
    maxTokens?: number
  ): Record<string, unknown> {
    if (provider === 'google-adk') {
      return {
        requestId: randomUUID(),
        traceId: randomUUID(),
        workspaceId: 'tnf-default-workspace',
        agentId: 'tnf-orchestration-controller',
        model: modelName,
        input: {
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: message },
          ],
        },
        tools: [],
        metadata: {
          source: 'tnf-orchestration-controller',
          policyProfile: 'default',
        },
        timeoutMs: 120000,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        maxTokens: maxTokens ?? 800,
      };
    }

    if (provider === 'anthropic') {
      return {
        model: modelName,
        max_tokens: maxTokens ?? 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      };
    }

    const messages = [] as Array<{ role: string; content: string }>;
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: message });

    return {
      model: modelName,
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: maxTokens ?? 800,
    };
  }

  private extractTextContent(provider: string, payload: any): string | null {
    if (provider === 'google-adk') {
      const text = payload?.output?.content;
      return typeof text === 'string' ? text : null;
    }

    if (provider === 'anthropic') {
      const text = payload?.content?.[0]?.text;
      return typeof text === 'string' ? text : null;
    }

    const message = payload?.choices?.[0]?.message?.content;
    if (typeof message === 'string') return message;

    const text = payload?.choices?.[0]?.text;
    return typeof text === 'string' ? text : null;
  }

  private async executeChatCompletion(
    selection: { provider: string; modelName: string; apiKey: string; apiEndpoint: string | null },
    message: string,
    systemPrompt?: string,
    temperature?: number,
    maxTokens?: number
  ) {
    const provider = selection.provider;
    const endpoint = this.resolveChatEndpoint(provider, selection.apiEndpoint);
    const headers = this.buildHeaders(provider, selection.apiKey);
    const payload = this.buildPayload(provider, selection.modelName, message, systemPrompt, temperature, maxTokens);

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
          `Orchestration chat failed: provider=${provider} status=${response.status} body=${raw.slice(0, 500)}`
        );
        throw new BadGatewayException('LLM provider request failed');
      }

      const text = this.extractTextContent(provider, parsed);
      if (!text) {
        throw new BadGatewayException('Provider returned no response text');
      }

      return text;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Orchestration chat transport failed: provider=${provider} error=${(error as Error).message}`
      );
      throw new BadGatewayException('LLM provider is currently unavailable');
    }
  }

  private tryParseJson(payload: string): any {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  private providerAllowsMissingApiKey(provider: string): boolean {
    return provider === 'google-adk';
  }

  private resolveEnvProviderFallback(): {
    provider: string;
    modelName: string;
    apiKey: string;
    apiEndpoint: string | null;
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
      };
    }

    if (!openAIKey) return null;
    return {
      provider: 'openai',
      modelName: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      apiKey: openAIKey,
      apiEndpoint: process.env.OPENAI_API_BASE?.trim() || null,
    };
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
}
