/**
 * Business Event Types and Interfaces
 * Based on the architectural plan specifications
 */

export interface BusinessEvent {
  id: string;
  type: BusinessEventType;
  source: IntegrationSource;
  timestamp: Date;
  data: Record<string, any>;
  metadata: EventMetadata;
  processing_status: ProcessingStatus;
}

export enum BusinessEventType {
  LEAD_CREATED = 'lead_created',
  PAYMENT_RECEIVED = 'payment_received',
  INVOICE_GENERATED = 'invoice_generated',
  WORKFLOW_TRIGGERED = 'workflow_triggered',
  CUSTOMER_UPDATED = 'customer_updated',
  PRODUCT_SOLD = 'product_sold',
  SUBSCRIPTION_CHANGED = 'subscription_changed'
}

export enum IntegrationSource {
  SALESFORCE = 'salesforce',
  HUBSPOT = 'hubspot',
  PIPEDRIVE = 'pipedrive',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  NETSUITE = 'netsuite',
  SAP = 'sap',
  QUICKBOOKS = 'quickbooks',
  ZAPIER = 'zapier',
  WORKATO = 'workato',
  POWER_AUTOMATE = 'power_automate'
}

export interface EventMetadata {
  correlation_id: string;
  user_id?: string;
  organization_id: string;
  priority: EventPriority;
  retry_count: number;
  max_retries: number;
}

export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

// Webhook payload interfaces for different sources
export interface SalesforceWebhookPayload {
  Id: string;
  ObjectType: 'Lead' | 'Opportunity' | 'Account' | 'Contact';
  EventType: 'created' | 'updated' | 'deleted';
  NewValue: Record<string, any>;
  OldValue?: Record<string, any>;
  EventDate: string;
}

export interface HubSpotWebhookPayload {
  objectId: number;
  propertyName?: string;
  propertyValue?: string;
  changeSource: string;
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
}

export interface StripeWebhookPayload {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: Record<string, any>;
    previous_attributes?: Record<string, any>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

export interface PayPalWebhookPayload {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  event_type: string;
  summary: string;
  resource: Record<string, any>;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface NetSuiteWebhookPayload {
  recordType: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: string;
  companyId: string;
  userId: string;
  data: Record<string, any>;
}

export interface ProcessingResult {
  eventId: string;
  status: ProcessingStatus;
  error?: string;
  retryAfter?: number;
}

// AI Insights Types
export interface AIInsight {
  type: InsightType;
  confidence: number;
  description: string;
  data: Record<string, any>;
  recommendations: string[];
  impact: ImpactLevel;
}

export enum InsightType {
  REVENUE_OPPORTUNITY = 'revenue_opportunity',
  CHURN_RISK = 'churn_risk',
  PROCESS_OPTIMIZATION = 'process_optimization',
  ANOMALY_DETECTION = 'anomaly_detection',
  CUSTOMER_BEHAVIOR = 'customer_behavior'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Analytics Types
export interface AnalyticsMetrics {
  totalEvents: number;
  eventsByType: Record<BusinessEventType, number>;
  eventsBySource: Record<IntegrationSource, number>;
  processingLatency: {
    avg: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  activeIntegrations: number;
  revenueMetrics: {
    totalRevenue: number;
    revenueBySource: Record<string, number>;
    conversionRate: number;
  };
}