import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs/promises';
import * as os from 'node:os';
import * as path from 'path';
import { TerminalsService } from './terminals.service';

describe('TerminalsService', () => {
  it('returns unavailable when TWIP snapshot is missing', async () => {
    const service = new TerminalsService();
    process.env.TWIP_INVENTORY_SNAPSHOT_PATH = path.join(
      os.tmpdir(),
      `missing-twip-${Date.now()}.json`
    );

    const result = await service.getTerminalGraph({
      limit: 100,
      includeCommands: false,
      includeProcessNodes: true,
    });

    expect(result.available).toBe(false);
    expect(result.graph.nodes).toEqual([]);
    expect(result.graph.edges).toEqual([]);
    delete process.env.TWIP_INVENTORY_SNAPSHOT_PATH;
  });

  it('builds terminal graph and redacts commands by default', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tnf-terminals-'));
    const snapshotPath = path.join(tmpDir, 'twip-inventory.snapshot.json');
    const registryPath = path.join(tmpDir, 'agents.json');

    await fs.writeFile(
      snapshotPath,
      JSON.stringify(
        {
          mirrored_from: 'tnf://twip/inventory',
          mirrored_at: '2026-03-18T00:00:00.000Z',
          meta: {
            source: 'test-fixture',
          },
          terminals: [
            {
              twid: 'twid-1',
              scope: {
                tenant_id: 'tnf-local',
                host_id: 'h:abc12345',
                pane_id: 'tty:ttys001',
                window_id: 'w:1',
              },
              process: {
                shell_pid: 1234,
                pgid: 1234,
                sid: 0,
                process_count: 2,
              },
              pty: {
                path: '/dev/ttys001',
              },
              active_commands: ['codex --help', 'node relay.js'],
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    await fs.writeFile(
      registryPath,
      JSON.stringify(
        [
          { id: 'codex-runtime-agent' },
          { id: 'relay-observer-agent' },
        ],
        null,
        2
      ),
      'utf8'
    );

    process.env.TWIP_INVENTORY_SNAPSHOT_PATH = snapshotPath;
    process.env.TNF_AGENT_REGISTRY_AGENTS_PATH = registryPath;

    const service = new TerminalsService();
    const redacted = await service.getTerminalGraph({
      limit: 50,
      includeCommands: false,
      includeProcessNodes: true,
      tenantId: 'tnf-local',
    });
    const verbose = await service.getTerminalGraph({
      limit: 50,
      includeCommands: true,
      includeProcessNodes: true,
      tenantId: 'tnf-local',
    });

    expect(redacted.available).toBe(true);
    expect(redacted.summary.returnedTerminals).toBe(1);
    expect(redacted.graph.nodes.some((node: any) => node.type === 'runtime')).toBe(true);
    expect(redacted.terminals[0].active_commands).toBeUndefined();
    expect(Array.isArray(redacted.terminals[0].ownershipHints)).toBe(true);
    expect(redacted.terminals[0].ownershipHints.length).toBeGreaterThan(0);

    expect(verbose.terminals[0].active_commands).toEqual(['codex --help', 'node relay.js']);

    delete process.env.TWIP_INVENTORY_SNAPSHOT_PATH;
    delete process.env.TNF_AGENT_REGISTRY_AGENTS_PATH;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});

