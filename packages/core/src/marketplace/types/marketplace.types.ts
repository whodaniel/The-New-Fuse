import { IntegrationType } from '@the-new-fuse/api-client/src/integrations/types';

export enum MarketplaceItemType {
  INTEGRATION = 'integration',
  WORKFLOW_TEMPLATE = 'workflow_template',
  MICROSERVICE = 'microservice',
  AGENT = 'agent'
}

export enum PricingModel {
  FREE = 'free',
  ONE_TIME = 'one_time',
  SUBSCRIPTION = 'subscription',
  USAGE_BASED = 'usage_based'
}

export interface PricingTier {
  name: string;
  price: number;
  billingPeriod?: 'monthly' | 'yearly';
  features: string[];
  limits?: Record<string, number>;
}

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  name: string;
  description: string;
  version: string;
  author: {
    id: string;
    name: string;
    verified: boolean;
  };
  integrationId?: string;
  integrationType?: IntegrationType;
  category: string;
  tags: string[];
  pricing: {
    model: PricingModel;
    tiers?: PricingTier[];
    trialDays?: number;
  };
  requirements?: {
    minimumVersion?: string;
    dependencies?: string[];
    permissions?: string[];
  };
  documentation: {
    overview: string;
    setup?: string;
    usage: string;
    examples?: string[];
  };
  assets?: {
    icon?: string;
    screenshots?: string[];
    video?: string;
  };
  stats: {
    installCount: number;
    rating: number;
    reviewCount: number;
  };
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}