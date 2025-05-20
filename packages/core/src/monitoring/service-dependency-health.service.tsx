import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { ServiceCommunicationMonitor } from './service-communication-monitor.js';
import axios, { AxiosRequestConfig } from 'axios';

export interface ServiceDependencyConfig {
  name: string;
  url: string;
  healthEndpoint?: string;
  timeout?: number;
  method?: string;
  headers?: Record<string, string>;
  expectedStatus?: number;
  expectedResponse?: any;
  isRequired: boolean;
}

export interface ServiceHealthStatus {
  name: string;
  url: string;
  healthy: boolean;
  responseTimeMs?: number;
  lastChecked: Date;
  error?: string;
  isRequired: boolean;
}

export interface ServiceDependencyHealthConfig {
  enabled: boolean;
  checkIntervalMs: number;
  defaultTimeout: number;
  retries: number;
  retryDelay: number;
  dependencies: ServiceDependencyConfig[];
}

@Injectable()
export class ServiceDependencyHealthService implements OnModuleInit {
  private readonly logger: any;
  private config: ServiceDependencyHealthConfig;
  private healthCheckInterval: NodeJS.Timeout;
  private serviceStatuses: Map<string, ServiceHealthStatus> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly serviceCommunicationMonitor: ServiceCommunicationMonitor,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = this.loggingService.createLogger('ServiceDependencyHealth');
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('monitoring.serviceDependencies.enabled', true),
      checkIntervalMs: this.configService.get<number>('monitoring.serviceDependencies.checkIntervalMs', 60000), // 1 minute
      defaultTimeout: this.configService.get<number>('monitoring.serviceDependencies.defaultTimeout', 5000),
      retries: this.configService.get<number>('monitoring.serviceDependencies.retries', 3),
      retryDelay: this.configService.get<number>('monitoring.serviceDependencies.retryDelay', 1000),
      dependencies: this.configService.get<ServiceDependencyConfig[]>('monitoring.serviceDependencies.dependencies', [])
    };

    if (!this.config.enabled) {
      this.logger.info('Service dependency health monitoring is disabled');
      return;
    }

    // Initialize service statuses
    for (const dependency of this.config.dependencies) {
      this.serviceStatuses.set(dependency.name, {
        name: dependency.name,
        url: dependency.url,
        healthy: true, // Assume healthy initially
        lastChecked: new Date(),
        isRequired: dependency.isRequired
      });
    }

    // Start health check interval
    this.healthCheckInterval = setInterval(() => this.checkAllDependencies(), this.config.checkIntervalMs);
    
    // Run initial health check
    await this.checkAllDependencies();
    
    this.logger.info('Service dependency health service initialized', {
      metadata: {
        dependencies: this.config.dependencies.map(d => d.name),
        checkIntervalMs: this.config.checkIntervalMs
      }
    });
  }

  /**
   * Get health status for all service dependencies
   */
  getAllServiceStatuses(): ServiceHealthStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get health status for a specific service
   */
  getServiceStatus(serviceName: string): ServiceHealthStatus | null {
    return this.serviceStatuses.get(serviceName) || null;
  }

  /**
   * Check if all required services are healthy
   */
  areRequiredServicesHealthy(): boolean {
    for (const status of this.serviceStatuses.values()) {
      if (status.isRequired && !status.healthy) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check health of all service dependencies
   */
  async checkAllDependencies(): Promise<ServiceHealthStatus[]> {
    const results: ServiceHealthStatus[] = [];
    
    for (const dependency of this.config.dependencies) {
      const status = await this.checkDependencyHealth(dependency);
      results.push(status);
    }
    
    return results;
  }

  /**
   * Check health of a specific service dependency
   */
  async checkDependencyHealth(dependency: ServiceDependencyConfig): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    let healthy = false;
    let error: string | undefined;
    let responseTimeMs: number | undefined;
    
    try {
      // Determine health check endpoint
      const url = dependency.healthEndpoint 
        ? `${dependency.url}${dependency.healthEndpoint}`
        : dependency.url;
      
      // Configure request
      const config: AxiosRequestConfig = {
        method: dependency.method || 'GET',
        url,
        timeout: dependency.timeout || this.config.defaultTimeout,
        headers: dependency.headers || {},
        validateStatus: (status) => {
          return dependency.expectedStatus 
            ? status === dependency.expectedStatus
            : status >= 200 && status < 300;
        }
      };
      
      // Make request with retries
      const response = await this.makeRequestWithRetries(config);
      
      // Calculate response time
      responseTimeMs = Date.now() - startTime;
      
      // Check expected response if specified
      if (dependency.expectedResponse) {
        healthy = this.checkExpectedResponse(response.data, dependency.expectedResponse);
        if (!healthy) {
          error = 'Response did not match expected format';
        }
      } else {
        healthy = true;
      }
      
      // Record communication metrics
      await this.serviceCommunicationMonitor.recordCommunication({
        sourceService: this.configService.get<string>('service.name', 'app'),
        targetService: dependency.name,
        operation: 'health_check',
        latencyMs: responseTimeMs,
        success: healthy
      });
    } catch (err) {
      // Calculate response time even for failures
      responseTimeMs = Date.now() - startTime;
      
      error = err.message;
      
      // Record failed communication
      await this.serviceCommunicationMonitor.recordCommunication({
        sourceService: this.configService.get<string>('service.name', 'app'),
        targetService: dependency.name,
        operation: 'health_check',
        latencyMs: responseTimeMs,
        success: false
      });
    }
    
    // Update service status
    const status: ServiceHealthStatus = {
      name: dependency.name,
      url: dependency.url,
      healthy,
      responseTimeMs,
      lastChecked: new Date(),
      error,
      isRequired: dependency.isRequired
    };
    
    this.serviceStatuses.set(dependency.name, status);
    
    // Log result
    const logLevel = healthy ? 'info' : (dependency.isRequired ? 'error' : 'warn');
    this.logger[logLevel](`Health check for ${dependency.name}: ${healthy ? 'Healthy' : 'Unhealthy'}`, {
      metadata: {
        service: dependency.name,
        responseTimeMs,
        error
      }
    });
    
    // Emit event
    this.eventEmitter.emit('monitoring.serviceHealth', {
      ...status,
      timestamp: new Date()
    });
    
    return status;
  }

  /**
   * Register a new service dependency
   */
  registerDependency(dependency: ServiceDependencyConfig): void {
    // Check if already exists
    const existing = this.config.dependencies.find(d => d.name === dependency.name);
    
    if (existing) {
      // Update existing dependency
      Object.assign(existing, dependency);
    } else {
      // Add new dependency
      this.config.dependencies.push(dependency);
      
      // Initialize status
      this.serviceStatuses.set(dependency.name, {
        name: dependency.name,
        url: dependency.url,
        healthy: true, // Assume healthy initially
        lastChecked: new Date(),
        isRequired: dependency.isRequired
      });
    }
    
    this.logger.info(`Registered service dependency: ${dependency.name}`, {
      metadata: {
        url: dependency.url,
        isRequired: dependency.isRequired
      }
    });
  }

  /**
   * Private methods
   */

  private async makeRequestWithRetries(config: AxiosRequestConfig): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        return await axios(config);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.retries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    throw lastError!;
  }

  private checkExpectedResponse(actual: any, expected: any): boolean {
    // If expected is a function, use it as a validator
    if (typeof expected === 'function') {
      return expected(actual);
    }
    
    // If expected is a regular expression, test against stringified actual
    if (expected instanceof RegExp) {
      return expected.test(JSON.stringify(actual));
    }
    
    // If expected is an object, check if all expected properties exist with expected values
    if (typeof expected === 'object' && expected !== null) {
      for (const key in expected) {
        if (!actual || !this.deepEquals(actual[key], expected[key])) {
          return false;
        }
      }
      return true;
    }
    
    // Direct comparison
    return this.deepEquals(actual, expected);
  }

  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object' && a !== null && b !== null) {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEquals(a[i], b[i])) return false;
        }
        return true;
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEquals(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
}
