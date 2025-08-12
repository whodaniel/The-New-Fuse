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

    it('should discover services with capability match mode "any"', async () => {
      const services = await broker.discoverServicesAdvanced({
        requiredCapabilities: ['query', 'nonexistent'],
        capabilityMatchMode: 'any'
      });
      
      // Should find services with 'query' capability
      expect(services.length).toBeGreaterThan(0);
      expect(services.every(s => 
        s.capabilities.includes('query') || s.capabilities.includes('nonexistent')
      )).toBe(true);
    });

    it('should discover services with exact capability matching', async () => {
      const services = await broker.discoverServicesAdvanced({
        requiredCapabilities: ['cache', 'storage', 'memory'],
        capabilityMatchMode: 'exact'
      });
      
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('service-2'); // Cache Service has exactly these capabilities
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

    it('should include partial matches when requested', async () => {
      const services = await broker.discoverServicesAdvanced({
        compatibleWith: 'service-1',
        includePartialMatches: true
      });
      
      // Should include more services with partial compatibility
      expect(services.length).toBeGreaterThan(0);
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

    it('should check service compatibility with detailed analysis', async () => {
      const compatibility = await broker.checkServiceCompatibility('service-1', 'service-3');
      
      expect(compatibility.compatible).toBe(true);
      expect(compatibility.commonCapabilities).toContain('query');
      expect(compatibility.missingInA).toEqual(expect.arrayContaining(['analytics', 'reporting']));
      expect(compatibility.missingInB).toEqual(expect.arrayContaining(['database', 'transaction']));
      expect(compatibility.compatibilityScore).toBeGreaterThan(0);
      expect(compatibility.analysis).toBeDefined();
      expect(compatibility.analysis?.versionCompatibility).toBe(true); // Both are version 1.x
    });

    it('should calculate compatibility score correctly', async () => {
      const compatibility = await broker.checkServiceCompatibility('service-1', 'service-3');
      
      // Should have a reasonable compatibility score based on common capabilities
      expect(compatibility.compatibilityScore).toBeGreaterThan(0);
      expect(compatibility.compatibilityScore).toBeLessThanOrEqual(1);
    });

    it('should analyze resource and tool compatibility', async () => {
      const compatibility = await broker.checkServiceCompatibility('service-1', 'service-3');
      
      expect(compatibility.analysis).toBeDefined();
      expect(typeof compatibility.analysis?.resourceCompatibility).toBe('boolean');
      expect(typeof compatibility.analysis?.toolCompatibility).toBe('boolean');
      expect(typeof compatibility.analysis?.versionCompatibility).toBe('boolean');
    });

    it('should return incompatible for services with no common capabilities', async () => {
      // Create a service with no common capabilities
      const isolatedService: MCPServiceInfo = {
        id: 'isolated-service',
        name: 'Isolated Service',
        version: '1.0.0',
        endpoint: 'http://localhost:3999',
        capabilities: ['isolated', 'unique'],
        resources: [],
        tools: [],
        status: ServiceStatus.ONLINE,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        healthScore: 0.8
      };
      
      await broker.registerService(isolatedService);
      
      const compatibility = await broker.checkServiceCompatibility('service-1', 'isolated-service');
      
      expect(compatibility.compatible).toBe(false);
      expect(compatibility.commonCapabilities).toHaveLength(0);
      expect(compatibility.compatibilityScore).toBe(0);
    });

    it('should throw error for non-existent service compatibility check', async () => {
      await expect(
        broker.checkServiceCompatibility('non-existent', 'service-1')
      ).rejects.toThrow(MCPErrorClass);
    });
  });

  describe('Service Recommendations', () => {
    it('should get service recommendations with scoring', async () => {
      const recommendations = await broker.getServiceRecommendations('service-1', {
        maxRecommendations: 3,
        includeCompatible: true,
        includeSimilar: true,
        weightByHealth: true
      });
      
      expect(recommendations.length).toBeLessThanOrEqual(3);
      expect(recommendations.find(s => s.id === 'service-1')).toBeUndefined(); // Should not include self
      
      // Should be sorted by calculated score (which includes health)
      expect(recommendations.length).toBeGreaterThan(0);
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
      
      // Should find services with any matching capabilities
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should filter recommendations by tags', async () => {
      const recommendations = await broker.getServiceRecommendations('service-1', {
        maxRecommendations: 5,
        includeCompatible: true,
        includeSimilar: true,
        excludeTags: ['backup'],
        includeTags: ['primary']
      });
      
      // Should exclude service-4 (has 'backup' tag) and prefer service-1 style services
      expect(recommendations.find(s => s.id === 'service-4')).toBeUndefined();
    });

    it('should weight recommendations by usage when enabled', async () => {
      // Add usage metadata to a service
      const serviceWithUsage = { ...mockServices[1] };
      serviceWithUsage.metadata = { ...serviceWithUsage.metadata, usageCount: 500 };
      await broker.updateService(serviceWithUsage.id, serviceWithUsage);

      const recommendations = await broker.getServiceRecommendations('service-1', {
        maxRecommendations: 5,
        includeCompatible: true,
        includeSimilar: true,
        weightByUsage: true
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
      // Service with higher usage should be ranked higher (if compatible)
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

  describe('Service Selection Algorithms', () => {
    it('should provide service selection recommendations', async () => {
      // Access the load balancer through the broker's internal structure
      const brokerInternal = broker as any;
      const loadBalancer = brokerInternal.loadBalancer;
      
      const recommendations = loadBalancer.getServiceSelectionRecommendations(
        ['database'],
        ['primary']
      );
      
      expect(recommendations.primary).toBeDefined();
      expect(recommendations.alternatives).toBeInstanceOf(Array);
      expect(recommendations.loadDistribution).toBeDefined();
      expect(typeof recommendations.loadDistribution).toBe('object');
    });

    it('should select multiple services for load distribution', async () => {
      const brokerInternal = broker as any;
      const loadBalancer = brokerInternal.loadBalancer;
      
      const selectedServices = loadBalancer.selectMultipleServices(3);
      
      expect(selectedServices).toBeInstanceOf(Array);
      expect(selectedServices.length).toBeLessThanOrEqual(3);
      expect(selectedServices.every(s => s.id && s.name)).toBe(true);
    });

    it('should predict optimal service selection', async () => {
      const brokerInternal = broker as any;
      const loadBalancer = brokerInternal.loadBalancer;
      
      const prediction = loadBalancer.predictOptimalSelection(
        'database-query',
        15, // expected load
        14  // 2 PM
      );
      
      expect(prediction.recommendedServices).toBeInstanceOf(Array);
      expect(typeof prediction.confidence).toBe('number');
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(prediction.reasoning).toBeInstanceOf(Array);
      expect(prediction.reasoning.length).toBeGreaterThan(0);
    });

    it('should exclude specified services from selection', async () => {
      const brokerInternal = broker as any;
      const loadBalancer = brokerInternal.loadBalancer;
      
      const selectedServices = loadBalancer.selectMultipleServices(
        2,
        undefined,
        undefined,
        ['service-1', 'service-2'] // exclude these
      );
      
      expect(selectedServices.every(s => s.id !== 'service-1' && s.id !== 'service-2')).toBe(true);
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