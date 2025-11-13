"use strict";
/**
 * Automatic Failover and Recovery Manager
 * Manages service failover and automatic recovery mechanisms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailoverManager = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const CircuitBreaker_1 = require("./CircuitBreaker");
/**
 * Failover Manager for handling service endpoint failover
 */
class FailoverManager extends events_1.EventEmitter {
    config;
    logger;
    endpoints = new Map();
    circuitBreakers = new Map();
    degradationManager;
    currentEndpointIndex = 0;
    healthCheckTimer;
    stats;
    constructor(config, degradationManager, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger_1.Logger(`FailoverManager:${config.serviceName});
    this.degradationManager = degradationManager;
    
    this.stats = {
      serviceName: config.serviceName,
      totalEndpoints: 0,
      healthyEndpoints: 0,
      failedEndpoints: 0,
      totalFailovers: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };

    this.startHealthChecking();
  }

  /**
   * Add service endpoint
   */
  addEndpoint(endpoint: Omit<ServiceEndpoint, 'healthy' | 'lastHealthCheck' | 'responseTime' | 'errorCount'>): void {
    const fullEndpoint: ServiceEndpoint = {
      ...endpoint,
      healthy: true,
      lastHealthCheck: new Date(),
      responseTime: 0,
      errorCount: 0
    };

    this.endpoints.set(endpoint.id, fullEndpoint);
    
    // Create circuit breaker for endpoint
    const circuitBreaker = new CircuitBreaker(` `${this.config.serviceName}` - $, { endpoint, : .id }, {
            failureThreshold: 3,
            timeout: 30000,
            enableMonitoring: true
        }, this.logger);
        this.circuitBreakers.set(endpoint.id, circuitBreaker);
        this.updateStats();
        `
    this.logger.info(`;
        Added;
        endpoint;
        $;
        {
            endpoint.id;
        }
        ` for service ${this.config.serviceName});
    this.emit('endpointAdded', endpoint.id, fullEndpoint);
  }

  /**
   * Remove service endpoint
   */
  removeEndpoint(endpointId: string): boolean {
    const removed = this.endpoints.delete(endpointId);
    this.circuitBreakers.delete(endpointId);
    
    if (removed) {
      this.updateStats();`;
        this.logger.info(Removed, endpoint, $, { endpointId } ` from service ${this.config.serviceName});
      this.emit('endpointRemoved', endpointId);
    }
    
    return removed;
  }

  /**
   * Execute request with failover support
   */
  async executeWithFailover<T>(
    operation: (endpoint: ServiceEndpoint) => Promise<T>
  ): Promise<T> {
    this.stats.totalRequests++;
    const startTime = Date.now();
    
    let lastError: Error | undefined;
    let attempts = 0;
    
    // Get available endpoints in order
    const availableEndpoints = this.getAvailableEndpoints();
    
    if (availableEndpoints.length === 0) {
      // No healthy endpoints available
      if (this.degradationManager) {
        this.degradationManager.degradeToLevel(
          ServiceLevel.OFFLINE,
          'No healthy endpoints available'`);
        `
      }
      
      throw new Error(No healthy endpoints available for service ${this.config.serviceName}`;
        ;
    }
    for(, endpoint, of, availableEndpoints) {
        if (attempts >= this.config.maxRetryAttempts) {
            break;
        }
        attempts++;
        try {
            const circuitBreaker = this.circuitBreakers.get(endpoint.id);
            if (!circuitBreaker) {
                throw new Error(No, circuit, breaker, found);
                for (endpoint; $; { endpoint, : .id } `);
        }

        const result = await circuitBreaker.execute(async () => {
          const operationStartTime = Date.now();
          const operationResult = await operation(endpoint);
          
          // Update endpoint response time
          endpoint.responseTime = Date.now() - operationStartTime;
          endpoint.errorCount = 0; // Reset on success
          
          return operationResult;
        });

        if (result.success && result.data !== undefined) {
          this.stats.successfulRequests++;
          this.updateAverageResponseTime(Date.now() - startTime);
          
          // Mark endpoint as healthy
          this.markEndpointHealthy(endpoint.id);
          
          return result.data;
        } else if (result.rejected) {
          // Circuit breaker rejected the request
          this.logger.warn(Request rejected by circuit breaker for endpoint ${endpoint.id});
          continue; // Try next endpoint
        } else {
          // Operation failed
          lastError = result.error || new Error('Operation failed');
          this.handleEndpointError(endpoint.id, lastError);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.handleEndpointError(endpoint.id, lastError);
        `)
                    this.logger.warn(`Request failed for endpoint ${endpoint.id}:, lastError.message);
        
        // Wait before retry if not the last attempt
        if (attempts < this.config.maxRetryAttempts && this.config.retryDelay > 0) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    // All endpoints failed
    this.stats.failedRequests++;
    
    if (this.degradationManager) {
      this.degradationManager.degradeToLevel(
        ServiceLevel.MINIMAL,
        'All endpoints failed'
      );`);
            }
            `

    throw lastError || new Error(All endpoints failed for service ${this.config.serviceName});
  }

  /**
   * Get current service statistics
   */
  getStats(): FailoverStats {
    return { ...this.stats };
  }

  /**
   * Get all endpoints
   */
  getEndpoints(): ServiceEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Get healthy endpoints
   */
  getHealthyEndpoints(): ServiceEndpoint[] {
    return Array.from(this.endpoints.values()).filter(endpoint => endpoint.healthy);
  }

  /**
   * Get endpoint by ID
   */
  getEndpoint(endpointId: string): ServiceEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  /**
   * Manually mark endpoint as healthy
   */
  markEndpointHealthy(endpointId: string): void {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint && !endpoint.healthy) {
      endpoint.healthy = true;
      endpoint.errorCount = 0;
      endpoint.lastHealthCheck = new Date();
      `;
            this.updateStats();
            `
      this.logger.info(Endpoint ${endpointId}`;
            marked;
            ;
            this.emit('endpointRecovered', endpointId, endpoint);
        }
        finally {
        }
    }
    /**
     * Manually mark endpoint as unhealthy
     */
    markEndpointUnhealthy(endpointId, error) {
        const endpoint = this.endpoints.get(endpointId);
        if (endpoint && endpoint.healthy) {
            endpoint.healthy = false;
            endpoint.lastError = error;
            endpoint.lastHealthCheck = new Date();
            this.updateStats();
            this.logger.warn(Endpoint, $, { endpointId }, marked, error?.message);
            this.emit('endpointFailed', endpointId, endpoint, error);
            // Trigger failover if this was the active endpoint
            if (this.stats.activeEndpoint?.id === endpointId) {
                this.triggerFailover(endpointId, error);
            }
        }
    }
    /**
     * Force failover to specific endpoint
     */
    forceFailover(targetEndpointId) {
        const targetEndpoint = this.endpoints.get(targetEndpointId);
        if (!targetEndpoint || !targetEndpoint.healthy) {
            return false;
        }
        const oldEndpoint = this.stats.activeEndpoint;
        this.stats.activeEndpoint = targetEndpoint;
        this.stats.totalFailovers++;
        this.stats.lastFailover = new Date();
        this.logger.info(Forced, failover, from, $, { oldEndpoint, id } || 'none');
    }
    to;
    $;
}
exports.FailoverManager = FailoverManager;
{
    targetEndpointId;
}
;
this.emit('failover', oldEndpoint?.id, targetEndpointId, 'manual');
return true;
/**
 * Shutdown the failover manager
 */
shutdown();
void {
    : .healthCheckTimer
};
{
    clearInterval(this.healthCheckTimer);
    this.healthCheckTimer = undefined;
}
`
    `;
this.removeAllListeners();
`
    this.logger.debug(Failover manager for ${this.config.serviceName} shutdown);
  }

  /**
   * Get available endpoints in priority order
   */
  private getAvailableEndpoints(): ServiceEndpoint[] {
    const healthyEndpoints = this.getHealthyEndpoints();
    
    switch (this.config.loadBalancingStrategy) {
      case 'priority':
        return healthyEndpoints.sort((a, b) => a.priority - b.priority);
      
      case 'response_time':
        return healthyEndpoints.sort((a, b) => a.responseTime - b.responseTime);
      
      case 'round_robin':
        // Simple round-robin implementation
        if (healthyEndpoints.length === 0) return [];
        
        const sortedEndpoints = healthyEndpoints.sort((a, b) => a.priority - b.priority);
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % sortedEndpoints.length;
        
        return [
          ...sortedEndpoints.slice(this.currentEndpointIndex),
          ...sortedEndpoints.slice(0, this.currentEndpointIndex)
        ];
      
      case 'least_connections':
        // For now, use priority as a proxy for connections
        return healthyEndpoints.sort((a, b) => a.priority - b.priority);
      
      default:
        return healthyEndpoints.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * Handle endpoint error
   */
  private handleEndpointError(endpointId: string, error: Error): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return;

    endpoint.errorCount++;
    endpoint.lastError = error;

    // Mark as unhealthy if error count exceeds threshold
    if (endpoint.errorCount >= 3) {
      this.markEndpointUnhealthy(endpointId, error);
    }
  }

  /**
   * Trigger failover
   */
  private triggerFailover(failedEndpointId: string, error?: Error): void {
    const availableEndpoints = this.getAvailableEndpoints();
    
    if (availableEndpoints.length === 0) {
      this.logger.error(No healthy endpoints available for failover from ${failedEndpointId});
      this.stats.activeEndpoint = undefined;
      return;
    }

    const newActiveEndpoint = availableEndpoints[0];
    const oldEndpoint = this.stats.activeEndpoint;
    
    this.stats.activeEndpoint = newActiveEndpoint;
    this.stats.totalFailovers++;`;
this.stats.lastFailover = new Date();
`
`;
this.logger.info(Failover, triggered, from, $, { failedEndpointId }, to, $, { newActiveEndpoint, : .id });
this.emit('failover', failedEndpointId, newActiveEndpoint.id, error?.message || 'unknown');
async;
performHealthCheck(endpoint, ServiceEndpoint);
Promise < boolean > {
    try: {
        // This would be implemented based on specific service requirements
        // For now, check if circuit breaker is healthy
        const: circuitBreaker = this.circuitBreakers.get(endpoint.id),
        if(, circuitBreaker) {
            return false;
        },
        const: isHealthy = circuitBreaker.getState() !== CircuitBreaker_1.CircuitState.OPEN,
        endpoint, : .lastHealthCheck = new Date()
    } `
      return isHealthy;`
};
try { }
catch (error) {
    `
      this.logger.error(Health check failed for endpoint ${endpoint.id}:, error);
      return false;
    }
  }

  /**
   * Start health checking
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(async () => {
      const endpoints = Array.from(this.endpoints.values());
      
      for (const endpoint of endpoints) {
        const healthy = await this.performHealthCheck(endpoint);
        
        if (healthy && !endpoint.healthy) {
          // Endpoint recovered
          this.markEndpointHealthy(endpoint.id);
          
          // Consider failback if enabled
          if (this.config.enableAutoFailback) {
            await this.considerFailback(endpoint);
          }
        } else if (!healthy && endpoint.healthy) {
          // Endpoint failed
          this.markEndpointUnhealthy(endpoint.id);
        }
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Consider failback to recovered endpoint
   */
  private async considerFailback(recoveredEndpoint: ServiceEndpoint): Promise<void> {
    if (!this.stats.activeEndpoint) {
      // No active endpoint, use recovered one
      this.stats.activeEndpoint = recoveredEndpoint;
      this.emit('failback', undefined, recoveredEndpoint.id);
      return;
    }

    // Check if recovered endpoint has higher priority
    if (recoveredEndpoint.priority < this.stats.activeEndpoint.priority) {
      // Wait for failback delay
      await this.delay(this.config.failbackDelay);
      
      // Double-check endpoint is still healthy
      const stillHealthy = await this.performHealthCheck(recoveredEndpoint);
      if (stillHealthy) {
        const oldEndpoint = this.stats.activeEndpoint;
        this.stats.activeEndpoint = recoveredEndpoint;
        `;
    this.logger.info(Failback, from, $, { oldEndpoint, : .id }, to, $, { recoveredEndpoint, : .id } ``);
    this.emit('failback', oldEndpoint.id, recoveredEndpoint.id);
}
updateStats();
void {
    const: endpoints = Array.from(this.endpoints.values()),
    this: .stats.totalEndpoints = endpoints.length,
    this: .stats.healthyEndpoints = endpoints.filter(e => e.healthy).length,
    this: .stats.failedEndpoints = endpoints.filter(e => !e.healthy).length,
    : .stats.activeEndpoint && this.stats.healthyEndpoints > 0
};
{
    const healthyEndpoints = endpoints.filter(e => e.healthy);
    this.stats.activeEndpoint = healthyEndpoints.sort((a, b) => a.priority - b.priority)[0];
}
updateAverageResponseTime(responseTime, number);
void {
    : .stats.successfulRequests === 1
};
{
    this.stats.averageResponseTime = responseTime;
}
{
    this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime) /
            this.stats.successfulRequests;
}
delay(ms, number);
Promise < void  > {
    return: new Promise(resolve => setTimeout(resolve, ms))
};
//# sourceMappingURL=FailoverManager.js.map