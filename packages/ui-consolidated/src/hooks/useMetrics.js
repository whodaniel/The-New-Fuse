import { useState, useEffect, useCallback, useRef } from 'react';
export function useMetrics(options = {}) {
    const { refreshInterval = 30000, autoRefresh = true, websocketUrl } = options;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const refreshTimeoutRef = useRef(null);
    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const resp = await fetch('/api/metrics');
            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }
            const json = await resp.json();
            setData(json);
        }
        catch (err) {
            setError(err.message || 'Failed to fetch metrics');
            console.error('Metrics fetch error:', err);
        }
        finally {
            setLoading(false);
        }
    }, []);
    const setupWebSocket = useCallback(() => {
        if (!websocketUrl)
            return;
        try {
            const ws = new WebSocket(websocketUrl);
            wsRef.current = ws;
            ws.onopen = () => {
                setIsConnected(true);
                console.log('Metrics WebSocket connected');
            };
            ws.onmessage = (event) => {
                try {
                    const update = JSON.parse(event.data);
                    if (update.type === 'metrics_update') {
                        setData(update.data);
                    }
                }
                catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };
            ws.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;
                // Reconnect after 5 seconds
                setTimeout(() => setupWebSocket(), 5000);
            };
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };
        }
        catch (err) {
            console.error('Failed to setup WebSocket:', err);
        }
    }, [websocketUrl]);
    const refresh = useCallback(async () => {
        await fetchMetrics();
    }, [fetchMetrics]);
    useEffect(() => {
        // Initial fetch
        fetchMetrics();
        // Setup WebSocket if URL provided
        if (websocketUrl) {
            setupWebSocket();
        }
        // Setup auto-refresh
        if (autoRefresh && refreshInterval > 0) {
            const scheduleRefresh = () => {
                refreshTimeoutRef.current = setTimeout(async () => {
                    await fetchMetrics();
                    scheduleRefresh();
                }, refreshInterval);
            };
            scheduleRefresh();
        }
        return () => {
            // Cleanup WebSocket
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            // Cleanup refresh timeout
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };
    }, [fetchMetrics, setupWebSocket, autoRefresh, refreshInterval, websocketUrl]);
    return { data, loading, error, refresh, isConnected };
}
//# sourceMappingURL=useMetrics.js.map