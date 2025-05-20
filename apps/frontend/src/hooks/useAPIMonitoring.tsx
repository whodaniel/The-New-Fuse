import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

interface ProviderStats {
  id: string;
  name: string;
  active: boolean;
  successRate: number;
  avgLatency: number;
  requestCount: number;
  currentRate: number;
  maxRate: number;
  totalCost: number;
}

interface APIStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  totalCost: number;
  cacheHitRate: number;
  cacheHits: number;
  cacheSavings: number;
  requestDelta: number;
  successDelta: number;
  responseDelta: number;
  costDelta: number;
}

interface CostBreakdown {
  byProvider: Array<{
    id: string;
    name: string;
    cost: number;
    percentage: number;
  }>;
  byModel: Array<{
    model: string;
    cost: number;
    percentage: number;
  }>;
}

interface TimeSeriesPoint {
  timestamp: string;
  count: number;
}

interface ErrorRatePoint {
  timestamp: string;
  rate: number;
}

interface DailyUsagePoint {
  date: string;
  cost: number;
  requests: number;
}

interface APIGatewaySettings {
  cacheEnabled: boolean;
  cacheTTL: number;
  semanticCacheEnabled: boolean;
  costTrackingEnabled: boolean;
  failoverEnabled: boolean;
}

export function useAPIMonitoring(): any {
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [stats, setStats] = useState<APIStats>({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalCost: 0,
    cacheHitRate: 0,
    cacheHits: 0,
    cacheSavings: 0,
    requestDelta: 0,
    successDelta: 0,
    responseDelta: 0,
    costDelta: 0,
  });
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
    byProvider: [],
    byModel: []
  });
  const [requestRate, setRequestRate] = useState<TimeSeriesPoint[]>([]);
  const [errorRate, setErrorRate] = useState<ErrorRatePoint[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsagePoint[]>([]);
  const [settings, setSettings] = useState<APIGatewaySettings>({
    cacheEnabled: true,
    cacheTTL: 3600,
    semanticCacheEnabled: true,
    costTrackingEnabled: true,
    failoverEnabled: true
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        providersResponse,
        statsResponse,
        costResponse,
        timeSeriesResponse,
        settingsResponse
      ] = await Promise.all([
        api.get('/admin/api-gateway/providers'),
        api.get('/admin/api-gateway/stats'),
        api.get('/admin/api-gateway/costs'),
        api.get('/admin/api-gateway/timeseries'),
        api.get('/admin/api-gateway/settings')
      ]);

      setProviders(providersResponse.data);
      setStats(statsResponse.data);
      setCostBreakdown(costResponse.data);
      setRequestRate(timeSeriesResponse.data.requestRate);
      setErrorRate(timeSeriesResponse.data.errorRate);
      setDailyUsage(timeSeriesResponse.data.dailyUsage);
      setSettings(settingsResponse.data);
    } catch (error) {
      console.error('Error loading API monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Set up polling to refresh data
    const interval = setInterval(loadData, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  const updateSettings = useCallback(async (newSettings: Partial<APIGatewaySettings>) => {
    try {
      await api.put('/admin/api-gateway/settings', newSettings);
      setSettings((prev: any) => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating API gateway settings:', error);
    }
  }, []);

  const resetProvider = useCallback(async (providerId: string) => {
    try {
      await api.post(`/admin/api-gateway/providers/${providerId}/reset`);
      loadData(); // Reload data after reset
    } catch (error) {
      console.error('Error resetting provider:', error);
    }
  }, [loadData]);

  const clearCache = useCallback(async () => {
    try {
      await api.post('/admin/api-gateway/cache/clear');
      loadData(); // Reload data after clearing cache
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [loadData]);

  return {
    providers,
    stats,
    costBreakdown,
    requestRate,
    errorRate,
    dailyUsage,
    settings,
    updateSettings,
    resetProvider,
    clearCache,
    loading
  };
}
