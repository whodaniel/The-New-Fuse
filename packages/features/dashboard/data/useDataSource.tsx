import { useCallback, useEffect, useRef, useState } from 'react';
import { DataFetcher } from './DataFetcher';
import { WebSocketConfig, WebSocketManager } from './WebSocketManager';

export interface DataSourceState {
  loading: boolean;
  error?: Error;
  lastUpdated?: number;
  nextUpdate?: number;
}

export interface UseDataSourceOptions<T = any, R = any> {
  type: 'rest' | 'websocket';
  config: any; // Could be DataFetcherConfig or WebSocketConfig
  cacheConfig?: any;
  transformer?: (data: T) => R;
  refreshInterval?: number;
  enabled?: boolean;
}

export function useDataSource<T = any, R = any>({
  type,
  config,
  cacheConfig,
  transformer,
  refreshInterval,
  enabled = true,
}: UseDataSourceOptions<T, R>) {
  const [state, setState] = useState<DataSourceState>({ loading: true });
  const [data, setData] = useState<R | null>(null);

  const dataFetcher = useRef(new DataFetcher());
  const wsManager = useRef<WebSocketManager | null>(null);
  const refreshTimeout = useRef<any>();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await dataFetcher.current.fetch(config, cacheConfig, transformer);

      setData(response.data);
      setState({
        loading: false,
        lastUpdated: response.timestamp || Date.now(),
        nextUpdate: refreshInterval ? Date.now() + refreshInterval : undefined,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error as Error,
        lastUpdated: Date.now(),
      });
    }
  }, [config, cacheConfig, transformer, refreshInterval, enabled]);

  const setupWebSocket = useCallback(() => {
    if (!enabled || type !== 'websocket') return () => {};

    if (!wsManager.current) {
      wsManager.current = new WebSocketManager(config as WebSocketConfig);
    }

    const unsubscribe = wsManager.current.subscribe({
      key: (config as any).channel || 'default',
      callback: (wsData) => {
        const transformedData = transformer ? transformer(wsData as T) : (wsData as R);
        setData(transformedData);
        setState({
          loading: false,
          lastUpdated: Date.now(),
        });
      },
      errorCallback: (error) => {
        setState({
          loading: false,
          error,
          lastUpdated: Date.now(),
        });
      },
    });

    return unsubscribe;
  }, [config, transformer, enabled, type]);

  useEffect(() => {
    if (type === 'rest') {
      fetchData();

      if (refreshInterval) {
        refreshTimeout.current = setInterval(fetchData, refreshInterval);
      }

      return () => {
        if (refreshTimeout.current) {
          clearInterval(refreshTimeout.current);
        }
      };
    } else {
      const unsubscribe = setupWebSocket();
      return () => {
        unsubscribe?.();
        wsManager.current?.disconnect();
      };
    }
  }, [type, fetchData, refreshInterval, setupWebSocket]);

  const refresh = useCallback(() => {
    if (type === 'rest') {
      fetchData();
    }
  }, [type, fetchData]);

  const send = useCallback(
    (data: any) => {
      if (type === 'websocket' && wsManager.current) {
        wsManager.current.send(data);
      }
    },
    [type]
  );

  return {
    data,
    ...state,
    refresh,
    send,
  };
}
