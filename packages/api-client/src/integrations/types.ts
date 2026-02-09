/**
 * Integration types
 */
export enum IntegrationType {
  AUTOMATION = 'automation',
  CRM = 'crm',
  ECOMMERCE = 'ecommerce',
  SOCIAL_MEDIA = 'social_media',
  AI = 'ai', // Added AI type
  // Add other types as needed
}

/**
 * Authentication types for integrations
 */
export enum AuthType {
  API_KEY = 'api_key',
  OAUTH1 = 'oauth1',
  OAUTH2 = 'oauth2',
  BASIC = 'basic',
  CUSTOM = 'custom',
  NONE = 'none'
}

/**
 * Base configuration for all integrations
 */
export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  baseUrl?: string;
  apiVersion?: string;
  authType?: AuthType | string;
  webhookSupport?: boolean;
  docUrl?: string;
  logoUrl?: string;
  defaultHeaders?: Record<string, string>;
  [key: string]: any;
}

/**
 * Base interface for all integrations
 */
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  config: IntegrationConfig;
  capabilities: {
    actions: string[];
    triggers?: string[];
    [key: string]: any;
  };
  isConnected: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  execute(action: string, params?: Record<string, any>): Promise<any>;
  getMetadata(): Promise<Record<string, any>>;
}

/**
 * Integration Registry interface
 */
export interface IntegrationRegistry {
  registerIntegration(integration: Integration): void;
  getIntegration(id: string): Integration | undefined;
  getIntegrations(): Integration[];
  getIntegrationsByType(type: IntegrationType): Integration[];
  removeIntegration(id: string): boolean;
  hasIntegration(id: string): boolean;
}

/**
 * Integration Listing for marketplace
 */
export interface IntegrationListing {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  logoUrl: string;
  category: string;
  author: string;
  version: string;
  pricing: {
    free: boolean;
    trialDays?: number;
    price?: number;
    currency?: string;
    billingPeriod?: 'monthly' | 'yearly' | 'one-time';
  };
  featured: boolean;
  popularity: number;
  rating: number;
  installCount: number;
  createdAt: Date;
  updatedAt: Date;
  screenshots?: string[];
  tags?: string[];
  requirements?: string[];
  dependencies?: string[];
  permissions?: string[];
}