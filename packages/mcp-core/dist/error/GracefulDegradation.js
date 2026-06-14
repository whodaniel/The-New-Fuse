/**
 * Graceful Degradation System
 * Provides fallback mechanisms when MCP services are unavailable
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger.js';
import { MCPErrorClass, ErrorCategory } from '../types/error.js';
export var ServiceLevel;
(function (ServiceLevel) {
    ServiceLevel["FULL"] = "full";
    ServiceLevel["DEGRADED"] = "degraded";
    ServiceLevel["MINIMAL"] = "minimal";
    ServiceLevel["OFFLINE"] = "offline";
})(ServiceLevel || (ServiceLevel = {}));
/**
 * Graceful Degradation Manager
 */
export class GracefulDegradationManager extends EventEmitter {
    constructor(config, logger) {
        super();
        this.currentLevel = ServiceLevel.FULL;
        this.operationQueue = [];
        this.config = config;
        this.logger = logger || new Logger(`GracefulDegradation:${config.serviceName}`);
        this.serviceStatus = {
            serviceName: config.serviceName,
            currentLevel: ServiceLevel.FULL,
            availableFeatures: config.levels[ServiceLevel.FULL].availableFeatures,
            disabledFeatures: config.levels[ServiceLevel.FULL].disabledFeatures,
            lastHealthCheck: new Date(),
            healthy: true,
            errorCount: 0,
            recoveryAttempts: 0
        };
        this.startHealthChecking();
        if (config.enableAutoRecovery) {
            this.startRecoveryChecking();
        }
    }
    /**
     * Execute an operation with graceful degradation
     */
    async executeOperation(operation, params, primaryHandler) {
        try {
            // Check if operation is available at current service level
            if (!this.isOperationAvailable(operation)) {
                return await this.executeFallback(operation, params);
            }
            // Check performance limits
            if (!this.checkPerformanceLimits()) {
                throw new Error('Performance limits exceeded');
            }
            // Execute primary handler
            const result = await primaryHandler();
            // Reset error count on success
            if (this.serviceStatus.errorCount > 0) {
                this.serviceStatus.errorCount = 0;
                this.emit('errorCountReset', this.config.serviceName);
            }
            return result;
        }
        catch (error) {
            const mcpError = error instanceof MCPErrorClass ?
                error :
                new MCPErrorClass(-32603, error instanceof Error ? error.message : String(error));
            await this.handleOperationError(mcpError, operation);
            // Try fallback
            return await this.executeFallback(operation, params);
        }
    }
    /**
     * Register a fallback handler
     */
    registerFallbackHandler(level, operation, handler) {
        const levelConfig = this.config.levels[level];
        if (!levelConfig.fallbackHandlers) {
            levelConfig.fallbackHandlers = new Map();
        }
        levelConfig.fallbackHandlers.set(operation, handler);
        this.logger.debug(`Registered fallback handler for ${operation} at level ${level}`);
    }
    /**
     * Get current service status
     */
    getServiceStatus() {
        return { ...this.serviceStatus };
    }
    /**
     * Manually degrade service to specified level
     */
    degradeToLevel(level, reason) {
        if (level === this.currentLevel) {
            return;
        }
        const oldLevel = this.currentLevel;
        this.currentLevel = level;
        this.serviceStatus.currentLevel = level;
        this.serviceStatus.degradationReason = reason;
        const levelConfig = this.config.levels[level];
        this.serviceStatus.availableFeatures = levelConfig.availableFeatures;
        this.serviceStatus.disabledFeatures = levelConfig.disabledFeatures;
        this.logger.warn(`Service ${this.config.serviceName} degraded from ${oldLevel} to ${level}: ${reason}`);
        this.emit('serviceDegraded', this.config.serviceName, oldLevel, level, reason);
    }
    /**
     * Attempt to recover service to higher level
     */
    async attemptRecovery() {
        if (this.currentLevel === ServiceLevel.FULL) {
            return true; // Already at full service
        }
        this.serviceStatus.recoveryAttempts++;
        this.serviceStatus.lastRecoveryAttempt = new Date();
        try {
            // Attempt to recover to next higher level
            const targetLevel = this.getNextHigherLevel(this.currentLevel);
            if (!targetLevel) {
                return false;
            }
            // Perform health check for target level
            const healthy = await this.performHealthCheck(targetLevel);
            if (healthy) {
                const oldLevel = this.currentLevel;
                this.currentLevel = targetLevel;
                this.serviceStatus.currentLevel = targetLevel;
                this.serviceStatus.healthy = true;
                this.serviceStatus.degradationReason = undefined;
                const levelConfig = this.config.levels[targetLevel];
                this.serviceStatus.availableFeatures = levelConfig.availableFeatures;
                this.serviceStatus.disabledFeatures = levelConfig.disabledFeatures;
                this.logger.info(`Service ${this.config.serviceName} recovered from ${oldLevel} to ${targetLevel}`);
                this.emit('serviceRecovered', this.config.serviceName, oldLevel, targetLevel);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Recovery attempt failed for ${this.config.serviceName}:`, error);
            return false;
        }
    }
    /**
     * Force service to full level (manual recovery)
     */
    forceFullService() {
        const oldLevel = this.currentLevel;
        this.currentLevel = ServiceLevel.FULL;
        this.serviceStatus.currentLevel = ServiceLevel.FULL;
        this.serviceStatus.healthy = true;
        this.serviceStatus.errorCount = 0;
        this.serviceStatus.degradationReason = undefined;
        const levelConfig = this.config.levels[ServiceLevel.FULL];
        this.serviceStatus.availableFeatures = levelConfig.availableFeatures;
        this.serviceStatus.disabledFeatures = levelConfig.disabledFeatures;
        this.logger.info(`Service ${this.config.serviceName} manually restored to full service from ${oldLevel}`);
        this.emit('serviceForceRecovered', this.config.serviceName, oldLevel);
    }
    /**
     * Check if operation is available at current service level
     */
    isOperationAvailable(operation) {
        return this.serviceStatus.availableFeatures.includes(operation);
    }
    /**
     * Get available operations at current level
     */
    getAvailableOperations() {
        return [...this.serviceStatus.availableFeatures];
    }
    /**
     * Get disabled operations at current level
     */
    getDisabledOperations() {
        return [...this.serviceStatus.disabledFeatures];
    }
    /**
     * Shutdown the degradation manager
     */
    shutdown() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
        if (this.recoveryTimer) {
            clearInterval(this.recoveryTimer);
            this.recoveryTimer = undefined;
        }
        this.removeAllListeners();
        this.logger.debug(`Graceful degradation manager for ${this.config.serviceName} shutdown`);
    }
    /**
     * Execute fallback handler
     */
    async executeFallback(operation, params) {
        // Find fallback handler for current level
        const levelConfig = this.config.levels[this.currentLevel];
        const fallbackHandler = levelConfig.fallbackHandlers?.get(operation);
        if (fallbackHandler && fallbackHandler.available) {
            try {
                this.logger.debug(`Executing fallback handler for ${operation} at level ${this.currentLevel}`);
                const result = await fallbackHandler.handler(operation, params);
                this.emit('fallbackExecuted', this.config.serviceName, operation, this.currentLevel);
                return result;
            }
            catch (error) {
                this.logger.error(`Fallback handler failed for ${operation}:`, error);
            }
        }
        // Try fallback handlers from lower levels
        const lowerLevels = this.getLowerLevels(this.currentLevel);
        for (const level of lowerLevels) {
            const lowerLevelConfig = this.config.levels[level];
            const lowerFallbackHandler = lowerLevelConfig.fallbackHandlers?.get(operation);
            if (lowerFallbackHandler && lowerFallbackHandler.available) {
                try {
                    this.logger.debug(`Executing lower-level fallback handler for ${operation} at level ${level}`);
                    const result = await lowerFallbackHandler.handler(operation, params);
                    this.emit('fallbackExecuted', this.config.serviceName, operation, level);
                    return result;
                }
                catch (error) {
                    this.logger.error(`Lower-level fallback handler failed for ${operation}:`, error);
                }
            }
        }
        // No fallback available
        throw new Error(`No fallback available for operation ${operation} at service level ${this.currentLevel}`);
    }
    /**
     * Handle operation error and potentially degrade service
     */
    async handleOperationError(error, operation) {
        this.serviceStatus.errorCount++;
        this.serviceStatus.lastError = error;
        this.emit('operationError', this.config.serviceName, operation, error);
        // Determine if we should degrade based on error type and count
        const shouldDegrade = this.shouldDegradeService(error);
        if (shouldDegrade) {
            const targetLevel = this.getNextLowerLevel(this.currentLevel);
            if (targetLevel) {
                this.degradeToLevel(targetLevel, `Error threshold exceeded: ${error.message}`);
            }
        }
    }
    /**
     * Check if service should be degraded based on error
     */
    shouldDegradeService(error) {
        // Immediate degradation for certain error types
        if (error.category === ErrorCategory.CONNECTION ||
            error.category === ErrorCategory.SYSTEM) {
            return true;
        }
        // Degrade based on error count threshold
        const errorThreshold = this.getErrorThresholdForLevel(this.currentLevel);
        return this.serviceStatus.errorCount >= errorThreshold;
    }
    /**
     * Get error threshold for current service level
     */
    getErrorThresholdForLevel(level) {
        switch (level) {
            case ServiceLevel.FULL:
                return 5;
            case ServiceLevel.DEGRADED:
                return 10;
            case ServiceLevel.MINIMAL:
                return 15;
            case ServiceLevel.OFFLINE:
                return Infinity;
            default:
                return 5;
        }
    }
    /**
     * Check performance limits
     */
    checkPerformanceLimits() {
        const levelConfig = this.config.levels[this.currentLevel];
        const limits = levelConfig.performanceLimits;
        if (!limits) {
            return true;
        }
        // Check concurrent requests (simplified - would need actual tracking)
        if (limits.maxConcurrentRequests && this.operationQueue.length >= limits.maxConcurrentRequests) {
            return false;
        }
        // Additional performance checks would go here
        return true;
    }
    /**
     * Get next higher service level
     */
    getNextHigherLevel(currentLevel) {
        switch (currentLevel) {
            case ServiceLevel.OFFLINE:
                return ServiceLevel.MINIMAL;
            case ServiceLevel.MINIMAL:
                return ServiceLevel.DEGRADED;
            case ServiceLevel.DEGRADED:
                return ServiceLevel.FULL;
            case ServiceLevel.FULL:
                return null;
            default:
                return null;
        }
    }
    /**
     * Get next lower service level
     */
    getNextLowerLevel(currentLevel) {
        switch (currentLevel) {
            case ServiceLevel.FULL:
                return ServiceLevel.DEGRADED;
            case ServiceLevel.DEGRADED:
                return ServiceLevel.MINIMAL;
            case ServiceLevel.MINIMAL:
                return ServiceLevel.OFFLINE;
            case ServiceLevel.OFFLINE:
                return null;
            default:
                return null;
        }
    }
    /**
     * Get all lower service levels
     */
    getLowerLevels(currentLevel) {
        const levels = [];
        let level = this.getNextLowerLevel(currentLevel);
        while (level) {
            levels.push(level);
            level = this.getNextLowerLevel(level);
        }
        return levels;
    }
    /**
     * Perform health check for specific level
     */
    async performHealthCheck(level) {
        try {
            // This would be implemented based on specific service requirements
            // For now, return true as a placeholder
            this.serviceStatus.lastHealthCheck = new Date();
            return true;
        }
        catch (error) {
            this.logger.error(`Health check failed for level ${level}:`, error);
            return false;
        }
    }
    /**
     * Start health checking
     */
    startHealthChecking() {
        this.healthCheckTimer = setInterval(async () => {
            const healthy = await this.performHealthCheck(this.currentLevel);
            this.serviceStatus.healthy = healthy;
            if (!healthy && this.currentLevel !== ServiceLevel.OFFLINE) {
                const targetLevel = this.getNextLowerLevel(this.currentLevel);
                if (targetLevel) {
                    this.degradeToLevel(targetLevel, 'Health check failed');
                }
            }
        }, this.config.healthCheckInterval);
    }
    /**
     * Start recovery checking
     */
    startRecoveryChecking() {
        this.recoveryTimer = setInterval(async () => {
            if (this.currentLevel !== ServiceLevel.FULL) {
                await this.attemptRecovery();
            }
        }, this.config.recoveryCheckInterval);
    }
}
//# sourceMappingURL=GracefulDegradation.js.map