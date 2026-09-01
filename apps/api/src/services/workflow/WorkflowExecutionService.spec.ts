import { describe, expect, it, jest } from '@jest/globals';

import { WorkflowExecutionService } from './WorkflowExecutionService';

/**
 * Build a service instance with a fake DatabaseService that just records
 * every updateExecution() call, so tests can assert on final run state
 * without a real database. AgentApiGrantsService/AgentService are passed as
 * jest mock objects, overridden per-test as needed.
 */
function makeService(overrides?: {
  agentApiGrants?: Partial<Record<string, jest.Mock>>;
  agents?: Partial<Record<string, jest.Mock>>;
}) {
  const updates: any[] = [];
  const db = {
    workflows: {
      updateExecution: jest.fn(async (id: string, patch: any) => {
        updates.push({ id, ...patch });
      }),
    },
  };
  const agentApiGrants = {
    findActiveGrantForAgentProvider: jest.fn(),
    executeProxyForGrant: jest.fn(),
    ...overrides?.agentApiGrants,
  };
  const agents = {
    findAgentById: jest.fn(),
    ...overrides?.agents,
  };
  const service = new WorkflowExecutionService(db as any, agentApiGrants as any, agents as any);
  return { service, db, updates, agentApiGrants, agents };
}

describe('WorkflowExecutionService', () => {
  describe('conditional branching — the regression this fix targets', () => {
    it('runs ONLY the true-branch node when the condition passes', async () => {
      const { service, updates } = makeService();

      const definition = {
        nodes: [
          { id: 'start', type: 'input', data: {} },
          {
            id: 'cond',
            type: 'condition',
            data: { config: { condition: 'input.value > 10' } },
          },
          { id: 'true-branch', type: 'generic', data: {} },
          { id: 'false-branch', type: 'generic', data: {} },
        ],
        edges: [
          { source: 'start', target: 'cond' },
          { source: 'cond', target: 'true-branch', sourceHandle: 'true' },
          { source: 'cond', target: 'false-branch', sourceHandle: 'false' },
        ],
      };

      await service.run('exec-1', definition, { value: 15 });

      const finalUpdate = updates.find((u) => u.status === 'COMPLETED');
      expect(finalUpdate).toBeDefined();
      const executedNodeIds = finalUpdate.nodeExecutions.map((n: any) => n.nodeId);
      expect(executedNodeIds).toEqual(expect.arrayContaining(['start', 'cond', 'true-branch']));
      expect(executedNodeIds).not.toContain('false-branch');
    });

    it('runs ONLY the false-branch node when the condition fails — this is the bug the fix corrects (previously both branches always ran)', async () => {
      const { service, updates } = makeService();

      const definition = {
        nodes: [
          { id: 'start', type: 'input', data: {} },
          {
            id: 'cond',
            type: 'condition',
            data: { config: { condition: 'input.value > 10' } },
          },
          { id: 'true-branch', type: 'generic', data: {} },
          { id: 'false-branch', type: 'generic', data: {} },
        ],
        edges: [
          { source: 'start', target: 'cond' },
          { source: 'cond', target: 'true-branch', sourceHandle: 'true' },
          { source: 'cond', target: 'false-branch', sourceHandle: 'false' },
        ],
      };

      await service.run('exec-2', definition, { value: 5 });

      const finalUpdate = updates.find((u) => u.status === 'COMPLETED');
      const executedNodeIds = finalUpdate.nodeExecutions.map((n: any) => n.nodeId);
      expect(executedNodeIds).toEqual(expect.arrayContaining(['start', 'cond', 'false-branch']));
      expect(executedNodeIds).not.toContain('true-branch');
    });

    it('falls back to firing every edge when sourceHandle was never recorded (pre-fix saved workflows), rather than silently executing nothing', async () => {
      const { service, updates } = makeService();

      const definition = {
        nodes: [
          { id: 'cond', type: 'condition', data: { config: { condition: 'true' } } },
          { id: 'a', type: 'generic', data: {} },
          { id: 'b', type: 'generic', data: {} },
        ],
        edges: [
          // Neither edge carries a sourceHandle — legacy/malformed data.
          { source: 'cond', target: 'a' },
          { source: 'cond', target: 'b' },
        ],
      };

      await service.run('exec-3', definition, {});

      const finalUpdate = updates.find((u) => u.status === 'COMPLETED');
      const executedNodeIds = finalUpdate.nodeExecutions.map((n: any) => n.nodeId);
      expect(executedNodeIds).toEqual(expect.arrayContaining(['cond', 'a', 'b']));
    });

    it('leaves non-condition nodes with multiple outgoing edges unaffected — they still fire every edge', async () => {
      const { service, updates } = makeService();

      const definition = {
        nodes: [
          { id: 'fanout', type: 'generic', data: {} },
          { id: 'a', type: 'generic', data: {} },
          { id: 'b', type: 'generic', data: {} },
        ],
        edges: [
          { source: 'fanout', target: 'a' },
          { source: 'fanout', target: 'b' },
        ],
      };

      await service.run('exec-4', definition, {});

      const finalUpdate = updates.find((u) => u.status === 'COMPLETED');
      const executedNodeIds = finalUpdate.nodeExecutions.map((n: any) => n.nodeId);
      expect(executedNodeIds).toEqual(expect.arrayContaining(['fanout', 'a', 'b']));
    });

    it('marks the execution FAILED with a clear message when the condition expression is invalid, rather than silently passing/failing open', async () => {
      const { service, updates } = makeService();

      const definition = {
        nodes: [
          { id: 'cond', type: 'condition', data: { config: { condition: 'input.value >' } } },
        ],
        edges: [],
      };

      await service.run('exec-5', definition, {});

      const failed = updates.find((u) => u.status === 'FAILED');
      expect(failed).toBeDefined();
      expect(failed.error).toMatch(/invalid expression/i);
    });
  });

  describe('agent-node execution', () => {
    const definition = {
      nodes: [{ id: 'agent-1', type: 'agent', data: { config: { agentId: 'a-1', prompt: 'hi' } } }],
      edges: [],
    };

    it('throws a clear error when the node has no agentId (Tauri raw provider+prompt shape)', async () => {
      const { service, updates } = makeService();
      await service.run(
        'exec-6',
        {
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              data: { config: { provider: 'openai', prompt: 'hi' } },
            },
          ],
          edges: [],
        },
        {},
        'user-1'
      );
      const failed = updates.find((u) => u.status === 'FAILED');
      expect(failed.error).toMatch(/no agentId/i);
    });

    it('throws a clear error when the execution has no owning user', async () => {
      const { service, updates } = makeService();
      await service.run('exec-7', definition, {}, null);
      const failed = updates.find((u) => u.status === 'FAILED');
      expect(failed.error).toMatch(/no owning user/i);
    });

    it('throws a clear error when the agent has no active grant for its provider', async () => {
      const { service, updates, agents, agentApiGrants } = makeService();
      (agents.findAgentById as jest.Mock).mockResolvedValue({
        id: 'a-1',
        provider: 'openai',
      } as never);
      (agentApiGrants.findActiveGrantForAgentProvider as jest.Mock).mockResolvedValue(
        null as never
      );

      await service.run('exec-8', definition, {}, 'user-1');

      const failed = updates.find((u) => u.status === 'FAILED');
      expect(failed.error).toMatch(/no active api grant/i);
    });

    it('spends the resolved grant via executeProxyForGrant on the happy path — never bypasses grant/budget enforcement', async () => {
      const { service, updates, agents, agentApiGrants } = makeService();
      (agents.findAgentById as jest.Mock).mockResolvedValue({
        id: 'a-1',
        provider: 'openai',
      } as never);
      const grant = { id: 'grant-1', provider: 'openai' };
      (agentApiGrants.findActiveGrantForAgentProvider as jest.Mock).mockResolvedValue(
        grant as never
      );
      (agentApiGrants.executeProxyForGrant as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: 'hello back' } }],
      } as never);

      await service.run('exec-9', definition, {}, 'user-1');

      expect(agentApiGrants.executeProxyForGrant).toHaveBeenCalledWith(
        grant,
        { messages: [{ role: 'user', content: 'hi' }] },
        expect.any(Number)
      );
      const completed = updates.find((u) => u.status === 'COMPLETED');
      expect(completed).toBeDefined();
      expect(completed.error).toBeUndefined();
    });
  });
});
