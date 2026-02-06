/**
 * Tests for MCP Capability types and validation
 */

import { mcpValidator } from '../validation/validator';
import {
  CapabilityAnnouncement,
  CapabilityCategory,
  CapabilityCompatibilityLevel,
  CapabilityCompatibilityResult,
  CapabilityDiscoveryResult,
  CapabilityLifecycleState,
  CapabilityNegotiation,
  CapabilitySearchCriteria,
  CapabilityUsageTracking,
  CapabilityValidationResult,
} from './capability';

describe('Capability Types', () => {
  describe('Enumerations', () => {
    it('should define capability categories', () => {
      expect(CapabilityCategory.CORE).toBe('core');
      expect(CapabilityCategory.RESOURCE).toBe('resource');
      expect(CapabilityCategory.TOOL).toBe('tool');
      expect(CapabilityCategory.COMMUNICATION).toBe('communication');
      expect(CapabilityCategory.SECURITY).toBe('security');
      expect(CapabilityCategory.MONITORING).toBe('monitoring');
      expect(CapabilityCategory.EXTENSION).toBe('extension');
    });

    it('should define lifecycle states', () => {
      expect(CapabilityLifecycleState.DRAFT).toBe('draft');
      expect(CapabilityLifecycleState.PROPOSED).toBe('proposed');
      expect(CapabilityLifecycleState.ACCEPTED).toBe('accepted');
      expect(CapabilityLifecycleState.DEPRECATED).toBe('deprecated');
      expect(CapabilityLifecycleState.RETIRED).toBe('retired');
    });

    it('should define compatibility levels', () => {
      expect(CapabilityCompatibilityLevel.FULL).toBe('full');
      expect(CapabilityCompatibilityLevel.PARTIAL).toBe('partial');
      expect(CapabilityCompatibilityLevel.NONE).toBe('none');
    });
  });

  describe('Interface Validation', () => {
    it('should validate capability discovery result', () => {
      const discoveryResult: CapabilityDiscoveryResult = {
        capabilities: [
          {
            name: 'test-capability',
            version: '1.0.0',
            description: 'Test capability',
            methods: ['test.method'],
          },
        ],
        totalCount: 1,
        discoveredAt: new Date(),
        source: 'test-source',
      };

      expect(discoveryResult.capabilities).toHaveLength(1);
      expect(discoveryResult.totalCount).toBe(1);
      expect(discoveryResult.discoveredAt).toBeInstanceOf(Date);
      expect(discoveryResult.source).toBe('test-source');
    });

    it('should validate capability compatibility result', () => {
      const compatibilityResult: CapabilityCompatibilityResult = {
        capabilityName: 'test-capability',
        level: CapabilityCompatibilityLevel.FULL,
        compatibleVersion: '1.0.0',
        issues: [],
        suggestions: ['Consider upgrading to version 2.0.0'],
      };

      expect(compatibilityResult.capabilityName).toBe('test-capability');
      expect(compatibilityResult.level).toBe(CapabilityCompatibilityLevel.FULL);
      expect(compatibilityResult.compatibleVersion).toBe('1.0.0');
      expect(compatibilityResult.issues).toHaveLength(0);
      expect(compatibilityResult.suggestions).toHaveLength(1);
    });

    it('should validate capability negotiation', () => {
      const negotiation: CapabilityNegotiation = {
        id: 'negotiation-123',
        clientCapabilities: [
          {
            name: 'client-capability',
            version: '1.0.0',
            description: 'Client capability',
            methods: ['client.method'],
          },
        ],
        serverCapabilities: [
          {
            name: 'server-capability',
            version: '1.0.0',
            description: 'Server capability',
            methods: ['server.method'],
          },
        ],
        negotiatedCapabilities: [
          {
            name: 'common-capability',
            version: '1.0.0',
            description: 'Common capability',
            methods: ['common.method'],
          },
        ],
        status: 'completed',
        timestamp: new Date(),
      };

      expect(negotiation.id).toBe('negotiation-123');
      expect(negotiation.clientCapabilities).toHaveLength(1);
      expect(negotiation.serverCapabilities).toHaveLength(1);
      expect(negotiation.negotiatedCapabilities).toHaveLength(1);
      expect(negotiation.status).toBe('completed');
      expect(negotiation.timestamp).toBeInstanceOf(Date);
    });

    it('should validate capability announcement', () => {
      const announcement: CapabilityAnnouncement = {
        id: 'announcement-456',
        capability: {
          name: 'new-capability',
          version: '1.0.0',
          description: 'New capability',
          methods: ['new.method'],
        },
        type: 'added',
        announcer: 'service-123',
        timestamp: new Date(),
        message: 'New capability has been added',
      };

      expect(announcement.id).toBe('announcement-456');
      expect(announcement.capability.name).toBe('new-capability');
      expect(announcement.type).toBe('added');
      expect(announcement.announcer).toBe('service-123');
      expect(announcement.timestamp).toBeInstanceOf(Date);
      expect(announcement.message).toBe('New capability has been added');
    });

    it('should validate capability search criteria', () => {
      const searchCriteria: CapabilitySearchCriteria = {
        name: 'test-*',
        category: CapabilityCategory.TOOL,
        version: '1.0.0',
        methods: ['test.method'],
        tags: ['testing', 'utility'],
        lifecycleState: CapabilityLifecycleState.ACCEPTED,
        experimental: false,
      };

      expect(searchCriteria.name).toBe('test-*');
      expect(searchCriteria.category).toBe(CapabilityCategory.TOOL);
      expect(searchCriteria.version).toBe('1.0.0');
      expect(searchCriteria.methods).toContain('test.method');
      expect(searchCriteria.tags).toContain('testing');
      expect(searchCriteria.lifecycleState).toBe(CapabilityLifecycleState.ACCEPTED);
      expect(searchCriteria.experimental).toBe(false);
    });

    it('should validate capability validation result', () => {
      const validationResult: CapabilityValidationResult = {
        valid: true,
        errors: [],
        warnings: ['Minor version mismatch'],
        normalizedCapability: {
          name: 'normalized-capability',
          version: '1.0.0',
          description: 'Normalized capability',
          methods: ['normalized.method'],
        },
      };

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      expect(validationResult.warnings).toHaveLength(1);
      expect(validationResult.normalizedCapability?.name).toBe('normalized-capability');
    });

    it('should validate capability usage tracking', () => {
      const usageTracking: CapabilityUsageTracking = {
        capabilityName: 'tracked-capability',
        usageCount: 100,
        uniqueUsers: 25,
        methodUsage: {
          method1: 60,
          method2: 40,
        },
        trends: [
          {
            period: new Date('2023-01-01'),
            count: 50,
            uniqueUsers: 15,
          },
          {
            period: new Date('2023-01-02'),
            count: 50,
            uniqueUsers: 10,
          },
        ],
        lastUsed: new Date(),
      };

      expect(usageTracking.capabilityName).toBe('tracked-capability');
      expect(usageTracking.usageCount).toBe(100);
      expect(usageTracking.uniqueUsers).toBe(25);
      expect(usageTracking.methodUsage['method1']).toBe(60);
      expect(usageTracking.methodUsage['method2']).toBe(40);
      expect(usageTracking.trends).toHaveLength(2);
      expect(usageTracking.lastUsed).toBeInstanceOf(Date);
    });
  });

  describe('MCP Capability Validation', () => {
    it('should validate a complete MCP capability', () => {
      const capability = {
        name: 'test-capability',
        version: '1.2.3',
        description: 'A test capability for validation',
        methods: ['test.method1', 'test.method2'],
        notifications: ['test.notification'],
        experimental: false,
        metadata: {
          author: 'Test Author',
          documentation: 'https://example.com/docs',
          license: 'MIT',
          tags: ['testing', 'validation'],
        },
      };

      const result = mcpValidator.validateMCPCapability(capability);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject capability without required fields', () => {
      const invalidCapability = {
        name: 'test-capability',
        // missing version, description, and methods
      };

      const result = mcpValidator.validateMCPCapability(invalidCapability);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject capability with invalid version format', () => {
      const invalidCapability = {
        name: 'test-capability',
        version: 'invalid-version',
        description: 'Test capability',
        methods: ['test.method'],
      };

      const result = mcpValidator.validateMCPCapability(invalidCapability);
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes('version'))).toBe(true);
    });

    it('should reject capability without methods', () => {
      const invalidCapability = {
        name: 'test-capability',
        version: '1.0.0',
        description: 'Test capability',
        methods: [], // empty methods array
      };

      const result = mcpValidator.validateMCPCapability(invalidCapability);
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes('methods'))).toBe(true);
    });

    it('should accept capability with optional fields', () => {
      const capability = {
        name: 'minimal-capability',
        version: '1.0.0',
        description: 'Minimal capability',
        methods: ['minimal.method'],
      };

      const result = mcpValidator.validateMCPCapability(capability);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate capability with metadata', () => {
      const capability = {
        name: 'documented-capability',
        version: '2.1.0-beta.1',
        description: 'Well-documented capability',
        methods: ['documented.method'],
        experimental: true,
        metadata: {
          author: 'Documentation Team',
          documentation: 'https://docs.example.com/capability',
          license: 'Apache-2.0',
          tags: ['documentation', 'beta'],
        },
      };

      const result = mcpValidator.validateMCPCapability(capability);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
