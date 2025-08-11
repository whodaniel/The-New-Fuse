/**
 * Tests for MCP Resource types and validation
 */

import { describe, it, expect } from 'vitest';
import { 
  ResourceType, 
  ResourceAccessMode, 
  ResourceStatus,
  ResourceDiscoveryResult,
  ResourceAccessLog,
  ResourceMetrics,
  ResourceSubscription,
  ResourceSubscriptionFilter,
  ResourceConfig,
  ResourceBackupConfig,
  ResourceValidationConfig
} from './resource';
import { mcpValidator } from '../validation/validator';

describe('Resource Types', () => {
  describe('Enumerations', () => {
    it('should define resource types', () => {
      expect(ResourceType.FILE).toBe('file');
      expect(ResourceType.DATABASE).toBe('database');
      expect(ResourceType.API).toBe('api');
      expect(ResourceType.MEMORY).toBe('memory');
      expect(ResourceType.STREAM).toBe('stream');
      expect(ResourceType.CUSTOM).toBe('custom');
    });

    it('should define access modes', () => {
      expect(ResourceAccessMode.READ_ONLY).toBe('read_only');
      expect(ResourceAccessMode.WRITE_ONLY).toBe('write_only');
      expect(ResourceAccessMode.READ_WRITE).toBe('read_write');
      expect(ResourceAccessMode.APPEND_ONLY).toBe('append_only');
    });

    it('should define resource statuses', () => {
      expect(ResourceStatus.AVAILABLE).toBe('available');
      expect(ResourceStatus.UNAVAILABLE).toBe('unavailable');
      expect(ResourceStatus.LOCKED).toBe('locked');
      expect(ResourceStatus.ERROR).toBe('error');
    });
  });

  describe('Interface Validation', () => {
    it('should validate resource discovery result', () => {
      const discoveryResult: ResourceDiscoveryResult = {
        resources: [
          {
            uri: 'file:///test/file.txt',
            name: 'Test File',
            description: 'A test file resource',
            mimeType: 'text/plain',
            handler: {} as any, // Mock handler
            permissions: {
              read: true,
              write: false,
              subscribe: false
            }
          }
        ],
        totalCount: 1,
        discoveredAt: new Date(),
        metadata: {
          source: 'file-system',
          scanDuration: 150
        }
      };

      expect(discoveryResult.resources).toHaveLength(1);
      expect(discoveryResult.totalCount).toBe(1);
      expect(discoveryResult.discoveredAt).toBeInstanceOf(Date);
      expect(discoveryResult.metadata?.source).toBe('file-system');
    });

    it('should validate resource access log', () => {
      const accessLog: ResourceAccessLog = {
        id: 'log-123',
        resourceUri: 'file:///test/file.txt',
        accessType: 'read',
        accessor: 'user-456',
        timestamp: new Date(),
        result: 'success',
        metadata: {
          userAgent: 'MCP-Client/1.0',
          duration: 25
        }
      };

      expect(accessLog.id).toBe('log-123');
      expect(accessLog.resourceUri).toBe('file:///test/file.txt');
      expect(accessLog.accessType).toBe('read');
      expect(accessLog.accessor).toBe('user-456');
      expect(accessLog.timestamp).toBeInstanceOf(Date);
      expect(accessLog.result).toBe('success');
      expect(accessLog.metadata?.duration).toBe(25);
    });

    it('should validate resource metrics', () => {
      const metrics: ResourceMetrics = {
        resourceUri: 'db://localhost/users',
        totalAccesses: 1000,
        readAccesses: 800,
        writeAccesses: 200,
        subscriptions: 5,
        averageAccessTime: 45.5,
        cacheHitRate: 0.85,
        lastAccess: new Date(),
        errorCount: 3
      };

      expect(metrics.resourceUri).toBe('db://localhost/users');
      expect(metrics.totalAccesses).toBe(1000);
      expect(metrics.readAccesses).toBe(800);
      expect(metrics.writeAccesses).toBe(200);
      expect(metrics.subscriptions).toBe(5);
      expect(metrics.averageAccessTime).toBe(45.5);
      expect(metrics.cacheHitRate).toBe(0.85);
      expect(metrics.lastAccess).toBeInstanceOf(Date);
      expect(metrics.errorCount).toBe(3);
    });

    it('should validate resource subscription', () => {
      const subscription: ResourceSubscription = {
        id: 'sub-789',
        resourceUri: 'stream://events',
        subscriber: 'service-123',
        callback: () => {}, // Mock callback
        subscribedAt: new Date(),
        filters: [
          {
            type: 'content',
            operator: 'contains',
            value: 'error'
          }
        ],
        metadata: {
          priority: 'high',
          batchSize: 10
        }
      };

      expect(subscription.id).toBe('sub-789');
      expect(subscription.resourceUri).toBe('stream://events');
      expect(subscription.subscriber).toBe('service-123');
      expect(subscription.callback).toBeInstanceOf(Function);
      expect(subscription.subscribedAt).toBeInstanceOf(Date);
      expect(subscription.filters).toHaveLength(1);
      expect(subscription.filters![0].type).toBe('content');
      expect(subscription.metadata?.priority).toBe('high');
    });

    it('should validate resource subscription filter', () => {
      const filter: ResourceSubscriptionFilter = {
        type: 'metadata',
        operator: 'eq',
        value: 'important'
      };

      expect(filter.type).toBe('metadata');
      expect(filter.operator).toBe('eq');
      expect(filter.value).toBe('important');
    });

    it('should validate resource configuration', () => {
      const config: ResourceConfig = {
        type: ResourceType.FILE,
        accessMode: ResourceAccessMode.READ_WRITE,
        versioning: true,
        compression: false,
        encryption: true,
        backup: {
          enabled: true,
          interval: 3600,
          retentionCount: 7,
          location: '/backups'
        },
        validation: {
          enabled: true,
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          },
          customValidator: (content) => content !== null
        }
      };

      expect(config.type).toBe(ResourceType.FILE);
      expect(config.accessMode).toBe(ResourceAccessMode.READ_WRITE);
      expect(config.versioning).toBe(true);
      expect(config.compression).toBe(false);
      expect(config.encryption).toBe(true);
      expect(config.backup?.enabled).toBe(true);
      expect(config.backup?.interval).toBe(3600);
      expect(config.validation?.enabled).toBe(true);
      expect(config.validation?.customValidator).toBeInstanceOf(Function);
    });

    it('should validate backup configuration', () => {
      const backupConfig: ResourceBackupConfig = {
        enabled: true,
        interval: 1800,
        retentionCount: 14,
        location: '/var/backups/resources'
      };

      expect(backupConfig.enabled).toBe(true);
      expect(backupConfig.interval).toBe(1800);
      expect(backupConfig.retentionCount).toBe(14);
      expect(backupConfig.location).toBe('/var/backups/resources');
    });

    it('should validate validation configuration', () => {
      const validationConfig: ResourceValidationConfig = {
        enabled: true,
        schema: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'number' },
            name: { type: 'string' }
          }
        },
        customValidator: (content) => {
          return content && typeof content === 'object' && 'id' in content;
        }
      };

      expect(validationConfig.enabled).toBe(true);
      expect(validationConfig.schema?.type).toBe('object');
      expect(validationConfig.schema?.required).toContain('id');
      expect(validationConfig.customValidator).toBeInstanceOf(Function);
      expect(validationConfig.customValidator!({ id: 1, name: 'test' })).toBe(true);
      expect(validationConfig.customValidator!(null)).toBeFalsy();
    });
  });

  describe('MCP Resource Validation', () => {
    it('should validate a complete MCP resource', () => {
      const resource = {
        uri: 'file:///home/user/documents/test.txt',
        name: 'Test Document',
        description: 'A test document for validation',
        mimeType: 'text/plain',
        metadata: {
          size: 1024,
          created: '2023-01-01T00:00:00Z',
          modified: '2023-01-02T00:00:00Z'
        },
        permissions: {
          read: true,
          write: false,
          subscribe: false,
          requiredRoles: ['reader']
        }
      };

      const result = mcpValidator.validateMCPResource(resource);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject resource without required fields', () => {
      const invalidResource = {
        name: 'Test Resource'
        // missing uri
      };

      const result = mcpValidator.validateMCPResource(invalidResource);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('uri'))).toBe(true);
    });

    it('should reject resource with invalid URI format', () => {
      const invalidResource = {
        uri: 'not-a-valid-uri',
        name: 'Test Resource'
      };

      const result = mcpValidator.validateMCPResource(invalidResource);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('uri'))).toBe(true);
    });

    it('should require read permission in permissions', () => {
      const invalidResource = {
        uri: 'file:///test.txt',
        name: 'Test Resource',
        permissions: {
          write: true
          // missing required read permission
        }
      };

      const result = mcpValidator.validateMCPResource(invalidResource);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('read'))).toBe(true);
    });

    it('should accept resource with minimal required fields', () => {
      const minimalResource = {
        uri: 'memory://cache/item1',
        name: 'Cache Item'
      };

      const result = mcpValidator.validateMCPResource(minimalResource);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate resource with complex permissions', () => {
      const resource = {
        uri: 'api://service/endpoint',
        name: 'API Endpoint',
        description: 'External API endpoint resource',
        permissions: {
          read: true,
          write: true,
          subscribe: true,
          requiredRoles: ['admin', 'api-user'],
          acl: [
            {
              principal: 'user:john',
              permissions: ['read', 'write'],
              type: 'allow'
            },
            {
              principal: 'role:guest',
              permissions: ['read'],
              type: 'deny'
            }
          ]
        }
      };

      const result = mcpValidator.validateMCPResource(resource);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate resource with caching configuration', () => {
      const resource = {
        uri: 'db://localhost/products',
        name: 'Product Database',
        permissions: {
          read: true
        },
        caching: {
          enabled: true,
          ttl: 300,
          keyStrategy: 'uri',
          customKeyFn: (uri: string) => `cache:${uri}`
        }
      };

      const result = mcpValidator.validateMCPResource(resource);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Resource Content Validation', () => {
    it('should validate resource content structure', () => {
      const content = {
        uri: 'file:///test.json',
        mimeType: 'application/json',
        content: '{"test": true}',
        size: 14,
        lastModified: new Date(),
        encoding: 'utf8',
        metadata: {
          checksum: 'abc123',
          version: '1.0'
        }
      };

      expect(content.uri).toBe('file:///test.json');
      expect(content.mimeType).toBe('application/json');
      expect(content.content).toBe('{"test": true}');
      expect(content.size).toBe(14);
      expect(content.lastModified).toBeInstanceOf(Date);
      expect(content.encoding).toBe('utf8');
      expect(content.metadata?.checksum).toBe('abc123');
    });

    it('should handle binary content', () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
      const content = {
        uri: 'file:///image.png',
        mimeType: 'image/png',
        content: binaryContent,
        size: binaryContent.length,
        lastModified: new Date(),
        encoding: 'binary'
      };

      expect(content.content).toBeInstanceOf(Buffer);
      expect(content.size).toBe(4);
      expect(content.mimeType).toBe('image/png');
      expect(content.encoding).toBe('binary');
    });
  });
});