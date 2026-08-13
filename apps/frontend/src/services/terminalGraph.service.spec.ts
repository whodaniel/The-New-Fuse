import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchTerminalGraph } from './terminalGraph.service';

describe('fetchTerminalGraph', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests terminal graph with query params and returns parsed payload', async () => {
    const payload = {
      available: true,
      generatedAt: '2026-03-18T00:00:00.000Z',
      source: {
        snapshotPath: '/tmp/twip.snapshot.json',
        mirroredFrom: 'tnf://twip/inventory',
        mirroredAt: null,
        meta: {},
      },
      safety: {
        commandsRedacted: true,
        tenantScopedFilter: 'tnf-local',
      },
      summary: {
        requestedLimit: 10,
        totalFromSnapshot: 2,
        totalAfterTenantFilter: 2,
        returnedTerminals: 2,
        nodeCount: 5,
        edgeCount: 4,
        runtimeHintCount: 1,
      },
      graph: { nodes: [], edges: [] },
      terminals: [],
      registryContext: { sourcePath: null, indexedAgents: 0 },
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);

    const result = await fetchTerminalGraph({
      tenantId: 'tnf-local',
      limit: 10,
      includeCommands: false,
      includeProcessNodes: true,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/terminals/graph?tenantId=tnf-local&limit=10&includeCommands=false&includeProcessNodes=true',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      })
    );
    expect(result.available).toBe(true);
    expect(result.summary.returnedTerminals).toBe(2);
  });

  it('throws when API returns a non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'boom',
    } as Response);

    await expect(fetchTerminalGraph()).rejects.toThrow('boom');
  });
});

