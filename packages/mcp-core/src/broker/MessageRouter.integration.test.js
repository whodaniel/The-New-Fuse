"use strict";
/**
 * MessageRouter Integration Tests
 *
 * Comprehensive integration tests for advanced routing features including
 * event subscription, pattern matching, broadcast notifications, and
 * complex routing scenarios.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MessageRouter_1 = require("./MessageRouter");
const LoadBalancer_1 = require("./LoadBalancer");
const EventSubscriptionManager_1 = require("./EventSubscriptionManager");
const MessageQueue_1 = require("./MessageQueue");
const common_1 = require("../types/common");
const error_1 = require("../types/error");
(0, vitest_1.describe)('MessageRouter Integration Tests', () => {
    let messageRouter;
    let loadBalancer;
    let eventSubscriptionManager;
    let messageQueue;
    let mockServices;
    (0, vitest_1.beforeEach)(async () => {
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
                status: common_1.ServiceStatus.ONLINE,
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
                status: common_1.ServiceStatus.ONLINE,
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
                status: common_1.ServiceStatus.ONLINE,
                metadata: { region: 'eu-west-1' },
                registeredAt: new Date(),
                lastHeartbeat: new Date()
            }
        ];
        // Create components
        loadBalancer = new LoadBalancer_1.LoadBalancer({
            defaultStrategy: common_1.LoadBalancingStrategy.ROUND_ROBIN,
            useHealthCheck: true,
            stickySession: false
        });
        eventSubscriptionManager = new EventSubscriptionManager_1.EventSubscriptionManager();
        messageQueue = new MessageQueue_1.MessageQueue();
        // Add services to load balancer
        mockServices.forEach(service => {
            loadBalancer.addService(service);
        });
        // Create message router with all components
        messageRouter = new MessageRouter_1.MessageRouter(loadBalancer, eventSubscriptionManager, messageQueue);
        // Start all components
        await messageRouter.start();
        // Mock the actual message sending methods for testing
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockImplementation(async (request, serviceId, timeout) => {
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
        messageRouter['sendNotificationToService'] = vitest_1.vi.fn().mockImplementation(async (notification, serviceId) => {
            // Simulate successful notification delivery
            return Promise.resolve();
        });
    });
    (0, vitest_1.afterEach)(async () => {
        if (messageRouter) {
            await messageRouter.stop();
        }
    });
    (0, vitest_1.describe)('Event Subscription and Pattern Matching', () => {
        (0, vitest_1.it)('should route notifications to services with exact pattern matches', async () => {
            // Subscribe auth-service to user events
            await messageRouter.subscribeToEvents('auth-service', 'user.login');
            await messageRouter.subscribeToEvents('auth-service', 'user.logout');
            // Subscribe data-service to data events
            await messageRouter.subscribeToEvents('data-service', 'data.created');
            // Send user login notification
            const loginNotification = {
                jsonrpc: '2.0',
                method: 'user.login',
                params: { userId: '123', timestamp: new Date().toISOString() }
            };
            await messageRouter.routeNotification(loginNotification);
            // Verify notification was sent only to auth-service
            (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(loginNotification, 'auth-service');
            (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should route notifications to services with wildcard pattern matches', async () => {
            // Subscribe notification-service to all user events using wildcard
            await messageRouter.subscribeToEventsAdvanced('notification-service', 'user.*', EventSubscriptionManager_1.PatternType.WILDCARD);
            // Subscribe data-service to specific data events
            await messageRouter.subscribeToEvents('data-service', 'data.updated');
            // Send user registration notification
            const registrationNotification = {
                jsonrpc: '2.0',
                method: 'user.registered',
                params: { userId: '456', email: 'test@example.com',
                    await: messageRouter.routeNotification(registrationNotification),
                    // Verify notification was sent only to notification-service (wildcard match)
                    expect(messageRouter, [], ) { } }
            };
        }).toHaveBeenCalledWith(registrationNotification, 'notification-service');
        (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should route notifications to multiple services with overlapping subscriptions', async () => {
        // Multiple services subscribe to overlapping patterns
        await messageRouter.subscribeToEvents('auth-service', 'system.alert');
        await messageRouter.subscribeToEventsAdvanced('notification-service', 'system.*', EventSubscriptionManager_1.PatternType.WILDCARD);
        await messageRouter.subscribeToEventsAdvanced('data-service', 'system.alert', EventSubscriptionManager_1.PatternType.EXACT);
        // Send system alert notification
        const alertNotification = {
            jsonrpc: '2.0',
            method: 'system.alert',
            params: { level: 'critical', message: 'Database connection lost',
                await: messageRouter.routeNotification(alertNotification),
                // Verify notification was sent to all matching services
                expect(messageRouter, [], ) { } }
        };
    }).toHaveBeenCalledWith(alertNotification, 'auth-service');
    (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(alertNotification, 'notification-service');
    (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(alertNotification, 'data-service');
    (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(3);
});
(0, vitest_1.it)('should handle subscription filters correctly', async () => {
    // Subscribe with filters
    await messageRouter.subscribeToEventsAdvanced('auth-service', 'user.action', EventSubscriptionManager_1.PatternType.EXACT, { action: 'login', region: 'us-east-1' });
    // Send matching notification
    const matchingNotification = {
        jsonrpc: '2.0',
        method: 'user.action',
        params: { action: 'login', region: 'us-east-1', userId: '123',
            await: messageRouter.routeNotification(matchingNotification),
            // Send non-matching notification
            const: nonMatchingNotification, MCPNotification: IMCPMessage_1.MCPNotification = {
                jsonrpc: '2.0',
                method: 'user.action',
                params: { action: 'logout', region: 'us-east-1', userId: '123',
                    await: messageRouter.routeNotification(nonMatchingNotification),
                    // Verify only matching notification was routed
                    expect(messageRouter, [], ) { } }
            } }
    };
}).toHaveBeenCalledWith(matchingNotification, 'auth-service');
(0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(1);
;
;
(0, vitest_1.describe)('Broadcast Notifications', () => {
    (0, vitest_1.it)('should broadcast notifications to all available services', async () => {
        const broadcastNotification = {
            jsonrpc: '2.0',
            method: 'system.shutdown',
            params: { reason: 'maintenance', scheduledTime: new Date().toISOString() }
        };
        await messageRouter.broadcastNotification(broadcastNotification);
        // Verify notification was sent to all services
        mockServices.forEach(service => {
            (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(broadcastNotification, service.id);
        });
        (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(mockServices.length);
    });
    (0, vitest_1.it)('should handle partial failures in broadcast gracefully', async () => {
        // Mock one service to fail
        const originalSendNotification = messageRouter['sendNotificationToService'];
        messageRouter['sendNotificationToService'] = vitest_1.vi.fn().mockImplementation(async (notification, serviceId) => {
            if (serviceId === 'auth-service') {
                throw new Error('Service temporarily unavailable');
            }
            return Promise.resolve();
        });
        const broadcastNotification = {
            jsonrpc: '2.0',
            method: 'system.update',
            params: { version: '2.0.0',
                // Should not throw even if one service fails
                await: (0, vitest_1.expect)(messageRouter.broadcastNotification(broadcastNotification)).resolves.toBeUndefined(),
                // Verify all services were attempted
                expect(messageRouter, [], ) { } }
        };
    }).toHaveBeenCalledTimes(mockServices.length);
});
;
(0, vitest_1.describe)('Complex Routing Scenarios', () => {
    (0, vitest_1.it)('should handle mixed request routing and notification routing', async () => {
        // Set up subscriptions
        await messageRouter.subscribeToEvents('notification-service', 'user.created');
        // Send a request
        const request = {
            jsonrpc: '2.0',
            id: 'req-1',
            method: 'user.create',
            params: { name: 'John Doe', email: 'john@example.com',
                const: routingInfo, RoutingInfo: broker_1.RoutingInfo = {
                    targetService: 'auth-service'
                },
                const: response = await messageRouter.routeRequest(request, routingInfo),
                // Send a related notification
                const: notification, MCPNotification: IMCPMessage_1.MCPNotification = {
                    jsonrpc: '2.0',
                    method: 'user.created',
                    params: { userId: '789', name: 'John Doe',
                        await: messageRouter.routeNotification(notification),
                        // Verify both operations completed successfully
                        expect(response) { }, : .result.serviceId }
                } }
        };
    }).toBe('auth-service');
    (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(notification, 'notification-service');
});
(0, vitest_1.it)('should handle load balancing with service failures and recovery', async () => {
    // Mock service failures
    let failureCount = 0;
    messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockImplementation(async (request, serviceId, timeout) => {
        if (serviceId === 'auth-service' && failureCount < 2) {
            failureCount++;
            throw new error_1.MCPErrorClass(error_1.MCPErrorCode.INTERNAL_ERROR, 'Service temporarily unavailable');
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
    ];
    const routingInfo = {
        retryPolicy: {
            maxAttempts: 3,
            initialDelay: 10,
            backoffMultiplier: 2,
            maxDelay: 1000
        }
    };
    // Send requests
    const responses = await Promise.all(requests.map(req => messageRouter.routeRequest(req, routingInfo)));
    // Verify all requests eventually succeeded
    responses.forEach(response => {
        (0, vitest_1.expect)(response.result.processed).toBe(true);
    });
    // Verify metrics tracked the failures and retries
    const metrics = messageRouter.getMetrics();
    (0, vitest_1.expect)(metrics.totalRequests).toBe(3);
    (0, vitest_1.expect)(metrics.successfulRequests).toBe(3);
});
(0, vitest_1.it)('should handle message queuing for offline services', async () => {
    // Remove a service to simulate it going offline
    loadBalancer.removeService('data-service');
    const request = {
        jsonrpc: '2.0',
        id: 'queued-req',
        method: 'data.process',
        params: { data: 'test data',
            const: routingInfo, RoutingInfo: broker_1.RoutingInfo = {
                targetService: 'data-service'
            },
            // Request should be queued since service is offline
            const: response = await messageRouter.routeRequest(request, routingInfo),
            expect(response) { }, : .result.status }
    };
}).toBe('queued');
(0, vitest_1.expect)(response.result.targetService).toBe('data-service');
// Verify message was added to queue
const queueStats = messageRouter.getMessageQueue().getStatistics();
(0, vitest_1.expect)(queueStats.totalMessages).toBe(1);
(0, vitest_1.expect)(queueStats.messagesByService['data-service']).toBe(1);
;
(0, vitest_1.it)('should process queued messages when service comes back online', async () => {
    // Queue some messages for offline service
    const queuedMessages = [
        { jsonrpc: '2.0', id: 'q1', method: 'process', params: { id: 1 } },
        { jsonrpc: '2.0', id: 'q2', method: 'process', params: { id: 2 } }
    ];
    for (const msg of queuedMessages) {
        await messageRouter.queueRequest(msg, 'data-service');
    }
    // Verify messages are queued
    let queueStats = messageRouter.getMessageQueue().getStatistics();
    (0, vitest_1.expect)(queueStats.totalMessages).toBe(2);
    // Bring service back online
    const dataService = mockServices.find(s => s.id === 'data-service');
    loadBalancer.addService(dataService);
    // Process queued messages
    await messageRouter.processQueuedMessages('data-service');
    // Verify messages were processed
    queueStats = messageRouter.getMessageQueue().getStatistics();
    (0, vitest_1.expect)(queueStats.totalMessages).toBe(0); // All messages should be processed
    // Verify sendRequestToService was called for each queued message
    (0, vitest_1.expect)(messageRouter['sendRequestToService']).toHaveBeenCalledTimes(2);
});
;
(0, vitest_1.describe)('Performance and Metrics', () => {
    (0, vitest_1.it)('should collect comprehensive routing metrics', async () => {
        // Send various types of requests
        const requests = [
            { jsonrpc: '2.0', id: 'perf-1', method: 'auth.login', params: {} },
            { jsonrpc: '2.0', id: 'perf-2', method: 'data.query', params: {} },
            { jsonrpc: '2.0', id: 'perf-3', method: 'notify.send', params: {} }
        ];
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
        (0, vitest_1.expect)(metrics.totalRequests).toBe(3);
        (0, vitest_1.expect)(metrics.successfulRequests).toBe(3);
        (0, vitest_1.expect)(metrics.failedRequests).toBe(0);
        (0, vitest_1.expect)(metrics.serviceDistribution['auth-service']).toBe(1);
        (0, vitest_1.expect)(metrics.serviceDistribution['data-service']).toBe(1);
        (0, vitest_1.expect)(metrics.serviceDistribution['notification-service']).toBe(1);
        (0, vitest_1.expect)(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)('should track subscription statistics', async () => {
        // Create various subscriptions
        await messageRouter.subscribeToEvents('auth-service', 'user.login');
        await messageRouter.subscribeToEventsAdvanced('notification-service', 'user.*', EventSubscriptionManager_1.PatternType.WILDCARD);
        await messageRouter.subscribeToEventsAdvanced('data-service', 'data.created', EventSubscriptionManager_1.PatternType.EXACT);
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
        (0, vitest_1.expect)(stats?.totalSubscriptions).toBe(3);
        (0, vitest_1.expect)(stats?.activeSubscriptions).toBe(3);
        (0, vitest_1.expect)(stats?.totalMatches).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should handle high-throughput routing scenarios', async () => {
        const requestCount = 100;
        const requests = [];
        // Generate many requests
        for (let i = 0; i < requestCount; i++) {
            requests.push({
                jsonrpc: '2.0',
                id: `load-test-${i},
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
`,
                console, : .log(`Processed ${requestCount}`, requests in $, { totalTime }, ms($, {}(requestCount / totalTime * 1000).toFixed(2)))
            }, req / sec) `);
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
      messageRouter['sendRequestToService'] = vi.fn().mockImplementation(async (request, serviceId, timeout) => {
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
});;
        }
    });
});
//# sourceMappingURL=MessageRouter.integration.test.js.map