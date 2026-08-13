import { describe, expect, it } from 'vitest';
import type { OperatorSynergySnapshot } from '../services/operatorSynergy/types';

const emptySynergy = {
  unifiedAgents: [],
  relayHealth: null,
  federatedAgentCount: 0,
  relayRegistered: false,
  relayConnected: false,
  channelCount: 0,
  apiOnline: false,
} as unknown as OperatorSynergySnapshot;

// Mirror the honest pure helpers from useAnalyticsData for unit testing.
// Synergy can only measure agent counts; everything else must be null (rendered "—").
function synergyOverview(synergy: OperatorSynergySnapshot) {
  return {
    totalAgents: synergy.unifiedAgents.length,
    activeAgents: synergy.unifiedAgents.filter((a) => a.status === 'active').length,
    totalInteractions: null,
    successRate: null,
    averageResponseTime: null,
    totalWorkflows: null,
  };
}

function synergyProviderRoster(synergy: OperatorSynergySnapshot) {
  const grouped = new Map<string, number>();
  for (const agent of synergy.unifiedAgents) {
    grouped.set(agent.platform, (grouped.get(agent.platform) || 0) + 1);
  }
  return Array.from(grouped.entries()).map(([provider, count]) => ({
    provider,
    agentCount: count,
    totalRequests: null,
    successRate: null,
    avgLatency: null,
    cost: null,
  }));
}

describe('analytics synergy fallback (honest)', () => {
  it('returns real agent counts and null unmeasured metrics when fleet is empty', () => {
    const overview = synergyOverview(emptySynergy);
    expect(overview.totalAgents).toBe(0);
    expect(overview.activeAgents).toBe(0);
    expect(overview.successRate).toBeNull();
    expect(overview.totalInteractions).toBeNull();
    expect(overview.averageResponseTime).toBeNull();
    expect(overview.totalWorkflows).toBeNull();
  });

  it('never fabricates interactions or latency even when relay health exists', () => {
    const overview = synergyOverview({
      ...emptySynergy,
      relayHealth: { agents: 12, channels: 3, uptime: 500 },
      federatedAgentCount: 4,
    } as OperatorSynergySnapshot);
    expect(overview.totalInteractions).toBeNull();
    expect(overview.averageResponseTime).toBeNull();
  });

  it('reports real per-platform agent counts but null usage/cost', () => {
    const roster = synergyProviderRoster({
      ...emptySynergy,
      unifiedAgents: [{ platform: 'local' }, { platform: 'local' }, { platform: 'openai' }],
    } as unknown as OperatorSynergySnapshot);
    const local = roster.find((r) => r.provider === 'local');
    expect(local?.agentCount).toBe(2);
    expect(local?.cost).toBeNull();
    expect(local?.totalRequests).toBeNull();
  });
});
