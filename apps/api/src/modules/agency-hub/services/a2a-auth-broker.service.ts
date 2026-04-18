import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import crypto from 'crypto';
import Redis from 'ioredis';
import { UnifiedLedgerService } from '../../unified-ledger/unified-ledger.service.js';

type AuthRequestStatus = 'pending' | 'approved' | 'denied' | 'revoked';
type AuthTokenStatus = 'active' | 'revoked' | 'expired';
type AuthDecision = 'approved' | 'pending' | 'denied';
type AuthAuditEventType =
  | 'REQUESTED'
  | 'APPROVED'
  | 'DENIED'
  | 'ISSUED'
  | 'USED'
  | 'REVOKED'
  | 'REVOKE_ALL';

const DEFAULT_STEP_UP_ACTIONS = [
  'delete',
  'billing',
  'admin',
  'publish',
  'credential-change',
  'repo-write',
];

const DEFAULT_SINGLE_USE_ACTIONS = ['delete', 'billing', 'admin', 'publish', 'repo-write'];

type RequestContext = {
  requesterUserId?: string;
  ip?: string;
  runtimeId?: string;
};

type AuthorizeContext = {
  ip?: string;
  runtimeId?: string;
};

type AgentTokenRequestInput = {
  agentId: string;
  integration: string;
  accountRef?: string;
  requestedScopes: string[];
  action: string;
  reason?: string;
  ttlSeconds?: number;
  runtimeId?: string;
  bindIp?: boolean;
};

type ApproveRequestInput = {
  requestId: string;
  mfaProof: string;
  approvedScopes?: string[];
  approvedTtlSeconds?: number;
};

type RevokeInput = {
  tokenId?: string;
  requestId?: string;
  reason?: string;
};

type RevokeAllInput = {
  agentId: string;
  integration?: string;
  reason?: string;
};

type UpsertPolicyInput = {
  allowedScopes: string[];
  allowedActions: string[];
  stepUpActions?: string[];
  singleUseActions?: string[];
  allowedAccountRefs?: string[];
  maxTtlSeconds?: number;
  defaultTtlSeconds?: number;
  requireRuntimeBinding?: boolean;
  requireIpBinding?: boolean;
};

export type AgentTokenAuthorizationInput = {
  bearerToken: string;
  agentId?: string;
  integration?: string;
  accountRef?: string;
  action?: string;
  requiredScopes?: string[];
  runtimeId?: string;
};

export type AgentTokenAuthorizationResult = {
  tokenId: string;
  requestId: string;
  agentId: string;
  integration: string;
  accountRef?: string;
  scopes: string[];
  action: string;
  expiresAt: string;
  singleUse: boolean;
  usageCount: number;
};

export type RequestTokenResult = {
  requestId: string;
  decision: AuthDecision;
  token?: string;
  tokenId?: string;
  expiresAt?: string;
  reason?: string;
};

export type ApproveTokenResult = {
  requestId: string;
  decision: 'approved';
  token: string;
  tokenId: string;
  expiresAt: string;
};

type AuthBrokerPolicy = {
  agentId: string;
  integration: string;
  allowedScopes: string[];
  allowedActions: string[];
  stepUpActions: string[];
  singleUseActions: string[];
  allowedAccountRefs: string[];
  maxTtlSeconds: number;
  defaultTtlSeconds: number;
  requireRuntimeBinding: boolean;
  requireIpBinding: boolean;
  updatedAt: string;
  updatedBy: string;
};

type AuthRequestRecord = {
  requestId: string;
  agentId: string;
  integration: string;
  accountRef?: string;
  requestedScopes: string[];
  effectivePolicyScopes: string[];
  action: string;
  reason?: string;
  requestedTtlSeconds: number;
  status: AuthRequestStatus;
  decisionReason?: string;
  createdAt: string;
  expiresAt: string;
  approvedBy?: string;
  approvedAt?: string;
  approvedScopes?: string[];
  approvedTtlSeconds?: number;
  issuedTokenId?: string;
  bindingTemplate?: {
    ip?: string;
    runtimeId?: string;
  };
};

type AuthTokenRecord = {
  tokenId: string;
  requestId: string;
  agentId: string;
  integration: string;
  accountRef?: string;
  scopes: string[];
  action: string;
  issuedAt: string;
  expiresAt: string;
  status: AuthTokenStatus;
  singleUse: boolean;
  bindings?: {
    ip?: string;
    runtimeId?: string;
  };
  usageCount: number;
  lastUsedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
};

@Injectable()
export class A2AAuthBrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(A2AAuthBrokerService.name);
  private redis: Redis | null = null;
  private redisReady = false;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly redisPrefix = 'tnf:auth';
  private readonly authActor = 'a2a-auth-broker';

  // memory fallback
  private readonly requests = new Map<string, AuthRequestRecord>();
  private readonly tokens = new Map<string, AuthTokenRecord>();
  private readonly tokenHashIndex = new Map<string, string>();
  private readonly agentActiveTokens = new Map<string, Set<string>>();
  private readonly policies = new Map<string, AuthBrokerPolicy>();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly unifiedLedgerService: UnifiedLedgerService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeRedis();
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredMemoryRecords();
    }, 60_000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    this.redisReady = false;
  }

  async requestToken(
    input: AgentTokenRequestInput,
    context: RequestContext
  ): Promise<RequestTokenResult> {
    const normalized = this.normalizeRequestInput(input);
    const policy = await this.resolvePolicy(normalized.agentId, normalized.integration);
    const requestedTtlSeconds = this.clampTtlSeconds(normalized.ttlSeconds);
    const now = new Date();
    const requestId = this.buildId('req');
    const expiresAt = new Date(now.getTime() + requestedTtlSeconds * 1000).toISOString();

    const evaluation = this.evaluateRequest(normalized, policy);
    const requestRecord: AuthRequestRecord = {
      requestId,
      agentId: normalized.agentId,
      integration: normalized.integration,
      accountRef: normalized.accountRef,
      requestedScopes: normalized.requestedScopes,
      effectivePolicyScopes: evaluation.effectiveScopes,
      action: normalized.action,
      reason: normalized.reason,
      requestedTtlSeconds,
      status: evaluation.decision === 'approved' ? 'approved' : evaluation.decision,
      decisionReason: evaluation.reason,
      createdAt: now.toISOString(),
      expiresAt,
      approvedBy: evaluation.decision === 'approved' ? 'policy:auto' : undefined,
      approvedAt: evaluation.decision === 'approved' ? now.toISOString() : undefined,
      approvedScopes: evaluation.decision === 'approved' ? evaluation.effectiveScopes : undefined,
      approvedTtlSeconds: evaluation.decision === 'approved' ? requestedTtlSeconds : undefined,
      bindingTemplate: {
        ip: normalized.bindIp ? context.ip : undefined,
        runtimeId: normalized.runtimeId,
      },
    };

    await this.saveRequest(requestRecord);
    await this.emitAuditEvent('REQUESTED', {
      requestId,
      decision: evaluation.decision,
      reason: evaluation.reason,
      agentId: normalized.agentId,
      integration: normalized.integration,
      accountRef: normalized.accountRef || null,
      action: normalized.action,
      requestedScopes: normalized.requestedScopes,
      effectiveScopes: evaluation.effectiveScopes,
      requestedTtlSeconds,
      requesterUserId: context.requesterUserId || null,
    });

    if (evaluation.decision === 'denied') {
      await this.emitAuditEvent('DENIED', {
        requestId,
        reason: evaluation.reason,
        agentId: normalized.agentId,
        integration: normalized.integration,
      });
      return {
        requestId,
        decision: 'denied',
        reason: evaluation.reason,
      };
    }

    if (evaluation.decision === 'pending') {
      return {
        requestId,
        decision: 'pending',
        reason: evaluation.reason,
      };
    }

    const issued = await this.issueToken({
      request: requestRecord,
      scopes: evaluation.effectiveScopes,
      ttlSeconds: requestedTtlSeconds,
      actor: context.requesterUserId || this.authActor,
      policy,
    });
    requestRecord.issuedTokenId = issued.tokenRecord.tokenId;
    await this.saveRequest(requestRecord);
    await this.emitAuditEvent('APPROVED', {
      requestId,
      approvedBy: requestRecord.approvedBy,
      approvedScopes: evaluation.effectiveScopes,
      approvedTtlSeconds: requestedTtlSeconds,
    });

    return {
      requestId,
      decision: 'approved',
      token: issued.accessToken,
      tokenId: issued.tokenRecord.tokenId,
      expiresAt: issued.tokenRecord.expiresAt,
    };
  }

  async approveTokenRequest(
    input: ApproveRequestInput,
    context: RequestContext
  ): Promise<ApproveTokenResult> {
    const requestId = this.normalizeIdentifier(input.requestId, 'requestId');
    const request = await this.getRequest(requestId);
    if (!request) {
      throw new NotFoundException(`Auth request not found: ${requestId}`);
    }
    if (request.status !== 'pending') {
      throw new BadRequestException(`Auth request ${requestId} is not pending`);
    }
    if (this.isExpired(request.expiresAt)) {
      throw new BadRequestException(`Auth request ${requestId} has expired`);
    }
    if (!this.isMfaProofValid(input.mfaProof)) {
      throw new ForbiddenException('Invalid MFA proof for approval');
    }

    const policy = await this.resolvePolicy(request.agentId, request.integration);
    if (!policy) {
      throw new ForbiddenException('No active auth policy found for this request');
    }

    const approvedScopes = this.normalizeScopes(
      input.approvedScopes || request.effectivePolicyScopes
    );
    const effectiveScopes = this.intersectScopes(request.effectivePolicyScopes, approvedScopes);
    if (effectiveScopes.length === 0) {
      throw new BadRequestException('Approved scopes do not intersect with policy-approved scopes');
    }

    const approvedTtlSeconds = Math.min(
      this.clampTtlSeconds(input.approvedTtlSeconds || request.requestedTtlSeconds),
      policy.maxTtlSeconds
    );
    const actor = context.requesterUserId || this.authActor;
    const now = new Date().toISOString();
    request.status = 'approved';
    request.approvedBy = actor;
    request.approvedAt = now;
    request.approvedScopes = effectiveScopes;
    request.approvedTtlSeconds = approvedTtlSeconds;
    await this.saveRequest(request);

    await this.emitAuditEvent('APPROVED', {
      requestId,
      approvedBy: actor,
      approvedScopes: effectiveScopes,
      approvedTtlSeconds,
      integration: request.integration,
      agentId: request.agentId,
    });

    const issued = await this.issueToken({
      request,
      scopes: effectiveScopes,
      ttlSeconds: approvedTtlSeconds,
      actor,
      policy,
    });
    request.issuedTokenId = issued.tokenRecord.tokenId;
    await this.saveRequest(request);

    return {
      requestId,
      decision: 'approved',
      token: issued.accessToken,
      tokenId: issued.tokenRecord.tokenId,
      expiresAt: issued.tokenRecord.expiresAt,
    };
  }

  async revokeTokenOrRequest(
    input: RevokeInput,
    context: RequestContext
  ): Promise<{ revoked: boolean; revokedAt: string; tokenId?: string }> {
    const tokenId = input.tokenId ? this.normalizeIdentifier(input.tokenId, 'tokenId') : undefined;
    const requestId = input.requestId
      ? this.normalizeIdentifier(input.requestId, 'requestId')
      : undefined;

    if (!tokenId && !requestId) {
      throw new BadRequestException('tokenId or requestId is required');
    }

    let resolvedTokenId = tokenId;
    let request: AuthRequestRecord | null = null;
    if (!resolvedTokenId && requestId) {
      request = await this.getRequest(requestId);
      if (!request) {
        throw new NotFoundException(`Auth request not found: ${requestId}`);
      }
      resolvedTokenId = request.issuedTokenId;
      if (!resolvedTokenId) {
        throw new BadRequestException('Request does not have an issued token to revoke');
      }
    }

    const revokedAt = new Date().toISOString();
    await this.revokeTokenById(
      resolvedTokenId!,
      input.reason || 'manual revoke',
      context.requesterUserId || this.authActor
    );

    if (requestId) {
      const loaded = request || (await this.getRequest(requestId));
      if (loaded) {
        loaded.status = 'revoked';
        loaded.decisionReason = input.reason || 'manual revoke';
        await this.saveRequest(loaded);
      }
    }

    return {
      revoked: true,
      revokedAt,
      tokenId: resolvedTokenId!,
    };
  }

  async revokeAllForAgent(
    input: RevokeAllInput,
    context: RequestContext
  ): Promise<{ revokedCount: number; revokedAt: string }> {
    const agentId = this.normalizeIdentifier(input.agentId, 'agentId');
    const integration = input.integration
      ? this.normalizeIdentifier(input.integration, 'integration')
      : undefined;
    const tokenIds = await this.listActiveTokenIds(agentId);
    let revokedCount = 0;
    for (const tokenId of tokenIds) {
      const token = await this.getToken(tokenId);
      if (!token || token.status !== 'active') {
        continue;
      }
      if (integration && token.integration !== integration) {
        continue;
      }
      await this.revokeTokenById(
        tokenId,
        input.reason || 'bulk revoke',
        context.requesterUserId || this.authActor
      );
      revokedCount += 1;
    }

    const revokedAt = new Date().toISOString();
    await this.emitAuditEvent('REVOKE_ALL', {
      agentId,
      integration: integration || null,
      revokedCount,
      reason: input.reason || 'bulk revoke',
      actor: context.requesterUserId || this.authActor,
    });

    return { revokedCount, revokedAt };
  }

  async upsertPolicy(
    agentIdRaw: string,
    integrationRaw: string,
    input: UpsertPolicyInput,
    actor = this.authActor
  ): Promise<AuthBrokerPolicy> {
    const agentId = this.normalizeIdentifier(agentIdRaw, 'agentId');
    const integration = this.normalizeIdentifier(integrationRaw, 'integration');
    const allowedScopes = this.normalizeScopes(input.allowedScopes);
    const allowedActions = this.normalizeActions(input.allowedActions);
    if (allowedScopes.length === 0) {
      throw new BadRequestException('Policy must include at least one allowed scope');
    }
    if (allowedActions.length === 0) {
      throw new BadRequestException('Policy must include at least one allowed action');
    }

    const maxTtlSeconds = this.clampTtlSeconds(input.maxTtlSeconds || 900);
    const defaultTtlSeconds = Math.min(
      this.clampTtlSeconds(input.defaultTtlSeconds || 300),
      maxTtlSeconds
    );
    const policy: AuthBrokerPolicy = {
      agentId,
      integration,
      allowedScopes,
      allowedActions,
      stepUpActions: this.normalizeActions(input.stepUpActions || DEFAULT_STEP_UP_ACTIONS),
      singleUseActions: this.normalizeActions(input.singleUseActions || DEFAULT_SINGLE_USE_ACTIONS),
      allowedAccountRefs: this.normalizeValues(input.allowedAccountRefs || []),
      maxTtlSeconds,
      defaultTtlSeconds,
      requireRuntimeBinding: Boolean(input.requireRuntimeBinding),
      requireIpBinding: Boolean(input.requireIpBinding),
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    };

    await this.savePolicy(policy);
    await this.emitAuditEvent('APPROVED', {
      event: 'policy_upserted',
      agentId,
      integration,
      actor,
      maxTtlSeconds,
      defaultTtlSeconds,
      allowedScopes,
      allowedActions,
    });
    return policy;
  }

  async getPolicy(agentIdRaw: string, integrationRaw: string): Promise<AuthBrokerPolicy | null> {
    const agentId = this.normalizeIdentifier(agentIdRaw, 'agentId');
    const integration = this.normalizeIdentifier(integrationRaw, 'integration');
    return this.resolvePolicy(agentId, integration);
  }

  async authorizeAgentToken(
    input: AgentTokenAuthorizationInput,
    context: AuthorizeContext
  ): Promise<AgentTokenAuthorizationResult> {
    const token = this.extractBearerToken(input.bearerToken);
    const tokenHash = this.hashToken(token);
    const tokenId = await this.lookupTokenIdByHash(tokenHash);
    if (!tokenId) {
      throw new UnauthorizedException('Invalid auth broker token');
    }
    const record = await this.getToken(tokenId);
    if (!record) {
      throw new UnauthorizedException('Invalid auth broker token');
    }
    if (record.status !== 'active') {
      throw new UnauthorizedException('Auth broker token is not active');
    }
    if (this.isExpired(record.expiresAt)) {
      record.status = 'expired';
      await this.saveToken(record, { preserveHashIndex: true });
      throw new UnauthorizedException('Auth broker token has expired');
    }

    const expectedAgentId = input.agentId
      ? this.normalizeIdentifier(input.agentId, 'agentId')
      : null;
    const expectedIntegration = input.integration
      ? this.normalizeIdentifier(input.integration, 'integration')
      : null;
    const expectedAction = input.action ? this.normalizeIdentifier(input.action, 'action') : null;
    const expectedAccountRef = input.accountRef
      ? this.normalizeIdentifier(input.accountRef, 'accountRef')
      : null;
    const requiredScopes = this.normalizeScopes(input.requiredScopes || []);

    if (expectedAgentId && record.agentId !== expectedAgentId) {
      throw new ForbiddenException('Token agent mismatch');
    }
    if (expectedIntegration && record.integration !== expectedIntegration) {
      throw new ForbiddenException('Token integration mismatch');
    }
    if (expectedAccountRef && record.accountRef !== expectedAccountRef) {
      throw new ForbiddenException('Token account scope mismatch');
    }
    if (expectedAction && record.action !== expectedAction) {
      throw new ForbiddenException('Token action mismatch');
    }
    if (!this.containsAllScopes(record.scopes, requiredScopes)) {
      throw new ForbiddenException('Token does not include required scopes');
    }
    if (record.bindings?.ip && context.ip && record.bindings.ip !== context.ip) {
      throw new ForbiddenException('Token IP binding mismatch');
    }
    const runtimeId = input.runtimeId || context.runtimeId;
    if (record.bindings?.runtimeId && runtimeId && record.bindings.runtimeId !== runtimeId) {
      throw new ForbiddenException('Token runtime binding mismatch');
    }

    record.lastUsedAt = new Date().toISOString();
    record.usageCount += 1;
    await this.saveToken(record, { preserveHashIndex: true });
    await this.emitAuditEvent('USED', {
      tokenId: record.tokenId,
      requestId: record.requestId,
      agentId: record.agentId,
      integration: record.integration,
      action: expectedAction || record.action,
      requiredScopes,
      usageCount: record.usageCount,
    });

    if (record.singleUse) {
      await this.revokeTokenById(
        record.tokenId,
        'single-use token consumed',
        context.runtimeId || this.authActor
      );
    }

    return {
      tokenId: record.tokenId,
      requestId: record.requestId,
      agentId: record.agentId,
      integration: record.integration,
      accountRef: record.accountRef,
      scopes: record.scopes,
      action: record.action,
      expiresAt: record.expiresAt,
      singleUse: record.singleUse,
      usageCount: record.usageCount,
    };
  }

  private normalizeRequestInput(input: AgentTokenRequestInput): AgentTokenRequestInput {
    const agentId = this.normalizeIdentifier(input.agentId, 'agentId');
    const integration = this.normalizeIdentifier(input.integration, 'integration');
    const action = this.normalizeIdentifier(input.action, 'action');
    const requestedScopes = this.normalizeScopes(input.requestedScopes);
    if (requestedScopes.length === 0) {
      throw new BadRequestException('requestedScopes must include at least one scope');
    }
    return {
      ...input,
      agentId,
      integration,
      accountRef: input.accountRef
        ? this.normalizeIdentifier(input.accountRef, 'accountRef')
        : undefined,
      action,
      requestedScopes,
      reason: input.reason?.trim() || undefined,
      runtimeId: input.runtimeId
        ? this.normalizeIdentifier(input.runtimeId, 'runtimeId')
        : undefined,
    };
  }

  private evaluateRequest(
    request: AgentTokenRequestInput,
    policy: AuthBrokerPolicy | null
  ): { decision: AuthDecision; effectiveScopes: string[]; reason?: string } {
    if (!policy) {
      return { decision: 'denied', effectiveScopes: [], reason: 'No matching auth policy' };
    }

    if (!this.actionAllowed(policy.allowedActions, request.action)) {
      return {
        decision: 'denied',
        effectiveScopes: [],
        reason: `Action ${request.action} is not allowed by policy`,
      };
    }

    if (policy.allowedAccountRefs.length > 0) {
      if (!request.accountRef) {
        return {
          decision: 'denied',
          effectiveScopes: [],
          reason: 'Policy requires accountRef, but request did not include one',
        };
      }
      if (!policy.allowedAccountRefs.includes(request.accountRef)) {
        return {
          decision: 'denied',
          effectiveScopes: [],
          reason: `Account ${request.accountRef} is not allowed by policy`,
        };
      }
    }

    const effectiveScopes = this.intersectScopesWithWildcard(
      request.requestedScopes,
      policy.allowedScopes
    );
    if (effectiveScopes.length === 0) {
      return {
        decision: 'denied',
        effectiveScopes: [],
        reason: 'No requested scope is allowed by policy',
      };
    }

    if (this.actionAllowed(policy.stepUpActions, request.action)) {
      return {
        decision: 'pending',
        effectiveScopes,
        reason: `Action ${request.action} requires approval`,
      };
    }

    return {
      decision: 'approved',
      effectiveScopes,
      reason:
        effectiveScopes.length === request.requestedScopes.length
          ? undefined
          : 'Some requested scopes were reduced by policy',
    };
  }

  private async issueToken(params: {
    request: AuthRequestRecord;
    scopes: string[];
    ttlSeconds: number;
    actor: string;
    policy: AuthBrokerPolicy | null;
  }): Promise<{ accessToken: string; tokenRecord: AuthTokenRecord }> {
    const tokenId = this.buildId('tok');
    const accessToken = `tnf_atk_${crypto.randomBytes(32).toString('base64url')}`;
    const accessTokenHash = this.hashToken(accessToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + params.ttlSeconds * 1000).toISOString();
    const singleUse =
      params.policy?.singleUseActions &&
      this.actionAllowed(params.policy.singleUseActions, params.request.action);

    const tokenRecord: AuthTokenRecord = {
      tokenId,
      requestId: params.request.requestId,
      agentId: params.request.agentId,
      integration: params.request.integration,
      accountRef: params.request.accountRef,
      scopes: params.scopes,
      action: params.request.action,
      issuedAt: now.toISOString(),
      expiresAt,
      status: 'active',
      singleUse: Boolean(singleUse),
      bindings: {
        ip: params.policy?.requireIpBinding ? params.request.bindingTemplate?.ip : undefined,
        runtimeId: params.policy?.requireRuntimeBinding
          ? params.request.bindingTemplate?.runtimeId
          : undefined,
      },
      usageCount: 0,
    };

    await this.saveToken(tokenRecord, { hash: accessTokenHash });
    await this.emitAuditEvent('ISSUED', {
      requestId: params.request.requestId,
      tokenId,
      agentId: params.request.agentId,
      integration: params.request.integration,
      accountRef: params.request.accountRef || null,
      scopes: params.scopes,
      action: params.request.action,
      expiresAt,
      singleUse: tokenRecord.singleUse,
      actor: params.actor,
    });
    return { accessToken, tokenRecord };
  }

  private async revokeTokenById(tokenId: string, reason: string, actor: string): Promise<void> {
    const token = await this.getToken(tokenId);
    if (!token) {
      throw new NotFoundException(`Token not found: ${tokenId}`);
    }
    if (token.status !== 'active') {
      return;
    }
    token.status = 'revoked';
    token.revokedAt = new Date().toISOString();
    token.revokedReason = reason;
    await this.saveToken(token, { preserveHashIndex: true });
    await this.removeActiveToken(token.agentId, tokenId);
    await this.emitAuditEvent('REVOKED', {
      tokenId,
      requestId: token.requestId,
      agentId: token.agentId,
      integration: token.integration,
      reason,
      actor,
    });
  }

  private async initializeRedis(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.redisReady = false;
      this.logger.warn('A2A auth broker running in memory mode (no REDIS_URL)');
      return;
    }

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
    });

    this.redis.on('error', (error: Error) => {
      this.redisReady = false;
      this.logger.warn(`A2A auth broker Redis degraded: ${error.message}`);
    });

    try {
      await this.redis.ping();
      this.redisReady = true;
      this.logger.log('A2A auth broker Redis backend enabled');
    } catch {
      this.redisReady = false;
      this.logger.warn('A2A auth broker running in memory fallback mode');
    }
  }

  private async emitAuditEvent(
    event: AuthAuditEventType,
    payload: Record<string, unknown>
  ): Promise<void> {
    const envelope = {
      event,
      timestamp: new Date().toISOString(),
      payload,
    };
    this.eventEmitter.emit(`a2a.auth.${event.toLowerCase()}`, envelope);

    if (this.redisReady && this.redis) {
      try {
        await this.redis.xadd(
          this.auditStreamKey(),
          '*',
          'event',
          event,
          'payload',
          JSON.stringify(envelope)
        );
      } catch (error) {
        this.logger.debug(`Failed to append auth audit stream: ${(error as Error).message}`);
      }
    }

    try {
      await this.unifiedLedgerService.createTimelineEvent({
        eventType: 'historical_event',
        actor: this.authActor,
        payload: {
          domain: 'a2a_auth_broker',
          ...envelope,
        },
      });
    } catch (error) {
      this.logger.debug(
        `Failed to mirror auth audit event to timeline: ${(error as Error).message}`
      );
    }
  }

  private isMfaProofValid(mfaProofRaw: string): boolean {
    const mfaProof = mfaProofRaw.trim();
    if (mfaProof.length < 6) {
      return false;
    }
    const expectedProof = this.configService.get<string>('AUTH_BROKER_APPROVAL_MFA_SECRET');
    if (!expectedProof) {
      return String(process.env.NODE_ENV || '').toLowerCase() !== 'production';
    }
    const left = Buffer.from(mfaProof);
    const right = Buffer.from(expectedProof);
    if (left.length !== right.length) {
      return false;
    }
    return crypto.timingSafeEqual(left, right);
  }

  private actionAllowed(allowList: string[], action: string): boolean {
    return allowList.includes('*') || allowList.includes(action);
  }

  private containsAllScopes(haystack: string[], needles: string[]): boolean {
    if (needles.length === 0) {
      return true;
    }
    if (haystack.includes('*')) {
      return true;
    }
    const set = new Set(haystack);
    return needles.every((scope) => set.has(scope));
  }

  private intersectScopes(policyScopes: string[], scopes: string[]): string[] {
    if (policyScopes.includes('*')) {
      return scopes;
    }
    const allowed = new Set(policyScopes);
    return scopes.filter((scope) => allowed.has(scope));
  }

  private intersectScopesWithWildcard(scopes: string[], policyScopes: string[]): string[] {
    if (policyScopes.includes('*')) {
      return scopes;
    }
    const allowed = new Set(policyScopes);
    return scopes.filter((scope) => allowed.has(scope));
  }

  private normalizeScopes(scopes: string[]): string[] {
    return this.normalizeValues(scopes).map((scope) => scope.toLowerCase());
  }

  private normalizeActions(actions: string[]): string[] {
    return this.normalizeValues(actions).map((action) => action.toLowerCase());
  }

  private normalizeValues(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
  }

  private clampTtlSeconds(ttlSeconds?: number): number {
    const requested = Number(
      ttlSeconds || this.configService.get<number>('AUTH_BROKER_DEFAULT_TTL_SECONDS') || 300
    );
    const min = Number(this.configService.get<number>('AUTH_BROKER_MIN_TTL_SECONDS') || 60);
    const max = Number(this.configService.get<number>('AUTH_BROKER_MAX_TTL_SECONDS') || 900);
    return Math.max(min, Math.min(max, Math.floor(requested)));
  }

  private normalizeIdentifier(value: string, field: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }
    return normalized;
  }

  private buildId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
  }

  private isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() <= Date.now();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private extractBearerToken(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new UnauthorizedException('Missing bearer token');
    }
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return trimmed.slice(7).trim();
    }
    return trimmed;
  }

  private requestKey(requestId: string): string {
    return `${this.redisPrefix}:req:${requestId}`;
  }

  private tokenKey(tokenId: string): string {
    return `${this.redisPrefix}:token:${tokenId}`;
  }

  private tokenHashKey(hash: string): string {
    return `${this.redisPrefix}:token-hash:${hash}`;
  }

  private agentActiveTokensKey(agentId: string): string {
    return `${this.redisPrefix}:agent:${agentId}:active-tokens`;
  }

  private policyKey(agentId: string, integration: string): string {
    return `${this.redisPrefix}:policy:${agentId}:${integration}`;
  }

  private auditStreamKey(): string {
    return `${this.redisPrefix}:audit:stream`;
  }

  private policyIndexKey(agentId: string, integration: string): string {
    return `${agentId}::${integration}`;
  }

  private async saveRequest(request: AuthRequestRecord): Promise<void> {
    if (this.redisReady && this.redis) {
      const ttlMs = this.computeRequestTtlMs(request.expiresAt);
      await this.redis.set(
        this.requestKey(request.requestId),
        JSON.stringify(request),
        'PX',
        ttlMs
      );
      return;
    }
    this.requests.set(request.requestId, request);
  }

  private async getRequest(requestId: string): Promise<AuthRequestRecord | null> {
    if (this.redisReady && this.redis) {
      const raw = await this.redis.get(this.requestKey(requestId));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as AuthRequestRecord;
    }
    return this.requests.get(requestId) || null;
  }

  private async saveToken(
    token: AuthTokenRecord,
    options: { hash?: string; preserveHashIndex?: boolean } = {}
  ): Promise<void> {
    if (this.redisReady && this.redis) {
      const ttlMs = Math.max(1, new Date(token.expiresAt).getTime() - Date.now());
      const pipeline = this.redis.pipeline();
      pipeline.set(this.tokenKey(token.tokenId), JSON.stringify(token), 'PX', ttlMs);
      if (options.hash) {
        pipeline.set(this.tokenHashKey(options.hash), token.tokenId, 'PX', ttlMs);
      }
      if (token.status === 'active') {
        pipeline.sadd(this.agentActiveTokensKey(token.agentId), token.tokenId);
        pipeline.pexpire(this.agentActiveTokensKey(token.agentId), ttlMs);
      }
      if (token.status !== 'active') {
        pipeline.srem(this.agentActiveTokensKey(token.agentId), token.tokenId);
      }
      await pipeline.exec();
      return;
    }

    this.tokens.set(token.tokenId, token);
    if (options.hash) {
      this.tokenHashIndex.set(options.hash, token.tokenId);
    }
    if (token.status === 'active') {
      const current = this.agentActiveTokens.get(token.agentId) || new Set<string>();
      current.add(token.tokenId);
      this.agentActiveTokens.set(token.agentId, current);
    } else {
      const current = this.agentActiveTokens.get(token.agentId);
      if (current) {
        current.delete(token.tokenId);
      }
    }
  }

  private async getToken(tokenId: string): Promise<AuthTokenRecord | null> {
    if (this.redisReady && this.redis) {
      const raw = await this.redis.get(this.tokenKey(tokenId));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as AuthTokenRecord;
    }
    return this.tokens.get(tokenId) || null;
  }

  private async lookupTokenIdByHash(hash: string): Promise<string | null> {
    if (this.redisReady && this.redis) {
      return this.redis.get(this.tokenHashKey(hash));
    }
    return this.tokenHashIndex.get(hash) || null;
  }

  private async listActiveTokenIds(agentId: string): Promise<string[]> {
    if (this.redisReady && this.redis) {
      return this.redis.smembers(this.agentActiveTokensKey(agentId));
    }
    return [...(this.agentActiveTokens.get(agentId) || new Set<string>())];
  }

  private async removeActiveToken(agentId: string, tokenId: string): Promise<void> {
    if (this.redisReady && this.redis) {
      await this.redis.srem(this.agentActiveTokensKey(agentId), tokenId);
      return;
    }
    const set = this.agentActiveTokens.get(agentId);
    if (set) {
      set.delete(tokenId);
    }
  }

  private async savePolicy(policy: AuthBrokerPolicy): Promise<void> {
    if (this.redisReady && this.redis) {
      await this.redis.set(
        this.policyKey(policy.agentId, policy.integration),
        JSON.stringify(policy)
      );
      return;
    }
    this.policies.set(this.policyIndexKey(policy.agentId, policy.integration), policy);
  }

  private async resolvePolicy(
    agentId: string,
    integration: string
  ): Promise<AuthBrokerPolicy | null> {
    const candidates: Array<[string, string]> = [
      [agentId, integration],
      [agentId, '*'],
      ['*', integration],
      ['*', '*'],
    ];

    for (const [candidateAgent, candidateIntegration] of candidates) {
      if (this.redisReady && this.redis) {
        const raw = await this.redis.get(this.policyKey(candidateAgent, candidateIntegration));
        if (raw) {
          return JSON.parse(raw) as AuthBrokerPolicy;
        }
      } else {
        const policy = this.policies.get(this.policyIndexKey(candidateAgent, candidateIntegration));
        if (policy) {
          return policy;
        }
      }
    }
    return null;
  }

  private computeRequestTtlMs(expiresAt: string): number {
    const retentionHours = Number(
      this.configService.get<number>('AUTH_BROKER_REQUEST_RETENTION_HOURS') || 168
    );
    const retentionMs = retentionHours * 60 * 60 * 1000;
    const requestedMs = new Date(expiresAt).getTime() - Date.now();
    return Math.max(60_000, requestedMs + retentionMs);
  }

  private cleanupExpiredMemoryRecords(): void {
    const now = Date.now();

    for (const [requestId, request] of this.requests.entries()) {
      const ttlMs = this.computeRequestTtlMs(request.expiresAt);
      const ageMs = now - new Date(request.createdAt).getTime();
      if (ageMs > ttlMs) {
        this.requests.delete(requestId);
      }
    }

    for (const [tokenId, token] of this.tokens.entries()) {
      if (new Date(token.expiresAt).getTime() <= now) {
        this.tokens.delete(tokenId);
        const set = this.agentActiveTokens.get(token.agentId);
        if (set) {
          set.delete(tokenId);
        }
      }
    }
  }
}
