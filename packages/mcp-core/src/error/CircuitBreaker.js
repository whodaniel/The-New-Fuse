"use strict";
/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerManager = exports.CircuitBreaker = exports.CircuitState = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half_open";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
/**
 * Circuit Breaker implementation
 */
class CircuitBreaker extends events_1.EventEmitter {
    config;
    logger;
    name;
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    lastFailureTime;
    nextAttemptTime;
    // Rolling window for failure tracking
    requestHistory = [];
    // Statistics
    totalRequests = 0;
    successfulRequests = 0;
    failedRequests = 0;
    rejectedRequests = 0;
    lastStateChange = new Date();
    constructor(name, config = {}, logger) {
        super();
        this.name = name;
        this.config = {
            failureThreshold: 5,
            successThreshold: 3,
            timeout: 60000, // 1 minute
            rollingWindowSize: 10,
            rollingWindowTime: 60000, // 1 minute
            enableMonitoring: true,
            ...config
        };
        this.logger = logger || new Logger_1.Logger(`CircuitBreaker:${name});
    
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<R = T>(fn: () => Promise<R>): Promise<RequestResult<R>> {
    const startTime = Date.now();
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (!this.canAttemptReset()) {
        this.rejectedRequests++;
        this.emit('requestRejected', this.name, this.state);
        
        return {
          success: false,
          rejected: true,
          executionTime: Date.now() - startTime,`, error, new Error(`Circuit breaker is OPEN for ${this.name}`));
    }
    ;
}
exports.CircuitBreaker = CircuitBreaker;
{
    // Transition to half-open
    this.transitionTo(CircuitState.HALF_OPEN);
}
try {
    const result = await fn();
    const executionTime = Date.now() - startTime;
    this.onSuccess();
    return {
        success: true,
        data: result,
        rejected: false,
        executionTime
    };
}
catch (error) {
    const executionTime = Date.now() - startTime;
    this.onFailure(error instanceof Error ? error : new Error(String(error)));
    return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        rejected: false,
        executionTime
    };
}
/**
 * Get current circuit breaker statistics
 */
getStats();
CircuitBreakerStats;
{
    const now = Date.now();
    const timeUntilRetry = this.nextAttemptTime ?
        Math.max(0, this.nextAttemptTime.getTime() - now) : undefined;
    return {
        state: this.state,
        totalRequests: this.totalRequests,
        successfulRequests: this.successfulRequests,
        failedRequests: this.failedRequests,
        rejectedRequests: this.rejectedRequests,
        successRate: this.totalRequests > 0 ?
            (this.successfulRequests / this.totalRequests) * 100 : 0,
        failureRate: this.totalRequests > 0 ?
            (this.failedRequests / this.totalRequests) * 100 : 0,
        lastStateChange: this.lastStateChange,
        timeUntilRetry
    };
}
/**
 * Reset circuit breaker to closed state
 */
reset();
void {
    this: .transitionTo(CircuitState.CLOSED),
    this: .failureCount = 0,
    this: .successCount = 0,
    this: .lastFailureTime = undefined,
    this: .nextAttemptTime = undefined,
    this: .requestHistory.length = 0,
    this: .logger.info(Circuit, breaker, $, { this: .name }, manually, reset),
    this: .emit('manualReset', this.name)
};
/**
 * Get circuit breaker name
 */
getName();
string;
{
    return this.name;
}
/**
 * Get current state
 */
getState();
CircuitState;
{
    return this.state;
}
/**
 * Check if circuit breaker is healthy
 */
isHealthy();
boolean;
{
    return this.state === CircuitState.CLOSED;
}
onSuccess();
void {
    this: .successfulRequests++,
    this: .addToHistory(true),
    : .state === CircuitState.HALF_OPEN
};
{
    this.successCount++;
    if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.failureCount = 0;
        this.successCount = 0;
    }
}
if (this.state === CircuitState.CLOSED) {
    // Reset failure count on success in closed state
    this.failureCount = 0;
}
this.emit('requestSuccess', this.name, this.state);
onFailure(error, Error);
void {
    this: .failedRequests++,
    this: .failureCount++,
    this: .lastFailureTime = new Date(),
    this: .addToHistory(false),
    this: .emit('requestFailure', this.name, this.state, error),
    : .state === CircuitState.HALF_OPEN
};
{
    // Any failure in half-open state opens the circuit
    this.transitionTo(CircuitState.OPEN);
    this.successCount = 0;
}
if (this.state === CircuitState.CLOSED) {
    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
        this.transitionTo(CircuitState.OPEN);
    }
}
shouldOpenCircuit();
boolean;
{
    // Simple threshold check
    if (this.failureCount >= this.config.failureThreshold) {
        return true;
    }
    // Rolling window check
    const recentFailures = this.getRecentFailures();
    const recentRequests = this.getRecentRequests();
    if (recentRequests >= this.config.rollingWindowSize) {
        const failureRate = recentFailures / recentRequests;
        return failureRate >= (this.config.failureThreshold / this.config.rollingWindowSize);
    }
    return false;
}
canAttemptReset();
boolean;
{
    if (!this.nextAttemptTime) {
        this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
        return false;
    }
    return Date.now() >= this.nextAttemptTime.getTime();
}
transitionTo(newState, CircuitState);
void {
    const: oldState = this.state,
    this: .state = newState,
    this: .lastStateChange = new Date(),
    if(newState) { }
} === CircuitState.OPEN;
{
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
}
if (newState === CircuitState.CLOSED) {
    this.nextAttemptTime = undefined;
}
`
    this.logger.info(Circuit breaker ${this.name}`;
transitioned;
from;
$;
{
    oldState;
}
to;
$;
{
    newState;
}
;
this.emit('stateChange', this.name, oldState, newState);
addToHistory(success, boolean);
void {
    const: now = new Date(),
    this: .requestHistory.push({ timestamp: now, success }),
    // Clean up old entries
    const: cutoff = new Date(now.getTime() - this.config.rollingWindowTime),
    const: firstValidIndex = this.requestHistory.findIndex(entry => entry.timestamp >= cutoff),
    if(firstValidIndex) { }
} > 0;
{
    this.requestHistory.splice(0, firstValidIndex);
}
// Limit size
if (this.requestHistory.length > this.config.rollingWindowSize * 2) {
    this.requestHistory.splice(0, this.requestHistory.length - this.config.rollingWindowSize);
}
getRecentFailures();
number;
{
    const cutoff = new Date(Date.now() - this.config.rollingWindowTime);
    return this.requestHistory
        .filter(entry => entry.timestamp >= cutoff && !entry.success)
        .length;
}
getRecentRequests();
number;
{
    const cutoff = new Date(Date.now() - this.config.rollingWindowTime);
    return this.requestHistory
        .filter(entry => entry.timestamp >= cutoff)
        .length;
}
startMonitoring();
void {
    const: monitoringInterval = setInterval(() => {
        this.emit('stats', this.name, this.getStats());
    }, 30000), // Every 30 seconds
    // Clean up on process exit
    process, : .once('exit', () => {
        clearInterval(monitoringInterval);
    })
};
/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
class CircuitBreakerManager extends events_1.EventEmitter {
    circuitBreakers = new Map();
    logger;
    constructor(logger) {
        super();
        this.logger = logger || new Logger_1.Logger('CircuitBreakerManager');
    }
    /**
     * Create or get a circuit breaker
     */
    getCircuitBreaker(name, config) {
        let circuitBreaker = this.circuitBreakers.get(name);
        if (!circuitBreaker) {
            circuitBreaker = new CircuitBreaker(name, config, this.logger);
            this.circuitBreakers.set(name, circuitBreaker);
            // Forward events
            circuitBreaker.on('stateChange', (...args) => this.emit('stateChange', ...args));
            circuitBreaker.on('requestFailure', (...args) => this.emit('requestFailure', ...args));
            circuitBreaker.on('requestSuccess', (...args) => this.emit('requestSuccess', ...args));
            `
      circuitBreaker.on('requestRejected', (...args) => this.emit('requestRejected', ...args));`;
            this.logger.debug(Created, circuit, breaker, $, { name } `);
    }
    
    return circuitBreaker as CircuitBreaker<T>;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      stats[name] = circuitBreaker.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
    }
    
    this.logger.info('All circuit breakers reset');
    this.emit('allReset');
  }

  /**
   * Get circuit breaker by name
   */
  getByName(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  /**
   * Remove circuit breaker
   */
  remove(name: string): boolean {
    const removed = this.circuitBreakers.delete(name);
    if (removed) {
      this.logger.debug(Removed circuit breaker: ${name}`);
        }
        return removed;
    }
    /**
     * Get all circuit breaker names
     */
    getNames() {
        return Array.from(this.circuitBreakers.keys());
    }
    /**
     * Check overall system health
     */
    getSystemHealth() {
        const stats = this.getAllStats();
        const totalCircuits = Object.keys(stats).length;
        let healthyCircuits = 0;
        let openCircuits = 0;
        let halfOpenCircuits = 0;
        for (const stat of Object.values(stats)) {
            switch (stat.state) {
                case CircuitState.CLOSED:
                    healthyCircuits++;
                    break;
                case CircuitState.OPEN:
                    openCircuits++;
                    break;
                case CircuitState.HALF_OPEN:
                    halfOpenCircuits++;
                    break;
            }
        }
        return {
            healthy: openCircuits === 0,
            totalCircuits,
            healthyCircuits,
            openCircuits,
            halfOpenCircuits
        };
    }
}
exports.CircuitBreakerManager = CircuitBreakerManager;
//# sourceMappingURL=CircuitBreaker.js.map