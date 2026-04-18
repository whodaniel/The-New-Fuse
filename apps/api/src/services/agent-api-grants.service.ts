import {
  BadGatewayException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { and, DatabaseService, desc, eq, gte } from '@the-new-fuse/database';
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { drizzleConfigurationRepository } from '@the-new-fuse/database/drizzle/repositories';
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { agentApiGrants } from '@the-new-fuse/database/drizzle/schema';
import { CreateAgentGrantDto } from '../dto/agent-grants.dto.js';

type GrantTokenPayload = {
  typ: 'agent-grant';
  sub: string; // user id
  gid: string; // grant id
  aid: string; // agent id
  prv: string; // provider
  tv: number; // token version
};

type RoutingSelection = {
  provider: string;
  model: string;
};

@Injectable()
export class AgentApiGrantsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async listForUser(userId: string) {
    return this.db.agentApiGrants.listByUser(userId);
  }

  async createForUser(userId: string, dto: CreateAgentGrantDto) {
    const row = await this.db.agentApiGrants.create({
      userId,
      agentId: dto.agentId.trim(),
      provider: dto.provider.trim().toLowerCase(),
      allowedModels: Array.isArray(dto.allowedModels) ? dto.allowedModels : [],
      maxRequestsPerMinute: dto.maxRequestsPerMinute ?? 30,
      dailyTokenBudget: dto.dailyTokenBudget ?? 200000,
      monthlyUsdCap: dto.monthlyUsdCapCents ?? 1000,
      expiresAt: new Date(dto.expiresAt),
      revoked: false,
      tokenVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      grant: row,
      accessToken: await this.mintGrantToken(row),
    };
  }

  async revokeForUser(userId: string, grantId: string) {
    const row = await this.db.agentApiGrants.revoke(grantId, userId);
    if (!row) {
      throw new ForbiddenException('Grant not found or not owned by user');
    }
    return row;
  }

  async rotateForUser(userId: string, grantId: string) {
    const row = await this.db.agentApiGrants.rotateTokenVersion(grantId, userId);
    if (!row) {
      throw new ForbiddenException('Grant not found or not owned by user');
    }
    return {
      grant: row,
      accessToken: await this.mintGrantToken(row),
    };
  }

  async proxy(provider: string, bearerToken: string | undefined, body: any) {
    const started = Date.now();
    const normalizedProvider = provider.trim().toLowerCase();
    const { payload, grant } = await this.validateGrantFromToken(bearerToken);
    if (grant.provider !== normalizedProvider) {
      throw new ForbiddenException('Grant is not authorized for this provider');
    }

    return this.executeProxyForGrant(grant, body, started);
  }

  async adaptiveProxy(target: string, bearerToken: string | undefined, body: any) {
    const started = Date.now();
    const decodedTarget = decodeURIComponent((target || '').trim());
    if (!decodedTarget) {
      throw new ForbiddenException('Target is required for adaptive routing');
    }

    const { payload, grant: baseGrant } = await this.validateGrantFromToken(bearerToken);
    const resolved = await this.resolveAdaptiveRouting(decodedTarget);
    const candidates = [resolved.primary, resolved.fallback].filter(
      (selection) => selection.provider && selection.model
    );

    if (candidates.length === 0) {
      throw new ForbiddenException(`No adaptive routing configured for target "${decodedTarget}"`);
    }

    const attempts: string[] = [];
    let lastError: unknown = null;

    for (const selection of candidates) {
      const normalizedProvider = selection.provider.trim().toLowerCase();
      const grant = await this.findActiveGrantForAgentProvider(
        payload.sub,
        payload.aid,
        normalizedProvider
      );

      if (!grant) {
        attempts.push(`${normalizedProvider}:${selection.model} (no active grant)`);
        continue;
      }

      const candidateBody = {
        ...(body && typeof body === 'object' ? body : {}),
        model: selection.model,
      };

      try {
        const response = await this.executeProxyForGrant(grant, candidateBody, started);
        const payload =
          response && typeof response === 'object'
            ? response
            : {
                data: response,
              };
        return {
          ...payload,
          _adaptiveRouting: {
            target: decodedTarget,
            provider: normalizedProvider,
            model: selection.model,
            sourceGrantId: grant.id,
            baseGrantId: baseGrant.id,
          },
        };
      } catch (error) {
        lastError = error;
        attempts.push(`${normalizedProvider}:${selection.model} (failed)`);
      }
    }

    if (lastError instanceof HttpException) {
      throw lastError;
    }

    throw new BadGatewayException(
      `Adaptive routing failed for "${decodedTarget}". Attempts: ${attempts.join(', ')}`
    );
  }

  async getAdaptiveConfig(target: string): Promise<{
    target: string;
    primary: RoutingSelection;
    fallback: RoutingSelection;
  }> {
    const decodedTarget = decodeURIComponent((target || '').trim());
    if (!decodedTarget) {
      throw new ForbiddenException('Target is required for adaptive routing');
    }
    const resolved = await this.resolveAdaptiveRouting(decodedTarget);
    return {
      target: decodedTarget,
      primary: resolved.primary,
      fallback: resolved.fallback,
    };
  }

  private async executeProxyForGrant(grant: any, body: any, started: number) {
    const provider = grant.provider;

    const usage = await this.db.agentApiGrants.getUsageSummary(grant.id);
    if (usage.requestsLastMinute >= grant.maxRequestsPerMinute) {
      throw new HttpException(
        'Grant requests-per-minute limit reached',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    if (usage.dailyTokens >= grant.dailyTokenBudget) {
      throw new HttpException('Grant daily token budget reached', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (usage.monthlyCostCents >= grant.monthlyUsdCap) {
      throw new HttpException('Grant monthly cost cap reached', HttpStatus.TOO_MANY_REQUESTS);
    }

    const providerKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(
      grant.userId,
      provider
    );
    if (!providerKey?.apiKey) {
      throw new ForbiddenException(
        `No API key configured for provider "${provider}" on this user account`
      );
    }

    const model = typeof body?.model === 'string' ? body.model : null;
    if (grant.allowedModels.length > 0 && model && !grant.allowedModels.includes(model)) {
      throw new ForbiddenException('Model not allowed by this grant');
    }

    const endpoint = this.getProviderEndpoint(provider, body?.endpoint);
    const outboundBody = this.buildOutboundPayload(provider, body);
    const headers = this.buildProviderHeaders(provider, providerKey.apiKey, body);

    let statusCode = 500;
    let responseBody: any = null;
    let errorText: string | null = null;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(outboundBody),
      });

      statusCode = response.status;
      const text = await response.text();
      responseBody = this.tryParseJson(text);

      const usageParsed = this.extractUsage(responseBody);
      const estimatedCostCents = this.estimateCostCents(model, usageParsed.totalTokens);

      await this.db.agentApiGrants.logUsage({
        grantId: grant.id,
        userId: grant.userId,
        agentId: grant.agentId,
        provider,
        model,
        promptTokens: usageParsed.promptTokens,
        completionTokens: usageParsed.completionTokens,
        totalTokens: usageParsed.totalTokens,
        estimatedCostCents,
        statusCode,
        durationMs: Date.now() - started,
        error: statusCode >= 400 ? text.slice(0, 2000) : null,
        createdAt: new Date(),
      });

      await this.db.apiLogs.logRequest({
        method: 'POST',
        path: `/api/agent-proxy/${provider}`,
        statusCode,
        duration: Date.now() - started,
        userId: grant.userId,
      });

      if (!response.ok) {
        throw new HttpException(
          typeof responseBody === 'object' ? responseBody : { error: text.slice(0, 2000) },
          statusCode
        );
      }

      return responseBody ?? text;
    } catch (error: any) {
      if (!errorText) {
        errorText = error?.message || 'Proxy request failed';
      }
      if (!(error instanceof HttpException)) {
        const safeErrorText = (errorText ?? 'Proxy request failed').slice(0, 2000);
        await this.db.agentApiGrants.logUsage({
          grantId: grant.id,
          userId: grant.userId,
          agentId: grant.agentId,
          provider,
          model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostCents: 0,
          statusCode,
          durationMs: Date.now() - started,
          error: safeErrorText,
          createdAt: new Date(),
        });
      }
      throw error;
    }
  }

  private async validateGrantFromToken(bearerToken: string | undefined): Promise<{
    payload: GrantTokenPayload;
    grant: any;
  }> {
    const payload = await this.verifyGrantToken(bearerToken);
    const grant = await this.db.agentApiGrants.isGrantActive(payload.gid, payload.tv);
    if (!grant || grant.userId !== payload.sub || grant.provider !== payload.prv) {
      throw new UnauthorizedException('Grant token is invalid or revoked');
    }
    return { payload, grant };
  }

  private async findActiveGrantForAgentProvider(
    userId: string,
    agentId: string,
    provider: string
  ): Promise<any | null> {
    const now = new Date();
    const [grant] = await this.db.client
      .select()
      .from(agentApiGrants)
      .where(
        and(
          eq(agentApiGrants.userId, userId),
          eq(agentApiGrants.agentId, agentId),
          eq(agentApiGrants.provider, provider),
          eq(agentApiGrants.revoked, false),
          gte(agentApiGrants.expiresAt, now)
        )
      )
      .orderBy(desc(agentApiGrants.updatedAt))
      .limit(1);

    return grant ?? null;
  }

  private async resolveAdaptiveRouting(target: string): Promise<{
    primary: RoutingSelection;
    fallback: RoutingSelection;
  }> {
    const stored = await drizzleConfigurationRepository.findConfigByKey('TNF_LLM_ROUTING_V1');
    if (!stored?.value) {
      return {
        primary: { provider: '', model: '' },
        fallback: { provider: '', model: '' },
      };
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(stored.value);
    } catch {
      parsed = null;
    }

    const globalPrimary = this.normalizeSelection(parsed?.global?.primary);
    const globalFallback = this.normalizeSelection(parsed?.global?.fallback);
    const agentCfg = parsed?.agents?.[target];

    if (agentCfg?.enabled) {
      const primary = this.normalizeSelection(agentCfg.primary);
      const fallback = this.normalizeSelection(agentCfg.fallback);
      return {
        primary: primary.provider && primary.model ? primary : globalPrimary,
        fallback: fallback.provider && fallback.model ? fallback : globalFallback,
      };
    }

    return {
      primary: globalPrimary,
      fallback: globalFallback,
    };
  }

  private normalizeSelection(selection: any): RoutingSelection {
    return {
      provider: typeof selection?.provider === 'string' ? selection.provider.trim() : '',
      model: typeof selection?.model === 'string' ? selection.model.trim() : '',
    };
  }

  private async mintGrantToken(grant: {
    id: string;
    userId: string;
    agentId: string;
    provider: string;
    tokenVersion: number;
    expiresAt: Date;
  }) {
    const secret = this.configService.get<string>('JWT_SECRET');
    const nowMs = Date.now();
    const expMs = new Date(grant.expiresAt).getTime();
    const ttlSeconds = Math.max(1, Math.floor((expMs - nowMs) / 1000));

    const payload: GrantTokenPayload = {
      typ: 'agent-grant',
      sub: grant.userId,
      gid: grant.id,
      aid: grant.agentId,
      prv: grant.provider,
      tv: grant.tokenVersion,
    };

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: ttlSeconds,
    });
  }

  private async verifyGrantToken(bearerToken?: string): Promise<GrantTokenPayload> {
    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = bearerToken.slice(7);
    const secret = this.configService.get<string>('JWT_SECRET');
    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid grant token');
    }

    if (!decoded || decoded.typ !== 'agent-grant' || !decoded.gid || !decoded.sub) {
      throw new UnauthorizedException('Invalid grant token payload');
    }

    return decoded as GrantTokenPayload;
  }

  private buildOutboundPayload(provider: string, body: any) {
    if (!body || typeof body !== 'object') return {};
    const { endpoint: _endpoint, ...rest } = body;
    if (provider !== 'google-adk') return rest;

    // Accept either native ADK execute envelopes or OpenAI-style chat payloads.
    if (rest.requestId && rest.traceId && rest.input && rest.workspaceId && rest.agentId) {
      return rest;
    }

    const mappedMessages = this.normalizeGoogleADKMessages(rest);
    return {
      requestId: typeof rest.requestId === 'string' && rest.requestId.trim() ? rest.requestId : randomUUID(),
      traceId: typeof rest.traceId === 'string' && rest.traceId.trim() ? rest.traceId : randomUUID(),
      workspaceId:
        typeof rest.workspaceId === 'string' && rest.workspaceId.trim()
          ? rest.workspaceId
          : 'tnf-agent-proxy',
      agentId:
        typeof rest.agentId === 'string' && rest.agentId.trim() ? rest.agentId : 'tnf-agent-proxy',
      model:
        typeof rest.model === 'string' && rest.model.trim()
          ? rest.model
          : process.env.GOOGLE_ADK_MODEL?.trim() || 'gemini-2.5-pro',
      input: {
        messages: mappedMessages,
      },
      tools: Array.isArray(rest.tools) ? rest.tools : [],
      metadata:
        rest.metadata && typeof rest.metadata === 'object'
          ? rest.metadata
          : {
              source: 'tnf-agent-proxy',
              policyProfile: 'default',
            },
      timeoutMs:
        typeof rest.timeoutMs === 'number' && Number.isFinite(rest.timeoutMs) && rest.timeoutMs > 0
          ? rest.timeoutMs
          : 120000,
    };
  }

  private normalizeGoogleADKMessages(body: any): Array<{ role: string; content: string }> {
    if (body?.input?.messages && Array.isArray(body.input.messages)) {
      return body.input.messages
        .map((message: any) => ({
          role: typeof message?.role === 'string' ? message.role : 'user',
          content: typeof message?.content === 'string' ? message.content : '',
        }))
        .filter((message: { role: string; content: string }) => message.content.length > 0);
    }

    if (Array.isArray(body?.messages)) {
      return body.messages
        .map((message: any) => ({
          role: typeof message?.role === 'string' ? message.role : 'user',
          content: typeof message?.content === 'string' ? message.content : '',
        }))
        .filter((message: { role: string; content: string }) => message.content.length > 0);
    }

    if (typeof body?.prompt === 'string' && body.prompt.trim()) {
      return [{ role: 'user', content: body.prompt.trim() }];
    }

    return [];
  }

  private getProviderEndpoint(provider: string, requestedEndpoint?: string): string {
    const endpoint = (requestedEndpoint || '').trim();
    const safeEndpoint = endpoint.startsWith('/') ? endpoint : '';
    const defaults: Record<string, { baseUrl: string; path: string }> = {
      openai: { baseUrl: 'https://api.openai.com/v1', path: '/chat/completions' },
      openrouter: { baseUrl: 'https://openrouter.ai/api/v1', path: '/chat/completions' },
      perplexity: { baseUrl: 'https://api.perplexity.ai', path: '/chat/completions' },
      groq: { baseUrl: 'https://api.groq.com/openai/v1', path: '/chat/completions' },
      anthropic: { baseUrl: 'https://api.anthropic.com/v1', path: '/messages' },
      'google-adk': { baseUrl: this.resolveGoogleADKBaseUrl(), path: '/v1/execute' },
    };

    const config = defaults[provider];
    if (!config) {
      throw new ForbiddenException(`Unsupported provider for proxy: ${provider}`);
    }

    const allowedPaths = new Set(['/chat/completions', '/responses', '/messages', '/v1/execute']);
    const path = safeEndpoint && allowedPaths.has(safeEndpoint) ? safeEndpoint : config.path;
    return `${config.baseUrl}${path}`;
  }

  private buildProviderHeaders(
    provider: string,
    apiKey: string,
    body: any
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] =
        typeof body?.anthropicVersion === 'string' ? body.anthropicVersion : '2023-06-01';
      return headers;
    }

    if (provider === 'google-adk') {
      headers['x-adk-gateway-key'] = apiKey;
      return headers;
    }

    headers.Authorization = `Bearer ${apiKey}`;
    return headers;
  }

  private extractUsage(responseBody: any): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    const usage = responseBody?.usage || {};
    const promptTokens = Number(usage.prompt_tokens ?? usage.input_tokens ?? usage.inputTokens ?? 0);
    const completionTokens = Number(
      usage.completion_tokens ?? usage.output_tokens ?? usage.outputTokens ?? 0
    );
    const totalTokens = Number(usage.total_tokens ?? usage.totalTokens ?? promptTokens + completionTokens);
    return {
      promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
      completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
      totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
    };
  }

  private estimateCostCents(model: string | null, totalTokens: number): number {
    if (!totalTokens || totalTokens <= 0) return 0;

    const lower = (model || '').toLowerCase();
    let centsPer1k = 0.2; // fallback: $0.002/1K tokens
    if (lower.includes('gpt-4')) centsPer1k = 2.0;
    if (lower.includes('claude')) centsPer1k = 1.5;
    if (lower.includes('sonnet')) centsPer1k = 1.0;
    if (lower.includes('haiku')) centsPer1k = 0.3;
    if (lower.includes('gpt-4o-mini')) centsPer1k = 0.15;

    return Math.max(0, Math.round((totalTokens / 1000) * centsPer1k));
  }

  private tryParseJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private resolveGoogleADKBaseUrl(): string {
    const raw =
      process.env.GOOGLE_ADK_BASE_URL?.trim() ||
      process.env.ADK_GATEWAY_URL?.trim() ||
      'http://localhost:8089';
    const withoutExecutePath = raw.replace(/\/v1\/execute(?:\/stream)?$/, '');
    return withoutExecutePath.replace(/\/+$/, '');
  }
}
