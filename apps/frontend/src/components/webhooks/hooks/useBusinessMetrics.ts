import { useState, useCallback, useEffect } from 'react';
import { AnalyticsMetrics, BusinessEventType, IntegrationSource } from '@tnf/types';

export interface BusinessMetricsState {
  metrics: AnalyticsMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface MetricsFilter {
  timeRange: '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';
  startDate?: Date;
  endDate?: Date;
  eventTypes?: BusinessEventType[];
  sources?: IntegrationSource[];
}

export function useBusinessMetrics(initialFilter: MetricsFilter = { timeRange: '24h' }) {
  const [state, setState] = useState<BusinessMetricsState>({
    metrics: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const [filter, setFilter] = useState<MetricsFilter>(initialFilter);
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }, []);

  const buildQueryParams = useCallback((filter: MetricsFilter): string => {
    const params = new URLSearchParams();
    
    params.append('timeRange', filter.timeRange);
    
    if (filter.startDate && filter.endDate) {
      params.append('startDate', filter.startDate.toISOString());
      params.append('endDate', filter.endDate.toISOString());
    }
    
    if (filter.eventTypes && filter.eventTypes.length > 0) {
      params.append('eventTypes', filter.eventTypes.join(','));
    }
    
    if (filter.sources && filter.sources.length > 0) {
      params.append('sources', filter.sources.join(','));
    }
    
    return params.toString();
  }, []);

  const loadMetrics = useCallback(async (currentFilter?: MetricsFilter): Promise<void> => {
    const activeFilter = currentFilter || filter;
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const queryParams = buildQueryParams(activeFilter);
      const response = await fetch(`${apiBaseUrl}/webhooks/analytics/metrics?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metrics: AnalyticsMetrics = await response.json();
      
      setState(prev => ({
        ...prev,
        metrics,
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Failed to load business metrics:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load metrics',
        loading: false,
      }));
    }
  }, [filter, buildQueryParams, apiBaseUrl, getAuthHeaders]);

  const updateFilter = useCallback((newFilter: Partial<MetricsFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    loadMetrics(updatedFilter);
  }, [filter, loadMetrics]);

  const refreshMetrics = useCallback(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Derived data calculations
  const getEventTypePercentages = useCallback((): Record<BusinessEventType, number> => {
    if (!state.metrics) return {} as Record<BusinessEventType, number>;
    
    const total = state.metrics.totalEvents;
    if (total === 0) return {} as Record<BusinessEventType, number>;
    
    const percentages = {} as Record<BusinessEventType, number>;
    Object.entries(state.metrics.eventsByType).forEach(([type, count]) => {
      percentages[type as BusinessEventType] = (count / total) * 100;
    });
    
    return percentages;
  }, [state.metrics]);

  const getSourcePercentages = useCallback((): Record<IntegrationSource, number> => {
    if (!state.metrics) return {} as Record<IntegrationSource, number>;
    
    const total = state.metrics.totalEvents;
    if (total === 0) return {} as Record<IntegrationSource, number>;
    
    const percentages = {} as Record<IntegrationSource, number>;
    Object.entries(state.metrics.eventsBySource).forEach(([source, count]) => {
      percentages[source as IntegrationSource] = (count / total) * 100;
    });
    
    return percentages;
  }, [state.metrics]);

  const getTopEventTypes = useCallback((limit: number = 5): Array<{ type: BusinessEventType; count: number; percentage: number }> => {
    if (!state.metrics) return [];
    
    const percentages = getEventTypePercentages();
    
    return Object.entries(state.metrics.eventsByType)
      .map(([type, count]) => ({
        type: type as BusinessEventType,
        count,
        percentage: percentages[type as BusinessEventType] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [state.metrics, getEventTypePercentages]);

  const getTopSources = useCallback((limit: number = 5): Array<{ source: IntegrationSource; count: number; percentage: number }> => {
    if (!state.metrics) return [];
    
    const percentages = getSourcePercentages();
    
    return Object.entries(state.metrics.eventsBySource)
      .map(([source, count]) => ({
        source: source as IntegrationSource,
        count,
        percentage: percentages[source as IntegrationSource] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [state.metrics, getSourcePercentages]);

  const getHealthScore = useCallback((): number => {
    if (!state.metrics) return 0;
    
    const { errorRate, processingLatency, activeIntegrations } = state.metrics;
    
    // Calculate health score based on multiple factors
    let score = 100;
    
    // Error rate impact (0-40 points deduction)
    score -= Math.min(errorRate * 4, 40);
    
    // Latency impact (0-30 points deduction)
    const latencyPenalty = Math.min((processingLatency.avg - 100) / 50, 30);
    if (latencyPenalty > 0) {
      score -= latencyPenalty;
    }
    
    // Active integrations boost (more integrations = better score up to a point)
    const integrationBonus = Math.min(activeIntegrations * 2, 10);
    score += integrationBonus;
    
    return Math.max(0, Math.min(100, score));
  }, [state.metrics]);

  const getPerformanceGrade = useCallback((): 'A' | 'B' | 'C' | 'D' | 'F' => {
    const healthScore = getHealthScore();
    
    if (healthScore >= 90) return 'A';
    if (healthScore >= 80) return 'B';
    if (healthScore >= 70) return 'C';
    if (healthScore >= 60) return 'D';
    return 'F';
  }, [getHealthScore]);

  const getRevenueGrowth = useCallback((): number => {
    // This would need historical data to calculate growth
    // For now, return a placeholder that could be implemented with time-series data
    return 0;
  }, []);

  // Auto-refresh metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.loading) {
        loadMetrics();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [state.loading, loadMetrics]);

  // Load initial metrics
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    ...state,
    filter,
    // Actions
    loadMetrics,
    updateFilter,
    refreshMetrics,
    // Computed values
    getEventTypePercentages,
    getSourcePercentages,
    getTopEventTypes,
    getTopSources,
    getHealthScore,
    getPerformanceGrade,
    getRevenueGrowth,
  };
}