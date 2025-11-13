"use strict";
/**
 * Node.js Performance Optimizer
 *
 * Leverages Node.js performance characteristics to optimize
 * The New Fuse discovery and processing operations.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BunPerformanceOptimizer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BunPerformanceOptimizer = void 0;
const common_1 = require("@nestjs/common");
let BunPerformanceOptimizer = BunPerformanceOptimizer_1 = class BunPerformanceOptimizer {
    logger = new common_1.Logger(BunPerformanceOptimizer_1.name);
    metrics;
    config;
    optimizationInterval;
    constructor() {
        this.metrics = this.initializeMetrics();
        this.config = this.getDefaultConfig();
        this.startPerformanceMonitoring();
    }
    /**
     * Optimize discovery operations using Node.js performance characteristics
     */
    async optimizeDiscoveryOperation(operation, operationName) {
        const startTime = performance.now();
        try {
            // Pre-optimization
            await this.preOptimize(operationName);
            // Execute operation with Node.js optimizations
            const result = await this.executeWithOptimizations(operation);
            // Post-optimization
            await this.postOptimize(operationName, startTime);
            return result;
        }
        catch (error) {
            this.logger.error(`Optimization failed for ${operationName}:, error);
      throw error;
    }
  }

  /**
   * Optimize parallel processing using Node.js worker capabilities
   */
  async optimizeParallelProcessing<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency?: number
  ): Promise<R[]> {
    const maxConcurrency = concurrency || this.config.maxConcurrency;
    const results: R[] = [];

    // Process items in batches
    for (let i = 0; i < items.length; i += maxConcurrency) {
      const batch = items.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Performance optimizer configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
      this.logger.log('Performance monitoring stopped');
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Update metrics every 5 seconds
    this.optimizationInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      eventLoopLag: 0,
      gcPressure: 0,
      nodeSpecificMetrics: {
        bundlerTime: 0,
        transpileTime: 0,
        moduleResolutionTime: 0,
        jitCompilationTime: 0,
        nativeCallOverhead: 0
      }
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): OptimizationConfig {
    const cpuCount = os.cpus().length;
    return {
      enableJITOptimization: true,
      enableBundlerOptimization: true,
      enableNativeOptimization: true,
      maxConcurrency: Math.max(2, cpuCount - 1),
      memoryThreshold: 0.85, // 85% of available memory
      gcThreshold: 0.75 // 75% memory usage triggers GC hint
    };
  }

  /**
   * Pre-optimize before operation
   */
  private async preOptimize(operationName: string): Promise<void> {
    this.updateMetrics();

    // Trigger GC if memory pressure is high
    if (this.metrics.memoryUsage > this.config.gcThreshold) {
      if (global.gc) {
        global.gc();`, this.logger.debug(`Triggered GC before ${operationName}`));
        }
    }
};
exports.BunPerformanceOptimizer = BunPerformanceOptimizer;
exports.BunPerformanceOptimizer = BunPerformanceOptimizer = BunPerformanceOptimizer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BunPerformanceOptimizer);
async;
executeWithOptimizations(operation, () => Promise);
Promise < T > {
    return: await operation()
};
async;
postOptimize(operationName, string, startTime, number);
Promise < void  > {
    const: duration = performance.now() - startTime,
    this: .logger.debug($, { operationName }, completed in $, { duration, : .toFixed(2) }, ms `);

    this.updateMetrics();
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    try {
      // Get memory usage
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      this.metrics.memoryUsage = memUsage.heapUsed / totalMemory;

      // Get CPU usage (approximation using process.cpuUsage())
      const cpuUsage = process.cpuUsage();
      const totalCpuTime = cpuUsage.user + cpuUsage.system;
      this.metrics.cpuUsage = totalCpuTime / 1000000; // Convert to seconds

      // Estimate event loop lag (simplified)
      const start = Date.now();
      setImmediate(() => {
        this.metrics.eventLoopLag = Date.now() - start;
      });

      // Estimate GC pressure based on heap usage
      const heapUsageRatio = memUsage.heapUsed / memUsage.heapTotal;
      this.metrics.gcPressure = heapUsageRatio;

    } catch (error) {
      this.logger.warn('Failed to update metrics:', error);
    }
  }

  /**
   * Get optimal concurrency based on current system load
   */
  getOptimalConcurrency(): number {
    const cpuCount = os.cpus().length;
    const memoryPressure = this.metrics.memoryUsage;

    // Reduce concurrency if memory pressure is high
    if (memoryPressure > 0.8) {
      return Math.max(1, Math.floor(cpuCount / 2));
    }

    // Reduce concurrency if CPU is heavily loaded
    if (this.metrics.cpuUsage > 0.8) {
      return Math.max(2, Math.floor(cpuCount * 0.75));
    }

    return Math.max(2, cpuCount - 1);
  }

  /**
   * Check if system is under high load
   */
  isUnderHighLoad(): boolean {
    return (
      this.metrics.cpuUsage > 0.8 ||
      this.metrics.memoryUsage > 0.85 ||
      this.metrics.eventLoopLag > 100
    );
  }

  /**
   * Get performance suggestions
   */
  getPerformanceSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.metrics.memoryUsage > 0.85) {
      suggestions.push('High memory usage detected. Consider reducing batch sizes or enabling streaming.');
    }

    if (this.metrics.eventLoopLag > 100) {
      suggestions.push('Event loop lag detected. Consider reducing concurrency or optimizing synchronous operations.');
    }

    if (this.metrics.cpuUsage > 0.8) {
      suggestions.push('High CPU usage detected. Consider reducing parallel operations or optimizing algorithms.');
    }

    return suggestions;
  }
}
    )
};
//# sourceMappingURL=BunPerformanceOptimizer.js.map