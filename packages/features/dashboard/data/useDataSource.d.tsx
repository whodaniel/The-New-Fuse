import { DataFetcherConfig, WebSocketConfig, CacheConfig, DataTransformer } from './types.js';
interface UseDataSourceOptions<T = any, R = any> {
    type: rest' | 'websocket';
    config: DataFetcherConfig | WebSocketConfig;
    cacheConfig?: CacheConfig;
    transformer?: DataTransformer<T, R>;
    refreshInterval?: number;
    enabled?: boolean;
}
export declare function useDataSource<T = any, R = any>({ type, config, cacheConfig, transformer, refreshInterval, enabled, }: UseDataSourceOptions<T, R>): void;
export {};
