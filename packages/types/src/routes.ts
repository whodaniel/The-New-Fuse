import type { DataMap } from './core/base-types.js';

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (params: RouteParams) => Promise<RouteResponse>;
  middleware?: RouteMiddleware[];
  validation?: RouteValidation;
}

export interface RouteParams {
  query?: DataMap;
  body?: unknown;
  params?: Record<string, string>;
}

export interface RouteResponse {
  status: number;
  data?: unknown;
  headers?: Record<string, string>;
}

export type RouteMiddleware = (params: RouteParams) => Promise<void>;

export interface RouteValidation {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
}
