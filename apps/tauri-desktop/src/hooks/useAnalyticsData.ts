import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import type { OperatorSynergySnapshot } from '../services/operatorSynergy/types';
import type {
  AnalyticsAgentMetric,
  AnalyticsDataSource,
  AnalyticsOverview,
  AnalyticsPerformancePoint,
  AnalyticsProviderMetric,
} from '../types';

/**
 * Honest synergy overview: only fields the live snapshot can actually measure
 * (agent counts) are populated. Interactions, success rate, latency and workflow
 * counts are not derivable from synergy, so they stay null and render as "—".
 */
function synergyOverview(synergy: OperatorSynergySnapshot): AnalyticsOverview {
  return {
    totalAgents: synergy.unifiedAgents.length,
    activeAgents: synergy.unifiedAgents.filter((a) => a.status === 'active').length,
    totalInteractions: null,
    successRate: null,
    averageResponseTime: null,
    totalWorkflows: null,
  };
}

/**
 * Synergy agent roster: real identities and live status only. Task/success/latency
 * metrics are not measured by synergy, so they stay null until the REST API ships
 * agent-level metrics.
 */
function synergyAgentRoster(synergy: OperatorSynergySnapshot): AnalyticsAgentMetric[] {
  return synergy.unifiedAgents.slice(0, 12).map((agent) => ({
    agentId: agent.id,
    agentName: agent.name,
    totalTasks: null,
    successRate: null,
    avgResponseTime: null,
    lastActive: agent.status,
  }));
}

/**
 * Synergy provider roster: real per-platform agent counts only. Request/cost/latency
 * usage metrics stay null until supplied by the REST API.
 */
function synergyProviderRoster(synergy: OperatorSynergySnapshot): AnalyticsProviderMetric[] {
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

export function useAnalyticsData(synergy: OperatorSynergySnapshot, timeRange: string) {
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<AnalyticsDataSource>('synergy');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview>(() => synergyOverview(synergy));
  // Time-series and usage/cost metrics cannot be derived from synergy, so they
  // are only populated when the corresponding REST API request succeeds.
  const [performanceData, setPerformanceData] = useState<AnalyticsPerformancePoint[]>([]);
  const [performanceAvailable, setPerformanceAvailable] = useState(false);
  const [agentMetrics, setAgentMetrics] = useState<AnalyticsAgentMetric[]>(() =>
    synergyAgentRoster(synergy)
  );
  // True only when the API supplies real per-agent task/success/latency metrics.
  const [agentMetricsAvailable, setAgentMetricsAvailable] = useState(false);
  const [providerMetrics, setProviderMetrics] = useState<AnalyticsProviderMetric[]>(() =>
    synergyProviderRoster(synergy)
  );
  const [providerMetricsAvailable, setProviderMetricsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError(null);

      const [overviewRes, performanceRes, providersRes] = await Promise.all([
        apiService.getAnalyticsOverview(timeRange),
        apiService.getAnalyticsPerformance(timeRange),
        apiService.getAnalyticsProviders(timeRange),
      ]);

      if (cancelled) return;

      if (overviewRes.success && overviewRes.data) {
        setDataSource('api');
        setOverview(overviewRes.data);

        if (performanceRes.success && performanceRes.data?.dataPoints?.length) {
          setPerformanceData(performanceRes.data.dataPoints);
          setPerformanceAvailable(true);
        } else {
          // Do not backfill with synthetic series under an "API" label.
          setPerformanceData([]);
          setPerformanceAvailable(false);
        }

        if (providersRes.success && providersRes.data?.length) {
          setProviderMetrics(
            providersRes.data.map((row) => ({
              provider: row.provider,
              totalRequests: row.totalRequests,
              successRate: row.successRate,
              avgLatency: row.avgLatency,
              cost: row.totalRequests * row.costPerRequest,
            }))
          );
          setProviderMetricsAvailable(true);
        } else {
          setProviderMetrics(synergyProviderRoster(synergy));
          setProviderMetricsAvailable(false);
        }

        // Agent-level API metrics are not shipped yet; show the live roster with
        // null metric cells rather than fabricated task/success numbers.
        setAgentMetrics(synergyAgentRoster(synergy));
        setAgentMetricsAvailable(false);
      } else {
        setDataSource('synergy');
        setOverview(synergyOverview(synergy));
        setPerformanceData([]);
        setPerformanceAvailable(false);
        setAgentMetrics(synergyAgentRoster(synergy));
        setAgentMetricsAvailable(false);
        setProviderMetrics(synergyProviderRoster(synergy));
        setProviderMetricsAvailable(false);
        setFetchError(
          overviewRes.error ||
            'REST API offline — showing live agent roster only. Usage metrics require the TNF API on port 3001.'
        );
      }

      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on sync ticks, not every snapshot field
  }, [timeRange, synergy.lastSyncAt]);

  const maxRequests = useMemo(
    () => Math.max(1, ...performanceData.map((point) => point.requests)),
    [performanceData]
  );

  const exportData = useCallback(async () => {
    const apiExport = await apiService.exportAnalytics(timeRange);
    if (apiExport.success && apiExport.data) {
      return { source: 'api' as const, payload: apiExport.data };
    }

    return {
      source: 'synergy' as const,
      payload: {
        note: 'Live synergy roster. Null fields are not measured without the REST API.',
        overview,
        performance: { timeRange, dataPoints: performanceData },
        agentMetrics,
        providerPerformance: providerMetrics.map((row) => ({
          provider: row.provider,
          agentCount: row.agentCount ?? null,
          totalRequests: row.totalRequests,
          successRate: row.successRate,
          avgLatency: row.avgLatency,
          costPerRequest:
            row.cost != null && row.totalRequests ? row.cost / row.totalRequests : null,
        })),
      },
    };
  }, [agentMetrics, overview, performanceData, providerMetrics, timeRange]);

  return {
    loading,
    dataSource,
    fetchError,
    overview,
    performanceData,
    performanceAvailable,
    agentMetrics,
    agentMetricsAvailable,
    providerMetrics,
    providerMetricsAvailable,
    maxRequests,
    exportData,
  };
}
