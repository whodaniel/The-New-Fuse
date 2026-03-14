import { useCallback, useEffect, useRef, useState } from 'react';
import { timelineApi } from '../../api/timeline';

export const useTimeline = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchMacro = useCallback(async () => {
    try {
      setLoading(true);
      const result = await timelineApi.getMacroView();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMacro();

    // SimulCollab: Connect to Relay
    const relayUrl = 'ws://localhost:3000';
    const ws = new WebSocket(relayUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'REGISTER',
          payload: { type: 'ui_client', capabilities: ['timeline_sync'] },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'BROADCAST_EVENT') {
          const { event: evType } = msg.payload;
          if (evType === 'record_updated' || evType === 'record_created') {
            console.log('Real-time Timeline Update Received:', evType);
            fetchMacro(); // Refresh UI instantly
          }
        }
      } catch (e) {
        console.error('Relay msg error', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [fetchMacro]);

  const updateRecord = async (recordId: string, patch: any) => {
    try {
      await timelineApi.updateRecordTimeline(recordId, patch);
      await fetchMacro(); // Refresh
    } catch (err) {
      console.error('Failed to update record', err);
    }
  };

  return {
    data,
    loading,
    error,
    refresh: fetchMacro,
    updateRecord,
  };
};
