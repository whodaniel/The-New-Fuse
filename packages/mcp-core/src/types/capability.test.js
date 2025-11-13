"use strict";
/**
 * Tests for MCP Capability types and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const capability_1 = require("./capability");
const validator_1 = require("../validation/validator");
(0, vitest_1.describe)('Capability Types', () => {
    (0, vitest_1.describe)('Enumerations', () => {
        (0, vitest_1.it)('should define capability categories', () => {
            (0, vitest_1.expect)(capability_1.CapabilityCategory.CORE).toBe('core');
            (0, vitest_1.expect)(capability_1.CapabilityCategory.RESOURCE).toBe('resource');
            (0, vitest_1.expect)(capability_1.CapabilityCategory.TOOL).toBe('tool');
            (0, vitest_1.expect)(capability_1.CapabilityCategory.COMMUNICATION).toBe('communication');
            (0, vitest_1.expect)(capability_1.CapabilityCategory.SECURITY).toBe('security');
            (0, vitest_1.expect)(capability_1.CapabilityCategory.MONITORING).toBe('monitoring');
            (0, vitest_1.expect)(capability_1.CapabilityCategory.EXTENSION).toBe('extension');
        });
        (0, vitest_1.it)('should define lifecycle states', () => {
            (0, vitest_1.expect)(capability_1.CapabilityLifecycleState.DRAFT).toBe('draft');
            (0, vitest_1.expect)(capability_1.CapabilityLifecycleState.PROPOSED).toBe('proposed');
            (0, vitest_1.expect)(capability_1.CapabilityLifecycleState.ACCEPTED).toBe('accepted');
            (0, vitest_1.expect)(capability_1.CapabilityLifecycleState.DEPRECATED).toBe('deprecated');
            (0, vitest_1.expect)(capability_1.CapabilityLifecycleState.RETIRED).toBe('retired');
        });
        (0, vitest_1.it)('should define compatibility levels', () => {
            (0, vitest_1.expect)(capability_1.CapabilityCompatibilityLevel.FULL).toBe('full');
            (0, vitest_1.expect)(capability_1.CapabilityCompatibilityLevel.PARTIAL).toBe('partial');
            (0, vitest_1.expect)(capability_1.CapabilityCompatibilityLevel.NONE).toBe('none');
        });
    });
    (0, vitest_1.describe)('Interface Validation', () => {
        (0, vitest_1.it)('should validate capability discovery result', () => {
            const discoveryResult = {
                capabilities: [
                    {
                        name: 'test-capability',
                        version: '1.0.0',
                        description: 'Test capability',
                        methods: ['test.method']
                    }
                ],
                totalCount: 1,
                discoveredAt: new Date(),
                source: 'test-source'
            };
            (0, vitest_1.expect)(discoveryResult.capabilities).toHaveLength(1);
            (0, vitest_1.expect)(discoveryResult.totalCount).toBe(1);
            (0, vitest_1.expect)(discoveryResult.discoveredAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(discoveryResult.source).toBe('test-source');
        });
        (0, vitest_1.it)('should validate capability compatibility result', () => {
            const compatibilityResult = {
                capabilityName: 'test-capability',
                level: capability_1.CapabilityCompatibilityLevel.FULL,
                compatibleVersion: '1.0.0',
                issues: [],
                suggestions: ['Consider upgrading to version 2.0.0']
            };
            (0, vitest_1.expect)(compatibilityResult.capabilityName).toBe('test-capability');
            (0, vitest_1.expect)(compatibilityResult.level).toBe(capability_1.CapabilityCompatibilityLevel.FULL);
            (0, vitest_1.expect)(compatibilityResult.compatibleVersion).toBe('1.0.0');
            (0, vitest_1.expect)(compatibilityResult.issues).toHaveLength(0);
            (0, vitest_1.expect)(compatibilityResult.suggestions).toHaveLength(1);
        });
        (0, vitest_1.it)('should validate capability negotiation', () => {
            const negotiation = {
                id: 'negotiation-123',
                clientCapabilities: [
                    {
                        name: 'client-capability',
                        version: '1.0.0',
                        description: 'Client capability',
                        methods: ['client.method']
                    }
                ],
                serverCapabilities: [
                    {
                        name: 'server-capability',
                        version: '1.0.0',
                        description: 'Server capability',
                        methods: ['server.method']
                    }
                ],
                negotiatedCapabilities: [
                    {
                        name: 'common-capability',
                        version: '1.0.0',
                        description: 'Common capability',
                        methods: ['common.method']
                    }
                ],
                status: 'completed',
                timestamp: new Date()
            };
            (0, vitest_1.expect)(negotiation.id).toBe('negotiation-123');
            (0, vitest_1.expect)(negotiation.clientCapabilities).toHaveLength(1);
            (0, vitest_1.expect)(negotiation.serverCapabilities).toHaveLength(1);
            (0, vitest_1.expect)(negotiation.negotiatedCapabilities).toHaveLength(1);
            (0, vitest_1.expect)(negotiation.status).toBe('completed');
            (0, vitest_1.expect)(negotiation.timestamp).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should validate capability announcement', () => {
            const announcement = {
                id: 'announcement-456',
                capability: {
                    name: 'new-capability',
                    version: '1.0.0',
                    description: 'New capability',
                    methods: ['new.method']
                },
                type: 'added',
                announcer: 'service-123',
                timestamp: new Date(),
                message: 'New capability has been added'
            };
            (0, vitest_1.expect)(announcement.id).toBe('announcement-456');
            (0, vitest_1.expect)(announcement.capability.name).toBe('new-capability');
            (0, vitest_1.expect)(announcement.type).toBe('added');
            (0, vitest_1.expect)(announcement.announcer).toBe('service-123');
            (0, vitest_1.expect)(announcement.timestamp).toBeInstanceOf(Date);
            (0, vitest_1.expect)(announcement.message).toBe('New capability has been added');
        });
        (0, vitest_1.it)('should validate capability search criteria', () => {
            const searchCriteria = {
                name: 'test-*',
                category: capability_1.CapabilityCategory.TOOL,
                version: '1.0.0',
                methods: ['test.method'],
                tags: ['testing', 'utility'],
                lifecycleState: capability_1.CapabilityLifecycleState.ACCEPTED,
                experimental: false
            };
            (0, vitest_1.expect)(searchCriteria.name).toBe('test-*');
            (0, vitest_1.expect)(searchCriteria.category).toBe(capability_1.CapabilityCategory.TOOL);
            (0, vitest_1.expect)(searchCriteria.version).toBe('1.0.0');
            (0, vitest_1.expect)(searchCriteria.methods).toContain('test.method');
            (0, vitest_1.expect)(searchCriteria.tags).toContain('testing');
            (0, vitest_1.expect)(searchCriteria.lifecycleState).toBe(capability_1.CapabilityLifecycleState.ACCEPTED);
            (0, vitest_1.expect)(searchCriteria.experimental).toBe(false);
        });
        (0, vitest_1.it)('should validate capability validation result', () => {
            const validationResult = {
                valid: true,
                errors: [],
                warnings: ['Minor version mismatch'],
                normalizedCapability: {
                    name: 'normalized-capability',
                    version: '1.0.0',
                    description: 'Normalized capability',
                    methods: ['normalized.method']
                }
            };
            (0, vitest_1.expect)(validationResult.valid).toBe(true);
            (0, vitest_1.expect)(validationResult.errors).toHaveLength(0);
            (0, vitest_1.expect)(validationResult.warnings).toHaveLength(1);
            (0, vitest_1.expect)(validationResult.normalizedCapability?.name).toBe('normalized-capability');
        });
        (0, vitest_1.it)('should validate capability usage tracking', () => {
            const usageTracking = {
                capabilityName: 'tracked-capability',
                usageCount: 100,
                uniqueUsers: 25,
                methodUsage: {
                    'method1': 60,
                    'method2': 40
                },
                trends: [
                    {
                        period: new Date('2023-01-01'),
                        count: 50,
                        uniqueUsers: 15
                    },
                    {
                        period: new Date('2023-01-02'),
                        count: 50,
                        uniqueUsers: 10
                    }
                ],
                lastUsed: new Date()
            };
            (0, vitest_1.expect)(usageTracking.capabilityName).toBe('tracked-capability');
            (0, vitest_1.expect)(usageTracking.usageCount).toBe(100);
            (0, vitest_1.expect)(usageTracking.uniqueUsers).toBe(25);
            (0, vitest_1.expect)(usageTracking.methodUsage['method1']).toBe(60);
            (0, vitest_1.expect)(usageTracking.methodUsage['method2']).toBe(40);
            (0, vitest_1.expect)(usageTracking.trends).toHaveLength(2);
            (0, vitest_1.expect)(usageTracking.lastUsed).toBeInstanceOf(Date);
        });
    });
    (0, vitest_1.describe)('MCP Capability Validation', () => {
        (0, vitest_1.it)('should validate a complete MCP capability', () => {
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
                    tags: ['testing', 'validation']
                }
            };
            const result = validator_1.mcpValidator.validateMCPCapability(capability);
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should reject capability without required fields', () => {
            const invalidCapability = {
                name: 'test-capability',
                // missing version, description, and methods
            };
            const result = validator_1.mcpValidator.validateMCPCapability(invalidCapability);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should reject capability with invalid version format', () => {
            const invalidCapability = {
                name: 'test-capability',
                version: 'invalid-version',
                description: 'Test capability',
                methods: ['test.method']
            };
            const result = validator_1.mcpValidator.validateMCPCapability(invalidCapability);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(error => error.includes('version'))).toBe(true);
        });
        (0, vitest_1.it)('should reject capability without methods', () => {
            const invalidCapability = {
                name: 'test-capability',
                version: '1.0.0',
                description: 'Test capability',
                methods: [] // empty methods array
            };
            const result = validator_1.mcpValidator.validateMCPCapability(invalidCapability);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(error => error.includes('methods'))).toBe(true);
        });
        (0, vitest_1.it)('should accept capability with optional fields', () => {
            const capability = {
                name: 'minimal-capability',
                version: '1.0.0',
                description: 'Minimal capability',
                methods: ['minimal.method']
            };
            const result = validator_1.mcpValidator.validateMCPCapability(capability);
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should validate capability with metadata', () => {
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
                    tags: ['documentation', 'beta']
                }
            };
            const result = validator_1.mcpValidator.validateMCPCapability(capability);
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=capability.test.js.map