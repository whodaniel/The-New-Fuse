import { fetchMasterGraph } from '@/services/masterGraph.service';
import { useContext, useEffect, useState } from 'react';
import type { MasterGraph } from '../../shared/master-graph';
import AuthContext from '../AuthContext';

export function useMasterGraph() {
  const auth = useContext(AuthContext);
  const scope = `${auth?.user?.id || 'anonymous'}:${auth?.user?.tenantId || ''}:${auth?.isAuthenticated || false}`;
  const [graphScope, setGraphScope] = useState(scope);
  const [graph, setGraph] = useState<MasterGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setGraph(null);
    setError(null);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchMasterGraph(controller.signal);
        if (!controller.signal.aborted) {
          setGraphScope(scope);
          setGraph(result);
          setError(null);
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Graph unavailable');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setNow(Date.now());
          timer = setTimeout(load, 30000);
        }
      }
    }
    void load();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, [refresh, scope]);
  return {
    graph: graphScope === scope ? graph : null,
    error,
    loading,
    now,
    reload: () => setRefresh((v) => v + 1),
  };
}
