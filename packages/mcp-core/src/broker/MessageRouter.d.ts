/**
 * Message Router Implementation
 *
 * Handles routing of MCP requests to appropriate services with load balancing,
 * retry logic, and comprehensive error handling.
 */
import { EventEmitter } from 'events';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage';
import { IMessageRouter, EventCallback } from '../interfaces/IMessageRouter';
import { RoutingMetrics, RoutingInfo } from '../types/broker';
import { LoadBalancer } from './LoadBalancer';
import { EventSubscriptionManager } from './EventSubscriptionManager';
import { MessageQueue } from './MessageQueue';
/**
 * Message Router class for routing MCP requests
 */
export declare class MessageRouter extends EventEmitter implements IMessageRouter {
    private loadBalancer;
    private eventSubscriptionManager?;
    private messageQueue;
    private activeRequests;
    private metrics;
    private isStarted;
    constructor(loadBalancer: LoadBalancer, eventSubscriptionManager?: EventSubscriptionManager, messageQueue?: MessageQueue);
    /**
     * Start the message router
     */
    start(): Promise<void>;
    /**
     * Stop the message router
     */
    stop(): Promise<void>;
    /**
     * Route a request to an appropriate service
     */
    routeRequest(request: MCPRequest, routing?: RoutingInfo): Promise<MCPResponse>;
    /**
     * Broadcast a notification to all services
     */
    broadcastNotification(notification: MCPNotification): Promise<void>;
    /**
     * Route a notification to subscribed services based on pattern matching
     */
    routeNotification(notification: MCPNotification): Promise<void>;
    /**
     * Get routing metrics
     */
    getMetrics(): RoutingMetrics;
    /**
     * Get routing metrics (interface method)
     */
    getRoutingMetrics(): RoutingMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Get active request count
     */
    getActiveRequestCount(): number;
    /**
     * Get event subscription manager
     */
    getEventSubscriptionManager(): EventSubscriptionManager | undefined;
    /**
     * Get message queue
     */
    getMessageQueue(): MessageQueue;
    /**
     * Process queued messages for a service when it comes online
     */
    processQueuedMessages(serviceId: string): Promise<void>;
    /**
     * Queue a request for offline service
     */
    queueRequest(request: MCPRequest, targetService: string, options?: {
        priority?: number;
        maxRetries?: number;
        timeoutMs?: number;
    }): Promise<string>;
    /**
     * Queue a notification for offline service
     */
    queueNotification(notification: MCPNotification, targetService: string, options?: {
        priority?: number;
        maxRetries?: number;
        timeoutMs?: number;
    }): Promise<string>;
    /**
     * Subscribe a service to events matching a pattern
     */
    subscribeToEvents(serviceId: string, pattern: string, callback?: EventCallback): Promise<string>;
    /**
     * Subscribe a service to events matching a pattern (advanced version)
     */
    subscribeToEventsAdvanced(serviceId: string, pattern: string, patternType?: import('./EventSubscriptionManager').PatternType, filters?: Record<string, any>, metadata?: Record<string, any>): Promise<string>;
    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvents(subscriptionId: string): Promise<void>;
    /**
     * Unsubscribe all subscriptions for a service
     */
    unsubscribeService(serviceId: string): Promise<void>;
    /**
     * Perform the actual request routing with retry logic
     */
    private performRouting;
    /**
     * Send request to a specific service
     */
    private sendRequestToService;
    /**
     * Send notification to a specific service
     */
    private sendNotificationToService;
    /**
     * Check if an error is retryable
     */
    private isRetryableError;
    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Initialize metrics object
     */
    private initializeMetrics;
    /**
     * Update response time metrics
     */
    private updateResponseTimeMetrics;
    /**
     * Update service distribution metrics
     */
    private updateServiceDistribution;
    /**
     * Update error distribution metrics
     */
    private updateErrorDistribution;
}
//# sourceMappingURL=MessageRouter.d.ts.map