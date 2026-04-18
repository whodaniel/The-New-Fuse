import { describe, expect, it, jest } from '@jest/globals';

import { AgentHandoffController } from '../agent-handoff.controller.js';

describe('AgentHandoffController', () => {
  const handoffService = {
    publishForTenant: jest.fn(),
    listForAgent: jest.fn(),
    acknowledgeForTenant: jest.fn(),
    listBySession: jest.fn(),
    getPacket: jest.fn(),
  } as any;

  const controller = new AgentHandoffController(handoffService);

  it('publishes packet using tenant from body scope', async () => {
    const input = {
      scope: { tenantId: 'tnf-prod' },
      targets: { agentIds: ['AGENT-01'] },
      payload: { title: 'x', summary: 'y', prompt: 'z' },
      fromAgentId: 'orchestrator-main',
    };
    handoffService.publishForTenant.mockResolvedValueOnce({ id: 'packet-1' });

    const result = await controller.publish(
      input,
      { user: { id: 'u1', roles: ['admin'] } } as any
    );

    expect(result).toEqual({ id: 'packet-1' });
    expect(handoffService.publishForTenant).toHaveBeenCalledWith(input, 'tnf-prod');
  });

  it('lists inbox with tenant from query and includeAcknowledged=true', async () => {
    handoffService.listForAgent.mockResolvedValueOnce([{ packet: { id: 'p1' }, ack: null }]);

    const result = await controller.listAgentInbox(
      'AGENT-07',
      { user: { id: 'u1', roles: ['admin'] } } as any,
      'tnf-prod',
      10,
      'true'
    );

    expect(handoffService.listForAgent).toHaveBeenCalledWith('AGENT-07', 'tnf-prod', {
      limit: 10,
      includeAcknowledged: true,
    });
    expect(result.count).toBe(1);
  });

  it('rejects mismatched user tenant and requested tenant', async () => {
    await expect(
      controller.listBySession(
        'session-1',
        { user: { id: 'u1', tenantId: 'tenant-a', roles: ['admin'] } } as any,
        'tenant-b',
        20
      )
    ).rejects.toThrow('tenantId mismatch');
  });

  it('forbids publish for non-privileged user', async () => {
    const input = {
      scope: { tenantId: 'tnf-prod' },
      targets: { agentIds: ['AGENT-01'] },
      payload: { title: 'x', summary: 'y', prompt: 'z' },
      fromAgentId: 'orchestrator-main',
    };
    await expect(controller.publish(input, { user: { id: 'u1' } } as any)).rejects.toThrow(
      'Publishing handoffs requires'
    );
  });

  it('forbids ack for different agent without elevated privileges', async () => {
    await expect(
      controller.acknowledge(
        {
          packetId: '8ad27fcb-2e3b-4df2-b180-5f43444d4faa',
          agentId: 'AGENT-02',
          status: 'claimed',
          scope: { tenantId: 'tnf-prod' },
        },
        { user: { id: 'AGENT-01' } } as any
      )
    ).rejects.toThrow('Acknowledging for another agent requires elevated privileges');
  });
});
