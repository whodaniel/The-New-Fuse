import { DataFetcherConfig, DataFetcherResponse } from './types';

export interface CacheConfig {
  key?: string;
  ttl?: number;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export type DataTransformer<S = any, T = any> = (data: S) => T | Promise<T>;

export class DataFetcher {
  private cache: Map<string, CacheEntry> = new Map();
  private fetchQueue: Map<string, Promise<any>> = new Map();

  public async fetch<T = any>(
    config: DataFetcherConfig,
    cacheConfig?: CacheConfig,
    transformer?: DataTransformer<any, T>
  ): Promise<DataFetcherResponse<T>> {
    const cacheKey = cacheConfig?.key || this.createCacheKey(config);

    if (cacheConfig) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.expiresAt > Date.now()) {
        return {
          data: cachedData.data,
          timestamp: cachedData.timestamp,
          status: 200,
        };
      }
    }

    const pendingRequest = this.fetchQueue.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const request = this.executeFetch<T>(config, transformer).then((response) => {
      this.fetchQueue.delete(cacheKey);
      if (cacheConfig && response.status === 200) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: response.timestamp,
          expiresAt: Date.now() + (cacheConfig.ttl || 0),
        });
      }
      return response;
    });

    this.fetchQueue.set(cacheKey, request);
    return request;
  }

  private async executeFetch<T>(
    config: DataFetcherConfig,
    transformer?: DataTransformer<any, T>
  ): Promise<DataFetcherResponse<T>> {
    const { url, method = 'GET', headers, body, queryParams } = config;

    try {
      let fullUrl = url;
      if (queryParams) {
        const query = new URLSearchParams(queryParams).toString();
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + query;
      }

      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      let data = await response.json();
      if (transformer) {
        data = await transformer(data);
      }

      return {
        data,
        timestamp: Date.now(),
        status: response.status,
      };
    } catch (error) {
      return {
        data: null as any,
        error: error as Error,
        timestamp: Date.now(),
        status: 500,
      };
    }
  }

  private createCacheKey(config: DataFetcherConfig): string {
    return JSON.stringify({
      url: config.url,
      method: config.method,
      queryParams: config.queryParams,
      body: config.body,
    });
  }

  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
