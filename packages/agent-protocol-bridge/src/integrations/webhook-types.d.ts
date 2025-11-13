/**
 * Webhook System Integration Types
 *
 * Comprehensive type definitions for webhook-based event delivery
 * and integration with The New Fuse AI Agent framework.
 */
import { NamedEntity } from '../types/common-types';
export interface WebhookConfiguration extends NamedEntity {
    agentId?: string;
    userId: string;
    organizationId?: string;
    url: string;
    method: WebhookMethod;
    eventTypes: string[];
    eventFilters?: Record<string, any>;
    authentication: WebhookAuthentication;
    authConfig?: {
        token?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        signatureSecret?: string;
        customHeaders?: Record<string, string>;
    };
    deliveryConfig: {
        timeout: number;
        retryAttempts: number;
        retryDelay: number;
        retryBackoff: WebhookRetryBackoff;
        includeMetadata: boolean;
        batchDelivery: boolean;
        batchSize?: number;
        batchTimeout?: number;
    };
    contentType: string;
    payloadTemplate?: string;
    customHeaders?: Record<string, string>;
    verifySSL: boolean;
    allowedIPs?: string[];
    rateLimiting?: {
        maxRequestsPerMinute: number;
        maxRequestsPerHour: number;
    };
    isActive: boolean;
    status: WebhookStatus;
    lastDeliveryAt?: Date;
    successCount: number;
    failureCount: number;
    deliveryLogs: WebhookDeliveryLog[];
}
export interface WebhookDeliveryLog {
    id: string;
    webhookId: string;
    eventId: string;
    eventType: string;
    eventData: Record<string, any>;
    status: WebhookDeliveryStatus;
    responseCode?: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    sentAt: Date;
    responseAt?: Date;
    duration?: number;
    attemptNumber: number;
    isRetry: boolean;
    retryOf?: string;
    nextRetryAt?: Date;
    error?: string;
    errorCode?: string;
    errorDetails?: Record<string, any>;
}
export interface WebhookEvent {
    id: string;
    type: string;
    source: string;
    data: Record<string, any>;
    timestamp: Date;
    organizationId?: string;
    userId?: string;
    agentId?: string;
    priority: WebhookPriority;
    ttl?: number;
    correlationId?: string;
    causedBy?: string;
    deliveredTo: string[];
    attempts: number;
    maxAttempts: number;
    lastAttemptAt?: Date;
}
export declare enum WebhookMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE"
}
export declare enum WebhookAuthentication {
    NONE = "NONE",
    BEARER_TOKEN = "BEARER_TOKEN",
    BASIC_AUTH = "BASIC_AUTH",
    API_KEY = "API_KEY",
    SIGNATURE = "SIGNATURE"
}
export declare enum WebhookRetryBackoff {
    LINEAR = "LINEAR",
    EXPONENTIAL = "EXPONENTIAL",
    FIXED = "FIXED"
}
export declare enum WebhookStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ERROR = "ERROR",
    SUSPENDED = "SUSPENDED"
}
export declare enum WebhookDeliveryStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    RETRYING = "RETRYING",
    CANCELLED = "CANCELLED"
}
export declare enum WebhookPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export interface WebhookManager {
    /**
     * Create a new webhook configuration
     */
    createWebhook(config: Omit<WebhookConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'deliveryLogs'>): Promise<WebhookConfiguration>;
    /**
     * Update webhook configuration
     */
    updateWebhook(id: string, updates: Partial<WebhookConfiguration>): Promise<WebhookConfiguration>;
    /**
     * Delete webhook configuration
     */
    deleteWebhook(id: string): Promise<boolean>;
    /**
     * Get webhook by ID
     */
    getWebhook(id: string): Promise<WebhookConfiguration | null>;
    /**
     * List webhooks for user/agent/organization
     */
    listWebhooks(filters: {
        userId?: string;
        agentId?: string;
        organizationId?: string;
        eventType?: string;
        status?: WebhookStatus;
    }): Promise<WebhookConfiguration[]>;
    /**
     * Deliver event to webhooks
     */
    deliverEvent(event: WebhookEvent): Promise<WebhookDeliveryResult[]>;
    /**
     * Test webhook endpoint
     */
    testWebhook(webhookId: string, testPayload?: Record<string, any>): Promise<WebhookTestResult>;
    /**
     * Get webhook delivery history
     */
    getDeliveryHistory(webhookId: string, limit?: number, offset?: number, status?: WebhookDeliveryStatus): Promise<WebhookDeliveryLog[]>;
    /**
     * Retry failed delivery
     */
    retryDelivery(deliveryLogId: string): Promise<WebhookDeliveryLog>;
    /**
     * Get webhook metrics
     */
    getWebhookMetrics(webhookId: string): Promise<WebhookMetrics>;
    /**
     * Validate webhook URL
     */
    validateWebhookUrl(url: string): Promise<WebhookValidationResult>;
}
export interface WebhookDeliveryResult {
    webhookId: string;
    deliveryLogId: string;
    status: WebhookDeliveryStatus;
    statusCode?: number;
    error?: string;
    duration: number;
}
export interface WebhookTestResult {
    success: boolean;
    statusCode?: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    duration: number;
    error?: string;
}
export interface WebhookMetrics {
    webhookId: string;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    successRate: number;
    deliveriesToday: number;
    deliveriesThisWeek: number;
    deliveriesThisMonth: number;
    commonErrors: Array<{
        error: string;
        count: number;
        lastOccurred: Date;
    }>;
    responseTimePercentiles: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
    recentDeliveries: WebhookDeliveryLog[];
}
export interface WebhookValidationResult {
    isValid: boolean;
    isReachable: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
    warnings: string[];
}
export interface WebhookEventBuilder {
    /**
     * Create agent-related event
     */
    createAgentEvent(agentId: string, eventType: string, data: Record<string, any>, options?: {
        priority?: WebhookPriority;
        ttl?: number;
        correlationId?: string;
    }): WebhookEvent;
    /**
     * Create user-related event
     */
    createUserEvent(userId: string, eventType: string, data: Record<string, any>, options?: {
        priority?: WebhookPriority;
        ttl?: number;
        correlationId?: string;
    }): WebhookEvent;
    /**
     * Create system event
     */
    createSystemEvent(eventType: string, data: Record<string, any>, options?: {
        priority?: WebhookPriority;
        ttl?: number;
        correlationId?: string;
    }): WebhookEvent;
    /**
     * Create workflow event
     */
    createWorkflowEvent(workflowId: string, eventType: string, data: Record<string, any>, options?: {
        priority?: WebhookPriority;
        ttl?: number;
        correlationId?: string;
    }): WebhookEvent;
}
export interface WebhookSignature {
    /**
     * Generate webhook signature
     */
    generateSignature(payload: string, secret: string, algorithm?: 'sha256' | 'sha1'): string;
    /**
     * Verify webhook signature
     */
    verifySignature(payload: string, signature: string, secret: string, algorithm?: 'sha256' | 'sha1'): boolean;
}
export interface WebhookRetryStrategy {
    /**
     * Calculate next retry delay
     */
    calculateRetryDelay(attemptNumber: number, baseDelay: number, backoffType: WebhookRetryBackoff): number;
    /**
     * Determine if retry should be attempted
     */
    shouldRetry(attemptNumber: number, maxAttempts: number, error: Error, statusCode?: number): boolean;
    /**
     * Get retry configuration for error type
     */
    getRetryConfig(error: Error, statusCode?: number): {
        shouldRetry: boolean;
        delay: number;
        maxAttempts: number;
    };
}
//# sourceMappingURL=webhook-types.d.ts.map