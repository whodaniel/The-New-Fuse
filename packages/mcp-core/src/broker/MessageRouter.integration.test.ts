/**
 * MessageRouter Integration Tests
 * 
 * Comprehensive integration tests for advanced routing features including
 * event subscription, pattern matching, broadcast notifications, and
 * complex routing scenarios.
 */

// @ts-expect-error - Jest globals are available without import
import { MessageRouter } from './MessageRouter.js';
import { LoadBalancer } from './LoadBalancer.js';
import { EventSubscriptionManager, PatternType } from './EventSubscriptionManager.js';
import { MessageQueue } from './MessageQueue.js';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage.js';
import { MCPServiceInfo, RoutingInfo } from '../types/broker.js';
import { ServiceStatus, LoadBalancingStrategy } from '../types/common.js';
import { MCPErrorClass, MCPErrorCode } from '../types/error.js';

describe('MessageRouter Integration Tests', () => {
  let messageRouter: MessageRouter;
  let loadBalancer: LoadBalancer;
  let eventSubscriptionManager: EventSubscriptionManager;
  let messageQueue: MessageQueue;
  let mockServices: MCPServiceInfo[];

  beforeEach(async () => {
    // Create mock services
    mockServices = [
      {
        id: 'auth-service',
        name: 'Authentication Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3001',
        capabilities: ['authentication', 'user-management'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { region: 'us-east-1' },
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      },
      {
        id: 'data-service',
        name: 'Data Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3002',
        capabilities: ['database', 'analytics'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { region: 'us-west-2' },
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      },
      {
        id: 'notification-service',
        name: 'Notification Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3003',
        capabilities: ['notifications', 'email'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { region: 'eu-west-1' },
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      }
    ];

    // Create components
    loadBalancer = new LoadBalancer({
      defaultStrategy: LoadBalancingStrategy.ROUND_ROBIN,
      useHealthCheck: true,
      stickySession: false
    });

    eventSubscriptionManager = new EventSubscriptionManager();
    messageQueue = new MessageQueue();

    // Add services to load balancer
    mockServices.forEach(service => {
      loadBalancer.addService(service);
    });

    // Create message router with all components
    messageRouter = new MessageRouter(loadBalancer, eventSubscriptionManager, messageQueue);

    // Start all components
    await messageRouter.start();

    // Mock the actual message sending methods for testing
    messageRouter['sendRequestToService'] = jest.fn().mockImplementation(async (request, serviceId, timeout) => {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          serviceId,
          method: request.method,
          timestamp: new Date().toISOString(),
          processed: true
        }
      };
    });

    messageRouter['sendNotificationToService'] = jest.fn().mockImplementation(async (notification, serviceId) => {
      // Simulate successful notification delivery
      return Promise.resolve();
    });
  });

  afterEach(async () => {
    if (messageRouter) {
      await messageRouter.stop();
    }
  });

  describe('Event Subscription and Pattern Matching', () => {
    it('should route notifications to services with exact pattern matches', async () => {
      // Subscribe auth-service to user events
      await messageRouter.subscribeToEvents('auth-service', 'user.login');
      await messageRouter.subscribeToEvents('auth-service', 'user.logout');

      // Subscribe data-service to data events
      await messageRouter.subscribeToEvents('data-service', 'data.created');

      // Send user login notification
      const loginNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.login',
        params: { userId: '123', timestamp: new Date().toISOString() }
      };

      await messageRouter.routeNotification(loginNotification);

      // Verify notification was sent only to auth-service
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
        loginNotification,
        'auth-service'
      );
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(1);
    });

    it('should route notifications to services with wildcard pattern matches', async () => {
      // Subscribe notification-service to all user events using wildcard
      await messageRouter.subscribeToEventsAdvanced(
        'notification-service',
        'user.*',
        PatternType.WILDCARD
      );

      // Subscribe data-service to specific data events
      await messageRouter.subscribeToEvents('data-service', 'data.updated');

      // Send user registration notification
      const registrationNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.registered',
        params: { userId: '456', email: 'test@example.com' }
      };

      await messageRouter.routeNotification(registrationNotification);

      // Verify notification was sent only to notification-service (wildcard match)
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
        registrationNotification,
        'notification-service'
      );
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(1);
    });

    it('should route notifications to multiple services with overlapping subscriptions', async () => {
      // Multiple services subscribe to overlapping patterns
      await messageRouter.subscribeToEvents('auth-service', 'system.alert');
      await messageRouter.subscribeToEventsAdvanced(
        'notification-service',
        'system.*',
        PatternType.WILDCARD
      );
      await messageRouter.subscribeToEventsAdvanced(
        'data-service',
        'system.alert',
        PatternType.EXACT
      );

      // Send system alert notification
      const alertNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'system.alert',
        params: { level: 'critical', message: 'Database connection lost' }
      };

      await messageRouter.routeNotification(alertNotification);

      // Verify notification was sent to all matching services
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
        alertNotification,
        'auth-service'
      );
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
        alertNotification,
        'notification-service'
      );
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
        alertNotification,
        'data-service'
      );
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(3);
    });

    it('should handle subscription filters correctly', async () => {
      // Subscribe with filters
      await messageRouter.subscribeToEventsAdvanced(
        'auth-service',
        'user.action',
        PatternType.EXACT,
        { action: 'login', region: 'us-east-1' }
      );

      // Send matching notification
      const matchingNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.action',
        params: { action: 'login', region: 'us-east-1', userId: '123' }
      };

      await messageRouter.routeNotification(matchingNotification);

      // Send non-matching notification
      const nonMatchingNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.action',
        params: { action: 'logout', region: 'us-east-1', userId: '123' }
      };

      await messageRouter.routeNotification(nonMatchingNotification);

      // Verify only matching notification was routed
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
        matchingNotification,
        'auth-service'
      );
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(1);
    });
  });

  describe('Broadcast Notifications', () => {
    it('should broadcast notifications to all available services', async () => {
      const broadcastNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'system.shutdown',
        params: { reason: 'maintenance', scheduledTime: new Date().toISOString() }
      };

      await messageRouter.broadcastNotification(broadcastNotification);

      // Verify notification was sent to all services
      mockServices.forEach(service => {
        expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
          broadcastNotification,
          service.id
        );
      });
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(mockServices.length);
    });

    it('should handle partial failures in broadcast gracefully', async () => {
      // Mock one service to fail
      const originalSendNotification = messageRouter['sendNotificationToService'];
      messageRouter['sendNotificationToService'] = jest.fn().mockImplementation(async (notification, serviceId) => {
        if (serviceId === 'auth-service') {
          throw new Error('Service temporarily unavailable');
        }
        return Promise.resolve();
      });

      const broadcastNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'system.update',
        params: { version: '2.0.0' }
      };

      // Should not throw even if one service fails
      await expect(messageRouter.broadcastNotification(broadcastNotification)).resolves.toBeUndefined();

      // Verify all services were attempted
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(mockServices.length);
    });
  });

  describe('Complex Routing Scenarios', () => {
    it('should handle mixed request routing and notification routing', async () => {
      // Set up subscriptions
      await messageRouter.subscribeToEvents('notification-service', 'user.created');

      // Send a request
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'req-1',
        method: 'user.create',
        params: { name: 'John Doe', email: 'john@example.com' }
      };

      const routingInfo: RoutingInfo = {
        targetService: 'auth-service'
      };

      const response = await messageRouter.routeRequest(request, routingInfo);

      // Send a related notification
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.created',
        params: { userId: '789', name: 'John Doe' }
      };

      await messageRouter.routeNotification(notification);

      // Verify both operations completed successfully
      expect(response.result.serviceId).toBe('auth-service');
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(
        notification,
        'notification-service'
      );
    });

    it('should handle load balancing with service failures and recovery', async () => {
      // Mock service failures
      let failureCount = 0;
      messageRouter['sendRequestToService'] = jest.fn().mockImplementation(async (request, serviceId, timeout) => {
        if (serviceId === 'auth-service' && failureCount < 2) {
          failureCount++;
          throw new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'Service temporarily unavailable');
        }
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { serviceId, processed: true }
        };
      });

      const requests = [
        { jsonrpc: '2.0', id: 'req-1', method: 'test', params: {} },
        { jsonrpc: '2.0', id: 'req-2', method: 'test', params: {} },
        { jsonrpc: '2.0', id: 'req-3', method: 'test', params: {} }
      ] as MCPRequest[];

      const routingInfo: RoutingInfo = {
        retryPolicy: {
          maxAttempts: 3,
          initialDelay: 10,
          backoffMultiplier: 2,
          maxDelay: 1000
        }
      };

      // Send requests
      const responses = await Promise.all(
        requests.map(req => messageRouter.routeRequest(req, routingInfo))
      );

      // Verify all requests eventually succeeded
      responses.forEach(response => {
        expect(response.result.processed).toBe(true);
      });

      // Verify metrics tracked the failures and retries
      const metrics = messageRouter.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successfulRequests).toBe(3);
    });

    it('should handle message queuing for offline services', async () => {
      // Remove a service to simulate it going offline
      loadBalancer.removeService('data-service');

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'queued-req',
        method: 'data.process',
        params: { data: 'test data' }
      };

      const routingInfo: RoutingInfo = {
        targetService: 'data-service'
      };

      // Request should be queued since service is offline
      const response = await messageRouter.routeRequest(request, routingInfo);

      expect(response.result.status).toBe('queued');
      expect(response.result.targetService).toBe('data-service');

      // Verify message was added to queue
      const queueStats = messageRouter.getMessageQueue().getStatistics();
      expect(queueStats.totalMessages).toBe(1);
      expect(queueStats.messagesByService['data-service']).toBe(1);
    });

    it('should process queued messages when service comes back online', async () => {
      // Queue some messages for offline service
      const queuedMessages = [
        { jsonrpc: '2.0', id: 'q1', method: 'process', params: { id: 1 } },
        { jsonrpc: '2.0', id: 'q2', method: 'process', params: { id: 2 } }
      ] as MCPRequest[];

      for (const msg of queuedMessages) {
        await messageRouter.queueRequest(msg, 'data-service');
      }

      // Verify messages are queued
      let queueStats = messageRouter.getMessageQueue().getStatistics();
      expect(queueStats.totalMessages).toBe(2);

      // Bring service back online
      const dataService = mockServices.find(s => s.id === 'data-service')!;
      loadBalancer.addService(dataService);

      // Process queued messages
      await messageRouter.processQueuedMessages('data-service');

      // Verify messages were processed
      queueStats = messageRouter.getMessageQueue().getStatistics();
      expect(queueStats.totalMessages).toBe(0); // All messages should be processed

      // Verify sendRequestToService was called for each queued message
      expect(messageRouter['sendRequestToService']).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Metrics', () => {
    it('should collect comprehensive routing metrics', async () => {
      // Send various types of requests
      const requests = [
        { jsonrpc: '2.0', id: 'perf-1', method: 'auth.login', params: {} },
        { jsonrpc: '2.0', id: 'perf-2', method: 'data.query', params: {} },
        { jsonrpc: '2.0', id: 'perf-3', method: 'notify.send', params: {} }
      ] as MCPRequest[];

      // Route requests to different services
      await messageRouter.routeRequest(requests[0], { targetService: 'auth-service' });
      await messageRouter.routeRequest(requests[1], { targetService: 'data-service' });
      await messageRouter.routeRequest(requests[2], { targetService: 'notification-service' });

      // Send some notifications
      await messageRouter.broadcastNotification({
        jsonrpc: '2.0',
        method: 'system.heartbeat',
        params: {}
      });

      // Check metrics
      const metrics = messageRouter.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successfulRequests).toBe(3);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.serviceDistribution['auth-service']).toBe(1);
      expect(metrics.serviceDistribution['data-service']).toBe(1);
      expect(metrics.serviceDistribution['notification-service']).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should track subscription statistics', async () => {
      // Create various subscriptions
      await messageRouter.subscribeToEvents('auth-service', 'user.login');
      await messageRouter.subscribeToEventsAdvanced('notification-service', 'user.*', PatternType.WILDCARD);
      await messageRouter.subscribeToEventsAdvanced('data-service', 'data.created', PatternType.EXACT);

      // Send notifications to trigger matches
      await messageRouter.routeNotification({
        jsonrpc: '2.0',
        method: 'user.login',
        params: {}
      });

      await messageRouter.routeNotification({
        jsonrpc: '2.0',
        method: 'user.logout',
        params: {}
      });

      // Check subscription statistics
      const subscriptionManager = messageRouter.getEventSubscriptionManager();
      const stats = subscriptionManager?.getStatistics();

      expect(stats?.totalSubscriptions).toBe(3);
      expect(stats?.activeSubscriptions).toBe(3);
      expect(stats?.totalMatches).toBeGreaterThan(0);
    });

    it('should handle high-throughput routing scenarios', async () => {
      const requestCount = 100;
      const requests: MCPRequest[] = [];

      // Generate many requests
      for (let i = 0; i < requestCount; i++) {
        requests.push({
          jsonrpc: '2.0',
          id: `load-test-${i}`,
          method: 'load.test',
          params: { index: i }
        });
      }

      // Route all requests concurrently
      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => messageRouter.routeRequest(req))
      );
      const endTime = Date.now();

      // Verify all requests succeeded
      expect(responses).toHaveLength(requestCount);
      responses.forEach(response => {
        expect(response.result).toBeDefined();
      });

      // Check performance metrics
      const metrics = messageRouter.getMetrics();
      expect(metrics.totalRequests).toBe(requestCount);
      expect(metrics.successfulRequests).toBe(requestCount);
      expect(metrics.failedRequests).toBe(0);

      // Verify reasonable performance (should handle 100 requests in under 5 seconds)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000);

      console.log(`Processed ${requestCount} requests in ${totalTime}ms (${(requestCount / totalTime * 1000).toFixed(2)} req/sec)`);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle subscription manager failures gracefully', async () => {
      // Stop the subscription manager to simulate failure
      await eventSubscriptionManager.stop();

      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'test.event',
        params: {}
      };

      // Should fall back to broadcast when subscription manager is unavailable
      await messageRouter.routeNotification(notification);

      // Verify notification was broadcast to all services
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(mockServices.length);
    });

    it('should handle message queue failures gracefully', async () => {
      // Stop the message queue
      await messageRouter.getMessageQueue().stop();

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'queue-fail-test',
        method: 'test',
        params: {}
      };

      // Should still route to available services even if queue is down
      const response = await messageRouter.routeRequest(request);
      expect(response.result).toBeDefined();
    });

    it('should maintain service isolation during partial failures', async () => {
      // Mock one service to always fail
      messageRouter['sendRequestToService'] = jest.fn().mockImplementation(async (request, serviceId, timeout) => {
        if (serviceId === 'auth-service') {
          throw new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'Service permanently down');
        }
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { serviceId, processed: true }
        };
      });

      const requests = [
        { jsonrpc: '2.0', id: 'iso-1', method: 'test', params: {} },
        { jsonrpc: '2.0', id: 'iso-2', method: 'test', params: {} },
        { jsonrpc: '2.0', id: 'iso-3', method: 'test', params: {} }
      ] as MCPRequest[];

      // Route requests - some should succeed, some should fail
      const results = await Promise.allSettled([
        messageRouter.routeRequest(requests[0], { targetService: 'auth-service' }),
        messageRouter.routeRequest(requests[1], { targetService: 'data-service' }),
        messageRouter.routeRequest(requests[2], { targetService: 'notification-service' })
      ]);

      // Verify that failures in one service don't affect others
      expect(results[0].status).toBe('rejected'); // auth-service failed
      expect(results[1].status).toBe('fulfilled'); // data-service succeeded
      expect(results[2].status).toBe('fulfilled'); // notification-service succeeded
    });
  });
});