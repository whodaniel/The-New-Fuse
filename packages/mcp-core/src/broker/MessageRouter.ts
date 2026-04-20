/**
 * Message Router Implementation
 * 
 * Handles routing of MCP requests to appropriate services with load balancing,
 * retry logic, and comprehensive error handling.
 */

import { EventEmitter } from 'events';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage.js';
import { IMessageRouter, EventCallback } from '../interfaces/IMessageRouter.js';
import { RoutingMetrics, RoutingInfo, MCPServiceInfo } from '../types/broker.js';
import { LoadBalancingStrategy } from '../types/common.js';
import { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode } from '../types/error.js';
import { LoadBalancer } from './LoadBalancer.js';
import { EventSubscriptionManager, EventMatchResult } from './EventSubscriptionManager.js';
import { MessageQueue, QueuedMessage } from './MessageQueue.js';

/**
 * Request tracking information
 */
interface RequestTracker {
  requestId: string | number;
  startTime: Date;
  targetService?: string;
  attempts: number;
  lastError?: string;
  reject: (reason?: any) => void; // Added for explicit promise rejection on router stop
}

/**
 * Message Router class for routing MCP requests
 */
export class MessageRouter extends EventEmitter implements IMessageRouter {
  private loadBalancer: LoadBalancer;
  private eventSubscriptionManager?: EventSubscriptionManager;
  private messageQueue: MessageQueue;
  private activeRequests: Map<string | number, RequestTracker> = new Map();
  private metrics: RoutingMetrics;
  private isStarted: boolean = false;

  constructor(
    loadBalancer: LoadBalancer, 
    eventSubscriptionManager?: EventSubscriptionManager,
    messageQueue?: MessageQueue
  ) {
    super();
    this.loadBalancer = loadBalancer;
    this.eventSubscriptionManager = eventSubscriptionManager;
    this.messageQueue = messageQueue || new MessageQueue();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Start the message router
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    if (this.eventSubscriptionManager) {
      await this.eventSubscriptionManager.start();
    }

    await this.messageQueue.start();

    this.isStarted = true;
    console.log('Message router started');
  }

  /**
   * Stop the message router
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    // Cancel all active requests
    for (const [requestId, tracker] of this.activeRequests.entries()) {
      // Reject pending requests with a cancellation error
      tracker.reject(new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Request ${requestId} cancelled: Message router stopped`
      ));
      this.emit('requestCancelled', requestId, tracker);
    }
    this.activeRequests.clear();

    if (this.eventSubscriptionManager) {
      await this.eventSubscriptionManager.stop();
    }

    await this.messageQueue.stop();

    this.isStarted = false;
    console.log('Message router stopped');
  }

  /**
   * Route a request to an appropriate service
   */
  async routeRequest(
    request: MCPRequest, 
    routing?: RoutingInfo
  ): Promise<MCPResponse> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Message router is not started'
      );
    }

    return new Promise<MCPResponse>(async (resolve, reject) => {
      if (!this.isStarted) {
        reject(new MCPErrorClass(
          MCPErrorCode.SERVICE_UNAVAILABLE, // This is correct, router not started is a service issue
          'Message router is not started'
        ));
        return;
      }

      const requestId = request.id;
      const startTime = new Date();
      const targetService = routing?.targetService;

      // Create request tracker with reject function
      const tracker: RequestTracker = {
        requestId,
        startTime,
        targetService,
        attempts: 0,
        reject: reject // Store the reject function of this promise
      };

      this.activeRequests.set(requestId, tracker);

      try {
        // Update metrics
        this.metrics.totalRequests++;
        this.metrics.activeConnections++;

        // Route the request
        const response = await this.performRouting(request, targetService, routing, tracker);

        // Update success metrics
        this.metrics.successfulRequests++;
        const responseTime = Date.now() - startTime.getTime();
        this.updateResponseTimeMetrics(responseTime);

        resolve(response);
      } catch (error) {
        // Update failure metrics
        this.metrics.failedRequests++;
        
        if (error instanceof MCPErrorClass) {
          reject(error);
        } else {
          reject(new MCPErrorClass(
            JSONRPCErrorCode.INTERNAL_ERROR,
            `Request routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          ));
        }
      } finally {
        // Clean up request tracker
        this.activeRequests.delete(requestId);
        this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
      }
    });
  }

  /**
   * Broadcast a notification to all services
   */
  async broadcastNotification(notification: MCPNotification): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Message router is not started'
      );
    }

    const services = this.loadBalancer.getAllServices();
    const promises = services.map(async (serviceInstance) => {
      try {
        await this.sendNotificationToService(notification, serviceInstance.service.id);
      } catch (error) {
        console.error(`Failed to send notification to service ${serviceInstance.service.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Route a notification to subscribed services based on pattern matching
   */
  async routeNotification(notification: MCPNotification): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Message router is not started'
      );
    }

    // If no event subscription manager or it's not started, fall back to broadcast
    if (!this.eventSubscriptionManager || !this.eventSubscriptionManager['isStarted']) {
      await this.broadcastNotification(notification);
      return;
    }

    // Find matching subscriptions
    const matchResults = this.eventSubscriptionManager.findMatchingSubscriptions(
      notification.method,
      notification.params
    );

    if (matchResults.length === 0) {
      console.log(`No subscriptions found for event: ${notification.method}`);
      return;
    }

    // Send notification to matching services
    const promises = matchResults.map(async (matchResult) => {
      try {
        await this.sendNotificationToService(notification, matchResult.subscription.serviceId);
        this.emit('notificationRouted', {
          notification,
          subscription: matchResult.subscription,
          matchResult
        });
      } catch (error) {
        console.error(
          `Failed to send notification to subscribed service ${matchResult.subscription.serviceId}:`,
          error
        );
      }
    });

    await Promise.allSettled(promises);
    
    console.log(`Notification ${notification.method} routed to ${matchResults.length} subscribed services`);
  }

  /**
   * Get routing metrics
   */
  getMetrics(): RoutingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get routing metrics (interface method)
   */
  getRoutingMetrics(): RoutingMetrics {
    return this.getMetrics();
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Get event subscription manager
   */
  getEventSubscriptionManager(): EventSubscriptionManager | undefined {
    return this.eventSubscriptionManager;
  }

  /**
   * Get message queue
   */
  getMessageQueue(): MessageQueue {
    return this.messageQueue;
  }

  /**
   * Process queued messages for a service when it comes online
   */
  async processQueuedMessages(serviceId: string): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    const queuedMessages = await this.messageQueue.dequeueMessagesForService(serviceId);
    
    if (queuedMessages.length === 0) {
      return;
    }

    console.log(`Processing ${queuedMessages.length} queued messages for service ${serviceId}`);

    for (const queuedMessage of queuedMessages) {
      try {
        await this.messageQueue.markMessageProcessing(queuedMessage.id);

        if (queuedMessage.type === 'request') {
          // Process queued request
          const request = queuedMessage.message as MCPRequest;
          try {
            await this.sendRequestToService(request, serviceId, 30000);
            await this.messageQueue.markMessageCompleted(queuedMessage.id);
          } catch (error) {
            await this.messageQueue.markMessageFailed(queuedMessage.id, error as Error);
          }
        } else {
          // Process queued notification
          const notification = queuedMessage.message as MCPNotification;
          try {
            await this.sendNotificationToService(notification, serviceId);
            await this.messageQueue.markMessageCompleted(queuedMessage.id);
          } catch (error) {
            await this.messageQueue.markMessageFailed(queuedMessage.id, error as Error);
          }
        }
      } catch (error) {
        console.error(`Failed to process queued message ${queuedMessage.id}:`, error);
      }
    }
  }

  /**
   * Queue a request for offline service
   */
  async queueRequest(
    request: MCPRequest,
    targetService: string,
    options?: {
      priority?: number;
      maxRetries?: number;
      timeoutMs?: number;
    }
  ): Promise<string> {
    return await this.messageQueue.enqueueMessage(targetService, request, options);
  }

  /**
   * Queue a notification for offline service
   */
  async queueNotification(
    notification: MCPNotification,
    targetService: string,
    options?: {
      priority?: number;
      maxRetries?: number;
      timeoutMs?: number;
    }
  ): Promise<string> {
    return await this.messageQueue.enqueueMessage(targetService, notification, options);
  }

  /**
   * Subscribe a service to events matching a pattern
   */
  async subscribeToEvents(
    serviceId: string,
    pattern: string,
    callback?: EventCallback
  ): Promise<string> {
    return this.subscribeToEventsAdvanced(serviceId, pattern, undefined, undefined, { callback });
  }

  /**
   * Subscribe a service to events matching a pattern (advanced version)
   */
  async subscribeToEventsAdvanced(
    serviceId: string,
    pattern: string,
    patternType?: import('./EventSubscriptionManager').PatternType,
    filters?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    if (!this.eventSubscriptionManager) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.METHOD_NOT_FOUND,
        'Event subscription is not available - no subscription manager configured'
      );
    }

    return await this.eventSubscriptionManager.subscribe(
      serviceId,
      pattern,
      patternType,
      filters,
      metadata
    );
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribeFromEvents(subscriptionId: string): Promise<void> {
    if (!this.eventSubscriptionManager) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.METHOD_NOT_FOUND,
        'Event subscription is not available - no subscription manager configured'
      );
    }

    await this.eventSubscriptionManager.unsubscribe(subscriptionId);
  }

  /**
   * Unsubscribe all subscriptions for a service
   */
  async unsubscribeService(serviceId: string): Promise<void> {
    if (!this.eventSubscriptionManager) {
      return; // Silently succeed if no subscription manager
    }

    await this.eventSubscriptionManager.unsubscribeService(serviceId);
  }

  /**
   * Perform the actual request routing with retry logic
   */
  private async performRouting(
    request: MCPRequest,
    targetService?: string,
    routingInfo?: RoutingInfo,
    tracker?: RequestTracker
  ): Promise<MCPResponse> {
    const maxAttempts = routingInfo?.retryPolicy?.maxAttempts || 3;
    const timeout = routingInfo?.timeout || 30000; // 30 seconds default
    
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (tracker) {
        tracker.attempts = attempt;
      }

      try {
        // Select target service
        let service: MCPServiceInfo | null = null;
        
        if (targetService) {
          // Find specific target service
          const allServices = this.loadBalancer.getAllServices();
          const serviceInstance = allServices.find(s => s.service.id === targetService);
          service = serviceInstance?.service || null;
        } else {
          // Use load balancer to select service
          service = this.loadBalancer.selectService(undefined, routingInfo?.loadBalancing);
        }

        if (!service) {
          // If no service is available, queue the request for later processing
          if (targetService) {
            console.log(`Service ${targetService} is offline, queuing request ${request.id}`);
            await this.queueRequest(request, targetService, {
              priority: routingInfo?.metadata?.priority || 5,
              maxRetries: routingInfo?.retryPolicy?.maxAttempts || 3,
              timeoutMs: routingInfo?.timeout || 300000
            });
            
            // Return a deferred response indicating the request was queued
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                status: 'queued',
                message: 'Request queued for offline service',
                targetService,
                timestamp: new Date().toISOString()
              }
            };
          } else {
            throw new MCPErrorClass(
              MCPErrorCode.SERVICE_UNAVAILABLE,
              'No available services for request routing'
            );
          }
        }

        // Update service distribution metrics
        this.updateServiceDistribution(service.id);

        // Increment connection count
        this.loadBalancer.incrementConnections(service.id);

        try {
          // Send request to service
          const response = await this.sendRequestToService(request, service.id, timeout);
          
          // Decrement connection count on success
          this.loadBalancer.decrementConnections(service.id);
          
          return response;
        } catch (error) {
          // Decrement connection count on error
          this.loadBalancer.decrementConnections(service.id);
          
          // Update error distribution
          this.updateErrorDistribution(service.id);
          
          throw error;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (tracker) {
          tracker.lastError = lastError.message;
        }

        // If this is the last attempt or a non-retryable error, throw
        if (attempt === maxAttempts || !this.isRetryableError(error)) {
          throw error;
        }

        // Wait before retry
        if (routingInfo?.retryPolicy) {
          const delay = this.calculateRetryDelay(attempt, routingInfo.retryPolicy);
          await this.sleep(delay);
        }
      }
    }

    // This should never be reached, but just in case
    throw lastError || new MCPErrorClass(JSONRPCErrorCode.INTERNAL_ERROR, 'Request routing failed after all attempts');
  }

  /**
   * Send request to a specific service
   */
  private async sendRequestToService(
    request: MCPRequest, 
    serviceId: string, 
    timeout: number
  ): Promise<MCPResponse> {
    // This is a placeholder implementation
    // In a real implementation, this would use the actual MCP client to send the request
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new MCPErrorClass(MCPErrorCode.CONNECTION_TIMEOUT, `Request timeout after ${timeout}ms`));
      }, timeout);

      // Simulate request processing
      setTimeout(() => {
        clearTimeout(timeoutId);
        
        // Simulate occasional failures for testing
        if (Math.random() < 0.1) { // 10% failure rate
          reject(new MCPErrorClass(JSONRPCErrorCode.INTERNAL_ERROR, 'Simulated service error'));
          return;
        }

        // Return successful response
        resolve({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            serviceId,
            method: request.method,
            timestamp: new Date().toISOString()
          }
        });
      }, Math.random() * 100 + 50); // 50-150ms response time
    });
  }

  /**
   * Send notification to a specific service
   */
  private async sendNotificationToService(
    notification: MCPNotification, 
    serviceId: string
  ): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, this would use the actual MCP client to send the notification
    
    return new Promise((resolve, reject) => {
      // Simulate notification sending
      setTimeout(() => {
        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
          reject(new Error('Simulated notification failure'));
          return;
        }
        
        resolve();
      }, Math.random() * 50 + 10); // 10-60ms processing time
    });
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof MCPErrorClass) {
      return error.retryable;
    }
    
    // All other errors (including generic ones not instances of MCPErrorClass) are retryable by default
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, retryPolicy: any): number {
    const baseDelay = retryPolicy.initialDelay || 1000;
    const maxDelay = retryPolicy.maxDelay || 30000;
    const multiplier = retryPolicy.backoffMultiplier || 2;
    const jitter = retryPolicy.jitter || 0.1;

    let delay = baseDelay * Math.pow(multiplier, attempt - 1);
    delay = Math.min(delay, maxDelay);

    // Add jitter
    if (jitter > 0) {
      const jitterAmount = delay * jitter * (Math.random() * 2 - 1);
      delay += jitterAmount;
    }

    return Math.max(delay, 0);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): RoutingMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
      activeConnections: 0,
      serviceDistribution: {},
      errorDistribution: {}
    };
  }

  /**
   * Update response time metrics
   */
  private updateResponseTimeMetrics(responseTime: number): void {
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    if (totalRequests > 1) {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    } else {
      this.metrics.averageResponseTime = responseTime;
    }
  }

  /**
   * Update service distribution metrics
   */
  private updateServiceDistribution(serviceId: string): void {
    this.metrics.serviceDistribution[serviceId] = 
      (this.metrics.serviceDistribution[serviceId] || 0) + 1;
  }

  /**
   * Update error distribution metrics
   */
  private updateErrorDistribution(serviceId: string): void {
    this.metrics.errorDistribution[serviceId] = 
      (this.metrics.errorDistribution[serviceId] || 0) + 1;
  }
}