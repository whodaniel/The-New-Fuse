import { timelineApi } from '@/api/timeline';
import { useCallback, useEffect, useRef, useState } from 'react';

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

    // Relay for live timeline updates (env override, local default)
    const relayUrl =
      String(import.meta.env.VITE_TIMELINE_RELAY_WS_URL || '').trim() || 'ws://127.0.0.1:3000/ws';

    if (typeof WebSocket === 'undefined') {
      console.warn('WebSocket is not available in this runtime');
      return;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(relayUrl);
    } catch (e) {
      console.warn('Failed to initialize timeline relay websocket', e);
      return;
    }

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
