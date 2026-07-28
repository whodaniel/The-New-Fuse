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

  // Re-read on each refresh rather than memoizing once: the user can change their relay URL in
  // Settings without remounting whatever is showing this picker.
  const [relayBaseUrl, setRelayBaseUrl] = useState(() => aiSourceService.getRelayBaseUrl());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    // Clear cached failures so an explicit refresh genuinely re-probes a relay the user just started.
    aiSourceService.resetRelayProbe();
    try {
      const currentRelay = aiSourceService.getRelayBaseUrl();
      setRelayBaseUrl(currentRelay);

      const nextSources = await aiSourceService.listSources(currentRelay || undefined);
      const online = currentRelay ? await aiSourceService.probeRelayHealth(currentRelay) : false;
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
    // No deps: refresh re-reads the relay URL itself, so depending on relayBaseUrl (which it also
    // sets) would risk re-running this effect on every refresh.
  }, []);

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
