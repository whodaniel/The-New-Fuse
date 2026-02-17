import {
  ForbiddenException,
  HttpException,
  Injectable,
  TooManyRequestsException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@the-new-fuse/database';
import { CreateAgentGrantDto } from '../dto/agent-grants.dto';

type GrantTokenPayload = {
  typ: 'agent-grant';
  sub: string; // user id
  gid: string; // grant id
  aid: string; // agent id
  prv: string; // provider
  tv: number; // token version
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
    const payload = await this.verifyGrantToken(bearerToken);

    const grant = await this.db.agentApiGrants.isGrantActive(payload.gid, payload.tv);
    if (!grant || grant.userId !== payload.sub || grant.provider !== payload.prv) {
      throw new UnauthorizedException('Grant token is invalid or revoked');
    }
    if (grant.provider !== normalizedProvider) {
      throw new ForbiddenException('Grant is not authorized for this provider');
    }

    const usage = await this.db.agentApiGrants.getUsageSummary(grant.id);
    if (usage.requestsLastMinute >= grant.maxRequestsPerMinute) {
      throw new TooManyRequestsException('Grant requests-per-minute limit reached');
    }
    if (usage.dailyTokens >= grant.dailyTokenBudget) {
      throw new TooManyRequestsException('Grant daily token budget reached');
    }
    if (usage.monthlyCostCents >= grant.monthlyUsdCap) {
      throw new TooManyRequestsException('Grant monthly cost cap reached');
    }

    const providerKey = await this.db.providerApiKeys.findDecryptedByUserAndProvider(
      grant.userId,
      grant.provider
    );
    if (!providerKey?.apiKey) {
      throw new ForbiddenException(
        `No API key configured for provider "${grant.provider}" on this user account`
      );
    }

    const model = typeof body?.model === 'string' ? body.model : null;
    if (grant.allowedModels.length > 0 && model && !grant.allowedModels.includes(model)) {
      throw new ForbiddenException('Model not allowed by this grant');
    }

    const endpoint = this.getProviderEndpoint(grant.provider, body?.endpoint);
    const outboundBody = this.buildOutboundPayload(body);
    const headers = this.buildProviderHeaders(grant.provider, providerKey.apiKey, body);

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
        provider: grant.provider,
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
        path: `/api/agent-proxy/${grant.provider}`,
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
        await this.db.agentApiGrants.logUsage({
          grantId: grant.id,
          userId: grant.userId,
          agentId: grant.agentId,
          provider: grant.provider,
          model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostCents: 0,
          statusCode,
          durationMs: Date.now() - started,
          error: errorText.slice(0, 2000),
          createdAt: new Date(),
        });
      }
      throw error;
    }
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

  private buildOutboundPayload(body: any) {
    if (!body || typeof body !== 'object') return {};
    const { endpoint: _endpoint, ...rest } = body;
    return rest;
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
    };

    const config = defaults[provider];
    if (!config) {
      throw new ForbiddenException(`Unsupported provider for proxy: ${provider}`);
    }

    const allowedPaths = new Set(['/chat/completions', '/responses', '/messages']);
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

    headers.Authorization = `Bearer ${apiKey}`;
    return headers;
  }

  private extractUsage(responseBody: any): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    const usage = responseBody?.usage || {};
    const promptTokens = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0);
    const completionTokens = Number(usage.completion_tokens ?? usage.output_tokens ?? 0);
    const totalTokens = Number(usage.total_tokens ?? promptTokens + completionTokens);
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
}
