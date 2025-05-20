import type { JsonValue } from './core/base-types.js';

export interface ServiceConfig {
  enabled: boolean;
  options?: Record<string, JsonValue>;
}

export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp: Date;
}

export interface ServiceDependency {
  name: string;
  version: string;
  status: 'active' | 'inactive';
}

// Export common service interfaces
export interface BaseService {
  start(): Promise<void>;
  stop(): Promise<void>;
  getHealth(): Promise<ServiceHealth>;
  getMetrics(): Promise<ServiceMetrics>;
  getDependencies(): Promise<ServiceDependency[]>;
}