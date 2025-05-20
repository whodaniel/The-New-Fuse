import { useState, useEffect } from 'react';

export interface MemoryItem {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface MemoryStats {
  totalItems: number;
  hitRate: number;
  avgImportance?: number;
}

export function useMemoryInspector(): {
  items: MemoryItem[];
  stats: MemoryStats | null;
  loading: boolean;
  error: string | null;
} {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemory() {
      try {
        // Placeholder: replace with real API call
        const resp = await fetch('/api/memory/items');
        const data = await resp.json();
        setItems(data.items);
        setStats(data.stats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMemory();
  }, []);

  return { items, stats, loading, error };
}