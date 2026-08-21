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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database';
import { randomUUID } from 'crypto';
import { isPrivilegedUser } from '../auth/auth-policy';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  JwtAuth,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { ProviderCatalogService } from '../services/provider-catalog.service';
import { assertDevLoopBudget } from '../utils/dev-loop-guard';

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

  constructor(
    private readonly db: DatabaseService,
    private readonly providerCatalog: ProviderCatalogService
  ) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Run an AI-assisted chat request with tenant-aware context validation',
  })
  @ApiResponse({ status: 200, description: 'AI response payload' })
  async chat(@Body() body: OrchestrationChatRequest, @CurrentUser() user: AuthUser) {
    assertDevLoopBudget('orchestration.chat', body);
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) {
      throw new BadRequestException('message is required');
    }

    const context = this.normalizeContext(body?.context);
    await this.assertContextAccess(context, user);

    const resolved = await this.resolveProviderForUser(user, body?.provider, body?.model);
    const response = await this.executeChatCompletion(
      resolved,
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

  // Delegated to ProviderCatalogService so the AI source picker (GET /llm/providers/available)
  // and this executor cannot drift apart on provider naming or model defaults.
  private normalizeProvider(value?: string): string {
    return this.providerCatalog.normalizeProvider(value);
  }

  private async resolveProviderForUser(
    user: AuthUser,
    requested?: string,
    requestedModel?: string
  ) {
    try {
      return await this.resolveProviderForUserInner(user, requested, requestedModel);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Provider resolution failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(
        'Unable to resolve an LLM provider. Add a personal API key in Settings, or ask an admin to enable a global provider.'
      );
    }
  }

  private async resolveProviderForUserInner(
    user: AuthUser,
    requested?: string,
    requestedModel?: string
  ) {
    const normalizedRequested = this.normalizeProvider(requested);
    const enabledConfigs = await this.safeLoadEnabledConfigs();
    const orderedConfigs = [...enabledConfigs].sort((a, b) => a.priority - b.priority);

    let userProviders: Array<{ provider: string }> = [];
    if (user?.id) {
      try {
        userProviders = await this.db.providerApiKeys.listByUser(user.id);
      } catch (error) {
        // Invalid user ids (non-UUID) or transient DB errors must not block
        // env / global provider fallbacks — that previously surfaced as opaque 500s.
        this.logger.warn(
          `Unable to load personal provider keys for user ${user.id}: ${(error as Error).message}`
        );
      }
    }
    const userProviderSet = new Set<string>(
      userProviders.map((row) => this.normalizeProvider(row.provider))
    );

    if (normalizedRequested) {
      return this.resolveSpecificProvider(
        normalizedRequested,
        requestedModel,
        orderedConfigs,
        userProviderSet,
        user
      );
    }

    for (const config of orderedConfigs) {
      const normalized = this.normalizeProvider(config.provider);
      if (!normalized || !userProviderSet.has(normalized)) continue;
      try {
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
      } catch (error) {
        // Stale ENCRYPTION_KEY or corrupt ciphertext must not block env/global fallbacks.
        this.logger.warn(
          `Unable to decrypt personal key for ${normalized}: ${(error as Error).message}`
        );
      }
    }

    if (userProviderSet.size > 0 && user?.id) {
      const provider = [...userProviderSet][0];
      try {
        const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(
          user.id,
          provider
        );
        if (userKey?.apiKey) {
          return {
            provider,
            modelName: this.defaultModelForProvider(provider),
            apiKey: userKey.apiKey,
            apiEndpoint: null,
          };
        }
      } catch (error) {
        this.logger.warn(
          `Unable to decrypt personal key for ${provider}: ${(error as Error).message}`
        );
      }
    }

    if (orderedConfigs.length > 0) {
      const config = orderedConfigs[0];
      if (config.apiKey && config.apiKey.trim()) {
        return {
          provider: this.normalizeProvider(config.provider),
          modelName: config.modelName,
          apiKey: config.apiKey,
          apiEndpoint: config.apiEndpoint ?? null,
        };
      }
    }

    const openAiEnvKey = process.env.OPENAI_API_KEY?.trim();
    if (openAiEnvKey) {
      return {
        provider: 'openai',
        modelName: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        apiKey: openAiEnvKey,
        apiEndpoint: process.env.OPENAI_API_BASE?.trim() || null,
      };
    }

    const geminiEnvKey =
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
    if (geminiEnvKey) {
      return {
        provider: 'gemini',
        modelName: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
        apiKey: geminiEnvKey,
        apiEndpoint: process.env.GEMINI_API_BASE?.trim() || null,
      };
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
    const modelName =
      requestedModel?.trim() || config?.modelName || this.defaultModelForProvider(provider);

    if (userProviderSet.has(provider) && user?.id) {
      try {
        const userKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(
          user.id,
          provider
        );
        if (userKey?.apiKey) {
          return {
            provider,
            modelName,
            apiKey: userKey.apiKey,
            apiEndpoint: config?.apiEndpoint ?? null,
          };
        }
      } catch (error) {
        this.logger.warn(
          `Unable to decrypt personal key for ${provider}: ${(error as Error).message}`
        );
      }
    }

    if (config?.apiKey && config.apiKey.trim()) {
      if (!isPrivilegedUser(user || {})) {
        throw new ForbiddenException(
          `Provider "${provider}" requires a personal API key in this workspace`
        );
      }
      return {
        provider,
        modelName,
        apiKey: config.apiKey,
        apiEndpoint: config.apiEndpoint ?? null,
      };
    }

    // Env fallback for the requested provider (same sources as auto-resolve).
    const envResolved = this.resolveProviderFromEnv(provider, modelName);
    if (envResolved) return envResolved;

    throw new BadRequestException(
      `Provider "${provider}" is not configured. Re-save the API key in Settings if it was stored under an older encryption key.`
    );
  }

  private resolveProviderFromEnv(
    provider: string,
    modelName?: string
  ): {
    provider: string;
    modelName: string;
    apiKey: string;
    apiEndpoint: string | null;
  } | null {
    const normalized = this.normalizeProvider(provider);
    if (normalized === 'openai') {
      const key = process.env.OPENAI_API_KEY?.trim();
      if (!key) return null;
      return {
        provider: 'openai',
        modelName: modelName?.trim() || process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        apiKey: key,
        apiEndpoint: process.env.OPENAI_API_BASE?.trim() || null,
      };
    }
    if (normalized === 'gemini' || normalized === 'google') {
      const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
      if (!key) return null;
      return {
        provider: 'gemini',
        modelName: modelName?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
        apiKey: key,
        apiEndpoint: process.env.GEMINI_API_BASE?.trim() || null,
      };
    }
    if (normalized === 'anthropic') {
      const key = process.env.ANTHROPIC_API_KEY?.trim();
      if (!key) return null;
      return {
        provider: 'anthropic',
        modelName: modelName?.trim() || 'claude-3-5-sonnet-20240620',
        apiKey: key,
        apiEndpoint: null,
      };
    }
    if (normalized === 'groq') {
      const key = process.env.GROQ_API_KEY?.trim();
      if (!key) return null;
      return {
        provider: 'groq',
        modelName: modelName?.trim() || 'llama-3.1-70b-versatile',
        apiKey: key,
        apiEndpoint: null,
      };
    }
    if (normalized === 'openrouter') {
      const key = process.env.OPENROUTER_API_KEY?.trim();
      if (!key) return null;
      return {
        provider: 'openrouter',
        modelName: modelName?.trim() || 'openai/gpt-4o-mini',
        apiKey: key,
        apiEndpoint: null,
      };
    }
    if (normalized === 'exa') {
      const key = process.env.EXA_API_KEY?.trim();
      if (!key) return null;
      return {
        provider: 'exa',
        modelName: modelName?.trim() || 'gpt-4o-mini',
        apiKey: key,
        apiEndpoint: null,
      };
    }
    return null;
  }

  private async safeLoadEnabledConfigs() {
    return this.providerCatalog.safeLoadEnabledConfigs();
  }

  private defaultModelForProvider(provider: string): string {
    return this.providerCatalog.defaultModelForProvider(provider);
  }

  private resolveChatEndpoint(
    provider: string,
    modelName: string,
    apiEndpoint?: string | null
  ): string {
    if (provider === 'google-adk') {
      const configuredBase =
        apiEndpoint?.trim() ||
        (modelName.startsWith('http://') || modelName.startsWith('https://') ? modelName : '') ||
        process.env.GOOGLE_ADK_BASE_URL?.trim() ||
        process.env.ADK_GATEWAY_URL?.trim() ||
        (process.env.TNF_RUNTIME === 'docker-compose'
          ? 'http://adk-gateway:8080'
          : 'http://localhost:8089');
      const base = configuredBase.replace(/\/+$/, '');
      return base.endsWith('/v1/execute') ? base : `${base}/v1/execute`;
    }

    if (apiEndpoint && apiEndpoint.trim()) return apiEndpoint.trim();
    if (provider === 'gemini' || provider === 'google') {
      const encodedModel = encodeURIComponent(modelName || 'gemini-2.5-flash');
      return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`;
    }
    if (provider === 'anthropic') return 'https://api.anthropic.com/v1/messages';
    if (provider === 'openrouter') return 'https://openrouter.ai/api/v1/chat/completions';
    if (provider === 'perplexity') return 'https://api.perplexity.ai/chat/completions';
    if (provider === 'groq') return 'https://api.groq.com/openai/v1/chat/completions';
    return 'https://api.openai.com/v1/chat/completions';
  }

  private buildHeaders(provider: string, apiKey: string): Record<string, string> {
    if (provider === 'google-adk') {
      return {
        'content-type': 'application/json',
        'x-adk-gateway-key': apiKey,
      };
    }

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
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        maxTokens: maxTokens ?? 800,
        timeoutMs: 120000,
      };
    }

    if (provider === 'gemini' || provider === 'google') {
      const parts = [systemPrompt, message]
        .filter((part): part is string => Boolean(part && part.trim()))
        .map((text) => ({ text }));

      return {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          maxOutputTokens: maxTokens ?? 800,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
        },
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

    if (provider === 'gemini' || provider === 'google') {
      const parts = payload?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) return null;
      const text = parts
        .map((part: any) => part?.text)
        .filter(Boolean)
        .join('');
      return text || null;
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
    const endpoint = this.resolveChatEndpoint(provider, selection.modelName, selection.apiEndpoint);
    const headers = this.buildHeaders(provider, selection.apiKey);
    const payload = this.buildPayload(
      provider,
      selection.modelName,
      message,
      systemPrompt,
      temperature,
      maxTokens
    );

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
}
