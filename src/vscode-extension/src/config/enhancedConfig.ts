/**
 * Enhanced Integration Configuration
 * Comprehensive configuration for The New Fuse framework's state-of-the-art features
 */

import { IntegrationConfig } from '../services/EnhancedIntegrationService';

export const defaultEnhancedConfig: IntegrationConfig = {
    mcp2025: {
        endpoint: 'ws://localhost:8080/mcp',
        authentication: {
            type: 'oauth2',
            config: {
                clientId: 'the-new-fuse',
                clientSecret: process.env.MCP_CLIENT_SECRET || 'default-secret',
                authorizationUrl: 'https://auth.example.com/oauth/authorize',
                tokenUrl: 'https://auth.example.com/oauth/token',
                scope: ['mcp:read', 'mcp:write', 'mcp:tools'],
                useCodeChallenge: true
            }
        },
        transport: {
            type: 'websocket',
            config: {
                chunkSize: 8192,
                compression: 'gzip',
                heartbeatInterval: 30000
            }
        },
        batching: {
            enabled: true,
            maxBatchSize: 10,
            batchTimeout: 100,
            priorityQueues: true
        },
        retryPolicy: {
            maxRetries: 3,
            backoffMultiplier: 2,
            initialDelay: 1000
        },
        observability: {
            metrics: true,
            tracing: true,
            logging: true
        }
    },
    mcp: {
        endpoints: [
            {
                name: 'primary',
                priority: 1,
                healthCheck: true,
                config: {
                    endpoint: 'ws://localhost:8080/mcp',
                    authentication: {
                        type: 'oauth2',
                        config: {
                            clientId: 'the-new-fuse',
                            clientSecret: process.env.MCP_CLIENT_SECRET || 'default-secret',
                            authorizationUrl: 'https://auth.example.com/oauth/authorize',
                            tokenUrl: 'https://auth.example.com/oauth/token',
                            scope: ['mcp:read', 'mcp:write', 'mcp:tools'],
                            useCodeChallenge: true
                        }
                    },
                    transport: {
                        type: 'websocket',
                        config: {
                            chunkSize: 8192,
                            compression: 'gzip',
                            heartbeatInterval: 30000
                        }
                    },
                    batching: {
                        enabled: true,
                        maxBatchSize: 10,
                        batchTimeout: 100,
                        priorityQueues: true
                    },
                    retryPolicy: {
                        maxRetries: 3,
                        backoffMultiplier: 2,
                        initialDelay: 1000
                    },
                    observability: {
                        metrics: true,
                        tracing: true,
                        logging: true
                    }
                }
            },
            {
                name: 'fallback',
                priority: 2,
                healthCheck: true,
                config: {
                    endpoint: 'http://localhost:8081/mcp',
                    transport: {
                        type: 'http'
                    },
                    batching: {
                        enabled: true,
                        maxBatchSize: 5,
                        batchTimeout: 200
                    },
                    retryPolicy: {
                        maxRetries: 2,
                        backoffMultiplier: 1.5,
                        initialDelay: 500
                    },
                    observability: {
                        metrics: true,
                        tracing: true,
                        logging: true
                    }
                }
            }
        ],
        connectionPool: {
            maxConnections: 10,
            idleTimeout: 300000, // 5 minutes
            retryDelay: 5000,
            healthCheckInterval: 30000 // 30 seconds
        }
    },
    a2a: {
        discovery: {
            enabled: true,
            broadcastInterval: 10000, // 10 seconds
            timeout: 5000
        },
        heartbeat: {
            interval: 15000, // 15 seconds
            timeout: 30000  // 30 seconds
        }
    },
    orchestration: {
        defaultStrategy: 'load-balanced',
        maxConcurrentTasks: 20,
        taskTimeout: 300000, // 5 minutes
        retryPolicy: {
            maxRetries: 3,
            backoffMultiplier: 2,
            initialDelay: 1000
        }
    },
    security: {
        encryption: {
            algorithm: 'aes-256-cbc',
            keyLength: 256,
            secretKey: process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production'
        },
        authentication: {
            enabled: true,
            tokenExpiry: 3600, // 1 hour
            refreshTokenExpiry: 86400, // 24 hours
            maxLoginAttempts: 5,
            lockoutDuration: 900 // 15 minutes
        },
        authorization: {
            enabled: true,
            roleBasedAccess: true,
            permissions: {
                admin: ['*'],
                user: [
                    'mcp.tools.list',
                    'mcp.tools.call',
                    'mcp.resources.list',
                    'mcp.resources.get',
                    'orchestration.workflow.create',
                    'orchestration.workflow.start',
                    'orchestration.workflow.view'
                ],
                viewer: [
                    'mcp.tools.list',
                    'mcp.resources.list',
                    'orchestration.workflow.view'
                ],
                agent: [
                    'mcp.tools.call',
                    'orchestration.task.execute',
                    'orchestration.consensus.vote',
                    'a2a.communicate'
                ]
            }
        },
        audit: {
            enabled: true,
            retentionDays: 90,
            includeRequestBodies: false,
            sensitiveFields: [
                'password',
                'token',
                'secret',
                'key',
                'credentials',
                'authorization'
            ]
        }
    },
    observability: {
        metrics: {
            enabled: true,
            interval: 30, // 30 seconds
            retention: 7, // 7 days
            customMetrics: [
                'mcp.requests.total',
                'mcp.requests.duration',
                'orchestration.tasks.active',
                'orchestration.workflows.total',
                'a2a.messages.sent',
                'a2a.messages.received',
                'security.login.attempts',
                'security.threats.detected'
            ]
        },
        tracing: {
            enabled: true,
            samplingRate: 0.1, // 10% sampling
            includeUserData: false
        },
        logging: {
            level: 'info',
            structured: true,
            includeStackTrace: true,
            maxLogSize: 10485760 // 10MB
        },
        alerting: {
            enabled: true,
            thresholds: {
                'system.memory.usage': 1024, // MB
                'mcp.requests.error_rate': 0.1, // 10%
                'orchestration.tasks.failed_rate': 0.05, // 5%
                'security.threats.critical': 1, // Any critical threat
                'connection.pool.unhealthy_rate': 0.2 // 20%
            },
            notificationChannels: [
                'vscode-notification',
                'console-log'
            ]
        }
    },
    performance: {
        connectionPool: {
            maxConnections: 50,
            idleTimeout: 300000, // 5 minutes
            connectionTimeout: 10000 // 10 seconds
        },
        caching: {
            enabled: true,
            ttl: 300, // 5 minutes
            maxSize: 1000 // Max 1000 cached entries
        },
        rateLimiting: {
            enabled: true,
            requests: 100, // 100 requests
            window: 60 // per minute
        }
    }
};

export const developmentConfig: Partial<IntegrationConfig> = {
    security: {
        ...defaultEnhancedConfig.security,
        authentication: {
            ...defaultEnhancedConfig.security.authentication,
            enabled: false // Disable auth in development
        },
        authorization: {
            ...defaultEnhancedConfig.security.authorization,
            enabled: false // Disable authz in development
        }
    },
    observability: {
        ...defaultEnhancedConfig.observability,
        logging: {
            ...defaultEnhancedConfig.observability.logging,
            level: 'debug'
        },
        tracing: {
            ...defaultEnhancedConfig.observability.tracing,
            samplingRate: 1.0 // 100% sampling in development
        }
    },
    performance: {
        ...defaultEnhancedConfig.performance,
        rateLimiting: {
            ...defaultEnhancedConfig.performance.rateLimiting,
            enabled: false // Disable rate limiting in development
        }
    }
};

export const productionConfig: Partial<IntegrationConfig> = {
    security: {
        ...defaultEnhancedConfig.security,
        encryption: {
            ...defaultEnhancedConfig.security.encryption,
            secretKey: process.env.PRODUCTION_ENCRYPTION_SECRET || (() => {
                throw new Error('PRODUCTION_ENCRYPTION_SECRET environment variable required in production');
            })()
        }
    },
    observability: {
        ...defaultEnhancedConfig.observability,
        logging: {
            ...defaultEnhancedConfig.observability.logging,
            level: 'warn'
        },
        tracing: {
            ...defaultEnhancedConfig.observability.tracing,
            samplingRate: 0.01 // 1% sampling in production
        }
    },
    performance: {
        ...defaultEnhancedConfig.performance,
        connectionPool: {
            ...defaultEnhancedConfig.performance.connectionPool,
            maxConnections: 100 // Higher capacity in production
        },
        caching: {
            ...defaultEnhancedConfig.performance.caching,
            maxSize: 10000 // Larger cache in production
        },
        rateLimiting: {
            ...defaultEnhancedConfig.performance.rateLimiting,
            requests: 1000, // Higher limits in production
            window: 60
        }
    }
};

export const testConfig: Partial<IntegrationConfig> = {
    mcp: {
        ...defaultEnhancedConfig.mcp,
        endpoints: [
            {
                name: 'test',
                priority: 1,
                healthCheck: false,
                config: {
                    endpoint: 'ws://localhost:9999/mcp-test',
                    transport: { type: 'websocket' },
                    batching: { enabled: false },
                    retryPolicy: {
                        maxRetries: 1,
                        backoffMultiplier: 1,
                        initialDelay: 100
                    },
                    observability: {
                        metrics: false,
                        tracing: false,
                        logging: false
                    }
                }
            }
        ],
        connectionPool: {
            maxConnections: 2,
            idleTimeout: 10000,
            retryDelay: 1000,
            healthCheckInterval: 5000
        }
    },
    security: {
        ...defaultEnhancedConfig.security,
        authentication: {
            ...defaultEnhancedConfig.security.authentication,
            enabled: false
        },
        authorization: {
            ...defaultEnhancedConfig.security.authorization,
            enabled: false
        },
        audit: {
            ...defaultEnhancedConfig.security.audit,
            enabled: false
        }
    },
    observability: {
        ...defaultEnhancedConfig.observability,
        metrics: {
            ...defaultEnhancedConfig.observability.metrics,
            enabled: false
        },
        tracing: {
            ...defaultEnhancedConfig.observability.tracing,
            enabled: false
        },
        alerting: {
            ...defaultEnhancedConfig.observability.alerting,
            enabled: false
        }
    },
    performance: {
        ...defaultEnhancedConfig.performance,
        caching: {
            ...defaultEnhancedConfig.performance.caching,
            enabled: false
        },
        rateLimiting: {
            ...defaultEnhancedConfig.performance.rateLimiting,
            enabled: false
        }
    }
};

/**
 * Get configuration based on environment
 */
export function getConfig(environment?: 'development' | 'production' | 'test'): IntegrationConfig {
    const env = environment || process.env.NODE_ENV || 'development';
    
    switch (env) {
        case 'production':
            return mergeConfigs(defaultEnhancedConfig, productionConfig);
        case 'test':
            return mergeConfigs(defaultEnhancedConfig, testConfig);
        default:
            return mergeConfigs(defaultEnhancedConfig, developmentConfig);
    }
}

/**
 * Deep merge configuration objects
 */
function mergeConfigs(base: IntegrationConfig, override: Partial<IntegrationConfig>): IntegrationConfig {
    const result = JSON.parse(JSON.stringify(base)); // Deep clone
    
    function deepMerge(target: any, source: any): any {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    
    return deepMerge(result, override);
}

/**
 * Validate configuration
 */
export function validateConfig(config: IntegrationConfig): string[] {
    const errors: string[] = [];
    
    // Validate MCP endpoints
    if (!config.mcp.endpoints || config.mcp.endpoints.length === 0) {
        errors.push('At least one MCP endpoint must be configured');
    }
    
    for (const endpoint of config.mcp.endpoints) {
        if (!endpoint.name) {
            errors.push('MCP endpoint name is required');
        }
        if (!endpoint.config.endpoint) {
            errors.push(`MCP endpoint ${endpoint.name} must have an endpoint URL`);
        }
    }
    
    // Validate security config
    if (config.security.authentication.enabled && !config.security.encryption.secretKey) {
        errors.push('Encryption secret key is required when authentication is enabled');
    }
    
    if (config.security.encryption.secretKey === 'default-secret-key-change-in-production') {
        errors.push('Default encryption secret key must be changed in production');
    }
    
    // Validate performance config
    if (config.performance.connectionPool.maxConnections < 1) {
        errors.push('Connection pool must allow at least 1 connection');
    }
    
    if (config.performance.caching.enabled && config.performance.caching.maxSize < 1) {
        errors.push('Cache size must be at least 1 when caching is enabled');
    }
    
    return errors;
}
