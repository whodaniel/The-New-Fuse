/**
 * Advanced Load Testing System
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

/**
 * Load test scenario configuration
 */
export interface LoadTestScenario {
  /** Scenario name */
  name: string;
  /** Scenario description */
  description?: string;
  /** Test phases */
  phases: LoadTestPhase[];
  /** Global configuration */
  global?: {
    /** Base URL */
    baseUrl?: string;
    /** Default headers */
    headers?: Record<string, string>;
    /** Default timeout */
    timeout?: number;
  };
}

/**
 * Load test phase configuration
 */
export interface LoadTestPhase {
  /** Phase name */
  name: string;
  /** Phase duration (ms) */
  duration: number;
  /** Virtual users configuration */
  users: {
    /** Number of users to start with */
    start: number;
    /** Number of users to end with */
    end: number;
    /** Ramp-up strategy */
    rampUp: 'linear' | 'exponential' | 'step';
  };
  /** Requests per second limit */
  rpsLimit?: number;
  /** Test operations */
  operations: LoadTestOperation[];
}

/**
 * Load test operation
 */
export interface LoadTestOperation {
  /** Operation name */
  name: string;
  /** Operation weight (probability) */
  weight: number;
  /** Request configuration */
  request: {
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    /** URL path */
    path: string;
    /** Request headers */
    headers?: Record<string, string>;
    /** Request body */
    body?: any;
    /** Query parameters */
    query?: Record<string, string>;
  };
  /** Validation rules */
  validation?: {
    /** Expected status codes */
    statusCodes?: number[];
    /** Response time threshold (ms) */
    maxResponseTime?: number;
    /** Response body validation */
    bodyValidation?: (body: any) => boolean;
  };
  /** Think time (ms) */
  thinkTime?: number;
}

/**
 * Load test result
 */
export interface LoadTestResult {
  /** Test scenario */
  scenario: LoadTestScenario;
  /** Test start time */
  startTime: Date;
  /** Test end time */
  endTime: Date;
  /** Total duration (ms) */
  duration: number;
  /** Phase results */
  phases: PhaseResult[];
  /** Overall statistics */
  overall: TestStatistics;
  /** Performance timeline */
  timeline: TimelinePoint[];
  /** Error summary */
  errors: ErrorSummary[];
}

/**
 * Phase result
 */
export interface PhaseResult {
  /** Phase name */
  name: string;
  /** Phase duration (ms) */
  duration: number;
  /** Phase statistics */
  statistics: TestStatistics;
  /** Operation results */
  operations: OperationResult[];
}

/**
 * Operation result
 */
export interface OperationResult {
  /** Operation name */
  name: string;
  /** Total executions */
  executions: number;
  /** Success count */
  successes: number;
  /** Failure count */
  failures: number;
  /** Success rate */
  successRate: number;
  /** Response time statistics */
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

/**
 * Test statistics
 */
export interface TestStatistics {
  /** Total requests */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Success rate */
  successRate: number;
  /** Requests per second */
  rps: number;
  /** Response time statistics */
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  /** Throughput (bytes/sec) */
  throughput: number;
}

/**
 * Timeline point
 */
export interface TimelinePoint {
  /** Timestamp */
  timestamp: Date;
  /** Active users */
  activeUsers: number;
  /** Requests per second */
  rps: number;
  /** Average response time */
  avgResponseTime: number;
  /** Error rate */
  errorRate: number;
}

/**
 * Error summary
 */
export interface ErrorSummary {
  /** Error type */
  type: string;
  /** Error message */
  message: string;
  /** Occurrence count */
  count: number;
  /** First occurrence */
  firstOccurrence: Date;
  /** Last occurrence */
  lastOccurrence: Date;
}

/**
 * Virtual user
 */
class VirtualUser extends EventEmitter {
  private readonly id: string;
  private readonly scenario: LoadTestScenario;
  private readonly logger: Logger;
  private running = false;
  private currentPhase?: LoadTestPhase;

  constructor(id: string, scenario: LoadTestScenario, logger: Logger) {
    super();
    this.id = id;
    this.scenario = scenario;
    this.logger = logger;
  }

  /**
   * Start virtual user
   */
  async start(phase: LoadTestPhase): Promise<void> {
    this.running = true;
    this.currentPhase = phase;

    while (this.running && this.currentPhase === phase) {
      try {
        await this.executeOperation();
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Stop virtual user
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Execute a random operation
   */
  private async executeOperation(): Promise<void> {
    if (!this.currentPhase) return;

    const operation = this.selectOperation(this.currentPhase.operations);
    const startTime = Date.now();

    try {
      const result = await this.performRequest(operation);
      const responseTime = Date.now() - startTime;

      // Validate response
      const isValid = this.validateResponse(operation, result, responseTime);

      this.emit('operationComplete', {
        userId: this.id,
        operation: operation.name,
        responseTime,
        success: isValid,
        result
      });

      // Think time
      if (operation.thinkTime) {
        await new Promise(resolve => setTimeout(resolve, operation.thinkTime));
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.emit('operationComplete', {
        userId: this.id,
        operation: operation.name,
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Select operation based on weights
   */
  private selectOperation(operations: LoadTestOperation[]): LoadTestOperation {
    const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const operation of operations) {
      currentWeight += operation.weight;
      if (random <= currentWeight) {
        return operation;
      }
    }
    
    return operations[0]; // Fallback
  }

  /**
   * Perform HTTP request (mock implementation)
   */
  private async performRequest(operation: LoadTestOperation): Promise<any> {
    // Mock HTTP request - in real implementation, use actual HTTP client
    const delay = 50 + Math.random() * 200; // 50-250ms response time
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated request failure');
    }

    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { success: true, data: 'mock response' },
      size: 1024
    };
  }

  /**
   * Validate response
   */
  private validateResponse(
    operation: LoadTestOperation,
    result: any,
    responseTime: number
  ): boolean {
    const validation = operation.validation;
    if (!validation) return true;

    // Check status code
    if (validation.statusCodes && !validation.statusCodes.includes(result.status)) {
      return false;
    }

    // Check response time
    if (validation.maxResponseTime && responseTime > validation.maxResponseTime) {
      return false;
    }

    // Check body validation
    if (validation.bodyValidation && !validation.bodyValidation(result.body)) {
      return false;
    }

    return true;
  }
}

/**
 * Advanced load test runner
 */
export class LoadTestRunner extends EventEmitter {
  private readonly logger: Logger;
  private running = false;
  private virtualUsers: VirtualUser[] = [];
  private results: any[] = [];
  private timeline: TimelinePoint[] = [];
  private errors: Map<string, ErrorSummary> = new Map();

  constructor(logger?: Logger) {
    super();
    this.logger = logger || new Logger('LoadTestRunner');
  }

  /**
   * Run load test scenario
   */
  async runScenario(scenario: LoadTestScenario): Promise<LoadTestResult> {
    this.logger.info(`Starting load test scenario: ${scenario.name}`);
    
    const startTime = new Date();
    this.running = true;
    this.results = [];
    this.timeline = [];
    this.errors.clear();

    // Start timeline monitoring
    const timelineInterval = setInterval(() => {
      this.captureTimelinePoint();
    }, 1000); // Every second

    const phaseResults: PhaseResult[] = [];

    try {
      // Execute each phase
      for (const phase of scenario.phases) {
        if (!this.running) break;
        
        this.logger.info(`Starting phase: ${phase.name}`);
        const phaseResult = await this.runPhase(scenario, phase);
        phaseResults.push(phaseResult);
      }
    } finally {
      clearInterval(timelineInterval);
      this.cleanup();
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Calculate overall statistics
    const overall = this.calculateOverallStatistics();

    const result: LoadTestResult = {
      scenario,
      startTime,
      endTime,
      duration,
      phases: phaseResults,
      overall,
      timeline: this.timeline,
      errors: Array.from(this.errors.values())
    };

    this.logger.info(`Load test completed: ${scenario.name}`, {
      duration,
      totalRequests: overall.totalRequests,
      successRate: overall.successRate
    });

    this.emit('testComplete', result);
    return result;
  }

  /**
   * Stop running test
   */
  stop(): void {
    this.logger.info('Stopping load test');
    this.running = false;
    this.cleanup();
  }

  /**
   * Run a single phase
   */
  private async runPhase(
    scenario: LoadTestScenario,
    phase: LoadTestPhase
  ): Promise<PhaseResult> {
    const phaseStartTime = Date.now();
    const phaseResults: any[] = [];

    // Create virtual users
    const maxUsers = Math.max(phase.users.start, phase.users.end);
    this.virtualUsers = [];
    
    for (let i = 0; i < maxUsers; i++) {
      const user = new VirtualUser(`user-${i}`, scenario, this.logger);
      user.on('operationComplete', (result) => {
        phaseResults.push(result);
        this.results.push(result);
      });
      user.on('error', (error) => {
        this.recordError(error);
      });
      this.virtualUsers.push(user);
    }

    // Ramp up users
    await this.rampUpUsers(phase);

    // Wait for phase duration
    await new Promise(resolve => setTimeout(resolve, phase.duration));

    // Stop all users
    this.virtualUsers.forEach(user => user.stop());

    const phaseDuration = Date.now() - phaseStartTime;

    // Calculate phase statistics
    const statistics = this.calculatePhaseStatistics(phaseResults);
    const operations = this.calculateOperationResults(phaseResults);

    return {
      name: phase.name,
      duration: phaseDuration,
      statistics,
      operations
    };
  }

  /**
   * Ramp up virtual users
   */
  private async rampUpUsers(phase: LoadTestPhase): Promise<void> {
    const { start, end, rampUp } = phase.users;
    const rampDuration = Math.min(phase.duration * 0.1, 30000); // 10% of phase or 30s max
    
    if (start === end) {
      // Start all users immediately
      for (let i = 0; i < start; i++) {
        this.virtualUsers[i].start(phase);
      }
      return;
    }

    const userDiff = end - start;
    const steps = Math.abs(userDiff);
    const stepDuration = rampDuration / steps;

    if (rampUp === 'linear') {
      for (let i = 0; i < steps; i++) {
        if (!this.running) break;
        
        const userIndex = start + (userDiff > 0 ? i : -i);
        if (userIndex >= 0 && userIndex < this.virtualUsers.length) {
          if (userDiff > 0) {
            this.virtualUsers[userIndex].start(phase);
          } else {
            this.virtualUsers[userIndex].stop();
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    } else if (rampUp === 'exponential') {
      // Exponential ramp-up implementation
      for (let i = 0; i < steps; i++) {
        if (!this.running) break;
        
        const progress = i / steps;
        const exponentialProgress = Math.pow(progress, 2);
        const userIndex = start + Math.floor(exponentialProgress * userDiff);
        
        if (userIndex >= 0 && userIndex < this.virtualUsers.length) {
          this.virtualUsers[userIndex].start(phase);
        }
        
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    } else if (rampUp === 'step') {
      // Step ramp-up implementation
      const stepSize = Math.ceil(steps / 5); // 5 steps
      for (let step = 0; step < 5; step++) {
        if (!this.running) break;
        
        const stepStart = start + step * stepSize;
        const stepEnd = Math.min(start + (step + 1) * stepSize, end);
        
        for (let i = stepStart; i < stepEnd; i++) {
          if (i >= 0 && i < this.virtualUsers.length) {
            this.virtualUsers[i].start(phase);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, rampDuration / 5));
      }
    }
  }

  /**
   * Capture timeline point
   */
  private captureTimelinePoint(): void {
    const activeUsers = this.virtualUsers.filter(user => user.listenerCount('operationComplete') > 0).length;
    const recentResults = this.results.filter(r => 
      Date.now() - new Date(r.timestamp || Date.now()).getTime() < 1000
    );
    
    const rps = recentResults.length;
    const avgResponseTime = recentResults.length > 0 ?
      recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length : 0;
    const errorRate = recentResults.length > 0 ?
      recentResults.filter(r => !r.success).length / recentResults.length : 0;

    this.timeline.push({
      timestamp: new Date(),
      activeUsers,
      rps,
      avgResponseTime,
      errorRate
    });
  }

  /**
   * Record error
   */
  private recordError(error: Error): void {
    const key = `${error.constructor.name}: ${error.message}`;
    const existing = this.errors.get(key);
    
    if (existing) {
      existing.count++;
      existing.lastOccurrence = new Date();
    } else {
      this.errors.set(key, {
        type: error.constructor.name,
        message: error.message,
        count: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date()
      });
    }
  }

  /**
   * Calculate overall statistics
   */
  private calculateOverallStatistics(): TestStatistics {
    return this.calculatePhaseStatistics(this.results);
  }

  /**
   * Calculate phase statistics
   */
  private calculatePhaseStatistics(results: any[]): TestStatistics {
    if (results.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        successRate: 0,
        rps: 0,
        responseTime: { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 },
        throughput: 0
      };
    }

    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const responseTime = {
      min: responseTimes[0] || 0,
      max: responseTimes[responseTimes.length - 1] || 0,
      avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p50: this.percentile(responseTimes, 0.5),
      p95: this.percentile(responseTimes, 0.95),
      p99: this.percentile(responseTimes, 0.99)
    };

    // Calculate RPS based on timeline
    const rps = this.timeline.length > 0 ?
      this.timeline.reduce((sum, point) => sum + point.rps, 0) / this.timeline.length : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      rps,
      responseTime,
      throughput: 0 // Would calculate based on response sizes
    };
  }

  /**
   * Calculate operation results
   */
  private calculateOperationResults(results: any[]): OperationResult[] {
    const operationMap = new Map<string, any[]>();
    
    results.forEach(result => {
      const operation = result.operation;
      if (!operationMap.has(operation)) {
        operationMap.set(operation, []);
      }
      operationMap.get(operation)!.push(result);
    });

    return Array.from(operationMap.entries()).map(([name, opResults]) => {
      const executions = opResults.length;
      const successes = opResults.filter(r => r.success).length;
      const failures = executions - successes;
      const successRate = executions > 0 ? successes / executions : 0;

      const responseTimes = opResults.map(r => r.responseTime).sort((a, b) => a - b);
      const responseTime = {
        min: responseTimes[0] || 0,
        max: responseTimes[responseTimes.length - 1] || 0,
        avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p50: this.percentile(responseTimes, 0.5),
        p95: this.percentile(responseTimes, 0.95),
        p99: this.percentile(responseTimes, 0.99)
      };

      return {
        name,
        executions,
        successes,
        failures,
        successRate,
        responseTime
      };
    });
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * p) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.virtualUsers.forEach(user => user.stop());
    this.virtualUsers = [];
  }
}