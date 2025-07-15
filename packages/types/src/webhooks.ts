// Core Business Event Types
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

// Webhook Configuration Types
export interface WebhookConfiguration {
  id: string;
  organization_id: string;
  source: IntegrationSource;
  endpoint_url: string;
  secret_key: string;
  is_active: boolean;
  configuration: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookSecurityConfig {
  signatureHeader: string;
  secret: string;
  algorithm: 'sha256' | 'sha1';
  tolerance: number; // seconds
}

// Integration-specific payload types
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

export interface PipedriveWebhookPayload {
  v: number;
  matches_filters: {
    current: number[];
    previous: number[];
  };
  meta: {
    v: number;
    object: string;
    action: string;
    id: number;
    company_id: number;
    user_id: number;
    host: string;
    timestamp: number;
    timestamp_micro: number;
    permitted_user_ids: number[];
    trans_pending: boolean;
    is_bulk_update: boolean;
  };
  current: Record<string, any>;
  previous?: Record<string, any>;
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

export interface ZapierWebhookPayload {
  zap_id: string;
  trigger_id: string;
  data: Record<string, any>;
  timestamp: string;
  user_id: string;
}

// SSE Types
export interface SSEClient {
  id: string;
  userId: string;
  organizationId: string;
  subscriptions: EventSubscription[];
  response: Response;
  lastHeartbeat: Date;
}

export interface EventSubscription {
  eventTypes: BusinessEventType[];
  filters: Record<string, any>;
  priority: EventPriority;
}

export interface SSEEvent {
  type: string;
  data: any;
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

// API Types
export interface WebhookRegistrationRequest {
  source: IntegrationSource;
  endpoint_url: string;
  secret_key: string;
  configuration: Record<string, any>;
  organization_id?: string;
}

export interface WebhookRegistrationResponse {
  id: string;
  status: 'registered' | 'error';
  webhook_url: string;
}

export interface WebhookEventResponse {
  received: boolean;
  event_id?: string;
}

export interface WebhookStatusResponse {
  id: string;
  status: 'active' | 'inactive' | 'error';
  last_received: string;
  event_count: number;
}

export interface EventHistoryRequest {
  start_date: string;
  end_date: string;
  event_types?: string;
  limit?: number;
}

export interface EventHistoryResponse {
  events: BusinessEvent[];
  total: number;
  has_more: boolean;
}

// Webhook Delivery Types
export interface WebhookDeliveryLog {
  id: string;
  webhook_config_id: string;
  event_id: string;
  delivery_status: DeliveryStatus;
  http_status?: number;
  response_body?: string;
  error_message?: string;
  attempt_count: number;
  delivered_at?: Date;
  created_at: Date;
}

export enum DeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

// Service Interfaces
export interface WebhookService {
  registerWebhook(request: WebhookRegistrationRequest): Promise<WebhookRegistrationResponse>;
  handleWebhook(source: IntegrationSource, payload: any, signature: string): Promise<WebhookEventResponse>;
  getWebhookStatus(id: string): Promise<WebhookStatusResponse>;
  validateSignature(payload: string, signature: string, config: WebhookSecurityConfig): Promise<boolean>;
}

export interface BusinessEventService {
  createEvent(event: Omit<BusinessEvent, 'id' | 'timestamp'>): Promise<BusinessEvent>;
  processEvent(eventId: string): Promise<void>;
  getEventHistory(organizationId: string, request: EventHistoryRequest): Promise<EventHistoryResponse>;
  retryFailedEvent(eventId: string): Promise<void>;
}

export interface SSEService {
  addClient(client: SSEClient): Promise<void>;
  removeClient(clientId: string): Promise<void>;
  broadcastEvent(event: BusinessEvent): Promise<void>;
  sendToClient(clientId: string, event: SSEEvent): Promise<void>;
}

export interface AnalyticsService {
  generateMetrics(organizationId: string, timeRange: string): Promise<AnalyticsMetrics>;
  streamMetrics(organizationId: string): Promise<ReadableStream>;
  recordMetric(organizationId: string, metricType: string, value: number, dimensions?: Record<string, any>): Promise<void>;
}