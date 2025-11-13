"use strict";
/**
 * Error recovery mechanisms for agents
 * Provides automated error handling and recovery strategies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorRecovery = exports.ErrorSeverity = exports.ErrorCategory = void 0;
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["RESOURCE"] = "resource";
    ErrorCategory["LOGIC"] = "logic";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["TIMEOUT"] = "timeout";
    ErrorCategory["DEPENDENCY"] = "dependency";
    ErrorCategory["SYSTEM"] = "system";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["FATAL"] = "fatal";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
class ErrorRecovery {
    strategies = new Map();
    errorHistory = [];
    maxHistorySize = 1000;
    constructor() {
        this.initializeDefaultStrategies();
    }
    /**
     * Handle an error with appropriate recovery strategy
     */
    async handleError(error, category, severity) {
        const errorRecord = {
            error,
            category,
            severity,
            timestamp: Date.now(),
            attempts: 0,
            resolved: false
        };
        // Add to history
        this.addToHistory(errorRecord);
        // Find appropriate strategy
        const strategy = this.findStrategy(category, severity);
        if (!strategy) {
            console.error(`No recovery strategy found for ${category}/${severity}:, error.message);
      return false;
    }

    errorRecord.strategy = strategy.name;

    // Attempt recovery
    for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
      errorRecord.attempts = attempt;
      
      try {`, console.log(Attempting, recovery));
            for ($; { category } `/${severity}`; error(attempt, $, { attempt } / $, { strategy, : .maxRetries }))
                ;
            const recovered = await strategy.execute(error, attempt);
            if (recovered) {
                errorRecord.resolved = true;
                `
          console.log(Successfully recovered from ${category}` / $;
                {
                    severity;
                }
                error;
                after;
                $;
                {
                    attempt;
                }
                ` attempts);
          return true;
        }
      } catch (strategyError) {
        console.error(Recovery strategy failed on attempt ${attempt}:, strategyError);
      }

      // Wait before retry (exponential backoff)
      if (attempt < strategy.maxRetries) {
        const delay = Math.pow(strategy.backoffMultiplier, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
`;
                console.error(Failed, to, recover, from, $, { category } / $, { severity } ` error after ${strategy.maxRetries} attempts);
    return false;
  }

  /**
   * Register a custom recovery strategy`
                    * /`, registerStrategy(strategy, ErrorRecoveryStrategy), void {
                    const: key = $
                }, { strategy, : .category }, $, { strategy, : .severity } `;
    this.strategies.set(key, strategy);
  }

  /**
   * Find appropriate recovery strategy
   */
  private findStrategy(category: ErrorCategory, severity: ErrorSeverity): ErrorRecoveryStrategy | null {
    const key = ${category}:${severity}`);
                return this.strategies.get(key) || null;
            }
            /**
             * Add error to history
             */
        }
        /**
         * Add error to history
         */
    }
    /**
     * Add error to history
     */
    addToHistory(record) {
        this.errorHistory.push(record);
        // Trim history if too large
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
        }
    }
    /**
     * Initialize default recovery strategies
     */
    initializeDefaultStrategies() {
        // Network retry strategy
        this.registerStrategy({
            name: 'network-retry',
            category: ErrorCategory.NETWORK,
            severity: ErrorSeverity.MEDIUM,
            maxRetries: 3,
            backoffMultiplier: 2,
            execute: async (error, attempt) => {
                // Simple retry logic - can be enhanced
                console.log(Network, retry, attempt, $, { attempt } `);
        return false; // Placeholder - should implement actual retry logic
      }
    });

    // Timeout recovery strategy
    this.registerStrategy({
      name: 'timeout-recovery',
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      maxRetries: 2,
      backoffMultiplier: 1.5,
      execute: async (_error: Error, _attempt: number) => {
        
        return false; // Placeholder - should implement timeout handling
      }
    });

    // Resource cleanup strategy
    this.registerStrategy({
      name: 'resource-cleanup',
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.HIGH,
      maxRetries: 1,
      backoffMultiplier: 1,
      execute: async () => {
        // Placeholder for resource cleanup logic
        return false;
      }
    });
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalErrors: number;
    resolvedErrors: number;
    categoryCounts: Record<ErrorCategory, number>;
    severityCounts: Record<ErrorSeverity, number>;
  } {
    const categoryCounts = {} as Record<ErrorCategory, number>;
    const severityCounts = {} as Record<ErrorSeverity, number>;
    let resolvedErrors = 0;

    this.errorHistory.forEach(record => {
      categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;
      severityCounts[record.severity] = (severityCounts[record.severity] || 0) + 1;
      if (record.resolved) {
        resolvedErrors++;
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      resolvedErrors,
      categoryCounts,
      severityCounts
    };
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }
});
            }
        });
    }
}
exports.ErrorRecovery = ErrorRecovery;
//# sourceMappingURL=recovery.js.map