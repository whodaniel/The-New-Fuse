import { z } from 'zod';

export interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    schema?: Record<string, any>;
  }>;
  responses: Record<string, {
    description: string;
    schema: Record<string, any>;
  }>;
  authentication?: 'none' | 'apiKey' | 'oauth2' | 'jwt';
  rate_limit?: {
    requests: number;
    period: number;
  };
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  type: 'header' | 'query';
  prefix?: string;
  expiration?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retries: number;
  created_at: string;
}

export interface RequestVolume {
  timestamp: string;
  requests: number;
}

export interface ResponseTime {
  timestamp: string;
  duration: number;
}

export interface StatusCode {
  status: string;
  count: number;
}

export interface EndpointUsage {
  endpoint: string;
  requests: number;
}

export interface APIUsageData {
  requestVolume: RequestVolume[];
  responseTimes: ResponseTime[];
  statusCodes: Record<string, number>;
  endpointUsage: EndpointUsage[];
  totalRequests: number;
}

// Zod schemas for runtime validation
export const endpointSchema = z.object({
  id: z.string(),
  name: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
  description: z.string(),
  parameters: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
      required: z.boolean(),
      description: z.string(),
      schema: z.record(z.any()).optional(),
    })
  ),
  responses: z.record(
    z.object({
      description: z.string(),
      schema: z.record(z.any()),
    })
  ),
  authentication: z.enum(['none', 'apiKey', 'oauth2', 'jwt']).optional(),
  rate_limit: z.object({
    requests: z.number(),
    period: z.number(),
  }).optional(),
});

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  type: z.enum(['header', 'query']),
  prefix: z.string().optional(),
  expiration: z.string().datetime().optional(),
});

export const webhookSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
  active: z.boolean(),
  retries: z.number(),
  created_at: z.string().datetime(),
});

export const apiUsageDataSchema = z.object({
  requestVolume: z.array(
    z.object({
      timestamp: z.string(),
      requests: z.number(),
    })
  ),
  responseTimes: z.array(
    z.object({
      timestamp: z.string(),
      duration: z.number(),
    })
  ),
  statusCodes: z.record(z.number()),
  endpointUsage: z.array(
    z.object({
      endpoint: z.string(),
      requests: z.number(),
    })
  ),
  totalRequests: z.number(),
});