/**
 * LoadBalancer Unit Tests
 * 
 * Comprehensive unit tests for the LoadBalancer class covering
 * all load balancing strategies, service management, and statistics.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoadBalancer } from './LoadBalancer';
import { MCPServiceInfo, LoadBalancingConfig } from '../types';
import { LoadBalancingStrategy, ServiceStatus } from '../types/common';
import { MCPErrorClass } from '../types/error';

describe('LoadBalancer', () => {
  let loadBalancer: LoadBalancer;
  let mockServices: MCPServiceInfo[];
  let config: LoadBalancingConfig;

  beforeEach(() => {
    config = {
      defaultStrategy: LoadBalancingStrategy.ROUND_ROBIN,
      useHealthCheck: true,
      stickySession: false,
      weights: {
        'service-1': 3,
        'service-2': 2,
        'service-3': 1
      }
    };

    loadBalancer = new LoadBalancer(config);

    mockServices = [
      {
        id: 'service-1',
        name: 'High Priority Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3001',
        capabilities: ['database'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { priority: 'high' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.95
      },
      {
        id: 'service-2',
        name: 'Medium Priority Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3002',
        capabilities: ['cache'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: { priority: 'medium' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.88
      },
      {
        id: 'service-3',
        name: 'Low Priority Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3003',
        capabilities: ['analytics'],
        resources: [],
        tools: [],
        status: ServiceStatus.DEGRADED,
        metadata: { priority: 'low' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.65
      }
    ];

    // Add all services to load balancer
    mockServices.forEach(service => loadBalancer.addService(service));
  });

  describe('Service Management', () => {
    it('should add service correctly with proper weight', () => {
      const newService: MCPServiceInfo = {
        id: 'service-4',
        name: 'New Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3004',
        capabilities: ['storage'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      };

      loadBalancer.addService(newService);

      const allServices = loadBalancer.getAllServices();
      expect(allServices).toHaveLength(4);
      
      const addedService = allServices.find(instance => instance.service.id === 'service-4');
      expect(addedService).toBeDefined();
      expect(addedService!.weight).toBe(1); // Default weight since not specified in config
      expect(addedService!.isHealthy).toBe(true);
    });

    it('should remove service correctly and clean up sticky sessions', () => {
      // Setup sticky session
      const stickyConfig = { ...config, stickySession: true };
      const stickyLoadBalancer = new LoadBalancer(stickyConfig);
      mockServices.forEach(service => stickyLoadBalancer.addService(service));
      
      // Select service with session to create sticky mapping
      stickyLoadBalancer.selectService('test-session');
      
      // Remove the service
      stickyLoadBalancer.removeService('service-1');
      
      const allServices = stickyLoadBalancer.getAllServices();
      expect(allServices).toHaveLength(2);
      expect(allServices.find(instance => instance.service.id === 'service-1')).toBeUndefined();
    });

    it('should update service information correctly', () => {
      const updatedService: MCPServiceInfo = {
        ...mockServices[0],
        status: ServiceStatus.DEGRADED,
        healthScore: 0.5
      };

      loadBalancer.updateService(updatedService);

      const allServices = loadBalancer.getAllServices();
      const updatedInstance = allServices.find(instance => instance.service.id === 'service-1');
      expect(updatedInstance).toBeDefined();
      expect(updatedInstance!.service.status).toBe(ServiceStatus.DEGRADED);
      expect(updatedInstance!.isHealthy).toBe(false);
    });

    it('should mark service as healthy/unhealthy correctly', () => {
      // Initially service should be healthy
      let serviceInstance = loadBalancer.getAllServices().find(s => s.service.id === 'service-1');
      expect(serviceInstance!.isHealthy).toBe(true);

      // Mark as unhealthy
      loadBalancer.markServiceUnhealthy('service-1');
      serviceInstance = loadBalancer.getAllServices().find(s => s.service.id === 'service-1');
      expect(serviceInstance!.isHealthy).toBe(false);

      // Mark as healthy again
      loadBalancer.markServiceHealthy('service-1');
      serviceInstance = loadBalancer.getAllServices().find(s => s.service.id === 'service-1');
      expect(serviceInstance!.isHealthy).toBe(true);
    });
  });

  describe('Round Robin Strategy', () => {
    beforeEach(() => {
      config.defaultStrategy = LoadBalancingStrategy.ROUND_ROBIN;
      loadBalancer = new LoadBalancer(config);
      mockServices.forEach(service => loadBalancer.addService(service));
    });

    it('should distribute requests in round robin fashion', () => {
      const selections = [];
      for (let i = 0; i < 6; i++) {
        const selected = loadBalancer.selectService();
        selections.push(selected!.id);
      }

      // With health check enabled, only healthy services (service-1 and service-2) should be selected
      // Pattern should repeat: service-1, service-2, service-1, service-2, ...
      expect(selections).toEqual([
        'service-1', 'service-2', 'service-1', 'service-2', 'service-1', 'service-2'
      ]);
    });

    it('should skip unhealthy services when health check is enabled', () => {
      // Mark service-2 as unhealthy
      loadBalancer.markServiceUnhealthy('service-2');

      const selections = [];
      for (let i = 0; i < 4; i++) {
        const selected = loadBalancer.selectService();
        selections.push(selected!.id);
      }

      // Should only select service-1 (the only healthy service)
      expect(selections).toEqual(['service-1', 'service-1', 'service-1', 'service-1']);
    });

    it('should include all services when health check is disabled', () => {
      const noHealthCheckConfig = { ...config, useHealthCheck: false };
      const noHealthCheckBalancer = new LoadBalancer(noHealthCheckConfig);
      mockServices.forEach(service => noHealthCheckBalancer.addService(service));

      const selections = [];
      for (let i = 0; i < 6; i++) {
        const selected = noHealthCheckBalancer.selectService();
        selections.push(selected!.id);
      }

      // Should cycle through all services including the degraded one
      expect(selections).toEqual([
        'service-1', 'service-2', 'service-3', 'service-1', 'service-2', 'service-3'
      ]);
    });
  });

  describe('Least Connections Strategy', () => {
    beforeEach(() => {
      config.defaultStrategy = LoadBalancingStrategy.LEAST_CONNECTIONS;
      loadBalancer = new LoadBalancer(config);
      mockServices.forEach(service => loadBalancer.addService(service));
    });

    it('should select service with least connections', () => {
      // Initially all services have 0 connections
      const first = loadBalancer.selectService();
      expect(['service-1', 'service-2']).toContain(first!.id); // Either healthy service

      // Increment connections for the selected service
      loadBalancer.incrementConnections(first!.id);

      // Next selection should be the other healthy service
      const second = loadBalancer.selectService();
      expect(second!.id).not.toBe(first!.id);
      expect(['service-1', 'service-2']).toContain(second!.id);
    });

    it('should handle connection count management correctly', () => {
      const serviceId = 'service-1';
      
      // Initial connection count should be 0
      let serviceInstance = loadBalancer.getAllServices().find(s => s.service.id === serviceId);
      expect(serviceInstance!.connectionCount).toBe(0);

      // Increment connections
      loadBalancer.incrementConnections(serviceId);
      loadBalancer.incrementConnections(serviceId);
      
      serviceInstance = loadBalancer.getAllServices().find(s => s.service.id === serviceId);
      expect(serviceInstance!.connectionCount).toBe(2);

      // Decrement connections
      loadBalancer.decrementConnections(serviceId);
      
      serviceInstance = loadBalancer.getAllServices().find(s => s.service.id === serviceId);
      expect(serviceInstance!.connectionCount).toBe(1);

      // Decrement below zero should stay at zero
      loadBalancer.decrementConnections(serviceId);
      loadBalancer.decrementConnections(serviceId);
      
      serviceInstance = loadBalancer.getAllServices().find(s => s.service.id === serviceId);
      expect(serviceInstance!.connectionCount).toBe(0);
    });
  });

  describe('Weighted Strategy', () => {
    beforeEach(() => {
      config.defaultStrategy = LoadBalancingStrategy.WEIGHTED;
      loadBalancer = new LoadBalancer(config);
      mockServices.forEach(service => loadBalancer.addService(service));
    });

    it('should distribute requests according to weights over many selections', () => {
      const selections: Record<string, number> = {};
      const totalSelections = 1000;

      for (let i = 0; i < totalSelections; i++) {
        const selected = loadBalancer.selectService();
        const serviceId = selected!.id;
        selections[serviceId] = (selections[serviceId] || 0) + 1;
      }

      // Service-1 has weight 3, service-2 has weight 2
      // So service-1 should get ~60% and service-2 should get ~40%
      const service1Percentage = (selections['service-1'] || 0) / totalSelections;
      const service2Percentage = (selections['service-2'] || 0) / totalSelections;

      // Allow some variance due to randomness
      expect(service1Percentage).toBeGreaterThan(0.55);
      expect(service1Percentage).toBeLessThan(0.65);
      expect(service2Percentage).toBeGreaterThan(0.35);
      expect(service2Percentage).toBeLessThan(0.45);
      
      // Service-3 is unhealthy so should not be selected
      expect(selections['service-3']).toBeUndefined();
    });

    it('should fallback to random when all weights are zero', () => {
      const zeroWeightConfig = { ...config, weights: { 'service-1': 0, 'service-2': 0, 'service-3': 0 } };
      const zeroWeightBalancer = new LoadBalancer(zeroWeightConfig);
      mockServices.forEach(service => zeroWeightBalancer.addService(service));

      // Should not throw and should return a service
      const selected = zeroWeightBalancer.selectService();
      expect(selected).toBeDefined();
      expect(['service-1', 'service-2']).toContain(selected!.id); // Only healthy services
    });
  });

  describe('Random Strategy', () => {
    beforeEach(() => {
      config.defaultStrategy = LoadBalancingStrategy.RANDOM;
      loadBalancer = new LoadBalancer(config);
      mockServices.forEach(service => loadBalancer.addService(service));
    });

    it('should select services randomly', () => {
      const selections = new Set<string>();
      
      // Make many selections to ensure we get different services
      for (let i = 0; i < 50; i++) {
        const selected = loadBalancer.selectService();
        selections.add(selected!.id);
      }

      // Should select from healthy services only
      expect(selections.has('service-1')).toBe(true);
      expect(selections.has('service-2')).toBe(true);
      expect(selections.has('service-3')).toBe(false); // Unhealthy
    });

    it('should return different services in subsequent calls', () => {
      // This test might occasionally fail due to randomness, but very unlikely
      const selections = [];
      for (let i = 0; i < 10; i++) {
        selections.push(loadBalancer.selectService()!.id);
      }

      // Should not always return the same service (very unlikely with random selection)
      const uniqueSelections = new Set(selections);
      expect(uniqueSelections.size).toBeGreaterThan(1);
    });
  });

  describe('Sticky Session Support', () => {
    beforeEach(() => {
      config.stickySession = true;
      loadBalancer = new LoadBalancer(config);
      mockServices.forEach(service => loadBalancer.addService(service));
    });

    it('should maintain sticky sessions', () => {
      const sessionId = 'test-session-123';
      
      // First selection should create sticky mapping
      const first = loadBalancer.selectService(sessionId);
      expect(first).toBeDefined();
      
      // Subsequent selections with same session should return same service
      const second = loadBalancer.selectService(sessionId);
      const third = loadBalancer.selectService(sessionId);
      
      expect(second!.id).toBe(first!.id);
      expect(third!.id).toBe(first!.id);
    });

    it('should handle different sessions independently', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      
      const service1 = loadBalancer.selectService(session1);
      const service2 = loadBalancer.selectService(session2);
      
      // Different sessions can get different services
      // (Though they might get the same service by chance)
      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
      
      // But each session should be consistent
      expect(loadBalancer.selectService(session1)!.id).toBe(service1!.id);
      expect(loadBalancer.selectService(session2)!.id).toBe(service2!.id);
    });

    it('should clear sticky sessions correctly', () => {
      const sessionId = 'test-session';
      
      const first = loadBalancer.selectService(sessionId);
      expect(first).toBeDefined();
      
      // Clear the session
      loadBalancer.clearStickySession(sessionId);
      
      // Next selection might return a different service
      const second = loadBalancer.selectService(sessionId);
      expect(second).toBeDefined();
      // We can't guarantee it's different due to randomness, but the sticky mapping is cleared
    });

    it('should handle removed service in sticky session', () => {
      const sessionId = 'test-session';
      
      // Force selection of service-1
      vi.spyOn(Math, 'random').mockReturnValue(0); // This will select the first service
      const first = loadBalancer.selectService(sessionId);
      
      // Remove the service
      loadBalancer.removeService(first!.id);
      
      // Next selection should work and select from remaining services
      const second = loadBalancer.selectService(sessionId);
      expect(second).toBeDefined();
      expect(second!.id).not.toBe(first!.id);
      
      vi.restoreAllMocks();
    });
  });

  describe('Statistics and Metrics', () => {
    it('should provide accurate statistics', () => {
      // Add some request tracking
      loadBalancer.selectService();
      loadBalancer.selectService();
      loadBalancer.incrementConnections('service-1');

      const stats = loadBalancer.getStatistics();
      
      expect(stats.totalServices).toBe(3);
      expect(stats.healthyServices).toBe(2); // service-3 is degraded
      expect(stats.totalRequests).toBe(2); // Two services were requested
      expect(stats.requestDistribution['service-1']).toBeGreaterThan(0);
      expect(stats.averageConnectionsPerService).toBeGreaterThan(0);
    });

    it('should handle empty service list in statistics', () => {
      const emptyBalancer = new LoadBalancer(config);
      const stats = emptyBalancer.getStatistics();
      
      expect(stats.totalServices).toBe(0);
      expect(stats.healthyServices).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.averageConnectionsPerService).toBe(0);
    });

    it('should track request distribution correctly', () => {
      // Make specific selections to track distribution
      for (let i = 0; i < 3; i++) {
        loadBalancer.selectService();
      }
      
      const stats = loadBalancer.getStatistics();
      expect(stats.totalRequests).toBe(3);
      
      // Check that requests were distributed (exact distribution depends on strategy)
      const totalDistributed = Object.values(stats.requestDistribution)
        .reduce((sum, count) => sum + count, 0);
      expect(totalDistributed).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown load balancing strategy', () => {
      const invalidStrategy = 'invalid-strategy' as LoadBalancingStrategy;
      
      expect(() => {
        loadBalancer.selectService(undefined, invalidStrategy);
      }).toThrow(MCPErrorClass);
    });

    it('should return null when no services are available', () => {
      const emptyBalancer = new LoadBalancer(config);
      
      const selected = emptyBalancer.selectService();
      expect(selected).toBeNull();
    });

    it('should return null when all services are unhealthy and health check is enabled', () => {
      // Mark all services as unhealthy
      loadBalancer.markServiceUnhealthy('service-1');
      loadBalancer.markServiceUnhealthy('service-2');
      loadBalancer.markServiceUnhealthy('service-3');
      
      const selected = loadBalancer.selectService();
      expect(selected).toBeNull();
    });

    it('should handle service operations on non-existent services gracefully', () => {
      // These operations should not throw errors
      loadBalancer.removeService('non-existent-service');
      loadBalancer.updateService({
        id: 'non-existent-service',
        name: 'Non-existent',
        version: '1.0.0',
        endpoint: 'http://localhost:9999',
        capabilities: [],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      });
      loadBalancer.markServiceHealthy('non-existent-service');
      loadBalancer.markServiceUnhealthy('non-existent-service');
      loadBalancer.incrementConnections('non-existent-service');
      loadBalancer.decrementConnections('non-existent-service');
      
      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Strategy Override', () => {
    beforeEach(() => {
      config.defaultStrategy = LoadBalancingStrategy.ROUND_ROBIN;
      loadBalancer = new LoadBalancer(config);
      mockServices.forEach(service => loadBalancer.addService(service));
    });

    it('should use override strategy when provided', () => {
      // Default is round robin, but override with random
      const selected1 = loadBalancer.selectService(undefined, LoadBalancingStrategy.RANDOM);
      const selected2 = loadBalancer.selectService(undefined, LoadBalancingStrategy.RANDOM);
      
      expect(selected1).toBeDefined();
      expect(selected2).toBeDefined();
      expect(['service-1', 'service-2']).toContain(selected1!.id);
      expect(['service-1', 'service-2']).toContain(selected2!.id);
    });

    it('should fall back to default strategy when no override provided', () => {
      const selected1 = loadBalancer.selectService();
      const selected2 = loadBalancer.selectService();
      
      // Round robin should give us different services (or same if only one healthy)
      expect(['service-1', 'service-2']).toContain(selected1!.id);
      expect(['service-1', 'service-2']).toContain(selected2!.id);
    });
  });
});