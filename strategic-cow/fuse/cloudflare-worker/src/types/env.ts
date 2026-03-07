/**
 * Environment variables and bindings for Cloudflare Workers
 */

export interface Env {
  // Database and Storage
  DATABASE_URL: string;
  REDIS_URL: string;
  
  // API Keys and Secrets
  STRIPE_WEBHOOK_SECRET: string;
  PAYPAL_WEBHOOK_SECRET: string;
  SALESFORCE_WEBHOOK_SECRET: string;
  HUBSPOT_WEBHOOK_SECRET: string;
  NETSUITE_WEBHOOK_SECRET: string;
  
  // MCP Integration
  MCP_SERVER_URL: string;
  MCP_API_KEY: string;
  
  // Business Intelligence
  AI_API_KEY: string;
  AI_MODEL: string;
  
  // SSE Configuration
  SSE_REDIS_CHANNEL: string;
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  
  // Monitoring
  METRICS_ENDPOINT: string;
  LOGGING_LEVEL: string;
  
  // Security
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  
  // Cloudflare Bindings
  KV: KVNamespace;
  DO_BUSINESS_EVENTS: DurableObjectNamespace;
  
  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

export interface WorkerContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}