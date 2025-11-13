"use strict";
/**
 * Tests for MCP Resource types and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resource_1 = require("./resource");
const validator_1 = require("../validation/validator");
(0, vitest_1.describe)('Resource Types', () => {
    (0, vitest_1.describe)('Enumerations', () => {
        (0, vitest_1.it)('should define resource types', () => {
            (0, vitest_1.expect)(resource_1.ResourceType.FILE).toBe('file');
            (0, vitest_1.expect)(resource_1.ResourceType.DATABASE).toBe('database');
            (0, vitest_1.expect)(resource_1.ResourceType.API).toBe('api');
            (0, vitest_1.expect)(resource_1.ResourceType.MEMORY).toBe('memory');
            (0, vitest_1.expect)(resource_1.ResourceType.STREAM).toBe('stream');
            (0, vitest_1.expect)(resource_1.ResourceType.CUSTOM).toBe('custom');
        });
        (0, vitest_1.it)('should define access modes', () => {
            (0, vitest_1.expect)(resource_1.ResourceAccessMode.READ_ONLY).toBe('read_only');
            (0, vitest_1.expect)(resource_1.ResourceAccessMode.WRITE_ONLY).toBe('write_only');
            (0, vitest_1.expect)(resource_1.ResourceAccessMode.READ_WRITE).toBe('read_write');
            (0, vitest_1.expect)(resource_1.ResourceAccessMode.APPEND_ONLY).toBe('append_only');
        });
        (0, vitest_1.it)('should define resource statuses', () => {
            (0, vitest_1.expect)(resource_1.ResourceStatus.AVAILABLE).toBe('available');
            (0, vitest_1.expect)(resource_1.ResourceStatus.UNAVAILABLE).toBe('unavailable');
            (0, vitest_1.expect)(resource_1.ResourceStatus.LOCKED).toBe('locked');
            (0, vitest_1.expect)(resource_1.ResourceStatus.ERROR).toBe('error');
        });
    });
    (0, vitest_1.describe)('Interface Validation', () => {
        (0, vitest_1.it)('should validate resource discovery result', () => {
            const discoveryResult = {
                resources: [
                    {
                        uri: 'file:///test/file.txt',
                        name: 'Test File',
                        description: 'A test file resource',
                        mimeType: 'text/plain',
                        handler: {}, // Mock handler
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
            (0, vitest_1.expect)(discoveryResult.resources).toHaveLength(1);
            (0, vitest_1.expect)(discoveryResult.totalCount).toBe(1);
            (0, vitest_1.expect)(discoveryResult.discoveredAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(discoveryResult.metadata?.source).toBe('file-system');
        });
        (0, vitest_1.it)('should validate resource access log', () => {
            const accessLog = {
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
            (0, vitest_1.expect)(accessLog.id).toBe('log-123');
            (0, vitest_1.expect)(accessLog.resourceUri).toBe('file:///test/file.txt');
            (0, vitest_1.expect)(accessLog.accessType).toBe('read');
            (0, vitest_1.expect)(accessLog.accessor).toBe('user-456');
            (0, vitest_1.expect)(accessLog.timestamp).toBeInstanceOf(Date);
            (0, vitest_1.expect)(accessLog.result).toBe('success');
            (0, vitest_1.expect)(accessLog.metadata?.duration).toBe(25);
        });
        (0, vitest_1.it)('should validate resource metrics', () => {
            const metrics = {
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
            (0, vitest_1.expect)(metrics.resourceUri).toBe('db://localhost/users');
            (0, vitest_1.expect)(metrics.totalAccesses).toBe(1000);
            (0, vitest_1.expect)(metrics.readAccesses).toBe(800);
            (0, vitest_1.expect)(metrics.writeAccesses).toBe(200);
            (0, vitest_1.expect)(metrics.subscriptions).toBe(5);
            (0, vitest_1.expect)(metrics.averageAccessTime).toBe(45.5);
            (0, vitest_1.expect)(metrics.cacheHitRate).toBe(0.85);
            (0, vitest_1.expect)(metrics.lastAccess).toBeInstanceOf(Date);
            (0, vitest_1.expect)(metrics.errorCount).toBe(3);
        });
        (0, vitest_1.it)('should validate resource subscription', () => {
            const subscription = {
                id: 'sub-789',
                resourceUri: 'stream://events',
                subscriber: 'service-123',
                callback: () => { }, // Mock callback
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
            (0, vitest_1.expect)(subscription.id).toBe('sub-789');
            (0, vitest_1.expect)(subscription.resourceUri).toBe('stream://events');
            (0, vitest_1.expect)(subscription.subscriber).toBe('service-123');
            (0, vitest_1.expect)(subscription.callback).toBeInstanceOf(Function);
            (0, vitest_1.expect)(subscription.subscribedAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(subscription.filters).toHaveLength(1);
            (0, vitest_1.expect)(subscription.filters[0].type).toBe('content');
            (0, vitest_1.expect)(subscription.metadata?.priority).toBe('high');
        });
        (0, vitest_1.it)('should validate resource subscription filter', () => {
            const filter = {
                type: 'metadata',
                operator: 'eq',
                value: 'important'
            };
            (0, vitest_1.expect)(filter.type).toBe('metadata');
            (0, vitest_1.expect)(filter.operator).toBe('eq');
            (0, vitest_1.expect)(filter.value).toBe('important');
        });
        (0, vitest_1.it)('should validate resource configuration', () => {
            const config = {
                type: resource_1.ResourceType.FILE,
                accessMode: resource_1.ResourceAccessMode.READ_WRITE,
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
                            name: { type: 'string'
                            },
                            customValidator: (content) => content !== null
                        }
                    },
                    expect(config) { }, : .type
                }
            };
        }).toBe(resource_1.ResourceType.FILE);
        (0, vitest_1.expect)(config.accessMode).toBe(resource_1.ResourceAccessMode.READ_WRITE);
        (0, vitest_1.expect)(config.versioning).toBe(true);
        (0, vitest_1.expect)(config.compression).toBe(false);
        (0, vitest_1.expect)(config.encryption).toBe(true);
        (0, vitest_1.expect)(config.backup?.enabled).toBe(true);
        (0, vitest_1.expect)(config.backup?.interval).toBe(3600);
        (0, vitest_1.expect)(config.validation?.enabled).toBe(true);
        (0, vitest_1.expect)(config.validation?.customValidator).toBeInstanceOf(Function);
    });
    (0, vitest_1.it)('should validate backup configuration', () => {
        const backupConfig = {
            enabled: true,
            interval: 1800,
            retentionCount: 14,
            location: '/var/backups/resources'
        };
        (0, vitest_1.expect)(backupConfig.enabled).toBe(true);
        (0, vitest_1.expect)(backupConfig.interval).toBe(1800);
        (0, vitest_1.expect)(backupConfig.retentionCount).toBe(14);
        (0, vitest_1.expect)(backupConfig.location).toBe('/var/backups/resources');
    });
    (0, vitest_1.it)('should validate validation configuration', () => {
        const validationConfig = {
            enabled: true,
            schema: {
                type: 'object',
                required: ['id', 'name'],
                properties: {
                    id: { type: 'number' },
                    name: { type: 'string'
                    },
                    customValidator: (content) => {
                        return content && typeof content === 'object' && 'id' in content;
                    }
                },
                expect(validationConfig) { }, : .enabled
            }
        };
    }).toBe(true);
    (0, vitest_1.expect)(validationConfig.schema?.type).toBe('object');
    (0, vitest_1.expect)(validationConfig.schema?.required).toContain('id');
    (0, vitest_1.expect)(validationConfig.customValidator).toBeInstanceOf(Function);
    (0, vitest_1.expect)(validationConfig.customValidator({ id: 1, name: 'test' })).toBe(true);
    (0, vitest_1.expect)(validationConfig.customValidator(null)).toBeFalsy();
});
;
(0, vitest_1.describe)('MCP Resource Validation', () => {
    (0, vitest_1.it)('should validate a complete MCP resource', () => {
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
        const result = validator_1.mcpValidator.validateMCPResource(resource);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should reject resource without required fields', () => {
        const invalidResource = {
            name: 'Test Resource'
            // missing uri
        };
        const result = validator_1.mcpValidator.validateMCPResource(invalidResource);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.errors.some(error => error.includes('uri'))).toBe(true);
    });
    (0, vitest_1.it)('should reject resource with invalid URI format', () => {
        const invalidResource = {
            uri: 'not-a-valid-uri',
            name: 'Test Resource'
        };
        const result = validator_1.mcpValidator.validateMCPResource(invalidResource);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors.some(error => error.includes('uri'))).toBe(true);
    });
    (0, vitest_1.it)('should require read permission in permissions', () => {
        const invalidResource = {
            uri: 'file:///test.txt',
            name: 'Test Resource',
            permissions: {
                write: true
                // missing required read permission
            }
        };
        const result = validator_1.mcpValidator.validateMCPResource(invalidResource);
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.errors.some(error => error.includes('read'))).toBe(true);
    });
    (0, vitest_1.it)('should accept resource with minimal required fields', () => {
        const minimalResource = {
            uri: 'memory://cache/item1',
            name: 'Cache Item'
        };
        const result = validator_1.mcpValidator.validateMCPResource(minimalResource);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should validate resource with complex permissions', () => {
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
        const result = validator_1.mcpValidator.validateMCPResource(resource);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should validate resource with caching configuration', () => {
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
                customKeyFn: (uri) => `cache:${uri}`
            }
        };
        const result = validator_1.mcpValidator.validateMCPResource(resource);
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.errors).toHaveLength(0);
    });
});
(0, vitest_1.describe)('Resource Content Validation', () => {
    (0, vitest_1.it)('should validate resource content structure', () => {
        const content = {
            uri: 'file:///test.json',
            mimeType: 'application/json',
            content: '{"test": true}',
            size: 14,
            lastModified: new Date(),
            encoding: 'utf8',
            metadata: {
                checksum: 'abc123',
                version: '1.0',
                expect(content) { }, : .uri
            }
        };
    }).toBe('file:///test.json');
    (0, vitest_1.expect)(content.mimeType).toBe('application/json');
    (0, vitest_1.expect)(content.content).toBe('{"test": true}');
    (0, vitest_1.expect)(content.size).toBe(14);
    (0, vitest_1.expect)(content.lastModified).toBeInstanceOf(Date);
    (0, vitest_1.expect)(content.encoding).toBe('utf8');
    (0, vitest_1.expect)(content.metadata?.checksum).toBe('abc123');
});
(0, vitest_1.it)('should handle binary content', () => {
    const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
    const content = {
        uri: 'file:///image.png',
        mimeType: 'image/png',
        content: binaryContent,
        size: binaryContent.length,
        lastModified: new Date(),
        encoding: 'binary'
    };
    (0, vitest_1.expect)(content.content).toBeInstanceOf(Buffer);
    (0, vitest_1.expect)(content.size).toBe(4);
    (0, vitest_1.expect)(content.mimeType).toBe('image/png');
    (0, vitest_1.expect)(content.encoding).toBe('binary');
});
;
;
//# sourceMappingURL=resource.test.js.map