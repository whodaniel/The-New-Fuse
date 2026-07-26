import { aiSourceService } from '@/services/aiSource.service';
import type { AISourceOption } from '@/types/aiSource';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useAISource() {
  const [sources, setSources] = useState<AISourceOption[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    aiSourceService.getSelectedSourceId()
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [relayOnline, setRelayOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relayBaseUrl = useMemo(() => aiSourceService.getRelayBaseUrl(), []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextSources = await aiSourceService.listSources(relayBaseUrl || undefined);
      const online = relayBaseUrl ? await aiSourceService.probeRelayHealth(relayBaseUrl) : false;
      setSources(nextSources);
      setRelayOnline(online);

      const currentId = aiSourceService.getSelectedSourceId();
      const resolved = aiSourceService.resolveSelected(nextSources, currentId);
      if (resolved.id !== currentId) {
        setSelectedSourceId(resolved.id);
        aiSourceService.setSelectedSourceId(resolved.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load AI sources.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [relayBaseUrl]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectSource = useCallback((sourceId: string) => {
    setSelectedSourceId(sourceId);
    aiSourceService.setSelectedSourceId(sourceId);
  }, []);

  const selectedSource = useMemo(
    () => aiSourceService.resolveSelected(sources, selectedSourceId),
    [sources, selectedSourceId]
  );

  return {
    sources,
    selectedSource,
    selectedSourceId,
    selectSource,
    refresh,
    loading,
    refreshing,
    relayOnline,
    relayBaseUrl,
    error,
  };
}
