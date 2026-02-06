import { MemoryItem, MemoryStats } from '@the-new-fuse/api-types/src/memory';
import { useEffect, useState } from 'react';

export function useMemoryInspector(agentId?: string): {
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
        const url = agentId ? `/api/memory/items?agentId=${agentId}` : '/api/memory/items';
        const resp = await fetch(url);
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
  }, [agentId]);

  return { items, stats, loading, error };
}
