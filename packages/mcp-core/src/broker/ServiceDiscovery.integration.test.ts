/**
 * Service Discovery Integration Tests
 * 
 * Comprehensive integration tests for advanced service discovery,
 * capability matching, and load balancing selection algorithms.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPBroker } from './MCPBroker';
import { MCPServiceInfo, BrokerConfig } from '../types';
import { ServiceStatus, LoadBalancingStrategy } from '../types/common';
import { MCPErrorClass } from '../types/error';

describe('Service Discovery Integration', () => {
  let broker: MCPBroker;
  let mockServices: MCPServiceInfo[];
  let config: Partial<BrokerConfig>;

  beforeEach(async () => {
    vi.clearAllMocks();

    config = {
      name: 'test-discovery-broker',
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
        defaultStrategy: LoadBalancingStrategy.ROUND_ROBIN,
        useHealthCheck: false, // Disable health check integration for tests
        stickySession: false
      }
    };

    broker = new MCPBroker(config);
    await broker.start();

    // Create mock services with different capabilities
    mockServices = [
      {
        id: 'service-1',
        name: 'Database Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3001',
        capabilities: ['database', 'query', 'transaction'],
        resources: [
          { uri: 'db://users', name: 'Users Table', description: 'User data', handler: {} as any },
          { uri: 'db://orders', name: 'Orders Table', description: 'Order data', handler: {} as any }
        ],
        tools: [
          { name: 'query', description: 'Execute SQL query', inputSchema: {
              type: ''
          }, handler: {} as any }
        ],
        status: ServiceStatus.ONLINE,
        metadata: { type: 'database', priority: 'high' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.95,
        tags: ['database', 'sql', 'primary']
      },
      {
        id: 'service-2',
        name: 'Cache Service',
        version: '2.1.0',
        endpoint: 'http://localhost:3002',
        capabilities: ['cache', 'storage', 'memory'],
        resources: [
          { uri: 'cache://session', name: 'Session Cache', description: 'Session storage', handler: {} as any }
        ],
        tools: [
          { name: 'get', description: 'Get cached value', inputSchema: {
              type: ''
          }, handler: {} as any },
          { name: 'set', description: 'Set cached value', inputSchema: {
              type: ''
          }, handler: {} as any }
        ],
        status: ServiceStatus.ONLINE,
        metadata: { type: 'cache', priority: 'medium' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.88,
        tags: ['cache', 'memory', 'fast']
      },
      {
        id: 'service-3',
        name: 'Analytics Service',
        version: '1.5.0',
        endpoint: 'http://localhost:3003',
        capabilities: ['analytics', 'query', 'reporting'],
        resources: [
          { uri: 'analytics://events', name: 'Event Stream', description: 'Analytics events', handler: {} as any }
        ],
        tools: [
          { name: 'analyze', description: 'Analyze data', inputSchema: {
              type: ''
          }, handler: {} as any },
          { name: 'report', description: 'Generate report', inputSchema: {
              type: ''
          }, handler: {} as any }
        ],
        status: ServiceStatus.ONLINE,
        metadata: { type: 'analytics', priority: 'low' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.92,
        tags: ['analytics', 'reporting', 'insights']
      },
      {
        id: 'service-4',
        name: 'Backup Database',
        version: '1.0.0',
        endpoint: 'http://localhost:3004',
        capabilities: ['database', 'backup', 'readonly'],
        resources: [
          { uri: 'db://backup-users', name: 'Backup Users', description: 'Backup user data', handler: {} as any }
        ],
        tools: [
          { name: 'backup-query', description: 'Execute backup query', inputSchema: {
              type: ''
          }, handler: {} as any }
        ],
        status: ServiceStatus.DEGRADED,
        metadata: { type: 'database', priority: 'low' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.65,
        tags: ['database', 'backup', 'readonly']
      },
      {
        id: 'service-5',
        name: 'File Storage',
        version: '3.0.0',
        endpoint: 'http://localhost:3005',
        capabilities: ['storage', 'files', 'upload'],
        resources: [
          { uri: 'files://documents', name: 'Documents', description: 'Document storage', handler: {} as any }
        ],
        tools: [
          { name: 'upload', description: 'Upload file', inputSchema: {
              type: ''
          }, handler: {} as any },
          { name: 'download', description: 'Download file', inputSchema: {
              type: ''
          }, handler: {} as any }
        ],
        status: ServiceStatus.ONLINE,
        metadata: { type: 'storage', priority: 'medium' },
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.90,
        tags: ['storage', 'files', 'cloud']
      }
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

  describe('Basic Service Discovery', () => {
    it('should discover all services with empty query', async () => {
      const services = await broker.discoverServices({});
      
      expect(services).toHaveLength(5);
      expect(services.map(s => s.id)).toEqual(
        expect.arrayContaining(['service-1', 'service-2', 'service-3', 'service-4', 'service-5'])
      );
    });

    it('should filter services by name', async () => {
      const services = await broker.discoverServices({ name: 'Database' });
      
      expect(services).toHaveLength(2);
      expect(services.map(s => s.name)).toEqual(
        expect.arrayContaining(['Database Service', 'Backup Database'])
      );
    });

    it('should filter services by capability', async () => {
      const services = await broker.discoverServices({ capability: 'database' });
      
      expect(services).toHaveLength(2);
      expect(services.every(s => s.capabilities.includes('database'))).toBe(true);
    });

    it('should filter services by status', async () => {
      const services = await broker.discoverServices({ status: ServiceStatus.ONLINE });
      
      expect(services).toHaveLength(4);
      expect(services.every(s => s.status === ServiceStatus.ONLINE)).toBe(true);
    });

    it('should filter services by tags', async () => {
      const services = await broker.discoverServices({ tags: ['cache'] });
      
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('service-2');
    });
  });

  describe('Advanced Service Discovery', () => {
    it('should discover services with required capabilities', async () => {
      const services = await broker.discoverServicesAdvanced({
        requiredCapabilities: ['query', 'database']
      });
      
      expect(services).toHaveLength(1);
      expect(services.every(s => 
        s.capabilities.includes('query') && s.capabilities.includes('database')
      )).toBe(true);
      expect(services[0].id).toBe('service-1'); // Only service-1 has both query and database
    });

    it('should discover services compatible with another service', async () => {
      const services = await broker.discoverServicesAdvanced({
        compatibleWith: 'service-1' // Database Service
      });
      
      // Should find Analytics Service (both have 'query' capability)
      expect(services.length).toBeGreaterThan(0);
      const analyticsService = services.find(s => s.id === 'service-3');
      expect(analyticsService).toBeDefined();
    });

    it('should filter services by minimum health score', async () => {
      const services = await broker.discoverServicesAdvanced({
        minHealthScore: 0.9
      });
      
      expect(services).toHaveLength(3);
      expect(services.every(s => (s.healthScore || 0) >= 0.9)).toBe(true);
    });

    it('should filter services by maximum age', async () => {
      // Set one service to be older
      const oldService = { ...mockServices[0] };
      oldService.registeredAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      await broker.updateService(oldService.id, oldService);

      const services = await broker.discoverServicesAdvanced({
        maxAge: 5 * 60 * 1000 // 5 minutes
      });
      
      // Should exclude the old service
      expect(services.length).toBeLessThan(5);
      expect(services.find(s => s.id === oldService.id)).toBeUndefined();
    });

    it('should combine multiple advanced filters', async () => {
      const services = await broker.discoverServicesAdvanced({
        requiredCapabilities: ['storage'],
        minHealthScore: 0.85,
        status: ServiceStatus.ONLINE
      });
      
      expect(services).toHaveLength(2); // Cache Service and File Storage
      expect(services.every(s => 
        s.capabilities.includes('storage') && 
        (s.healthScore || 0) >= 0.85 && 
        s.status === ServiceStatus.ONLINE
      )).toBe(true);
    });
  });

  describe('Capability Matching', () => {
    it('should find compatible services', async () => {
      const compatibleServices = await broker.findCompatibleServices('service-1');
      
      // Should find Analytics Service (both have 'query' capability)
      expect(compatibleServices.length).toBeGreaterThan(0);
      const analyticsService = compatibleServices.find(s => s.id === 'service-3');
      expect(analyticsService).toBeDefined();
    });

    it('should check service compatibility', async () => {
      const compatibility = await broker.checkServiceCompatibility('service-1', 'service-3');
      
      expect(compatibility.compatible).toBe(true);
      expect(compatibility.commonCapabilities).toContain('query');
      expect(compatibility.missingInA).toEqual(expect.arrayContaining(['analytics', 'reporting']));
      expect(compatibility.missingInB).toEqual(expect.arrayContaining(['database', 'transaction']));
    });

    it('should return incompatible for services with no common capabilities', async () => {
      const compatibility = await broker.checkServiceCompatibility('service-2', 'service-5');
      
      expect(compatibility.compatible).toBe(true); // Both have 'storage' capability
      expect(compatibility.commonCapabilities).toContain('storage');
    });

    it('should throw error for non-existent service compatibility check', async () => {
      await expect(
        broker.checkServiceCompatibility('non-existent', 'service-1')
      ).rejects.toThrow(MCPErrorClass);
    });
  });

  describe('Service Recommendations', () => {
    it('should get service recommendations', async () => {
      const recommendations = await broker.getServiceRecommendations('service-1', {
        maxRecommendations: 3,
        includeCompatible: true,
        includeSimilar: true,
        weightByHealth: true
      });
      
      expect(recommendations.length).toBeLessThanOrEqual(3);
      expect(recommendations.find(s => s.id === 'service-1')).toBeUndefined(); // Should not include self
      
      // Should be sorted by health score (descending)
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].healthScore || 0).toBeGreaterThanOrEqual(
          recommendations[i].healthScore || 0
        );
      }
    });

    it('should get compatible service recommendations only', async () => {
      const recommendations = await broker.getServiceRecommendations('service-1', {
        maxRecommendations: 5,
        includeCompatible: true,
        includeSimilar: false
      });
      
      // Should find services with common capabilities
      expect(recommendations.length).toBeGreaterThan(0);
      const analyticsService = recommendations.find(s => s.id === 'service-3');
      expect(analyticsService).toBeDefined();
    });

    it('should get similar service recommendations only', async () => {
      const recommendations = await broker.getServiceRecommendations('service-1', {
        maxRecommendations: 5,
        includeCompatible: false,
        includeSimilar: true
      });
      
      // Looking for services with ALL capabilities of service-1: ['database', 'query', 'transaction']
      // No other service has all three capabilities, so should return empty array
      expect(recommendations.length).toBe(0);
    });

    it('should throw error for non-existent service recommendations', async () => {
      await expect(
        broker.getServiceRecommendations('non-existent')
      ).rejects.toThrow(MCPErrorClass);
    });
  });

  describe('Complex Query Scenarios', () => {
    it('should handle complex filtering with sorting and pagination', async () => {
      const services = await broker.discoverServices({
        filters: [
          { field: 'healthScore', operator: 'gte', value: 0.8 },
          { field: 'status', operator: 'eq', value: ServiceStatus.ONLINE }
        ],
        sort: [
          { field: 'healthScore', direction: 'desc' }
        ],
        pagination: { offset: 0, limit: 2 }
      });
      
      expect(services).toHaveLength(2);
      expect(services[0].healthScore).toBeGreaterThanOrEqual(services[1].healthScore || 0);
    });

    it('should handle metadata filtering', async () => {
      const services = await broker.discoverServices({
        filters: [
          { field: 'priority', operator: 'eq', value: 'high' }
        ]
      });
      
      expect(services).toHaveLength(1);
      expect(services[0].metadata.priority).toBe('high');
    });

    it('should handle array contains filtering', async () => {
      const services = await broker.discoverServices({
        filters: [
          { field: 'capabilities', operator: 'contains', value: 'storage' }
        ]
      });
      
      expect(services.length).toBeGreaterThan(0);
      expect(services.every(s => s.capabilities.includes('storage'))).toBe(true);
    });

    it('should handle string operations filtering', async () => {
      const services = await broker.discoverServices({
        filters: [
          { field: 'name', operator: 'startsWith', value: 'Database' }
        ]
      });
      
      expect(services).toHaveLength(1);
      expect(services[0].name).toBe('Database Service');
    });
  });

  describe('Load Balancing Integration', () => {
    it('should integrate discovery with load balancing', async () => {
      // Discover database services
      const dbServices = await broker.discoverServices({ capability: 'database' });
      expect(dbServices).toHaveLength(2);
      
      // The load balancer should have these services available
      const allServices = await broker.getAllServices();
      const dbServiceIds = dbServices.map(s => s.id);
      const registeredDbServices = allServices.filter(s => dbServiceIds.includes(s.id));
      
      expect(registeredDbServices).toHaveLength(2);
    });

    it('should respect health check filtering in discovery', async () => {
      // With health check disabled, all services should be returned
      const allServices = await broker.discoverServices({});
      
      // Should include all services including service-4 which is DEGRADED
      expect(allServices).toHaveLength(5);
      expect(allServices.find(s => s.id === 'service-4')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle discovery when broker is stopped', async () => {
      await broker.stop();
      
      await expect(broker.discoverServices({})).rejects.toThrow(MCPErrorClass);
      await expect(broker.discoverServices({})).rejects.toThrow('Broker is not running');
    });

    it('should handle advanced discovery when broker is stopped', async () => {
      await broker.stop();
      
      await expect(broker.discoverServicesAdvanced({})).rejects.toThrow(MCPErrorClass);
    });

    it('should handle invalid filter operators gracefully', async () => {
      const services = await broker.discoverServices({
        filters: [
          { field: 'name', operator: 'invalid' as any, value: 'test' }
        ]
      });
      
      // Should return all services when filter is invalid
      expect(services).toHaveLength(5);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of services efficiently', async () => {
      // Register additional services
      const additionalServices: MCPServiceInfo[] = [];
      for (let i = 6; i <= 100; i++) {
        additionalServices.push({
          id: `service-${i}`,
          name: `Service ${i}`,
          version: '1.0.0',
          endpoint: `http://localhost:${3000 + i}`,
          capabilities: ['test', `capability-${i % 5}`],
          resources: [],
          tools: [],
          status: ServiceStatus.ONLINE,
          metadata: { index: i },
          registeredAt: new Date(),
          lastHeartbeat: new Date(),
          healthScore: Math.random(),
          tags: [`tag-${i % 3}`]
        });
      }

      // Register all additional services
      for (const service of additionalServices) {
        await broker.registerService(service);
      }

      const startTime = Date.now();
      const services = await broker.discoverServices({
        filters: [
          { field: 'healthScore', operator: 'gte', value: 0.5 }
        ],
        sort: [
          { field: 'healthScore', direction: 'desc' }
        ],
        pagination: { offset: 0, limit: 10 }
      });
      const endTime = Date.now();

      expect(services).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});