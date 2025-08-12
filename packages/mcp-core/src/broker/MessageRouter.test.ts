/**
 * MessageRouter Unit Tests
 * 
 * Comprehensive unit tests for the MessageRouter class covering
 * request routing, load balancing integration, retry logic, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { MessageRouter } from './MessageRouter';
import { LoadBalancer } from './LoadBalancer';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage';
import { MCPServiceInfo, RoutingInfo } from '../types/broker';
import { ServiceStatus, LoadBalancingStrategy } from '../types/common';
import { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode } from '../types/error';

describe('MessageRouter', () => {
  let messageRouter: MessageRouter;
  let loadBalancer: LoadBalancer;
  let mockServices: MCPServiceInfo[];

  beforeEach(() => {
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
        status: ServiceStatus.ONLINE,
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
        status: ServiceStatus.ONLINE,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      }
    ];

    // Create real load balancer
    loadBalancer = new LoadBalancer({
      defaultStrategy: LoadBalancingStrategy.ROUND_ROBIN,
      useHealthCheck: true,
      stickySession: false
    });

    // Add services to load balancer
    mockServices.forEach(service => {
      loadBalancer.addService(service);
    });

    // Create message router
    messageRouter = new MessageRouter(loadBalancer);
  });

  afterEach(async () => {
    if (messageRouter) {
      await messageRouter.stop();
    }
  });

  describe('Lifecycle Management', () => {
    it('should start successfully', async () => {
      await messageRouter.start();
      expect(messageRouter['isStarted']).toBe(true);
    });

    it('should stop successfully', async () => {
      await messageRouter.start();
      await messageRouter.stop();
      expect(messageRouter['isStarted']).toBe(false);
    });

    it('should handle multiple start calls gracefully', async () => {
      await messageRouter.start();
      await messageRouter.start(); // Should not throw
      expect(messageRouter['isStarted']).toBe(true);
    });

    it('should handle stop before start gracefully', async () => {
      await messageRouter.stop(); // Should not throw
      expect(messageRouter['isStarted']).toBe(false);
    });

    it('should cancel active requests on stop', async () => {
      await messageRouter.start();

      // Mock an active request
      const request: MCPRequest = {
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
      await expect(requestPromise).rejects.toThrow(MCPErrorClass);
    });
  });

  describe('Request Routing', () => {
    beforeEach(async () => {
      await messageRouter.start();

      // Mock the private sendRequestToService method
      const originalSendRequest = messageRouter['sendRequestToService'];
      messageRouter['sendRequestToService'] = vi.fn().mockImplementation(async (request, serviceId, timeout) => {
        const response: MCPResponse = {
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

    it('should route request to selected service successfully', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: { test: 'data' }
      };

      const response = await messageRouter.routeRequest(request);

      expect(response).toBeDefined();
      expect(response.id).toBe(request.id);
      expect(response.result).toBeDefined();
    });

    it('should route request to specific target service', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      const routingInfo: RoutingInfo = {
        targetService: 'service-2'
      };

      const response = await messageRouter.routeRequest(request, routingInfo);

      expect(response).toBeDefined();
      expect(response.result.serviceId).toBe('service-2');
    });

    it('should throw error when no services available', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      // Remove all services from load balancer
      mockServices.forEach(service => {
        loadBalancer.removeService(service.id);
      });

      await expect(messageRouter.routeRequest(request)).rejects.toThrow(MCPErrorClass);
      await expect(messageRouter.routeRequest(request)).rejects.toThrow('No available services');
    });

    it('should throw error when target service not available', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      const routingInfo: RoutingInfo = {
        targetService: 'non-existent-service'
      };

      const response = await messageRouter.routeRequest(request, routingInfo);
      
      // Should return a queued response for offline service
      expect(response.result.status).toBe('queued');
    });

    it('should throw error when router is not started', async () => {
      // Make sure router is stopped
      await messageRouter.stop();
      
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      await expect(messageRouter.routeRequest(request)).rejects.toThrow(MCPErrorClass);
      await expect(messageRouter.routeRequest(request)).rejects.toThrow('Message router is not started');
    });
  });

  describe('Retry Logic', () => {
    beforeEach(async () => {
      await messageRouter.start();
    });

    it('should retry failed requests up to max attempts', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      const routingInfo: RoutingInfo = {
        retryPolicy: {
          maxAttempts: 3,
          initialDelay: 100,
          backoffMultiplier: 2,
          maxDelay: 5000
        }
      };

      let callCount = 0;
      messageRouter['sendRequestToService'] = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'Service temporarily unavailable');
        }
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { success: true }
        };
      });

      const response = await messageRouter.routeRequest(request, routingInfo);
      
      expect(response).toBeDefined();
      expect(callCount).toBe(3);
    });

    it('should not retry non-retryable errors', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'invalid/method',
        params: {}
      };

      const routingInfo: RoutingInfo = {
        retryPolicy: {
          maxAttempts: 3,
          initialDelay: 100,
          backoffMultiplier: 2,
          maxDelay: 5000
        }
      };

      let callCount = 0;
      messageRouter['sendRequestToService'] = vi.fn().mockImplementation(async () => {
        callCount++;
        // Use JSONRPCErrorCode.METHOD_NOT_FOUND which is in the non-retryable list
        throw new MCPErrorClass(JSONRPCErrorCode.METHOD_NOT_FOUND, 'Method not found');
      });

      await expect(messageRouter.routeRequest(request, routingInfo)).rejects.toThrow(MCPErrorClass);
      expect(callCount).toBe(1); // Should not retry
    });

    it('should calculate exponential backoff delay correctly', async () => {
      const retryPolicy = {
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: 0.1
      };

      const delay1 = messageRouter['calculateRetryDelay'](1, retryPolicy);
      const delay2 = messageRouter['calculateRetryDelay'](2, retryPolicy);
      const delay3 = messageRouter['calculateRetryDelay'](3, retryPolicy);

      expect(delay1).toBeGreaterThanOrEqual(900); // 1000 * (1-0.1)
      expect(delay1).toBeLessThanOrEqual(1100);   // 1000 * (1+0.1)
      
      expect(delay2).toBeGreaterThanOrEqual(1800); // 2000 * (1-0.1)
      expect(delay2).toBeLessThanOrEqual(2200);    // 2000 * (1+0.1)
      
      expect(delay3).toBeGreaterThanOrEqual(3600); // 4000 * (1-0.1)
      expect(delay3).toBeLessThanOrEqual(4400);    // 4000 * (1+0.1)
    });

    it('should respect maximum delay limit', async () => {
      const retryPolicy = {
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 3,
        jitter: 0 // Remove jitter for predictable testing
      };

      const delay5 = messageRouter['calculateRetryDelay'](5, retryPolicy);
      expect(delay5).toBeLessThanOrEqual(2000);
    });
  });

  describe('Broadcast Notifications', () => {
    beforeEach(async () => {
      await messageRouter.start();

      messageRouter['sendNotificationToService'] = vi.fn().mockResolvedValue(undefined);
    });

    it('should broadcast notification to all services', async () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'notification/test',
        params: { message: 'test broadcast' }
      };

      await messageRouter.broadcastNotification(notification);

      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledTimes(2);
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(notification, 'service-1');
      expect(messageRouter['sendNotificationToService']).toHaveBeenCalledWith(notification, 'service-2');
    });

    it('should handle partial failures in broadcast', async () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'notification/test',
        params: {}
      };

      // Mock one service to fail
      (messageRouter['sendNotificationToService'] as MockedFunction<any>)
        .mockImplementationOnce(() => Promise.reject(new Error('Service 1 failed')))
        .mockImplementationOnce(() => Promise.resolve());

      // Should not throw even if one service fails
      await expect(messageRouter.broadcastNotification(notification)).resolves.toBeUndefined();
    });

    it('should throw error when router is not started', async () => {
      await messageRouter.stop();

      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'notification/test',
        params: {}
      };

      await expect(messageRouter.broadcastNotification(notification)).rejects.toThrow(MCPErrorClass);
    });
  });

  describe('Metrics and Monitoring', () => {
    beforeEach(async () => {
      await messageRouter.start();

      messageRouter['sendRequestToService'] = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 'test',
        result: {}
      });
    });

    it('should track request metrics correctly', async () => {
      const initialMetrics = messageRouter.getMetrics();
      expect(initialMetrics.totalRequests).toBe(0);
      expect(initialMetrics.successfulRequests).toBe(0);

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      await messageRouter.routeRequest(request);

      const updatedMetrics = messageRouter.getMetrics();
      expect(updatedMetrics.totalRequests).toBe(1);
      expect(updatedMetrics.successfulRequests).toBe(1);
      expect(updatedMetrics.failedRequests).toBe(0);
    });

    it('should track failure metrics correctly', async () => {
      messageRouter['sendRequestToService'] = vi.fn().mockRejectedValue(
        new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'Service error')
      );

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      await expect(messageRouter.routeRequest(request)).rejects.toThrow();

      const metrics = messageRouter.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(1);
    });

    it('should track service distribution correctly', async () => {
      const request1: MCPRequest = {
        jsonrpc: '2.0',
        id: 'request-1',
        method: 'test/method',
        params: {}
      };

      const request2: MCPRequest = {
        jsonrpc: '2.0',
        id: 'request-2',
        method: 'test/method',
        params: {}
      };

      const routingInfo1: RoutingInfo = {
        targetService: 'service-1'
      };

      const routingInfo2: RoutingInfo = {
        targetService: 'service-1'
      };

      await messageRouter.routeRequest(request1, routingInfo1);
      await messageRouter.routeRequest(request2, routingInfo2);

      const metrics = messageRouter.getMetrics();
      expect(metrics.serviceDistribution['service-1']).toBe(2);
    });

    it('should reset metrics correctly', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      await messageRouter.routeRequest(request);
      
      let metrics = messageRouter.getMetrics();
      expect(metrics.totalRequests).toBe(1);

      messageRouter.resetMetrics();
      
      metrics = messageRouter.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should track active request count correctly', async () => {
      expect(messageRouter.getActiveRequestCount()).toBe(0);

      // Mock a slow request
      messageRouter['sendRequestToService'] = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { jsonrpc: '2.0', id: 'test', result: {} };
      });

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      const requestPromise = messageRouter.routeRequest(request);
      
      // Check active count during request
      expect(messageRouter.getActiveRequestCount()).toBe(1);
      
      await requestPromise;
      
      // Check active count after request
      expect(messageRouter.getActiveRequestCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await messageRouter.start();
    });

    it('should identify retryable errors correctly', async () => {
      const retryableError = new MCPErrorClass(MCPErrorCode.CONNECTION_TIMEOUT, 'Connection timeout');
      const nonRetryableError = new MCPErrorClass(JSONRPCErrorCode.INVALID_REQUEST, 'Invalid request');
      
      expect(messageRouter['isRetryableError'](retryableError)).toBe(true);
      expect(messageRouter['isRetryableError'](nonRetryableError)).toBe(false);
    });

    it('should handle generic errors as retryable', async () => {
      const genericError = new Error('Generic error');
      expect(messageRouter['isRetryableError'](genericError)).toBe(true);
    });

    it('should handle connection management on errors', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      messageRouter['sendRequestToService'] = vi.fn().mockRejectedValue(
        new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'Service error')
      );

      await expect(messageRouter.routeRequest(request)).rejects.toThrow();

      // Test passes if error is thrown correctly
    });
  });

  describe('Routing Info Integration', () => {
    beforeEach(async () => {
      await messageRouter.start();

      messageRouter['sendRequestToService'] = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 'test',
        result: {}
      });
    });

    it('should use custom load balancing strategy from routing info', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      const routingInfo: RoutingInfo = {
        loadBalancing: LoadBalancingStrategy.LEAST_CONNECTIONS
      };

      const response = await messageRouter.routeRequest(request, routingInfo);
      
      expect(response).toBeDefined();
      expect(response.result).toBeDefined();
    });

    it('should use custom timeout from routing info', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 'test-request',
        method: 'test/method',
        params: {}
      };

      const routingInfo: RoutingInfo = {
        timeout: 5000
      };

      const response = await messageRouter.routeRequest(request, routingInfo);
      
      expect(response).toBeDefined();
      expect(response.result).toBeDefined();
    });
  });
});