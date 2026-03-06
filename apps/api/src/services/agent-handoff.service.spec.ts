import { describe, expect, it, jest } from '@jest/globals';
import { AgentHandoffService } from './agent-handoff.service';

describe('AgentHandoffService lifecycle audit logging', () => {
  const createService = () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'HANDOFF_KEY_PREFIX') return 'tnf:handoff:test';
        return undefined;
      }),
    } as any;
    const unifiedLedgerService = {
      createTimelineEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
    } as any;

    const service = new AgentHandoffService(configService, unifiedLedgerService);
    return { service, unifiedLedgerService };
  };

  it('emits timeline event when publishing a handoff packet', async () => {
    const { service, unifiedLedgerService } = createService();
    const packet = {
      id: '8f6c8be6-1f83-4c08-a5a2-f6457ebdbf6d',
      version: '1.0',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      status: 'pending',
      fromAgentId: 'agent-alpha',
      targets: { agentIds: ['agent-beta'], roles: [] },
      scope: { tenantId: 'tnf-prod' },
      payload: {
        title: 'Task handoff',
        summary: 'Send context to next agent',
        prompt: 'Handle next stage',
        acceptanceCriteria: [],
        nextActions: [],
        artifacts: [],
      },
      priority: 'normal',
      tags: ['triage'],
    } as any;

    (service as any).store = {
      publish: jest.fn().mockResolvedValue(packet),
    };

    const result = await service.publishForTenant(
      {
        fromAgentId: 'agent-alpha',
        targets: { agentIds: ['agent-beta'] },
        scope: { tenantId: 'tnf-prod' },
        payload: {
          title: 'Task handoff',
          summary: 'Send context to next agent',
          prompt: 'Handle next stage',
        },
      },
      'tnf-prod'
    );

    expect(result.id).toBe(packet.id);
    expect(unifiedLedgerService.createTimelineEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'historical_event',
        actor: 'agent_handoff_service',
        payload: expect.objectContaining({
          category: 'handoff_publish',
          tenantId: 'tnf-prod',
          packetId: packet.id,
        }),
      })
    );
  });

  it('emits timeline event when acknowledging a handoff packet', async () => {
    const { service, unifiedLedgerService } = createService();
    const packetId = '1ce0e5f1-e954-4d86-bd5e-5e18df3fcd6f';
    const packet = {
      id: packetId,
      scope: { tenantId: 'tnf-prod' },
    };
    const ack = {
      packetId,
      agentId: 'agent-beta',
      status: 'received',
      ackedAt: new Date().toISOString(),
    };

    (service as any).store = {
      getPacket: jest.fn().mockResolvedValue(packet),
      acknowledge: jest.fn().mockResolvedValue(ack),
    };

    const result = await service.acknowledgeForTenant(
      {
        packetId,
        agentId: 'agent-beta',
        status: 'received',
      },
      'tnf-prod'
    );

    expect(result.status).toBe('received');
    expect(unifiedLedgerService.createTimelineEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'historical_event',
        actor: 'agent_handoff_service',
        payload: expect.objectContaining({
          category: 'handoff_ack',
          tenantId: 'tnf-prod',
          packetId,
          agentId: 'agent-beta',
          status: 'received',
        }),
      })
    );
  });
});
