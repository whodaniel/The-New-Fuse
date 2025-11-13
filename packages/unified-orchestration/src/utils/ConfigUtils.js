"use strict";
/**
 * Configuration Utilities for Unified Orchestration
 *
 * This module provides utility functions for configuration management,
 * validation, and agent scoring algorithms.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultConfig = createDefaultConfig;
exports.validateAgentConfiguration = validateAgentConfiguration;
exports.calculateAgentScore = calculateAgentScore;
exports.mergeConfigurations = mergeConfigurations;
/**
 * Create default configuration for unified orchestration
 */
function createDefaultConfig() {
    return {
        agentRegistry: {
            maxAgents: 1000,
            defaultTimeout: 30000,
            healthCheckInterval: 60000,
            metricsRetentionPeriod: 86400000, // 24 hours
            loadBalancingStrategy: 'performance_based',
            enableCaching: true,
            cacheTimeout: 300000, // 5 minutes
            maxConcurrentExecutions: 100,
            enableMetrics: true,
            enableHealthChecks: true,
            enableEventLogging: true,
            enableTenantIsolation: true,
            requireAuthentication: false,
            allowCrossTenanantAccess: false,
            enableLegacySupport: true,
            legacyMappings: {
                cliAgentTypes: {},
                workflowNodeCapabilities: {},
                syncAgentTypes: {},
                customAgentMappings: {}
            },
            enableFederation: false,
            federationEndpoints: []
        },
        messageProcessing: {
            routing: {
                enableRoundRobin: true,
                enableLoadBalancing: true,
                enableFailover: true,
                maxHops: 10
            },
            limits: {
                maxMessageSize: 1048576, // 1MB
                maxBatchSize: 100,
                maxProcessingTime: 30000,
                maxRetries: 3
            },
            performance: {
                enableCompression: true,
                enableCaching: true,
                cacheTtl: 300000,
                enablePipelining: true,
                maxConcurrentMessages: 1000
            },
            security: {
                enableEncryption: false,
                enableSigning: false,
                enableChecksums: true,
                requireAuthentication: false
            }
        }
    };
}
/**
 * Validate agent configuration
 */
function validateAgentConfiguration(config) {
    const errors = [];
    const warnings = [];
    // Timeout validation
    if (config.timeout <= 0) {
        errors.push('Timeout must be greater than 0');
    }
    if (config.timeout > 300000) { // 5 minutes
        warnings.push('Timeout is very long (>5 minutes)');
    }
    // Retry policy validation
    if (config.retryPolicy.maxRetries < 0) {
        errors.push('Max retries cannot be negative');
    }
    if (config.retryPolicy.maxRetries > 10) {
        warnings.push('High number of retries may cause performance issues');
    }
    if (config.retryPolicy.baseDelay <= 0) {
        errors.push('Base delay must be greater than 0');
    }
    if (config.retryPolicy.maxDelay < config.retryPolicy.baseDelay) {
        errors.push('Max delay must be greater than or equal to base delay');
    }
    // Resource validation
    if (config.resources.cpu) {
        if (config.resources.cpu.min > config.resources.cpu.max) {
            errors.push('CPU min cannot be greater than max');
        }
        if (config.resources.cpu.current > config.resources.cpu.max) {
            warnings.push('Current CPU usage exceeds max limit');
        }
    }
    if (config.resources.memory) {
        if (config.resources.memory.min > config.resources.memory.max) {
            errors.push('Memory min cannot be greater than max');
        }
        if (config.resources.memory.current > config.resources.memory.max) {
            warnings.push('Current memory usage exceeds max limit');
        }
    }
    if (config.resources.concurrent) {
        if (config.resources.concurrent.current > config.resources.concurrent.max) {
            warnings.push('Current concurrent tasks exceed max limit');
        }
    }
    // Communication protocol validation
    if (config.communication) {
        if (!config.communication.protocols.includes(config.communication.preferredProtocol)) {
            errors.push('Preferred protocol must be in the list of supported protocols');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Calculate agent score based on selection criteria
 */
function calculateAgentScore(agent, criteria) {
    const breakdown = {};
    let totalScore = 0;
    const reasons = [];
    // Capability matching (40% of score)
    const capabilityScore = calculateCapabilityScore(agent, criteria);
    breakdown.capabilities = capabilityScore;
    totalScore += capabilityScore * 0.4;
    if (capabilityScore > 0.8) {
        reasons.push('Strong capability match');
    }
    else if (capabilityScore > 0.5) {
        reasons.push('Partial capability match');
    }
    else {
        reasons.push('Weak capability match');
    }
    // Performance score (30% of score)
    const performanceScore = calculatePerformanceScore(agent, criteria);
    breakdown.performance = performanceScore;
    totalScore += performanceScore * 0.3;
    if (performanceScore > 0.8) {
        reasons.push('Excellent performance metrics');
    }
    else if (performanceScore < 0.3) {
        reasons.push('Poor performance metrics');
    }
    // Load score (20% of score)
    const loadScore = calculateLoadScore(agent, criteria);
    breakdown.load = loadScore;
    totalScore += loadScore * 0.2;
    if (loadScore > 0.8) {
        reasons.push('Low current load');
    }
    else if (loadScore < 0.3) {
        reasons.push('High current load');
    }
    // Availability score (10% of score)
    const availabilityScore = calculateAvailabilityScore(agent);
    breakdown.availability = availabilityScore;
    totalScore += availabilityScore * 0.1;
    if (availabilityScore < 1.0) {
        reasons.push('Agent may not be fully available');
    }
    // Apply preferences and penalties
    if (criteria.preferredAgents?.includes(agent.id)) {
        totalScore += 0.1;
        reasons.push('Preferred agent');
    }
    if (criteria.excludeAgents?.includes(agent.id)) {
        totalScore = 0;
        reasons.push('Excluded agent');
    }
    // Tenant/workspace matching
    if (criteria.tenantId && agent.tenantId !== criteria.tenantId) {
        totalScore *= 0.5;
        reasons.push('Cross-tenant access penalty');
    }
    if (criteria.workspaceId && agent.workspaceId !== criteria.workspaceId) {
        totalScore *= 0.8;
        reasons.push('Cross-workspace access penalty');
    }
    return {
        score: Math.max(0, Math.min(1, totalScore)),
        reasoning: reasons.join(', '),
        breakdown
    };
}
/**
 * Merge multiple configurations with proper precedence
 */
function mergeConfigurations(base, ...overrides) {
    let result = { ...base };
    for (const override of overrides) {
        result = deepMerge(result, override);
    }
    return result;
}
// Helper functions
function calculateCapabilityScore(agent, criteria) {
    const requiredCapabilities = criteria.requiredCapabilities || [];
    const optionalCapabilities = criteria.optionalCapabilities || [];
    const agentCapabilities = new Set(agent.capabilities);
    if (requiredCapabilities.length === 0 && optionalCapabilities.length === 0) {
        return 1.0; // No specific requirements
    }
    // Required capabilities must all be present
    const requiredMatches = requiredCapabilities.filter(cap => agentCapabilities.has(cap));
    if (requiredCapabilities.length > 0 && requiredMatches.length !== requiredCapabilities.length) {
        return 0; // Missing required capabilities
    }
    // Optional capabilities add bonus points
    const optionalMatches = optionalCapabilities.filter(cap => agentCapabilities.has(cap));
    const optionalScore = optionalCapabilities.length > 0 ?
        optionalMatches.length / optionalCapabilities.length : 0;
    // Base score for meeting requirements, bonus for optional
    return requiredCapabilities.length > 0 ? 0.7 + (optionalScore * 0.3) : optionalScore;
}
function calculatePerformanceScore(agent, criteria) {
    let score = 1.0;
    // Success rate penalty
    if (agent.metrics.successRate < 0.9) {
        score *= agent.metrics.successRate;
    }
    // Response time penalty
    if (criteria.maxResponseTime && agent.metrics.averageResponseTime > criteria.maxResponseTime) {
        const penalty = Math.min(0.5, agent.metrics.averageResponseTime / criteria.maxResponseTime - 1);
        score *= (1 - penalty);
    }
    // Success rate requirement
    if (criteria.minSuccessRate && agent.metrics.successRate < criteria.minSuccessRate) {
        score *= 0.1; // Heavy penalty
    }
    return Math.max(0, Math.min(1, score));
}
function calculateLoadScore(agent, criteria) {
    let score = 1.0;
    // Current load penalty
    if (agent.metrics.currentLoad > 0.8) {
        score *= (1 - agent.metrics.currentLoad);
    }
    // Max load requirement
    if (criteria.maxCurrentLoad && agent.metrics.currentLoad > criteria.maxCurrentLoad) {
        score *= 0.2; // Heavy penalty
    }
    // Queue size penalty
    if (agent.metrics.queueSize > 10) {
        score *= Math.max(0.1, 1 - (agent.metrics.queueSize / 100));
    }
    return Math.max(0, Math.min(1, score));
}
function calculateAvailabilityScore(agent) {
    if (agent.status === 'offline')
        return 0;
    if (agent.status === 'error')
        return 0.1;
    if (agent.status === 'maintenance')
        return 0.2;
    if (agent.status === 'busy')
        return 0.7;
    return 1.0; // available
}
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            const sourceValue = source[key];
            const targetValue = target[key];
            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
                targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
                result[key] = deepMerge(targetValue, sourceValue);
            }
            else {
                result[key] = sourceValue;
            }
        }
    }
    return result;
}
//# sourceMappingURL=ConfigUtils.js.map