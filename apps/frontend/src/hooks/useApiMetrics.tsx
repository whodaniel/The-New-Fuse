import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface ApiMetrics {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  requestsOverTime: Array<{ timestamp: string; count: number }>;
  responseTimesOverTime: Array<{ timestamp: string; value: number }>;
}

interface EndpointMetrics {
  path: string;
  method: string;
  requests: number;
  avgTime: number;
  errorRate: number;
}

interface ApiError {
  timestamp: string;
  endpoint: string;
  error: string;
  count: number;
}

export function useApiMetrics(): any {
  const [metrics, setMetrics] = useState<ApiMetrics>({
    totalRequests: 0,
    errorRate: 0,
    avgResponseTime: 0,
    requestsOverTime: [],
    responseTimesOverTime: []
  });
  const [endpoints, setEndpoints] = useState<EndpointMetrics[]>([]);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const [metricsData, endpointsData, errorsData] = await Promise.all([
        api.get('/admin/metrics/overview'),
        api.get('/admin/metrics/endpoints'),
        api.get('/admin/metrics/errors')
      ]);

      setMetrics(metricsData.data);
      setEndpoints(endpointsData.data);
      setErrors(errorsData.data);
    } catch (error) {
      console.error('Error loading API metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, endpoints, errors, loading };
}
