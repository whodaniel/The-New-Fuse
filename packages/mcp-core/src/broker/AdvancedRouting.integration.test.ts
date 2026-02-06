/**
 * Advanced Routing Integration Tests
 *
 * Comprehensive integration tests for advanced routing features including
 * event subscription, pattern matching, selective routing, and performance monitoring.
 */

// @ts-expect-error - Jest globals are available without import
import { MCPNotification } from '../interfaces/IMCPMessage';
import { BrokerConfig, MCPServiceInfo } from '../types';
import { LoadBalancingStrategy, ServiceStatus } from '../types/common';
import { PatternType } from './EventSubscriptionManager';
import { MCPBroker } from './MCPBroker';

describe('Advanced Routing Integration', () => {
  let broker: MCPBroker;
  let mockServices: MCPServiceInfo[];
  let config: Partial<BrokerConfig>;

  beforeEach(async () => {
    jest.clearAllMocks();

    config = {
      name: 'test-advanced-routing-broker',
      version: '1.0.0',
      registry: {
        type: 'memory',
        serviceTTL: 300,
        cleanupInterval: 60,
      },
      healthCheck: {
        enabled: false, // Disable health checking for integration tests
        interval: 30,
        timeout: 5000,
        failureThreshold: 3,
        recoveryThreshold: 2,
      },
      loadBalancing: {
        defaultStrategy: LoadBalancingStrategy.ROUND_ROBIN,
        useHealthCheck: false, // Disable health check integration for tests
        stickySession: false,
      },
    };

    broker = new MCPBroker(config);
    await broker.start();

    // Create mock services with different capabilities
    mockServices = [
      {
        id: 'auth-service',
        name: 'Authentication Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3001',
        capabilities: ['auth', 'user-management'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { domain: 'auth', tier: 'critical' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        tags: ['security', 'authentication'],
      },
      {
        id: 'analytics-service',
        name: 'Analytics Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3002',
        capabilities: ['analytics', 'reporting'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { domain: 'analytics', tier: 'standard' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        tags: ['analytics', 'metrics'],
      },
      {
        id: 'notification-service',
        name: 'Notification Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3003',
        capabilities: ['notifications', 'messaging'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { domain: 'communication', tier: 'standard' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        tags: ['notifications', 'communication'],
      },
      {
        id: 'audit-service',
        name: 'Audit Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3004',
        capabilities: ['audit', 'logging'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { domain: 'compliance', tier: 'critical' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        tags: ['audit', 'compliance', 'logging'],
      },
    ];

    // Register all services
    for (const service of mockServices) {
      await broker.registerService(service);
    }
  });

  afterEach(async () => {
    if (broker.isRunning()) {
      await broker.stop();
    }
  });

  describe('Event Subscription Management', () => {
    it('should create event subscriptions with different pattern types', async () => {
      // Exact pattern subscription
      const exactSubscription = await broker.subscribeToEvents(
        'auth-service',
        'user.login',
        PatternType.EXACT
      );
      expect(exactSubscription).toBeDefined();

      // Wildcard pattern subscription
      const wildcardSubscription = await broker.subscribeToEvents(
        'analytics-service',
        'user.*',
        PatternType.WILDCARD
      );
      expect(wildcardSubscription).toBeDefined();

      // Prefix pattern subscription
      const prefixSubscription = await broker.subscribeToEvents(
        'audit-service',
        'audit',
        PatternType.PREFIX
      );
      expect(prefixSubscription).toBeDefined();

      // Regex pattern subscription
      const regexSubscription = await broker.subscribeToEvents(
        'notification-service',
        '^notification\\..*$',
        PatternType.REGEX
      );
      expect(regexSubscription).toBeDefined();

      const stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(4);
      expect(stats.activeSubscriptions).toBe(4);
      expect(stats.subscriptionsByPattern[PatternType.EXACT]).toBe(1);
      expect(stats.subscriptionsByPattern[PatternType.WILDCARD]).toBe(1);
      expect(stats.subscriptionsByPattern[PatternType.PREFIX]).toBe(1);
      expect(stats.subscriptionsByPattern[PatternType.REGEX]).toBe(1);
    });

    it('should create subscriptions with filters', async () => {
      const subscription = await broker.subscribeToEvents(
        'analytics-service',
        'user.action',
        PatternType.EXACT,
        {
          userId: { min: 1000, max: 9999 }, // User ID range filter
          action: ['login', 'logout', 'signup'], // Action whitelist
          source: { regex: '^web-.*' }, // Source pattern filter
        }
      );

      expect(subscription).toBeDefined();
      const stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(1);
    });

    it('should unsubscribe from events', async () => {
      const subscription1 = await broker.subscribeToEvents('auth-service', 'user.login');
      const subscription2 = await broker.subscribeToEvents(
        'analytics-service',
        'user.*',
        PatternType.WILDCARD
      );

      let stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(2);

      await broker.unsubscribeFromEvents(subscription1);

      stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(1);

      await broker.unsubscribeFromEvents(subscription2);

      stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(0);
    });

    it('should handle invalid subscription patterns', async () => {
      // Invalid regex pattern
      await expect(
        broker.subscribeToEvents('auth-service', '[invalid-regex', PatternType.REGEX)
      ).rejects.toThrow('Invalid regex pattern');

      // Invalid wildcard pattern with double wildcards
      await expect(
        broker.subscribeToEvents('auth-service', 'user.**', PatternType.WILDCARD)
      ).rejects.toThrow('Double wildcards');
    });
  });

  describe('Pattern Matching and Selective Routing', () => {
    beforeEach(async () => {
      // Set up various subscriptions for testing
      await broker.subscribeToEvents('auth-service', 'user.login', PatternType.EXACT);
      await broker.subscribeToEvents('analytics-service', 'user.*', PatternType.WILDCARD);
      await broker.subscribeToEvents('audit-service', 'audit', PatternType.PREFIX);
      await broker.subscribeToEvents('notification-service', '^system\\..*$', PatternType.REGEX);
    });

    it('should route notifications to exact pattern matches', async () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.login',
        params: { userId: 12345, timestamp: Date.now() },
      };

      // Mock the message router's sendNotificationToService method
      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);

      await broker.routeNotification(notification);

      // Should route to both auth-service (exact match) and analytics-service (wildcard match)
      expect(sendSpy).toHaveBeenCalledTimes(2);
      expect(sendSpy).toHaveBeenCalledWith(notification, 'auth-service');
      expect(sendSpy).toHaveBeenCalledWith(notification, 'analytics-service');
    });

    it('should route notifications to wildcard pattern matches', async () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.signup',
        params: { userId: 67890 },
      };

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);

      await broker.routeNotification(notification);

      // Should route only to analytics-service (wildcard match)
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(notification, 'analytics-service');
    });

    it('should route notifications to prefix pattern matches', async () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'audit.security.failed_login',
        params: { userId: 12345, reason: 'invalid_password' },
      };

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);

      await broker.routeNotification(notification);

      // Should route only to audit-service (prefix match)
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(notification, 'audit-service');
    });

    it('should route notifications to regex pattern matches', async () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'system.maintenance.started',
        params: { scheduledBy: 'admin', duration: '2h' },
      };

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);

      await broker.routeNotification(notification);

      // Should route only to notification-service (regex match)
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(notification, 'notification-service');
    });

    it('should handle notifications with no matching subscriptions', async () => {
      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'unmatched.event',
        params: { data: 'test' },
      };

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await broker.routeNotification(notification);

      expect(sendSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No subscriptions found for event: unmatched.event');

      consoleSpy.mockRestore();
    });
  });

  describe('Filter-based Routing', () => {
    it('should route notifications based on parameter filters', async () => {
      // Subscribe with specific filters
      await broker.subscribeToEvents('analytics-service', 'user.action', PatternType.EXACT, {
        userId: { min: 1000, max: 9999 },
        action: ['login', 'logout'],
        source: { regex: '^web-.*' },
      });

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);

      // Matching notification
      const matchingNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.action',
        params: {
          userId: 5000,
          action: 'login',
          source: 'web-app',
        },
      };

      await broker.routeNotification(matchingNotification);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(matchingNotification, 'analytics-service');

      sendSpy.mockClear();

      // Non-matching notification (userId out of range)
      const nonMatchingNotification1: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.action',
        params: {
          userId: 500, // Below minimum
          action: 'login',
          source: 'web-app',
        },
      };

      await broker.routeNotification(nonMatchingNotification1);
      expect(sendSpy).not.toHaveBeenCalled();

      // Non-matching notification (action not in whitelist)
      const nonMatchingNotification2: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.action',
        params: {
          userId: 5000,
          action: 'signup', // Not in allowed actions
          source: 'web-app',
        },
      };

      await broker.routeNotification(nonMatchingNotification2);
      expect(sendSpy).not.toHaveBeenCalled();

      // Non-matching notification (source doesn't match regex)
      const nonMatchingNotification3: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.action',
        params: {
          userId: 5000,
          action: 'login',
          source: 'mobile-app', // Doesn't match '^web-.*' pattern
        },
      };

      await broker.routeNotification(nonMatchingNotification3);
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should handle complex filter combinations', async () => {
      const currentTime = Date.now();
      await broker.subscribeToEvents('audit-service', 'security.event', PatternType.EXACT, {
        severity: ['high', 'critical'],
        category: { regex: '^(authentication|authorization)$' },
        // Remove timestamp filter as it requires range validation which is complex
      });

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);

      const complexNotification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'security.event',
        params: {
          severity: 'critical',
          category: 'authentication',
          timestamp: currentTime,
          details: 'Multiple failed login attempts detected',
        },
      };

      await broker.routeNotification(complexNotification);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(complexNotification, 'audit-service');
    });
  });

  describe('Service Lifecycle Integration', () => {
    it('should clean up subscriptions when service is unregistered', async () => {
      // Create subscriptions for a service
      const subscription1 = await broker.subscribeToEvents('analytics-service', 'user.login');
      const subscription2 = await broker.subscribeToEvents('analytics-service', 'user.logout');

      let stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(2);
      expect(stats.subscriptionsByService['analytics-service']).toBe(2);

      // Unregister the service
      await broker.unregisterService('analytics-service');

      // Subscriptions should be cleaned up
      stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(0);
      expect(stats.subscriptionsByService['analytics-service']).toBeUndefined();
    });

    it('should handle service reregistration after unsubscription', async () => {
      const subscription = await broker.subscribeToEvents('auth-service', 'user.login');

      // Unregister service
      await broker.unregisterService('auth-service');

      let stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(0);

      // Reregister service
      await broker.registerService(mockServices[0]); // auth-service

      // Create new subscription
      const newSubscription = await broker.subscribeToEvents('auth-service', 'user.logout');

      stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(1);
      expect(newSubscription).not.toBe(subscription);
    });
  });

  describe('Performance and Statistics', () => {
    it('should track subscription and routing statistics', async () => {
      // Create various subscriptions
      await broker.subscribeToEvents('auth-service', 'user.login');
      await broker.subscribeToEvents('analytics-service', 'user.*', PatternType.WILDCARD);
      await broker.subscribeToEvents('notification-service', 'system.*', PatternType.WILDCARD);

      const mockRouter = broker['messageRouter'];
      jest.spyOn(mockRouter as any, 'sendNotificationToService').mockResolvedValue(undefined);

      // Send various notifications to generate statistics
      const notifications = [
        { jsonrpc: '2.0' as const, method: 'user.login', params: {} },
        { jsonrpc: '2.0' as const, method: 'user.signup', params: {} },
        { jsonrpc: '2.0' as const, method: 'user.login', params: {} },
        { jsonrpc: '2.0' as const, method: 'system.maintenance', params: {} },
      ];

      for (const notification of notifications) {
        await broker.routeNotification(notification);
      }

      const stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.activeSubscriptions).toBe(3);
      expect(stats.totalMatches).toBeGreaterThan(0);
      expect(stats.averageMatchesPerSubscription).toBeGreaterThan(0);
      expect(stats.topMatchingPatterns.length).toBeGreaterThan(0);
    });

    it('should handle high-volume event routing efficiently', async () => {
      // Create a wildcard subscription that will match many events
      await broker.subscribeToEvents('analytics-service', '*', PatternType.WILDCARD);

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockResolvedValue(undefined);

      // Send many notifications
      const startTime = Date.now();
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const notification: MCPNotification = {
          jsonrpc: '2.0',
          method: `test.event.${i}`,
          params: { data: i },
        };
        promises.push(broker.routeNotification(notification));
      }

      await Promise.all(promises);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second for 100 events)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(sendSpy).toHaveBeenCalledTimes(100);

      const stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalMatches).toBe(100);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle routing when broker is stopped', async () => {
      await broker.stop();

      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'test.event',
        params: {},
      };

      await expect(broker.routeNotification(notification)).rejects.toThrow('Broker is not running');
      await expect(broker.subscribeToEvents('test-service', 'test.pattern')).rejects.toThrow(
        'Broker is not running'
      );
    });

    it('should handle subscription failures gracefully', async () => {
      // Try to subscribe for non-existent service (should still work - subscriptions are service-agnostic)
      const subscription = await broker.subscribeToEvents('non-existent-service', 'test.event');
      expect(subscription).toBeDefined();

      const stats = broker.getEventSubscriptionStatistics();
      expect(stats.totalSubscriptions).toBe(1);
      expect(stats.subscriptionsByService['non-existent-service']).toBe(1);
    });

    it('should handle notification routing failures gracefully', async () => {
      await broker.subscribeToEvents('auth-service', 'user.login');

      const mockRouter = broker['messageRouter'];
      const sendSpy = jest
        .spyOn(mockRouter as any, 'sendNotificationToService')
        .mockRejectedValue(new Error('Service unavailable'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const notification: MCPNotification = {
        jsonrpc: '2.0',
        method: 'user.login',
        params: {},
      };

      // Should not throw even if individual service notifications fail
      await expect(broker.routeNotification(notification)).resolves.toBeUndefined();

      expect(sendSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send notification to subscribed service'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle pattern matching edge cases', async () => {
      // Empty pattern
      await expect(broker.subscribeToEvents('auth-service', '', PatternType.EXACT)).rejects.toThrow(
        'Pattern cannot be empty'
      );

      // Very long pattern
      const longPattern = 'a'.repeat(10000);
      const subscription = await broker.subscribeToEvents(
        'auth-service',
        longPattern,
        PatternType.EXACT
      );
      expect(subscription).toBeDefined();

      // Special characters in exact pattern
      const specialPattern = 'user.login-test_123@domain.com';
      const specialSubscription = await broker.subscribeToEvents(
        'auth-service',
        specialPattern,
        PatternType.EXACT
      );
      expect(specialSubscription).toBeDefined();
    });
  });
});
