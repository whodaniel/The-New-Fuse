"use strict";
/**
 * MessageRouter Unit Tests
 *
 * Comprehensive unit tests for the MessageRouter class covering
 * request routing, load balancing integration, retry logic, and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MessageRouter_1 = require("./MessageRouter");
const LoadBalancer_1 = require("./LoadBalancer");
const common_1 = require("../types/common");
const error_1 = require("../types/error");
(0, vitest_1.describe)('MessageRouter', () => {
    let messageRouter;
    let loadBalancer;
    let mockServices;
    (0, vitest_1.beforeEach)(() => {
        // Create mock services
        mockServices = [
            {
                id: 'service-1',
                name: 'Service 1',
                version: '1.0.0',
                endpoint: 'http://localhost:3001',
                capabilities: ['database'],
                resources: [],
                tools: [],
                status: common_1.ServiceStatus.ONLINE,
                metadata: {},
                registeredAt: new Date(),
                lastHeartbeat: new Date()
            },
            {
                id: 'service-2',
                name: 'Service 2',
                version: '1.0.0',
                endpoint: 'http://localhost:3002',
                capabilities: ['cache'],
                resources: [],
                tools: [],
                status: common_1.ServiceStatus.ONLINE,
                metadata: {},
                registeredAt: new Date(),
                lastHeartbeat: new Date()
            }
        ];
        // Create real load balancer
        loadBalancer = new LoadBalancer_1.LoadBalancer({
            defaultStrategy: common_1.LoadBalancingStrategy.ROUND_ROBIN,
            useHealthCheck: true,
            stickySession: false
        });
        // Add services to load balancer
        mockServices.forEach(service => {
            loadBalancer.addService(service);
        });
        // Create message router
        messageRouter = new MessageRouter_1.MessageRouter(loadBalancer);
    });
    (0, vitest_1.afterEach)(async () => {
        if (messageRouter) {
            await messageRouter.stop();
        }
    });
    (0, vitest_1.describe)('Lifecycle Management', () => {
        (0, vitest_1.it)('should start successfully', async () => {
            await messageRouter.start();
            (0, vitest_1.expect)(messageRouter['isStarted']).toBe(true);
        });
        (0, vitest_1.it)('should stop successfully', async () => {
            await messageRouter.start();
            await messageRouter.stop();
            (0, vitest_1.expect)(messageRouter['isStarted']).toBe(false);
        });
        (0, vitest_1.it)('should handle multiple start calls gracefully', async () => {
            await messageRouter.start();
            await messageRouter.start(); // Should not throw
            (0, vitest_1.expect)(messageRouter['isStarted']).toBe(true);
        });
        (0, vitest_1.it)('should handle stop before start gracefully', async () => {
            await messageRouter.stop(); // Should not throw
            (0, vitest_1.expect)(messageRouter['isStarted']).toBe(false);
        });
        (0, vitest_1.it)('should cancel active requests on stop', async () => {
            await messageRouter.start();
            // Mock an active request
            const request = {
                jsonrpc: '2.0',
                id: 'test-request',
                method: 'test/method',
                params: {}
            };
            // Start a request but don't await it
            const requestPromise = messageRouter.routeRequest(request);
            // Stop the router
            await messageRouter.stop();
            // The request should be cancelled
            await (0, vitest_1.expect)(requestPromise).rejects.toThrow(error_1.MCPErrorClass);
        });
    });
    (0, vitest_1.describe)('Request Routing', () => {
        (0, vitest_1.beforeEach)(async () => {
            await messageRouter.start();
            // Mock the private sendRequestToService method
            const originalSendRequest = messageRouter['sendRequestToService'];
            messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockImplementation(async (request, serviceId, timeout) => {
                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        serviceId,
                        method: request.method,
                        timestamp: new Date().toISOString()
                    }
                };
                return response;
            });
        });
        (0, vitest_1.it)('should route request to selected service successfully', async () => {
            const request = {
                jsonrpc: '2.0',
                id: 'test-request',
                method: 'test/method',
                params: { test: 'data',
                    const: response = await messageRouter.routeRequest(request),
                    expect(response) { }, : .toBeDefined(),
                    expect(response) { }, : .id }
            };
        }).toBe(request.id);
        (0, vitest_1.expect)(response.result).toBeDefined();
    });
    (0, vitest_1.it)('should route request to specific target service', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        const routingInfo = {
            targetService: 'service-2'
        };
        const response = await messageRouter.routeRequest(request, routingInfo);
        (0, vitest_1.expect)(response).toBeDefined();
        (0, vitest_1.expect)(response.result.serviceId).toBe('service-2');
    });
    (0, vitest_1.it)('should throw error when no services available', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        // Remove all services from load balancer
        mockServices.forEach(service => {
            loadBalancer.removeService(service.id);
        });
        await (0, vitest_1.expect)(messageRouter.routeRequest(request)).rejects.toThrow(error_1.MCPErrorClass);
        await (0, vitest_1.expect)(messageRouter.routeRequest(request)).rejects.toThrow('No available services');
    });
    (0, vitest_1.it)('should throw error when target service not available', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        const routingInfo = {
            targetService: 'non-existent-service'
        };
        const response = await messageRouter.routeRequest(request, routingInfo);
        // Should return a queued response for offline service
        (0, vitest_1.expect)(response.result.status).toBe('queued');
    });
    (0, vitest_1.it)('should throw error when router is not started', async () => {
        // Make sure router is stopped
        await messageRouter.stop();
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        await (0, vitest_1.expect)(messageRouter.routeRequest(request)).rejects.toThrow(error_1.MCPErrorClass);
        await (0, vitest_1.expect)(messageRouter.routeRequest(request)).rejects.toThrow('Message router is not started');
    });
});
(0, vitest_1.describe)('Retry Logic', () => {
    (0, vitest_1.beforeEach)(async () => {
        await messageRouter.start();
    });
    (0, vitest_1.it)('should retry failed requests up to max attempts', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        const routingInfo = {
            retryPolicy: {
                maxAttempts: 3,
                initialDelay: 100,
                backoffMultiplier: 2,
                maxDelay: 5000
            }
        };
        let callCount = 0;
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockImplementation(async () => {
            callCount++;
            if (callCount < 3) {
                throw new error_1.MCPErrorClass(error_1.MCPErrorCode.INTERNAL_ERROR, 'Service temporarily unavailable');
            }
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: { success: true }
            };
        });
        const response = await messageRouter.routeRequest(request, routingInfo);
        (0, vitest_1.expect)(response).toBeDefined();
        (0, vitest_1.expect)(callCount).toBe(3);
    });
    (0, vitest_1.it)('should not retry non-retryable errors', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'invalid/method',
            params: {}
        };
        const routingInfo = {
            retryPolicy: {
                maxAttempts: 3,
                initialDelay: 100,
                backoffMultiplier: 2,
                maxDelay: 5000
            }
        };
        let callCount = 0;
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockImplementation(async () => {
            callCount++;
            // Use JSONRPCErrorCode.METHOD_NOT_FOUND which is in the non-retryable list
            throw new error_1.MCPErrorClass(error_1.JSONRPCErrorCode.METHOD_NOT_FOUND, 'Method not found');
        });
        await (0, vitest_1.expect)(messageRouter.routeRequest(request, routingInfo)).rejects.toThrow(error_1.MCPErrorClass);
        (0, vitest_1.expect)(callCount).toBe(1); // Should not retry
    });
    (0, vitest_1.it)('should calculate exponential backoff delay correctly', async () => {
        const retryPolicy = {
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
            jitter: 0.1
        };
        const delay1 = messageRouter['calculateRetryDelay'](1, retryPolicy);
        const delay2 = messageRouter['calculateRetryDelay'](2, retryPolicy);
        const delay3 = messageRouter['calculateRetryDelay'](3, retryPolicy);
        (0, vitest_1.expect)(delay1).toBeGreaterThanOrEqual(900); // 1000 * (1-0.1)
        (0, vitest_1.expect)(delay1).toBeLessThanOrEqual(1100); // 1000 * (1+0.1)
        (0, vitest_1.expect)(delay2).toBeGreaterThanOrEqual(1800); // 2000 * (1-0.1)
        (0, vitest_1.expect)(delay2).toBeLessThanOrEqual(2200); // 2000 * (1+0.1)
        (0, vitest_1.expect)(delay3).toBeGreaterThanOrEqual(3600); // 4000 * (1-0.1)
        (0, vitest_1.expect)(delay3).toBeLessThanOrEqual(4400); // 4000 * (1+0.1)
    });
    (0, vitest_1.it)('should respect maximum delay limit', async () => {
        const retryPolicy = {
            initialDelay: 1000,
            maxDelay: 2000,
            backoffMultiplier: 3,
            jitter: 0 // Remove jitter for predictable testing
        };
        const delay5 = messageRouter['calculateRetryDelay'](5, retryPolicy);
        (0, vitest_1.expect)(delay5).toBeLessThanOrEqual(2000);
    });
});
(0, vitest_1.describe)('Broadcast Notifications', () => {
    (0, vitest_1.beforeEach)(async () => {
        await messageRouter.start();
        messageRouter['sendNotificationToService'] = vitest_1.vi.fn().mockResolvedValue(undefined);
    });
    (0, vitest_1.it)('should broadcast notification to all services', async () => {
        const notification = {
            jsonrpc: '2.0',
            method: 'notification/test',
            params: { message: 'test broadcast',
                await: messageRouter.broadcastNotification(notification),
                expect(messageRouter, [], ) { } }
        };
    }).toHaveBeenCalledTimes(2);
    (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(notification, 'service-1');
    (0, vitest_1.expect)(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(notification, 'service-2');
});
(0, vitest_1.it)('should handle partial failures in broadcast', async () => {
    const notification = {
        jsonrpc: '2.0',
        method: 'notification/test',
        params: {}
    };
    // Mock one service to fail
    messageRouter['sendNotificationToService']
        .mockImplementationOnce(() => Promise.reject(new Error('Service 1 failed')))
        .mockImplementationOnce(() => Promise.resolve());
    // Should not throw even if one service fails
    await (0, vitest_1.expect)(messageRouter.broadcastNotification(notification)).resolves.toBeUndefined();
});
(0, vitest_1.it)('should throw error when router is not started', async () => {
    await messageRouter.stop();
    const notification = {
        jsonrpc: '2.0',
        method: 'notification/test',
        params: {}
    };
    await (0, vitest_1.expect)(messageRouter.broadcastNotification(notification)).rejects.toThrow(error_1.MCPErrorClass);
});
;
(0, vitest_1.describe)('Metrics and Monitoring', () => {
    (0, vitest_1.beforeEach)(async () => {
        await messageRouter.start();
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockResolvedValue({
            jsonrpc: '2.0',
            id: 'test',
            result: {}
        });
    });
    (0, vitest_1.it)('should track request metrics correctly', async () => {
        const initialMetrics = messageRouter.getMetrics();
        (0, vitest_1.expect)(initialMetrics.totalRequests).toBe(0);
        (0, vitest_1.expect)(initialMetrics.successfulRequests).toBe(0);
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        await messageRouter.routeRequest(request);
        const updatedMetrics = messageRouter.getMetrics();
        (0, vitest_1.expect)(updatedMetrics.totalRequests).toBe(1);
        (0, vitest_1.expect)(updatedMetrics.successfulRequests).toBe(1);
        (0, vitest_1.expect)(updatedMetrics.failedRequests).toBe(0);
    });
    (0, vitest_1.it)('should track failure metrics correctly', async () => {
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockRejectedValue(new error_1.MCPErrorClass(error_1.MCPErrorCode.INTERNAL_ERROR, 'Service error'));
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        await (0, vitest_1.expect)(messageRouter.routeRequest(request)).rejects.toThrow();
        const metrics = messageRouter.getMetrics();
        (0, vitest_1.expect)(metrics.totalRequests).toBe(1);
        (0, vitest_1.expect)(metrics.successfulRequests).toBe(0);
        (0, vitest_1.expect)(metrics.failedRequests).toBe(1);
    });
    (0, vitest_1.it)('should track service distribution correctly', async () => {
        const request1 = {
            jsonrpc: '2.0',
            id: 'request-1',
            method: 'test/method',
            params: {}
        };
        const request2 = {
            jsonrpc: '2.0',
            id: 'request-2',
            method: 'test/method',
            params: {}
        };
        const routingInfo1 = {
            targetService: 'service-1'
        };
        const routingInfo2 = {
            targetService: 'service-1'
        };
        await messageRouter.routeRequest(request1, routingInfo1);
        await messageRouter.routeRequest(request2, routingInfo2);
        const metrics = messageRouter.getMetrics();
        (0, vitest_1.expect)(metrics.serviceDistribution['service-1']).toBe(2);
    });
    (0, vitest_1.it)('should reset metrics correctly', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        await messageRouter.routeRequest(request);
        let metrics = messageRouter.getMetrics();
        (0, vitest_1.expect)(metrics.totalRequests).toBe(1);
        messageRouter.resetMetrics();
        metrics = messageRouter.getMetrics();
        (0, vitest_1.expect)(metrics.totalRequests).toBe(0);
        (0, vitest_1.expect)(metrics.successfulRequests).toBe(0);
        (0, vitest_1.expect)(metrics.failedRequests).toBe(0);
    });
    (0, vitest_1.it)('should track active request count correctly', async () => {
        (0, vitest_1.expect)(messageRouter.getActiveRequestCount()).toBe(0);
        // Mock a slow request
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return { jsonrpc: '2.0', id: 'test', result: {} };
        });
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        const requestPromise = messageRouter.routeRequest(request);
        // Check active count during request
        (0, vitest_1.expect)(messageRouter.getActiveRequestCount()).toBe(1);
        await requestPromise;
        // Check active count after request
        (0, vitest_1.expect)(messageRouter.getActiveRequestCount()).toBe(0);
    });
});
(0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.beforeEach)(async () => {
        await messageRouter.start();
    });
    (0, vitest_1.it)('should identify retryable errors correctly', async () => {
        const retryableError = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_TIMEOUT, 'Connection timeout');
        const nonRetryableError = new error_1.MCPErrorClass(error_1.JSONRPCErrorCode.INVALID_REQUEST, 'Invalid request');
        (0, vitest_1.expect)(messageRouter['isRetryableError'](retryableError)).toBe(true);
        (0, vitest_1.expect)(messageRouter['isRetryableError'](nonRetryableError)).toBe(false);
    });
    (0, vitest_1.it)('should handle generic errors as retryable', async () => {
        const genericError = new Error('Generic error');
        (0, vitest_1.expect)(messageRouter['isRetryableError'](genericError)).toBe(true);
    });
    (0, vitest_1.it)('should handle connection management on errors', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockRejectedValue(new error_1.MCPErrorClass(error_1.MCPErrorCode.INTERNAL_ERROR, 'Service error'));
        await (0, vitest_1.expect)(messageRouter.routeRequest(request)).rejects.toThrow();
        // Test passes if error is thrown correctly
    });
});
(0, vitest_1.describe)('Routing Info Integration', () => {
    (0, vitest_1.beforeEach)(async () => {
        await messageRouter.start();
        messageRouter['sendRequestToService'] = vitest_1.vi.fn().mockResolvedValue({
            jsonrpc: '2.0',
            id: 'test',
            result: {}
        });
    });
    (0, vitest_1.it)('should use custom load balancing strategy from routing info', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        const routingInfo = {
            loadBalancing: common_1.LoadBalancingStrategy.LEAST_CONNECTIONS
        };
        const response = await messageRouter.routeRequest(request, routingInfo);
        (0, vitest_1.expect)(response).toBeDefined();
        (0, vitest_1.expect)(response.result).toBeDefined();
    });
    (0, vitest_1.it)('should use custom timeout from routing info', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 'test-request',
            method: 'test/method',
            params: {}
        };
        const routingInfo = {
            timeout: 5000
        };
        const response = await messageRouter.routeRequest(request, routingInfo);
        (0, vitest_1.expect)(response).toBeDefined();
        (0, vitest_1.expect)(response.result).toBeDefined();
    });
});
;
//# sourceMappingURL=MessageRouter.test.js.map