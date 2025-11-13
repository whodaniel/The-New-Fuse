"use strict";
/**
 * Advanced Routing Integration Tests
 *
 * Comprehensive integration tests for advanced routing features including
 * event subscription, pattern matching, selective routing, and performance monitoring.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MCPBroker_1 = require("./MCPBroker");
const common_1 = require("../types/common");
const EventSubscriptionManager_1 = require("./EventSubscriptionManager");
(0, vitest_1.describe)('Advanced Routing Integration', () => {
    let broker;
    let mockServices;
    let config;
    (0, vitest_1.beforeEach)(async () => {
        vitest_1.vi.clearAllMocks();
        config = {
            name: 'test-advanced-routing-broker',
            version: '1.0.0',
            registry: {
                type: 'memory',
                serviceTTL: 300,
                cleanupInterval: 60
            },
            healthCheck: {
                enabled: false, // Disable health checking for integration tests
                interval: 30,
                timeout: 5000,
                failureThreshold: 3,
                recoveryThreshold: 2
            },
            loadBalancing: {
                defaultStrategy: common_1.LoadBalancingStrategy.ROUND_ROBIN,
                useHealthCheck: false, // Disable health check integration for tests
                stickySession: false
            }
        };
        broker = new MCPBroker_1.MCPBroker(config);
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
                status: common_1.ServiceStatus.ONLINE,
                metadata: { domain: 'auth', tier: 'critical' },
                registeredAt: new Date(),
                lastHeartbeat: new Date(),
                tags: ['security', 'authentication']
            },
            {
                id: 'analytics-service',
                name: 'Analytics Service',
                version: '1.0.0',
                endpoint: 'http://localhost:3002',
                capabilities: ['analytics', 'reporting'],
                resources: [],
                tools: [],
                status: common_1.ServiceStatus.ONLINE,
                metadata: { domain: 'analytics', tier: 'standard' },
                registeredAt: new Date(),
                lastHeartbeat: new Date(),
                tags: ['analytics', 'metrics']
            },
            {
                id: 'notification-service',
                name: 'Notification Service',
                version: '1.0.0',
                endpoint: 'http://localhost:3003',
                capabilities: ['notifications', 'messaging'],
                resources: [],
                tools: [],
                status: common_1.ServiceStatus.ONLINE,
                metadata: { domain: 'communication', tier: 'standard' },
                registeredAt: new Date(),
                lastHeartbeat: new Date(),
                tags: ['notifications', 'communication']
            },
            {
                id: 'audit-service',
                name: 'Audit Service',
                version: '1.0.0',
                endpoint: 'http://localhost:3004',
                capabilities: ['audit', 'logging'],
                resources: [],
                tools: [],
                status: common_1.ServiceStatus.ONLINE,
                metadata: { domain: 'compliance', tier: 'critical' },
                registeredAt: new Date(),
                lastHeartbeat: new Date(),
                tags: ['audit', 'compliance', 'logging']
            }
        ];
        // Register all services
        for (const service of mockServices) {
            await broker.registerService(service);
        }
    });
    (0, vitest_1.afterEach)(async () => {
        if (broker.isRunning()) {
            await broker.stop();
        }
    });
    (0, vitest_1.describe)('Event Subscription Management', () => {
        (0, vitest_1.it)('should create event subscriptions with different pattern types', async () => {
            // Exact pattern subscription
            const exactSubscription = await broker.subscribeToEvents('auth-service', 'user.login', EventSubscriptionManager_1.PatternType.EXACT);
            (0, vitest_1.expect)(exactSubscription).toBeDefined();
            // Wildcard pattern subscription
            const wildcardSubscription = await broker.subscribeToEvents('analytics-service', 'user.*', EventSubscriptionManager_1.PatternType.WILDCARD);
            (0, vitest_1.expect)(wildcardSubscription).toBeDefined();
            // Prefix pattern subscription
            const prefixSubscription = await broker.subscribeToEvents('audit-service', 'audit', EventSubscriptionManager_1.PatternType.PREFIX);
            (0, vitest_1.expect)(prefixSubscription).toBeDefined();
            // Regex pattern subscription
            const regexSubscription = await broker.subscribeToEvents('notification-service', '^notification\\..*$', EventSubscriptionManager_1.PatternType.REGEX);
            (0, vitest_1.expect)(regexSubscription).toBeDefined();
            const stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(4);
            (0, vitest_1.expect)(stats.activeSubscriptions).toBe(4);
            (0, vitest_1.expect)(stats.subscriptionsByPattern[EventSubscriptionManager_1.PatternType.EXACT]).toBe(1);
            (0, vitest_1.expect)(stats.subscriptionsByPattern[EventSubscriptionManager_1.PatternType.WILDCARD]).toBe(1);
            (0, vitest_1.expect)(stats.subscriptionsByPattern[EventSubscriptionManager_1.PatternType.PREFIX]).toBe(1);
            (0, vitest_1.expect)(stats.subscriptionsByPattern[EventSubscriptionManager_1.PatternType.REGEX]).toBe(1);
        });
        (0, vitest_1.it)('should create subscriptions with filters', async () => {
            const subscription = await broker.subscribeToEvents('analytics-service', 'user.action', EventSubscriptionManager_1.PatternType.EXACT, {
                userId: { min: 1000, max: 9999 }, // User ID range filter
                action: ['login', 'logout', 'signup'], // Action whitelist
                source: { regex: '^web-.*' } // Source pattern filter
            });
            (0, vitest_1.expect)(subscription).toBeDefined();
            const stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(1);
        });
        (0, vitest_1.it)('should unsubscribe from events', async () => {
            const subscription1 = await broker.subscribeToEvents('auth-service', 'user.login');
            const subscription2 = await broker.subscribeToEvents('analytics-service', 'user.*', EventSubscriptionManager_1.PatternType.WILDCARD);
            let stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(2);
            await broker.unsubscribeFromEvents(subscription1);
            stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(1);
            await broker.unsubscribeFromEvents(subscription2);
            stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(0);
        });
        (0, vitest_1.it)('should handle invalid subscription patterns', async () => {
            // Invalid regex pattern
            await (0, vitest_1.expect)(broker.subscribeToEvents('auth-service', '[invalid-regex', EventSubscriptionManager_1.PatternType.REGEX)).rejects.toThrow('Invalid regex pattern');
            // Invalid wildcard pattern with double wildcards
            await (0, vitest_1.expect)(broker.subscribeToEvents('auth-service', 'user.**', EventSubscriptionManager_1.PatternType.WILDCARD)).rejects.toThrow('Double wildcards');
        });
    });
    (0, vitest_1.describe)('Pattern Matching and Selective Routing', () => {
        (0, vitest_1.beforeEach)(async () => {
            // Set up various subscriptions for testing
            await broker.subscribeToEvents('auth-service', 'user.login', EventSubscriptionManager_1.PatternType.EXACT);
            await broker.subscribeToEvents('analytics-service', 'user.*', EventSubscriptionManager_1.PatternType.WILDCARD);
            await broker.subscribeToEvents('audit-service', 'audit', EventSubscriptionManager_1.PatternType.PREFIX);
            await broker.subscribeToEvents('notification-service', '^system\\..*$', EventSubscriptionManager_1.PatternType.REGEX);
        });
        (0, vitest_1.it)('should route notifications to exact pattern matches', async () => {
            const notification = {
                jsonrpc: '2.0',
                method: 'user.login',
                params: { userId: 12345, timestamp: Date.now() }
            };
            // Mock the message router's sendNotificationToService method
            const mockRouter = broker['messageRouter'];
            const sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined);
            await broker.routeNotification(notification);
            // Should route to both auth-service (exact match) and analytics-service (wildcard match)
            (0, vitest_1.expect)(sendSpy).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(sendSpy).toHaveBeenCalledWith(notification, 'auth-service');
            (0, vitest_1.expect)(sendSpy).toHaveBeenCalledWith(notification, 'analytics-service');
        });
        (0, vitest_1.it)('should route notifications to wildcard pattern matches', async () => {
            const notification = {
                jsonrpc: '2.0',
                method: 'user.signup',
                params: { userId: 67890 }
            };
            const mockRouter = broker['messageRouter'];
            const sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined);
            await broker.routeNotification(notification);
            // Should route only to analytics-service (wildcard match)
            (0, vitest_1.expect)(sendSpy).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(sendSpy).toHaveBeenCalledWith(notification, 'analytics-service');
        });
        (0, vitest_1.it)('should route notifications to prefix pattern matches', async () => {
            const notification = {
                jsonrpc: '2.0',
                method: 'audit.security.failed_login',
                params: { userId: 12345, reason: 'invalid_password',
                    const: mockRouter = broker['messageRouter'],
                    const: sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined),
                    await: broker.routeNotification(notification),
                    // Should route only to audit-service (prefix match)
                    expect(sendSpy) { }, : .toHaveBeenCalledTimes(1),
                    expect(sendSpy) { }, : .toHaveBeenCalledWith(notification, 'audit-service') }
            };
        });
        (0, vitest_1.it)('should route notifications to regex pattern matches', async () => {
            const notification = {
                jsonrpc: '2.0',
                method: 'system.maintenance.started',
                params: { scheduledBy: 'admin', duration: '2h',
                    const: mockRouter = broker['messageRouter'],
                    const: sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined),
                    await: broker.routeNotification(notification),
                    // Should route only to notification-service (regex match)
                    expect(sendSpy) { }, : .toHaveBeenCalledTimes(1),
                    expect(sendSpy) { }, : .toHaveBeenCalledWith(notification, 'notification-service') }
            };
        });
        (0, vitest_1.it)('should handle notifications with no matching subscriptions', async () => {
            const notification = {
                jsonrpc: '2.0',
                method: 'unmatched.event',
                params: { data: 'test',
                    const: mockRouter = broker['messageRouter'],
                    const: sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined),
                    const: consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { }),
                    await: broker.routeNotification(notification),
                    expect(sendSpy) { }, : .not.toHaveBeenCalled(),
                    expect(consoleSpy) { }, : .toHaveBeenCalledWith('No subscriptions found for event: unmatched.event'),
                    consoleSpy, : .mockRestore() }
            };
        });
    });
    (0, vitest_1.describe)('Filter-based Routing', () => {
        (0, vitest_1.it)('should route notifications based on parameter filters', async () => {
            // Subscribe with specific filters
            await broker.subscribeToEvents('analytics-service', 'user.action', EventSubscriptionManager_1.PatternType.EXACT, {
                userId: { min: 1000, max: 9999 },
                action: ['login', 'logout'],
                source: { regex: '^web-.*' }
            });
            const mockRouter = broker['messageRouter'];
            const sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined);
            // Matching notification
            const matchingNotification = {
                jsonrpc: '2.0',
                method: 'user.action',
                params: {
                    userId: 5000,
                    action: 'login',
                    source: 'web-app',
                    await: broker.routeNotification(matchingNotification),
                    expect(sendSpy) { }, : .toHaveBeenCalledTimes(1),
                    expect(sendSpy) { }, : .toHaveBeenCalledWith(matchingNotification, 'analytics-service'),
                    sendSpy, : .mockClear(),
                    // Non-matching notification (userId out of range)
                    const: nonMatchingNotification1, MCPNotification: IMCPMessage_1.MCPNotification = {
                        jsonrpc: '2.0',
                        method: 'user.action',
                        params: {
                            userId: 500, // Below minimum
                            action: 'login',
                            source: 'web-app',
                            await: broker.routeNotification(nonMatchingNotification1),
                            expect(sendSpy) { }, : .not.toHaveBeenCalled(),
                            // Non-matching notification (action not in whitelist)
                            const: nonMatchingNotification2, MCPNotification: IMCPMessage_1.MCPNotification = {
                                jsonrpc: '2.0',
                                method: 'user.action',
                                params: {
                                    userId: 5000,
                                    action: 'signup', // Not in allowed actions
                                    source: 'web-app',
                                    await: broker.routeNotification(nonMatchingNotification2),
                                    expect(sendSpy) { }, : .not.toHaveBeenCalled(),
                                    // Non-matching notification (source doesn't match regex)
                                    const: nonMatchingNotification3, MCPNotification: IMCPMessage_1.MCPNotification = {
                                        jsonrpc: '2.0',
                                        method: 'user.action',
                                        params: {
                                            userId: 5000,
                                            action: 'login',
                                            source: 'mobile-app' // Doesn't match '^web-.*' pattern
                                        }
                                    },
                                    await: broker.routeNotification(nonMatchingNotification3),
                                    expect(sendSpy) { }, : .not.toHaveBeenCalled()
                                }
                            }
                        }
                    }
                }
            };
        });
        (0, vitest_1.it)('should handle complex filter combinations', async () => {
            const currentTime = Date.now();
            await broker.subscribeToEvents('audit-service', 'security.event', EventSubscriptionManager_1.PatternType.EXACT, {
                severity: ['high', 'critical'],
                category: { regex: '^(authentication|authorization)$' }
                // Remove timestamp filter as it requires range validation which is complex
            });
            const mockRouter = broker['messageRouter'];
            const sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined);
            const complexNotification = {
                jsonrpc: '2.0',
                method: 'security.event',
                params: {
                    severity: 'critical',
                    category: 'authentication',
                    timestamp: currentTime,
                    details: 'Multiple failed login attempts detected',
                    await: broker.routeNotification(complexNotification),
                    expect(sendSpy) { }, : .toHaveBeenCalledTimes(1),
                    expect(sendSpy) { }, : .toHaveBeenCalledWith(complexNotification, 'audit-service')
                }
            };
        });
    });
    (0, vitest_1.describe)('Service Lifecycle Integration', () => {
        (0, vitest_1.it)('should clean up subscriptions when service is unregistered', async () => {
            // Create subscriptions for a service
            const subscription1 = await broker.subscribeToEvents('analytics-service', 'user.login');
            const subscription2 = await broker.subscribeToEvents('analytics-service', 'user.logout');
            let stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(2);
            (0, vitest_1.expect)(stats.subscriptionsByService['analytics-service']).toBe(2);
            // Unregister the service
            await broker.unregisterService('analytics-service');
            // Subscriptions should be cleaned up
            stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(0);
            (0, vitest_1.expect)(stats.subscriptionsByService['analytics-service']).toBeUndefined();
        });
        (0, vitest_1.it)('should handle service reregistration after unsubscription', async () => {
            const subscription = await broker.subscribeToEvents('auth-service', 'user.login');
            // Unregister service
            await broker.unregisterService('auth-service');
            let stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(0);
            // Reregister service
            await broker.registerService(mockServices[0]); // auth-service
            // Create new subscription
            const newSubscription = await broker.subscribeToEvents('auth-service', 'user.logout');
            stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(1);
            (0, vitest_1.expect)(newSubscription).not.toBe(subscription);
        });
    });
    (0, vitest_1.describe)('Performance and Statistics', () => {
        (0, vitest_1.it)('should track subscription and routing statistics', async () => {
            // Create various subscriptions
            await broker.subscribeToEvents('auth-service', 'user.login');
            await broker.subscribeToEvents('analytics-service', 'user.*', EventSubscriptionManager_1.PatternType.WILDCARD);
            await broker.subscribeToEvents('notification-service', 'system.*', EventSubscriptionManager_1.PatternType.WILDCARD);
            const mockRouter = broker['messageRouter'];
            vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined);
            // Send various notifications to generate statistics
            const notifications = [
                { jsonrpc: '2.0', method: 'user.login', params: {} },
                { jsonrpc: '2.0', method: 'user.signup', params: {} },
                { jsonrpc: '2.0', method: 'user.login', params: {} },
                { jsonrpc: '2.0', method: 'system.maintenance', params: {} },
            ];
            for (const notification of notifications) {
                await broker.routeNotification(notification);
            }
            const stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(3);
            (0, vitest_1.expect)(stats.activeSubscriptions).toBe(3);
            (0, vitest_1.expect)(stats.totalMatches).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.averageMatchesPerSubscription).toBeGreaterThan(0);
            (0, vitest_1.expect)(stats.topMatchingPatterns.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle high-volume event routing efficiently', async () => {
            // Create a wildcard subscription that will match many events
            await broker.subscribeToEvents('analytics-service', '*', EventSubscriptionManager_1.PatternType.WILDCARD);
            const mockRouter = broker['messageRouter'];
            const sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService').mockResolvedValue(undefined);
            // Send many notifications
            const startTime = Date.now();
            const promises = [];
            for (let i = 0; i < 100; i++) {
                const notification = {
                    jsonrpc: '2.0',
                    method: `test.event.${i}`,
                    params: { data: i }
                };
                promises.push(broker.routeNotification(notification));
            }
            await Promise.all(promises);
            const endTime = Date.now();
            // Should complete within reasonable time (less than 1 second for 100 events)
            (0, vitest_1.expect)(endTime - startTime).toBeLessThan(1000);
            (0, vitest_1.expect)(sendSpy).toHaveBeenCalledTimes(100);
            const stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalMatches).toBe(100);
        });
    });
    (0, vitest_1.describe)('Error Handling and Edge Cases', () => {
        (0, vitest_1.it)('should handle routing when broker is stopped', async () => {
            await broker.stop();
            const notification = {
                jsonrpc: '2.0',
                method: 'test.event',
                params: {}
            };
            await (0, vitest_1.expect)(broker.routeNotification(notification)).rejects.toThrow('Broker is not running');
            await (0, vitest_1.expect)(broker.subscribeToEvents('test-service', 'test.pattern')).rejects.toThrow('Broker is not running');
        });
        (0, vitest_1.it)('should handle subscription failures gracefully', async () => {
            // Try to subscribe for non-existent service (should still work - subscriptions are service-agnostic)
            const subscription = await broker.subscribeToEvents('non-existent-service', 'test.event');
            (0, vitest_1.expect)(subscription).toBeDefined();
            const stats = broker.getEventSubscriptionStatistics();
            (0, vitest_1.expect)(stats.totalSubscriptions).toBe(1);
            (0, vitest_1.expect)(stats.subscriptionsByService['non-existent-service']).toBe(1);
        });
        (0, vitest_1.it)('should handle notification routing failures gracefully', async () => {
            await broker.subscribeToEvents('auth-service', 'user.login');
            const mockRouter = broker['messageRouter'];
            const sendSpy = vitest_1.vi.spyOn(mockRouter, 'sendNotificationToService')
                .mockRejectedValue(new Error('Service unavailable'));
            const consoleErrorSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
            const notification = {
                jsonrpc: '2.0',
                method: 'user.login',
                params: {}
            };
            // Should not throw even if individual service notifications fail
            await (0, vitest_1.expect)(broker.routeNotification(notification)).resolves.toBeUndefined();
            (0, vitest_1.expect)(sendSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(consoleErrorSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Failed to send notification to subscribed service'), vitest_1.expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
        (0, vitest_1.it)('should handle pattern matching edge cases', async () => {
            // Empty pattern
            await (0, vitest_1.expect)(broker.subscribeToEvents('auth-service', '', EventSubscriptionManager_1.PatternType.EXACT)).rejects.toThrow('Pattern cannot be empty');
            // Very long pattern
            const longPattern = 'a'.repeat(10000);
            const subscription = await broker.subscribeToEvents('auth-service', longPattern, EventSubscriptionManager_1.PatternType.EXACT);
            (0, vitest_1.expect)(subscription).toBeDefined();
            // Special characters in exact pattern
            const specialPattern = 'user.login-test_123@domain.com';
            const specialSubscription = await broker.subscribeToEvents('auth-service', specialPattern, EventSubscriptionManager_1.PatternType.EXACT);
            (0, vitest_1.expect)(specialSubscription).toBeDefined();
        });
    });
});
//# sourceMappingURL=AdvancedRouting.integration.test.js.map