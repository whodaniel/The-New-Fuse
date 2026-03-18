import { describe, expect, it, jest } from '@jest/globals';
import { AgentHandoffService } from './agent-handoff.service';

describe('AgentHandoffService lifecycle audit logging', () => {
  const baseGateDecisions = [
    { gate: 'TENANT_SCOPE_GATE', decision: 'allow', at: new Date().toISOString() },
    { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow', at: new Date().toISOString() },
    { gate: 'TERMINAL_BINDING_GATE', decision: 'allow', at: new Date().toISOString() },
    { gate: 'HIGH_RISK_RUNTIME_GATE', decision: 'allow', at: new Date().toISOString() },
    { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow', at: new Date().toISOString() },
  ] as const;

  const buildCumulativeId = (overrides: Record<string, unknown> = {}) => ({
    spec: 'tnf/mcid/0.1',
    id: '4f406f02-8b9c-4fdf-8819-95528f6af92b',
    scope: {
      tenant_id: 'tnf-prod',
      session_key: null,
      workflow_id: null,
      channel_id: null,
    },
    lineage: {
      correlation_id: 'eb8ba106-52e8-4438-ad0a-c78f8c7f3154',
      causation_id: null,
      handoff_packet_id: null,
      twid: null,
    },
    federation: {
      domain: 'tnf-local',
      route: ['orchestrator', 'handoff-service'],
      hop_count: 1,
      gate_decisions: baseGateDecisions,
    },
    ...overrides,
  });

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
      version: '1.1',
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
      cumulativeId: buildCumulativeId(),
      gateDecisions: baseGateDecisions,
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
        cumulativeId: buildCumulativeId(),
        gateDecisions: baseGateDecisions,
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
      cumulativeId: buildCumulativeId(),
      version: '1.1',
      gateDecisions: baseGateDecisions,
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
        cumulativeId: buildCumulativeId({
          lineage: {
            correlation_id: 'eb8ba106-52e8-4438-ad0a-c78f8c7f3154',
            causation_id: null,
            handoff_packet_id: packetId,
            twid: null,
          },
        }),
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
          packetVersion: '1.1',
          agentId: 'agent-beta',
          status: 'received',
          packetGateDecisions: expect.any(Array),
        }),
      })
    );
  });

  it('rejects publish when required federation gate is missing', async () => {
    const { service } = createService();
    (service as any).store = {
      publish: jest.fn(),
    };

    await expect(
      service.publishForTenant(
        {
          fromAgentId: 'agent-alpha',
          targets: { agentIds: ['agent-beta'] },
          scope: { tenantId: 'tnf-prod' },
          payload: {
            title: 'Task handoff',
            summary: 'Send context to next agent',
            prompt: 'Handle next stage',
          },
          cumulativeId: buildCumulativeId(),
          gateDecisions: baseGateDecisions.filter(
            (gate) => gate.gate !== 'CHANNEL_MEMBERSHIP_GATE'
          ),
        },
        'tnf-prod'
      )
    ).rejects.toThrow('Missing required federation gate decision');
  });

  it('rejects publish when gate decisions diverge from cumulative federation lineage', async () => {
    const { service } = createService();
    (service as any).store = {
      publish: jest.fn(),
    };

    await expect(
      service.publishForTenant(
        {
          fromAgentId: 'agent-alpha',
          targets: { agentIds: ['agent-beta'] },
          scope: { tenantId: 'tnf-prod' },
          payload: {
            title: 'Task handoff',
            summary: 'Send context to next agent',
            prompt: 'Handle next stage',
          },
          cumulativeId: buildCumulativeId({
            federation: {
              domain: 'tnf-local',
              route: ['orchestrator', 'handoff-service'],
              hop_count: 1,
              gate_decisions: [
                ...baseGateDecisions,
                {
                  gate: 'APPROVAL_GATE',
                  decision: 'deny' as const,
                  at: new Date().toISOString(),
                },
              ],
            },
          }),
          gateDecisions: [
            ...baseGateDecisions,
            {
              gate: 'APPROVAL_GATE',
              decision: 'allow' as const,
              at: new Date().toISOString(),
            },
          ],
        },
        'tnf-prod'
      )
    ).rejects.toThrow('Gate decision mismatch for APPROVAL_GATE');
  });

  it('rejects ack when cumulative lineage breaks correlation continuity', async () => {
    const { service } = createService();
    const packetId = '1ce0e5f1-e954-4d86-bd5e-5e18df3fcd6f';
    (service as any).store = {
      getPacket: jest.fn().mockResolvedValue({
        id: packetId,
        scope: { tenantId: 'tnf-prod' },
        cumulativeId: buildCumulativeId(),
      }),
      acknowledge: jest.fn(),
    };

    await expect(
      service.acknowledgeForTenant(
        {
          packetId,
          agentId: 'agent-beta',
          status: 'received',
          cumulativeId: buildCumulativeId({
            lineage: {
              correlation_id: '2d0642a4-5249-4d28-92a8-62aee530a2e8',
              causation_id: null,
              handoff_packet_id: packetId,
              twid: null,
            },
          }),
        },
        'tnf-prod'
      )
    ).rejects.toThrow('Ack cumulativeId.lineage.correlation_id must match');
  });
});
