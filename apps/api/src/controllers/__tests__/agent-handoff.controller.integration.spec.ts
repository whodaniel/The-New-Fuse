import { describe, expect, it, jest } from '@jest/globals';
import { AgentHandoffController } from '../agent-handoff.controller';
import { AgentHandoffService } from '../../services/agent-handoff.service';

describe('AgentHandoffController timeline integration', () => {
  const configService = {
    get: jest.fn((key: string) => (key === 'HANDOFF_KEY_PREFIX' ? 'tnf:handoff:int-test' : undefined)),
  } as any;
  const unifiedLedgerService = {
    createTimelineEvent: jest.fn().mockResolvedValue({ id: 'timeline-event' }),
  } as any;
  const service = new AgentHandoffService(configService, unifiedLedgerService);
  const controller = new AgentHandoffController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes handoff and emits a timeline event', async () => {
    const packet = {
      id: '4d8c8f09-5d9f-4d14-9b8b-2d6536a4bf5a',
      fromAgentId: 'agent-alpha',
      targets: { agentIds: ['agent-beta'], roles: [] },
      scope: { tenantId: 'tnf-prod' },
      payload: {
        title: 'handoff',
        summary: 'Send detailed context',
        prompt: 'do the work',
        acceptanceCriteria: [],
        nextActions: [],
        artifacts: [],
      },
      priority: 'normal',
      version: '1.0',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      status: 'pending',
      tags: [],
    } as any;

    (service as any).store = {
      publish: jest.fn().mockResolvedValue(packet),
    };

    const req = {
      user: {
        tenantId: 'tnf-prod',
        roles: ['ADMIN'],
        permissions: ['handoff:publish'],
      },
    } as any;

    await controller.publish(
      {
        fromAgentId: 'agent-alpha',
        targets: { agentIds: ['agent-beta'], roles: [] },
        scope: { tenantId: 'tnf-prod' },
      payload: {
        title: 'handoff',
        summary: 'Send detailed context',
        prompt: 'do the work',
        acceptanceCriteria: [],
        nextActions: [],
        artifacts: [],
      },
      },
      req
    );

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

  it('acknowledges handoff and logs lifecycle', async () => {
    const packetId = '262166b8-5b63-4fd6-ac3c-7b3bde3b5eb5';
    const packet = {
      id: packetId,
      scope: { tenantId: 'tnf-prod' },
    };
    const ack = {
      packetId,
      agentId: 'agent-beta',
      status: 'received' as const,
      ackedAt: new Date().toISOString(),
    };

    (service as any).store = {
      getPacket: jest.fn().mockResolvedValue(packet),
      acknowledge: jest.fn().mockResolvedValue(ack),
    };

    const req = {
      user: {
        tenantId: 'tnf-prod',
        id: 'agent-beta',
        roles: ['AGENT'],
        permissions: ['handoff:ack:any'],
      },
    } as any;

    await controller.acknowledge(
      {
        packetId,
        agentId: 'agent-beta',
        status: 'received',
      },
      req
    );

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
