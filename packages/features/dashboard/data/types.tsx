export interface DataFetcherConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface DataFetcherResponse<T = any> {
  data: T;
  error?: Error;
  timestamp: number;
  status: number;
  headers?: Record<string, string>;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxRetries?: number;
}
