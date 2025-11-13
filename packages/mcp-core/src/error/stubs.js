"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.ServiceStatus = exports.BaseError = void 0;
// Temporary stubs for missing dependencies
const types_1 = require("@the-new-fuse/types");
// MCPError moved to centralized types package
class BaseError {
    name;
    message;
    code;
    category;
    timestamp;
    severity;
    retryable;
    connectionId;
    resourceUri;
    toolName;
    requestId;
    constructor(name, message = '', code = 500, category = types_1.ErrorCategory.UNKNOWN) {
        this.name = name;
        this.message = message;
        this.code = code;
        this.category = category;
    }
}
exports.BaseError = BaseError;
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["ONLINE"] = "online";
    ServiceStatus["OFFLINE"] = "offline";
    ServiceStatus["DEGRADED"] = "degraded";
    ServiceStatus["MAINTENANCE"] = "maintenance";
})(ServiceStatus || (exports.ServiceStatus = ServiceStatus = {}));
// ErrorSeverity and ErrorCategory moved to centralized types package
class Logger {
    context;
    constructor(context) {
        this.context = context;
    }
    debug(message, meta) {
        console.debug(`[${this.context}] ${message}, meta);
  }
  info(message: string, meta?: any): void {`, console.info([$, { this: .context } `] ${message}`, meta]));
    }
    warn(message, meta) {
        console.warn([$, { this: .context }], $, { message }, meta);
    }
    error(message, meta) {
        `
    console.error(`[$];
        {
            this.context;
        }
        $;
        {
            message;
        }
        `, meta);
  }
}

export interface MCPErrorHandlerConfig extends BaseErrorHandlerConfig {}

export class ConsoleLogger implements Logger {
  constructor(public context: string) {}
  debug(message: string, meta?: any): void {
    console.debug([${this.context}] ${message}, meta);
  }
  info(message: string, meta?: any): void {`;
        console.info([$, { this: .context }], $, { message } ``, meta);
    }
    warn(message, meta) {
        console.warn([$, { this: .context }], $, { message }, meta);
    }
    error(message, meta) {
        `
    console.error([${this.context}] ${message}` `, meta);
  }
}

export class BaseErrorHandler {
  protected config: BaseErrorHandlerConfig;
  public logger: Logger;

  constructor(config: Partial<BaseErrorHandlerConfig>, logger?: Logger) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      statisticsInterval: 60000,
      enableLogging: true,
      logLevel: 'error',
      ...config
    };
    this.logger = logger || new ConsoleLogger('BaseErrorHandler');
  }

  // Add stub methods
  protected registerRecoveryStrategy(strategy: RecoveryStrategy): void {
    // Stub implementation
  }

  protected registerErrorHandler(code: number, handler: ErrorHandler): void {
    // Stub implementation
  }

  protected emit(event: string, ...args: any[]): void {
    // Stub implementation
  }

  protected async handleError(error: any, context: any): Promise<void> {
    // Stub implementation
  }
}

// Performance monitoring stubs
export interface PerformanceMetrics {
  timestamp: number;
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    healthScore: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    rps: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  connections: {
    active: number;
    total: number;
    failed: number;
    avgConnectionTime: number;
  };
  resources: {
    total: number;
    accessCount: number;
    cacheHitRate: number;
    avgReadTime: number;
  };
  tools: {
    total: number;
    executionCount: number;
    avgExecutionTime: number;
    successRate: number;
  };
}

export interface IMetricsCollector<T> {
  getCurrentMetrics(): T;
  recordRequest(duration: number, success: boolean): void;
  recordConnectionEvent(event: 'connected' | 'disconnected' | 'error'): void;
  recordResourceAccess(resourceId: string, duration: number, cached: boolean): void;
  recordToolExecution(name: string, duration: number, success: boolean): void;
  // Add methods used in MCPMetricsCollector
  calculatePercentile?(values: number[], percentile: number): number;
  recordGauge?(name: string, value: number, labels?: Record<string, string>): void;
  incrementCounter?(name: string, labels?: Record<string, string>): void;
  recordHistogram?(name: string, value: number, labels?: Record<string, string>): void;
  emit?(event: string, data: any): void;
  getCounterValue?(name: string): number;
}

export interface BaseMetricsCollectorConfig {
  interval?: number;
  retentionPeriod?: number;
  storage?: {
    type: 'memory' | 'file' | 'database';
    [key: string]: any;
  };
}

export class BaseMetricsCollector implements IMetricsCollector<PerformanceMetrics> {
  protected requestCount = 0;
  protected activeConnections = 0;

  getCurrentMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      system: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        uptime: process.uptime(),
        healthScore: 1
      },
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rps: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      },
      connections: {
        active: 0,
        total: 0,
        failed: 0,
        avgConnectionTime: 0
      },
      resources: {
        total: 0,
        accessCount: 0,
        cacheHitRate: 0,
        avgReadTime: 0
      },
      tools: {
        total: 0,
        executionCount: 0,
        avgExecutionTime: 0,
        successRate: 0
      }
    };
  }

  recordRequest(duration: number, success: boolean): void {
    this.requestCount++;
  }

  recordConnectionEvent(event: 'connected' | 'disconnected' | 'error'): void {
    if (event === 'connected') {
      this.activeConnections++;
    } else if (event === 'disconnected') {
      this.activeConnections--;
    }
  }

  recordResourceAccess(resourceId: string, duration: number, cached: boolean): void {
    // Stub implementation
  }

  recordToolExecution(name: string, duration: number, success: boolean): void {
    // Stub implementation
  }

  calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    // Stub implementation
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    // Stub implementation
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    // Stub implementation
  }

  emit(event: string, data: any): void {
    // Stub implementation
  }

  getCounterValue(name: string): number {
    return 0;
  }
}

export interface MonitoringSystemConfig {
  metricsInterval?: number;
  retentionPeriod?: number;
  storage?: {
    type: 'memory' | 'file' | 'database';
    [key: string]: any;
  };
}

export class BaseMonitoringSystem {
  protected logger: Logger;
  protected config?: MonitoringSystemConfig;
  private metricsCollector?: IMetricsCollector<PerformanceMetrics>;

  constructor(config: MonitoringSystemConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new ConsoleLogger('BaseMonitoringSystem');
  }

  protected createMetricsCollector(): IMetricsCollector<PerformanceMetrics> {
    return new BaseMetricsCollector();
  }

  
};
    }
}
exports.Logger = Logger;
//# sourceMappingURL=stubs.js.map