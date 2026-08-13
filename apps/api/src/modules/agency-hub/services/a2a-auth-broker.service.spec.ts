import { describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnifiedLedgerService } from '../../unified-ledger/unified-ledger.service';
import { A2AAuthBrokerService } from './a2a-auth-broker.service';

describe('A2AAuthBrokerService', () => {
  const createService = () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'REDIS_URL') return undefined;
        if (key === 'AUTH_BROKER_DEFAULT_TTL_SECONDS') return 300;
        if (key === 'AUTH_BROKER_MAX_TTL_SECONDS') return 900;
        if (key === 'AUTH_BROKER_MIN_TTL_SECONDS') return 60;
        return undefined;
      }),
    } as unknown as ConfigService;
    const eventEmitter = {
      emit: jest.fn(),
    } as unknown as EventEmitter2;
    const unifiedLedgerService = {
      createTimelineEvent: jest.fn().mockResolvedValue({ id: 'evt_1' }),
    } as unknown as UnifiedLedgerService;

    const service = new A2AAuthBrokerService(configService, eventEmitter, unifiedLedgerService);
    return { service, eventEmitter, unifiedLedgerService };
  };

  it('denies token request when no policy is configured', async () => {
    const { service } = createService();
    const result = await service.requestToken(
      {
        agentId: 'agent-alpha',
        integration: 'github',
        requestedScopes: ['repo:read'],
        action: 'read',
      },
      { requesterUserId: 'user-1', ip: '127.0.0.1' }
    );

    expect(result.decision).toBe('denied');
    expect(result.token).toBeUndefined();
  });

  it('auto-approves non-step-up actions and authorizes scoped usage', async () => {
    const { service } = createService();
    await service.upsertPolicy('agent-alpha', 'github', {
      allowedScopes: ['repo:read', 'issues:read'],
      allowedActions: ['read'],
      stepUpActions: ['delete'],
      singleUseActions: ['delete'],
      maxTtlSeconds: 900,
      defaultTtlSeconds: 300,
    });

    const request = await service.requestToken(
      {
        agentId: 'agent-alpha',
        integration: 'github',
        requestedScopes: ['repo:read', 'repo:write'],
        action: 'read',
        ttlSeconds: 120,
      },
      { requesterUserId: 'user-1', ip: '127.0.0.1' }
    );

    expect(request.decision).toBe('approved');
    expect(request.token).toBeDefined();

    const authorized = await service.authorizeAgentToken(
      {
        bearerToken: request.token as string,
        agentId: 'agent-alpha',
        integration: 'github',
        action: 'read',
        requiredScopes: ['repo:read'],
      },
      { ip: '127.0.0.1' }
    );

    expect(authorized.agentId).toBe('agent-alpha');
    expect(authorized.integration).toBe('github');
    expect(authorized.scopes).toEqual(['repo:read']);
  });

  it('requires approval for step-up actions and enforces single-use token behavior', async () => {
    const { service } = createService();
    await service.upsertPolicy('agent-alpha', 'github', {
      allowedScopes: ['repo:delete'],
      allowedActions: ['delete'],
      stepUpActions: ['delete'],
      singleUseActions: ['delete'],
      maxTtlSeconds: 900,
      defaultTtlSeconds: 300,
    });

    const requested = await service.requestToken(
      {
        agentId: 'agent-alpha',
        integration: 'github',
        requestedScopes: ['repo:delete'],
        action: 'delete',
      },
      { requesterUserId: 'user-1', ip: '127.0.0.1' }
    );

    expect(requested.decision).toBe('pending');
    expect(requested.token).toBeUndefined();

    const approved = await service.approveTokenRequest(
      {
        requestId: requested.requestId,
        mfaProof: '123456',
      },
      { requesterUserId: 'admin-1', ip: '127.0.0.1' }
    );

    expect(approved.decision).toBe('approved');

    await service.authorizeAgentToken(
      {
        bearerToken: approved.token,
        agentId: 'agent-alpha',
        integration: 'github',
        action: 'delete',
        requiredScopes: ['repo:delete'],
      },
      { ip: '127.0.0.1' }
    );

    await expect(
      service.authorizeAgentToken(
        {
          bearerToken: approved.token,
          agentId: 'agent-alpha',
          integration: 'github',
          action: 'delete',
          requiredScopes: ['repo:delete'],
        },
        { ip: '127.0.0.1' }
      )
    ).rejects.toThrow('not active');
  });

  it('bulk revokes active tokens for an agent', async () => {
    const { service } = createService();
    await service.upsertPolicy('agent-alpha', 'github', {
      allowedScopes: ['repo:read'],
      allowedActions: ['read'],
      stepUpActions: ['delete'],
      singleUseActions: ['delete'],
      maxTtlSeconds: 900,
      defaultTtlSeconds: 300,
    });

    const one = await service.requestToken(
      {
        agentId: 'agent-alpha',
        integration: 'github',
        requestedScopes: ['repo:read'],
        action: 'read',
      },
      { requesterUserId: 'user-1', ip: '127.0.0.1' }
    );
    const two = await service.requestToken(
      {
        agentId: 'agent-alpha',
        integration: 'github',
        requestedScopes: ['repo:read'],
        action: 'read',
      },
      { requesterUserId: 'user-1', ip: '127.0.0.1' }
    );

    const result = await service.revokeAllForAgent(
      {
        agentId: 'agent-alpha',
      },
      { requesterUserId: 'admin-1' }
    );

    expect(result.revokedCount).toBe(2);
    await expect(
      service.authorizeAgentToken(
        {
          bearerToken: one.token as string,
          agentId: 'agent-alpha',
          integration: 'github',
          action: 'read',
          requiredScopes: ['repo:read'],
        },
        { ip: '127.0.0.1' }
      )
    ).rejects.toThrow('not active');

    await expect(
      service.authorizeAgentToken(
        {
          bearerToken: two.token as string,
          agentId: 'agent-alpha',
          integration: 'github',
          action: 'read',
          requiredScopes: ['repo:read'],
        },
        { ip: '127.0.0.1' }
      )
    ).rejects.toThrow('not active');
  });
});
