"use strict";
/**
 * Graceful Degradation System
 * Provides fallback mechanisms when MCP services are unavailable
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GracefulDegradationManager = exports.ServiceLevel = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const error_1 = require("../types/error");
var ServiceLevel;
(function (ServiceLevel) {
    ServiceLevel["FULL"] = "full";
    ServiceLevel["DEGRADED"] = "degraded";
    ServiceLevel["MINIMAL"] = "minimal";
    ServiceLevel["OFFLINE"] = "offline";
})(ServiceLevel || (exports.ServiceLevel = ServiceLevel = {}));
/**
 * Graceful Degradation Manager
 */
class GracefulDegradationManager extends events_1.EventEmitter {
    config;
    logger;
    currentLevel = ServiceLevel.FULL;
    serviceStatus;
    healthCheckTimer;
    recoveryTimer;
    operationQueue = [];
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger_1.Logger(`GracefulDegradation:${config.serviceName});
    
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
  async executeOperation<T = any>(
    operation: string,
    params: any,
    primaryHandler: () => Promise<T>
  ): Promise<T> {
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
    } catch (error) {
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
  registerFallbackHandler(
    level: ServiceLevel,
    operation: string,
    handler: FallbackHandler
  ): void {
    const levelConfig = this.config.levels[level];
    if (!levelConfig.fallbackHandlers) {
      levelConfig.fallbackHandlers = new Map();
    }
    
    levelConfig.fallbackHandlers.set(operation, handler);`, this.logger.debug(`Registered fallback handler for ${operation}`, at, level, $, { level }));
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
        `
    this.logger.warn(`;
        Service;
        $;
        {
            this.config.serviceName;
        }
        ` degraded from ${oldLevel} to ${level}: ${reason});
    this.emit('serviceDegraded', this.config.serviceName, oldLevel, level, reason);
  }

  /**
   * Attempt to recover service to higher level
   */
  async attemptRecovery(): Promise<boolean> {
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
        this.serviceStatus.availableFeatures = levelConfig.availableFeatures;`;
        this.serviceStatus.disabledFeatures = levelConfig.disabledFeatures;
        `
`;
        this.logger.info(Service, $, { this: .config.serviceName }, recovered, from, $, { oldLevel }, to, $, { targetLevel });
        this.emit('serviceRecovered', this.config.serviceName, oldLevel, targetLevel);
        return true;
    }
}
exports.GracefulDegradationManager = GracefulDegradationManager;
`
      return false;`;
try { }
catch (error) {
    `
      this.logger.error(Recovery attempt failed for ${this.config.serviceName}:, error);
      return false;
    }
  }

  /**
   * Force service to full level (manual recovery)
   */
  forceFullService(): void {
    const oldLevel = this.currentLevel;
    this.currentLevel = ServiceLevel.FULL;
    this.serviceStatus.currentLevel = ServiceLevel.FULL;
    this.serviceStatus.healthy = true;
    this.serviceStatus.errorCount = 0;
    this.serviceStatus.degradationReason = undefined;
    
    const levelConfig = this.config.levels[ServiceLevel.FULL];
    this.serviceStatus.availableFeatures = levelConfig.availableFeatures;
    this.serviceStatus.disabledFeatures = levelConfig.disabledFeatures;
`;
    this.logger.info(Service, $, { this: .config.serviceName } ` manually restored to full service from ${oldLevel});
    this.emit('serviceForceRecovered', this.config.serviceName, oldLevel);
  }

  /**
   * Check if operation is available at current service level
   */
  isOperationAvailable(operation: string): boolean {
    return this.serviceStatus.availableFeatures.includes(operation);
  }

  /**
   * Get available operations at current level
   */
  getAvailableOperations(): string[] {
    return [...this.serviceStatus.availableFeatures];
  }

  /**
   * Get disabled operations at current level
   */
  getDisabledOperations(): string[] {
    return [...this.serviceStatus.disabledFeatures];
  }

  /**
   * Shutdown the degradation manager
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = undefined;
    }` `
    this.removeAllListeners();
    this.logger.debug(Graceful degradation manager for ${this.config.serviceName} shutdown`);
}
async;
executeFallback < T;
any > (operation);
string, params;
any;
Promise < T > {
    // Find fallback handler for current level
    const: levelConfig = this.config.levels[this.currentLevel],
    const: fallbackHandler = levelConfig.fallbackHandlers?.get(operation),
    if(fallbackHandler) { }
} && fallbackHandler.available;
{
    try {
        this.logger.debug(Executing, fallback, handler);
        for ($; { operation }; at)
            level;
        $;
        {
            this.currentLevel;
        }
        `);
        const result = await fallbackHandler.handler(operation, params);
        this.emit('fallbackExecuted', this.config.serviceName, operation, this.currentLevel);
        return result;
      } catch (error) {
        this.logger.error(Fallback handler failed for ${operation}:, error);
      }
    }

    // Try fallback handlers from lower levels
    const lowerLevels = this.getLowerLevels(this.currentLevel);
    for (const level of lowerLevels) {
      const lowerLevelConfig = this.config.levels[level];
      const lowerFallbackHandler = lowerLevelConfig.fallbackHandlers?.get(operation);
      
      if (lowerFallbackHandler && lowerFallbackHandler.available) {
        try {`;
        this.logger.debug(Executing, lower - level, fallback, handler);
        for ($; { operation }; at)
            level;
        $;
        {
            level;
        }
        `);
          const result = await lowerFallbackHandler.handler(operation, params);
          this.emit('fallbackExecuted', this.config.serviceName, operation, level);
          return result;
        } catch (error) {
          this.logger.error(Lower-level fallback handler failed for ${operation}`;
        error;
        ;
    }
    finally {
    }
}
// No fallback available
throw new Error(No, fallback, available);
for (operation; $; { operation })
    at;
service;
level;
$;
{
    this.currentLevel;
}
;
async;
handleOperationError(error, error_1.MCPErrorClass, operation, string);
Promise < void  > {
    this: .serviceStatus.errorCount++,
    this: .serviceStatus.lastError = error,
    this: .emit('operationError', this.config.serviceName, operation, error),
    // Determine if we should degrade based on error type and count
    const: shouldDegrade = this.shouldDegradeService(error),
    if(shouldDegrade) {
        const targetLevel = this.getNextLowerLevel(this.currentLevel);
        if (targetLevel) {
            this.degradeToLevel(targetLevel, Error, threshold, exceeded, $, { error, : .message });
        }
    }
};
shouldDegradeService(error, error_1.MCPErrorClass);
boolean;
{
    // Immediate degradation for certain error types
    if (error.category === error_1.ErrorCategory.CONNECTION ||
        error.category === error_1.ErrorCategory.SYSTEM) {
        return true;
    }
    // Degrade based on error count threshold
    const errorThreshold = this.getErrorThresholdForLevel(this.currentLevel);
    return this.serviceStatus.errorCount >= errorThreshold;
}
getErrorThresholdForLevel(level, ServiceLevel);
number;
{
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
checkPerformanceLimits();
boolean;
{
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
getNextHigherLevel(currentLevel, ServiceLevel);
ServiceLevel | null;
{
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
getNextLowerLevel(currentLevel, ServiceLevel);
ServiceLevel | null;
{
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
getLowerLevels(currentLevel, ServiceLevel);
ServiceLevel[];
{
    const levels = [];
    let level = this.getNextLowerLevel(currentLevel);
    while (level) {
        levels.push(level);
        level = this.getNextLowerLevel(level);
    }
    return levels;
}
async;
performHealthCheck(level, ServiceLevel);
Promise < boolean > {
    try: {
        // This would be implemented based on specific service requirements
        // For now, return true as a placeholder
        this: .serviceStatus.lastHealthCheck = new Date()
    } `
      return true;`
};
try { }
catch (error) {
    `
      this.logger.error(Health check failed for level ${level}:`, error;
    ;
    return false;
}
startHealthChecking();
void {
    this: .healthCheckTimer = setInterval(async () => {
        const healthy = await this.performHealthCheck(this.currentLevel);
        this.serviceStatus.healthy = healthy;
        if (!healthy && this.currentLevel !== ServiceLevel.OFFLINE) {
            const targetLevel = this.getNextLowerLevel(this.currentLevel);
            if (targetLevel) {
                this.degradeToLevel(targetLevel, 'Health check failed');
            }
        }
    }, this.config.healthCheckInterval)
};
startRecoveryChecking();
void {
    this: .recoveryTimer = setInterval(async () => {
        if (this.currentLevel !== ServiceLevel.FULL) {
            await this.attemptRecovery();
        }
    }, this.config.recoveryCheckInterval)
};
//# sourceMappingURL=GracefulDegradation.js.map