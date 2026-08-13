import { useState, useEffect } from 'react';
import { MetricsData, Metric } from '@the-new-fuse/api-types/src/metrics';

export function useMetrics(): {
  data: MetricsData | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const resp = await fetch('/api/metrics');
        const json = await resp.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return { data, loading, error };
}
