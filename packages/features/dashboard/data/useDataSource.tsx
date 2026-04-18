import { useState, useEffect, useCallback, useRef } from 'react';
import { DataFetcher } from './DataFetcher.js';
import { WebSocketManager } from './WebSocketManager.js';
import {
  DataSourceState,
  DataFetcherConfig,
  WebSocketConfig,
  CacheConfig,
  DataTransformer,
} from './types.js';

interface UseDataSourceOptions<T = any, R = any> {
  type: 'rest' | 'websocket';
  config: DataFetcherConfig | WebSocketConfig;
  cacheConfig?: CacheConfig;
  transformer?: DataTransformer<T, R>;
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
  const refreshTimeout = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async (): Promise<void> => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await dataFetcher.current.fetch(
        config as DataFetcherConfig,
        cacheConfig,
        transformer
      );

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

    // Create WebSocket instance if not already created
    if (!wsManager.current) {
      wsManager.current = new WebSocketManager();
    }
    
    // Configure and connect
    wsManager.current.configure(config as WebSocketConfig);
    wsManager.current.connect();

    // Subscribe to data
    const unsubscribe = wsManager.current.subscribe({
      key: (config as WebSocketConfig).channel || 'default',
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
        wsManager.current?.close();
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
