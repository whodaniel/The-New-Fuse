import { useState, useEffect } from 'react';

export interface StepMetric {
  id: string;
  name: string;
  value: number;
  nodeId: string;
  duration: number;
  success: boolean;
}

export interface MemoryMetric {
  id: string;
  name: string;
  value: number;
  totalItems: number;
  hitRate: number;
}

export interface MetricsData {
  stepMetrics: StepMetric[];
  memoryMetrics: MemoryMetric;
}

export type Metric = StepMetric;

export interface BaseMetric {
  id: string;
  name: string;
  value: number;
}

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