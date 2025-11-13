"use strict";
/**
 * Tool Execution Engine with timeout and resource limits
 *
 * This module provides a comprehensive tool execution engine that enforces
 * resource limits, timeouts, and provides monitoring capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutionEngine = void 0;
const events_1 = require("events");
const error_1 = require("../types/error");
/**
 * Tool Execution Engine class
 *
 * Provides comprehensive tool execution with resource management,
 * timeout handling, security controls, and monitoring capabilities.
 */
class ToolExecutionEngine extends events_1.EventEmitter {
    activeExecutions = new Map();
    executionHistory = new Map();
    resourceMonitor;
    securityManager;
    performanceMonitor;
    rateLimiter;
    defaultTimeout;
    defaultResourceLimits;
    constructor(defaultTimeout = 30000, // 30 seconds
    defaultResourceLimits = {
        cpuTime: 30000,
        memory: 128 * 1024 * 1024, // 128MB
        fileOperations: 1000,
        networkOperations: 100
    }, rateLimiter) {
        super();
        this.defaultTimeout = defaultTimeout;
        this.defaultResourceLimits = defaultResourceLimits;
        this.resourceMonitor = new ResourceMonitor();
        this.securityManager = new ToolSecurityManager();
        this.performanceMonitor = new ToolPerformanceMonitor();
        this.rateLimiter = rateLimiter || new InMemoryRateLimiter();
    }
    /**
     * Execute a tool with comprehensive security, monitoring and resource management
     */
    async executeToolSecurely(handler, params, permissions, securityContext, options = {}) {
        const executionId = this.generateExecutionId();
        const timeout = options.timeout || this.defaultTimeout;
        const resourceLimits = { ...this.defaultResourceLimits, ...options.resourceLimits };
        const context = {
            executionId,
            toolName: handler.name || 'unknown',
            executor: securityContext.principal,
            parameters: params,
            startTime: new Date(),
            timeout,
            metadata: {
                ...options.context,
                securityContext,
                permissions
            }
        };
        this.activeExecutions.set(executionId, context);
        const logs = [];
        try {
            this.addLog(logs, executionId, 'info', 'Secure tool execution started', {
                toolName: context.toolName,
                principal: securityContext.principal,
                timeout,
                resourceLimits
            });
            // Security checks
            await this.performSecurityChecks(handler, params, permissions, securityContext, logs, executionId);
            // Rate limiting check
            if (permissions.rateLimit) {
                const rateLimitKey = `${securityContext.principal}:${context.toolName};
        const allowed = await this.rateLimiter.isAllowed(rateLimitKey, permissions.rateLimit);
        if (!allowed) {
          throw new MCPErrorClass(
            MCPErrorCode.RATE_LIMIT_EXCEEDED,
            'Rate limit exceeded for tool execution',
            {
              category: ErrorCategory.TOOL,
              severity: ErrorSeverity.MEDIUM,
              retryable: true,
              details: { 
                executionId, 
                principal: securityContext.principal,
                toolName: context.toolName,
                rateLimit: permissions.rateLimit
              }
            }
          );
        }
      }

      // Start resource monitoring
      const resourceUsage = this.resourceMonitor.startMonitoring(executionId, resourceLimits);
      
      // Start performance monitoring
      this.performanceMonitor.startExecution(context.toolName, executionId);
      
      // Execute with constraints and sandbox
      const result = await this.executeWithSecurityConstraints(
        handler,
        params,
        timeout,
        resourceLimits,
        options.sandbox,
        context,
        logs
      );

      // Stop monitoring
      const finalResourceUsage = this.resourceMonitor.stopMonitoring(executionId);
      this.performanceMonitor.recordExecution(context.toolName, executionId, true, finalResourceUsage);
      
      // Validate result
      const validatedResult = await this.validateToolResult(result, handler, logs, executionId);
      
      const enhancedResult: EnhancedToolResult = {
        ...validatedResult,
        executionContext: context,
        logs,
        resourceUsage: finalResourceUsage,
        metadata: {
          ...validatedResult.metadata,
          executionId,
          context: {
            ...validatedResult.metadata?.context,
            resourceLimitsEnforced: true,
            timeoutEnforced: true,
            securityEnforced: true,
            sandboxed: options.sandbox?.enabled || false
          }
        }
      };

      this.executionHistory.set(executionId, enhancedResult);
      this.addLog(logs, executionId, 'info', 'Secure tool execution completed successfully');
      
      this.emit('executionComplete', context, enhancedResult);
      return enhancedResult;

    } catch (error) {
      this.addLog(logs, executionId, 'error', 'Secure tool execution failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Record failed execution in performance monitor
      this.performanceMonitor.recordExecution(context.toolName, executionId, false);

      const sanitizedError = error instanceof Error ? 
        this.securityManager.sanitizeErrorMessage(error.message) : 'Tool execution failed';

      const failedResult: EnhancedToolResult = {
        success: false,
        error: sanitizedError,
        executionContext: context,
        logs,
        resourceUsage: this.resourceMonitor.stopMonitoring(executionId),
        metadata: {
          executionId,
          executionTime: Date.now() - context.startTime.getTime(),
          context: {
            resourceLimitsEnforced: true,
            timeoutEnforced: true,
            securityEnforced: true,
            sandboxed: options.sandbox?.enabled || false,
            error: error instanceof Error ? error.stack : 'Unknown error'
      };

      this.executionHistory.set(executionId, failedResult);
      this.emit('executionError', context, error);
      return failedResult;

    } finally {
      this.activeExecutions.delete(executionId);
      this.resourceMonitor.cleanup(executionId);
    }
  }

  /**
   * Execute a tool with comprehensive monitoring and resource management (legacy method)
   */
  async executeToolWithLimits(
    handler: ToolHandler,
    params: any,
    options: ToolExecutionOptions = {}
  ): Promise<EnhancedToolResult> {
    const executionId = this.generateExecutionId();
    const timeout = options.timeout || this.defaultTimeout;
    const resourceLimits = { ...this.defaultResourceLimits, ...options.resourceLimits };
    
    const context: ToolExecutionContext = {
      executionId,
      toolName: (handler as any).name || 'unknown',
      executor: 'ToolExecutionEngine',
      parameters: params,
      startTime: new Date(),
      timeout,
      metadata: options.context || {}
    };

    this.activeExecutions.set(executionId, context);
    const logs: ToolExecutionLog[] = [];
    
    try {
      this.addLog(logs, executionId, 'info', 'Tool execution started', { 
        toolName: context.toolName,
        timeout,
        resourceLimits 
      });

      // Start resource monitoring
      const resourceUsage = this.resourceMonitor.startMonitoring(executionId, resourceLimits);
      
      // Start performance monitoring
      this.performanceMonitor.startExecution(context.toolName, executionId);
      
      // Execute with timeout and resource limits
      const result = await this.executeWithConstraints(
        handler,
        params,
        timeout,
        resourceLimits,
        context,
        logs
      );

      // Stop resource monitoring
      const finalResourceUsage = this.resourceMonitor.stopMonitoring(executionId);
      this.performanceMonitor.recordExecution(context.toolName, executionId, true, finalResourceUsage);
      
      // Validate result
      const validatedResult = await this.validateToolResult(result, handler, logs, executionId);
      
      const enhancedResult: EnhancedToolResult = {
        ...validatedResult,
        executionContext: context,
        logs,
        resourceUsage: finalResourceUsage,
        metadata: {
          ...validatedResult.metadata,
          executionId,
          context: {
            ...validatedResult.metadata?.context,
            resourceLimitsEnforced: true,
            timeoutEnforced: true
          }
        }
      };

      this.executionHistory.set(executionId, enhancedResult);
      this.addLog(logs, executionId, 'info', 'Tool execution completed successfully');
      
      this.emit('executionComplete', context, enhancedResult);
      return enhancedResult;

    } catch (error) {
      this.addLog(logs, executionId, 'error', 'Tool execution failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Record failed execution in performance monitor
      this.performanceMonitor.recordExecution(context.toolName, executionId, false);

      const sanitizedError = error instanceof Error ? 
        this.securityManager.sanitizeErrorMessage(error.message) : 'Tool execution failed';

      const failedResult: EnhancedToolResult = {
        success: false,
        error: sanitizedError,
        executionContext: context,
        logs,
        resourceUsage: this.resourceMonitor.stopMonitoring(executionId),
        metadata: {
          executionId,
          executionTime: Date.now() - context.startTime.getTime(),
          context: {
            resourceLimitsEnforced: true,
            timeoutEnforced: true,
            error: error instanceof Error ? error.stack : 'Unknown error'
      };

      this.executionHistory.set(executionId, failedResult);
      this.emit('executionError', context, error);
      return failedResult;

    } finally {
      this.activeExecutions.delete(executionId);
      this.resourceMonitor.cleanup(executionId);
    }
  }

  /**
   * Perform security checks before tool execution
   */
  private async performSecurityChecks(
    handler: ToolHandler,
    params: any,
    permissions: ToolPermissions,
    securityContext: ToolSecurityContext,
    logs: ToolExecutionLog[],
    executionId: string
  ): Promise<void> {
    // Check execute permission
    if (!permissions.execute) {
      this.addLog(logs, executionId, 'error', 'Tool execution not permitted');
      
      // Record security violation
      this.securityManager.recordViolation({
        type: 'permission_denied',
        description: 'Tool execution not permitted',
        severity: 'medium',
        timestamp: new Date(),
        data: { executionId, principal: securityContext.principal }
      });
      
      throw new MCPErrorClass(
        MCPErrorCode.TOOL_PERMISSION_DENIED,
        'Tool execution not permitted',
        {
          category: ErrorCategory.AUTH,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { executionId, principal: securityContext.principal }
        }
      );
    }

    // Check required roles
    if (permissions.requiredRoles && permissions.requiredRoles.length > 0) {
      const hasRequiredRole = permissions.requiredRoles.some(role => 
        securityContext.roles.includes(role)
      );
      if (!hasRequiredRole) {
        this.addLog(logs, executionId, 'error', 'Insufficient roles for tool execution', {
          requiredRoles: permissions.requiredRoles,
          userRoles: securityContext.roles
        });
        
        // Record security violation
        this.securityManager.recordViolation({
          type: 'permission_denied',`;
                description: Insufficient;
                roles.Required;
                $;
                {
                    permissions.requiredRoles.join(', ');
                }
                `,
          severity: 'medium',
          timestamp: new Date(),
          data: { 
            executionId, 
            principal: securityContext.principal,
            requiredRoles: permissions.requiredRoles,
            userRoles: securityContext.roles
          }
        });
        
        throw new MCPErrorClass(
          MCPErrorCode.INSUFFICIENT_PERMISSIONS,
          `;
                Insufficient;
                roles.Required;
                $;
                {
                    permissions.requiredRoles.join(', ');
                }
                {
                    category: error_1.ErrorCategory.AUTH,
                        severity;
                    error_1.ErrorSeverity.MEDIUM,
                        retryable;
                    false,
                        details;
                    {
                        executionId,
                            principal;
                        securityContext.principal,
                            requiredRoles;
                        permissions.requiredRoles,
                            userRoles;
                        securityContext.roles;
                    }
                }
                ;
            }
        }
        // Check ACL permissions
        finally {
        }
        // Check ACL permissions
        if (permissions.acl && permissions.acl.length > 0) {
            const allowed = await this.securityManager.checkACLPermissions(securityContext.principal, securityContext.roles, permissions.acl, 'execute');
            if (!allowed) {
                this.addLog(logs, executionId, 'error', 'ACL permission denied for tool execution');
                // Record security violation
                this.securityManager.recordViolation({
                    type: 'permission_denied',
                    description: 'ACL permission denied for tool execution',
                    severity: 'medium',
                    timestamp: new Date(),
                    data: { executionId, principal: securityContext.principal }
                });
                throw new error_1.MCPErrorClass(error_1.MCPErrorCode.AUTHORIZATION_FAILED, 'ACL permission denied for tool execution', {
                    category: error_1.ErrorCategory.AUTH,
                    severity: error_1.ErrorSeverity.MEDIUM,
                    retryable: false,
                    details: { executionId, principal: securityContext.principal }
                });
            }
        }
        this.addLog(logs, executionId, 'info', 'Security checks passed');
    }
    /**
     * Execute tool with security constraints, timeout and resource limits
     */
    async executeWithSecurityConstraints(handler, params, timeout, resourceLimits, sandboxConfig, context, logs) {
        if (sandboxConfig?.enabled) {
            return this.executeInSandbox(handler, params, timeout, resourceLimits, sandboxConfig, context, logs);
        }
        else {
            return this.executeWithConstraints(handler, params, timeout, resourceLimits, context, logs);
        }
    }
    /**
     * Execute tool in sandbox environment
     */
    async executeInSandbox(handler, params, timeout, resourceLimits, sandboxConfig, context, logs) {
        this.addLog(logs, context.executionId, 'info', 'Executing tool in sandbox', {
            sandboxType: sandboxConfig.type,
            resourceLimits: sandboxConfig.resourceLimits
        });
        // Create sandbox environment
        const sandbox = await this.securityManager.createSandbox(sandboxConfig, context.executionId);
        try {
            // Monitor sandbox violations
            const violationMonitor = this.securityManager.monitorSandboxViolations(context.executionId, (violation) => {
                this.addLog(logs, context.executionId, 'error', 'Sandbox violation detected', violation);
                this.emit('securityViolation', context, violation);
            });
            // Execute in sandbox with constraints
            const result = await sandbox.execute(async () => {
                return this.executeWithConstraints(handler, params, timeout, resourceLimits, context, logs);
            });
            violationMonitor.stop();
            this.addLog(logs, context.executionId, 'info', 'Sandbox execution completed successfully');
            return result;
        }
        catch (error) {
            this.addLog(logs, context.executionId, 'error', 'Sandbox execution failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
        finally {
            await sandbox.cleanup();
        }
    }
    /**
     * Execute tool with timeout and resource constraints
     */
    async executeWithConstraints(handler, params, timeout, resourceLimits, context, logs) {
        return new Promise(async (resolve, reject) => {
            let timeoutHandle = null;
            let resourceCheckInterval = null;
            let completed = false;
            const cleanup = () => {
                if (timeoutHandle)
                    clearTimeout(timeoutHandle);
                if (resourceCheckInterval)
                    clearInterval(resourceCheckInterval);
                completed = true;
            };
            // Set up timeout
            timeoutHandle = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    this.addLog(logs, context.executionId, 'error', 'Tool execution timed out', { timeout });
                    reject(new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_TIMEOUT, `
            Tool execution timed out after ${timeout}`, ms `,
            {
              category: ErrorCategory.TOOL,
              severity: ErrorSeverity.MEDIUM,
              retryable: true,
              details: { executionId: context.executionId, timeout }
            }
          ));
        }
      }, timeout);

      // Set up resource monitoring
      resourceCheckInterval = setInterval(() => {
        if (!completed) {
          const usage = this.resourceMonitor.getCurrentUsage(context.executionId);
          if (usage) {
            // Check resource limits
            if (resourceLimits.memory && usage.peakMemory > resourceLimits.memory) {
              cleanup();
              this.addLog(logs, context.executionId, 'error', 'Memory limit exceeded', { 
                limit: resourceLimits.memory, 
                usage: usage.peakMemory 
              });
              reject(new MCPErrorClass(
                MCPErrorCode.TOOL_RESOURCE_EXHAUSTED,
                Memory limit exceeded: ${usage.peakMemory} > ${resourceLimits.memory},
                {
                  category: ErrorCategory.TOOL,
                  severity: ErrorSeverity.HIGH,
                  retryable: false,
                  details: { executionId: context.executionId, resourceLimits, usage }
                }
              ));
              return;
            }

            if (resourceLimits.cpuTime && usage.cpuTime > resourceLimits.cpuTime) {
              cleanup();
              this.addLog(logs, context.executionId, 'error', 'CPU time limit exceeded', { 
                limit: resourceLimits.cpuTime, 
                usage: usage.cpuTime 
              });
              reject(new MCPErrorClass(
                MCPErrorCode.TOOL_RESOURCE_EXHAUSTED,`, CPU, time, limit, exceeded, $, { usage, : .cpuTime } ` > ${resourceLimits.cpuTime},
                {
                  category: ErrorCategory.TOOL,
                  severity: ErrorSeverity.HIGH,
                  retryable: false,
                  details: { executionId: context.executionId, resourceLimits, usage }
                }
              ));
              return;
            }

            this.emit('resourceUsage', context, usage);
          }
        }
      }, 1000); // Check every second

      try {
        // Execute the tool
        this.addLog(logs, context.executionId, 'info', 'Starting tool execution');
        const result = await handler.execute(params);
        
        if (!completed) {
          cleanup();
          this.addLog(logs, context.executionId, 'info', 'Tool execution completed', { 
            success: result.success 
          });
          resolve(result);
        }
      } catch (error) {
        if (!completed) {
          cleanup();
          this.addLog(logs, context.executionId, 'error', 'Tool execution threw error', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          reject(error);
        }
      }
    });
  }

  /**
   * Validate tool execution result
   */
  private async validateToolResult(
    result: ToolResult,
    handler: ToolHandler,
    logs: ToolExecutionLog[],
    executionId: string
  ): Promise<ToolResult> {
    this.addLog(logs, executionId, 'info', 'Validating tool execution result');

    // Basic result validation
    if (typeof result !== 'object' || result === null) {
      this.addLog(logs, executionId, 'error', 'Invalid result format: result must be an object');
      throw new MCPErrorClass(
        MCPErrorCode.TOOL_EXECUTION_FAILED,
        'Invalid result format: result must be an object',
        {
          category: ErrorCategory.TOOL,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { executionId, resultType: typeof result }
        }
      );
    }

    // Check required properties
    if (typeof result.success !== 'boolean') {
      this.addLog(logs, executionId, 'error', 'Invalid result format: success property must be boolean');
      throw new MCPErrorClass(
        MCPErrorCode.TOOL_EXECUTION_FAILED,
        'Invalid result format: success property must be boolean',
        {
          category: ErrorCategory.TOOL,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { executionId, successType: typeof result.success }
        }
      );
    }

    // Validate success result
    if (result.success) {
      if (result.error) {
        this.addLog(logs, executionId, 'warn', 'Successful result contains error field');
      }
    } else {
      if (!result.error) {
        this.addLog(logs, executionId, 'warn', 'Failed result missing error message');
        result.error = 'Tool execution failed without error message';
      }
    }

    // Sanitize result data to prevent information leakage
    const sanitizedResult = await this.securityManager.sanitizeResult(result, executionId);

    this.addLog(logs, executionId, 'info', 'Tool result validation completed');
    return sanitizedResult;
  }

  /**
   * Get tool performance metrics
   */
  getToolPerformanceMetrics(toolName: string): ToolPerformanceMetrics | null {
    return this.performanceMonitor.getMetrics(toolName);
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics(): Map<string, ToolPerformanceMetrics> {
    return this.performanceMonitor.getAllMetrics();
  }

  /**
   * Get security violations for a time period
   */
  getSecurityViolations(since?: Date): SecurityViolation[] {
    return this.securityManager.getViolations(since);
  }

  /**
   * Validate tool parameters with enhanced JSON Schema validation
   */
  async validateToolParameters(
    schema: JSONSchema,
    params: any,
    strict: boolean = true
  ): Promise<ValidationResult> {
    try {
      const validator = new EnhancedJSONSchemaValidator(strict);
      return await validator.validate(params, schema);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ToolExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 100): EnhancedToolResult[] {
    const results = Array.from(this.executionHistory.values());
    return results.slice(-limit);
  }

  /**
   * Cancel an active execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      return false;
    }

    this.emit('executionCancelled', context);
    this.activeExecutions.delete(executionId);
    this.resourceMonitor.cleanup(executionId);
    
    return true;
  }

  /**
   * Get execution statistics
   */
  getExecutionStatistics(): {
    totalExecutions: number;
    activeExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  } {
    const history = Array.from(this.executionHistory.values());
    const successful = history.filter(r => r.success).length;
    const failed = history.filter(r => !r.success).length;
    const totalTime = history.reduce((sum, r) => sum + (r.metadata?.executionTime || 0), 0);
    
    return {
      totalExecutions: history.length,
      activeExecutions: this.activeExecutions.size,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageExecutionTime: history.length > 0 ? totalTime / history.length : 0
    };
  }

  /**
   * Generate unique execution ID`
                        * /`, private, generateExecutionId(), string, {
                        return: exec_$
                    }, { Date, : .now() }, _$, { Math, : .random().toString(36).substr(2, 9) } `;
  }

  /**
   * Add log entry
   */
  private addLog(
    logs: ToolExecutionLog[],
    executionId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    logs.push({
      id: log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, executionId, level, message, timestamp, new Date(), data));
                }
            });
        });
    }
}
exports.ToolExecutionEngine = ToolExecutionEngine;
/**
 * Resource Monitor class for tracking resource usage
 */
class ResourceMonitor {
    monitoredExecutions = new Map();
    /**
     * Start monitoring resource usage for an execution
     */
    startMonitoring(executionId, resourceLimits) {
        const startTime = new Date();
        const usage = {
            cpuTime: 0,
            peakMemory: 0,
            fileOperations: 0,
            networkOperations: 0,
            startTime,
            endTime: startTime
        };
        this.monitoredExecutions.set(executionId, {
            startTime,
            resourceLimits,
            usage
        });
        return usage;
    }
    /**
     * Get current resource usage for an execution
     */
    getCurrentUsage(executionId) {
        const monitoring = this.monitoredExecutions.get(executionId);
        if (!monitoring)
            return null;
        // Update CPU time
        monitoring.usage.cpuTime = Date.now() - monitoring.startTime.getTime();
        // In a real implementation, you would gather actual resource usage
        // For now, we'll simulate some basic monitoring
        if (process.memoryUsage) {
            const memUsage = process.memoryUsage();
            monitoring.usage.peakMemory = Math.max(monitoring.usage.peakMemory, memUsage.heapUsed);
        }
        monitoring.usage.endTime = new Date();
        return { ...monitoring.usage };
    }
    /**
     * Stop monitoring and return final usage statistics
     */
    stopMonitoring(executionId) {
        const monitoring = this.monitoredExecutions.get(executionId);
        if (!monitoring)
            return undefined;
        const finalUsage = this.getCurrentUsage(executionId);
        this.monitoredExecutions.delete(executionId);
        return finalUsage || undefined;
    }
    /**
     * Cleanup monitoring resources
     */
    cleanup(executionId) {
        const monitoring = this.monitoredExecutions.get(executionId);
        if (monitoring?.interval) {
            clearInterval(monitoring.interval);
        }
        this.monitoredExecutions.delete(executionId);
    }
}
/**
 * Enhanced JSON Schema Validator
 */
class EnhancedJSONSchemaValidator {
    strict;
    constructor(strict = true) {
        this.strict = strict;
    }
    /**
     * Validate parameters against JSON Schema with enhanced validation
     */
    async validate(params, schema) {
        const errors = [];
        let normalizedParams = params;
        try {
            // Basic type validation
            if (!this.validateType(params, schema, errors)) {
                return { valid: false, errors };
            }
            // Validate object properties
            if (schema.type === 'object' && typeof params === 'object' && params !== null) {
                normalizedParams = await this.validateObjectProperties(params, schema, errors);
            }
            // Validate array items
            if (schema.type === 'array' && Array.isArray(params)) {
                normalizedParams = await this.validateArrayItems(params, schema, errors);
            }
            // Custom validation rules
            if (schema.format) {
                this.validateFormat(params, schema.format, errors);
            }
            if (schema.pattern && typeof params === 'string') {
                this.validatePattern(params, schema.pattern, errors);
            }
            if (schema.minimum !== undefined && typeof params === 'number') {
                this.validateMinimum(params, schema.minimum, errors);
            }
            if (schema.maximum !== undefined && typeof params === 'number') {
                this.validateMaximum(params, schema.maximum, errors);
            }
            if (schema.minLength !== undefined && typeof params === 'string') {
                this.validateMinLength(params, schema.minLength, errors);
            }
            if (schema.maxLength !== undefined && typeof params === 'string') {
                this.validateMaxLength(params, schema.maxLength, errors);
            }
            return {
                valid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined,
                normalizedParams
            };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : 'Validation error']
            };
        }
    }
    validateType(value, schema, errors) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (schema.type && actualType !== schema.type) {
            errors.push(Expected, type, $, { schema, : .type }, got, $, { actualType });
            return false;
        }
        return true;
    }
    async validateObjectProperties(obj, schema, errors) {
        const normalized = { ...obj };
        // Check required properties
        if (schema.required) {
            for (const requiredProp of schema.required) {
                `
        if (!(requiredProp in obj)) {`;
                errors.push(Missing, required, property, $, { requiredProp } `);
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in obj) {
          const propResult = await this.validate(obj[propName], propSchema as JSONSchema);
          if (!propResult.valid) {
            errors.push(...(propResult.errors || []).map(err => Property ${propName}: ${err}));
          } else if (propResult.normalizedParams !== undefined) {
            normalized[propName] = propResult.normalizedParams;
          }
        }
      }
    }

    // Check additional properties
    if (schema.additionalProperties === false && this.strict) {
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      for (const propName of Object.keys(obj)) {
        if (!allowedProps.has(propName)) {`, errors.push(Additional, property, not, allowed, $, { propName } `);
        }
      }
    }

    return normalized;
  }

  private async validateArrayItems(
    arr: any[], 
    schema: JSONSchema, 
    errors: string[]
  ): Promise<any[]> {
    const normalized = [...arr];

    if (schema.items) {
      for (let i = 0; i < arr.length; i++) {
        const itemResult = await this.validate(arr[i], schema.items as JSONSchema);
        if (!itemResult.valid) {
          errors.push(...(itemResult.errors || []).map(err => Item ${i}: ${err}));
        } else if (itemResult.normalizedParams !== undefined) {
          normalized[i] = itemResult.normalizedParams;
        }
      }
    }
`));
                if (schema.minItems !== undefined && arr.length < schema.minItems) {
                    `
      errors.push(Array must have at least ${schema.minItems} items, got ${arr.length});
    }` `
    if (schema.maxItems !== undefined && arr.length > schema.maxItems) {`;
                    errors.push(Array, must, have, at, most, $, { schema, : .maxItems }, items, got, $, { arr, : .length });
                }
                return normalized;
            }
        }
    }
    validateFormat(value, format, errors) {
        if (typeof value !== 'string')
            return;
        switch (format) {
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.push('Invalid email format');
                }
                break;
            case 'uri':
                try {
                    new URL(value);
                }
                catch {
                    errors.push('Invalid URI format');
                }
                break;
            case 'date':
                if (isNaN(Date.parse(value))) {
                    errors.push('Invalid date format');
                }
                break;
            case 'uuid':
                if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
                    errors.push('Invalid UUID format');
                }
                break;
        }
    }
    validatePattern(value, pattern, errors) {
        try {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                `
        errors.push(Value does not match pattern: ${pattern}`;
                ;
            }
        }
        catch {
            errors.push(Invalid, pattern, $, { pattern });
        }
    }
    validateMinimum(value, minimum, errors) {
        `
    if (value < minimum) {`;
        errors.push(Value, $, { value }, is, less, than, minimum, $, { minimum });
    }
}
`
`;
validateMaximum(value, number, maximum, number, errors, string[]);
void {} `
    if (value > maximum) {
      errors.push(Value ${value} is greater than maximum ${maximum});
    }
  }

  private validateMinLength(value: string, minLength: number, errors: string[]): void {
    if (value.length < minLength) {`;
errors.push(String, length, $, { value, : .length } ` is less than minimum ${minLength});
    }
  }
`, private, validateMaxLength(value, string, maxLength, number, errors, string[]), void {} `
    if (value.length > maxLength) {
      errors.push(`, String, length, $, { value, : .length }, is, greater, than, maximum, $, { maxLength });
/**
 * Tool Security Manager class
 */
class ToolSecurityManager {
    violations = [];
    sandboxes = new Map();
    /**
     * Check ACL permissions for a principal
     */
    async checkACLPermissions(principal, roles, acl, permission) {
        // Check explicit deny rules first
        for (const entry of acl) {
            if (entry.type === 'deny' && entry.permissions.includes(permission)) {
                if (entry.principal === principal || roles.includes(entry.principal)) {
                    return false;
                }
            }
        }
        // Check allow rules
        for (const entry of acl) {
            if (entry.type === 'allow' && entry.permissions.includes(permission)) {
                if (entry.principal === principal || roles.includes(entry.principal)) {
                    return true;
                }
            }
        }
        // Default deny
        return false;
    }
    /**
     * Create a sandbox for tool execution
     */
    async createSandbox(config, executionId) {
        const sandbox = new ToolSandbox(config, executionId, this);
        this.sandboxes.set(executionId, sandbox);
        return sandbox;
    }
    /**
     * Monitor sandbox violations
     */
    monitorSandboxViolations(executionId, onViolation) {
        const sandbox = this.sandboxes.get(executionId);
        if (sandbox) {
            return sandbox.monitorViolations(onViolation);
        }
        return { stop: () => { } };
    }
    /**
     * Record a security violation
     */
    recordViolation(violation) {
        this.violations.push(violation);
        // Keep only last 1000 violations
        if (this.violations.length > 1000) {
            this.violations.splice(0, this.violations.length - 1000);
        }
    }
    /**
     * Get security violations
     */
    getViolations(since) {
        if (since) {
            return this.violations.filter(v => v.timestamp >= since);
        }
        return [...this.violations];
    }
    /**
     * Sanitize tool result to prevent information leakage
     */
    async sanitizeResult(result, executionId) {
        // Create a deep copy to avoid modifying the original
        const sanitized = JSON.parse(JSON.stringify(result));
        // Remove sensitive metadata fields
        if (sanitized.metadata) {
            delete sanitized.metadata.internalState;
            delete sanitized.metadata.systemInfo;
            delete sanitized.metadata.credentials;
            delete sanitized.metadata.secrets;
        }
        // Sanitize error messages to prevent information disclosure
        if (sanitized.error && typeof sanitized.error === 'string') {
            sanitized.error = this.sanitizeErrorMessage(sanitized.error);
        }
        return sanitized;
    }
    /**
     * Sanitize error messages
     */
    sanitizeErrorMessage(error) {
        // Remove file paths
        error = error.replace(/\/[^\s]+/g, '[PATH]');
        // Remove IP addresses
        error = error.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');
        // Remove potential credentials
        error = error.replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]');
        error = error.replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]');
        error = error.replace(/key[=:]\s*\S+/gi, 'key=[REDACTED]');
        return error;
    }
}
/**
 * Tool Sandbox class
 */
class ToolSandbox {
    config;
    executionId;
    securityManager;
    violationMonitors = [];
    constructor(config, executionId, securityManager) {
        this.config = config;
        this.executionId = executionId;
        this.securityManager = securityManager;
    }
    /**
     * Execute function in sandbox
     */
    async execute(fn) {
        // Set up sandbox environment
        this.setupSandboxEnvironment();
        try {
            // Execute the function with monitoring
            return await this.executeWithMonitoring(fn);
        }
        finally {
            // Clean up sandbox environment
            this.cleanupSandboxEnvironment();
        }
    }
    /**
     * Monitor violations
     */
    monitorViolations(onViolation) {
        this.violationMonitors.push(onViolation);
        return {
            stop: () => {
                const index = this.violationMonitors.indexOf(onViolation);
                if (index > -1) {
                    this.violationMonitors.splice(index, 1);
                }
            }
        };
    }
    /**
     * Clean up sandbox resources
     */
    async cleanup() {
        this.violationMonitors = [];
        // Additional cleanup logic would go here
    }
    /**
     * Set up sandbox environment
     */
    setupSandboxEnvironment() {
        // Set environment variables`
        if (this.config.environment) {
            `
      for (const [key, value] of Object.entries(this.config.environment)) {
        process.env[SANDBOX_${key}`;
            value;
        }
    }
    // Set up file system restrictions (simplified implementation)
    if(config, blockedPaths) {
        // In a real implementation, this would set up file system monitoring
        this.monitorFileAccess();
    }
    // Set up network restrictions
    if(config, networkAccess) {
        this.monitorNetworkAccess();
    }
}
async;
executeWithMonitoring(fn, () => Promise);
Promise < T > {
    const: startTime = Date.now(),
    try: {
        const: result = await fn(),
        // Check execution time against limits
        const: executionTime = Date.now() - startTime,
        : .config.resourceLimits.cpuTime && executionTime > this.config.resourceLimits.cpuTime
    }
};
{
    this.reportViolation('resource_abuse', CPU, time, limit, exceeded, $, { executionTime }, ms);
}
return result;
try { }
catch (error) {
    // Check if error indicates a security violation
    if (error instanceof Error && this.isSecurityViolation(error)) {
        this.reportViolation('sandbox_escape', error.message);
    }
    throw error;
}
cleanupSandboxEnvironment();
void {
    : .config.environment
};
{
    `
      for (const key of Object.keys(this.config.environment)) {`;
    delete process.env[SANDBOX_$];
    {
        key;
    }
    `];
      }
    }
  }

  /**
   * Monitor file access
   */
  private monitorFileAccess(): void {
    // Simplified file access monitoring
    // In a real implementation, this would use fs watchers or system-level monitoring
  }

  /**
   * Monitor network access
   */
  private monitorNetworkAccess(): void {
    // Simplified network access monitoring
    // In a real implementation, this would intercept network calls
  }

  /**
   * Check if error indicates security violation
   */
  private isSecurityViolation(error: Error): boolean {
    const securityKeywords = [
      'permission denied',
      'access denied',
      'unauthorized',
      'forbidden',
      'security violation',
      'sandbox escape'
    ];
    
    return securityKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  /**
   * Report security violation
   */
  private reportViolation(type: SecurityViolation['type'], description: string): void {
    const violation: SecurityViolation = {
      type,
      description,
      severity: this.getViolationSeverity(type),
      timestamp: new Date(),
      data: {
        executionId: this.executionId,
        sandboxConfig: this.config
      }
    };

    this.securityManager.recordViolation(violation);
    
    // Notify all monitors
    for (const monitor of this.violationMonitors) {
      monitor(violation);
    }
  }

  /**
   * Get violation severity based on type
   */
  private getViolationSeverity(type: SecurityViolation['type']): SecurityViolation['severity'] {
    switch (type) {
      case 'sandbox_escape':
        return 'critical';
      case 'permission_denied':
        return 'high';
      case 'resource_abuse':
        return 'medium';
      case 'network_violation':
      case 'file_access_violation':
        return 'medium';
      default:
        return 'low';
    }
  }
}

/**
 * Tool Performance Monitor class
 */
class ToolPerformanceMonitor {
  private readonly metrics = new Map<string, ToolPerformanceMetrics>();
  private readonly executionTimes = new Map<string, Map<string, number>>(); // toolName -> executionId -> startTime
  private readonly executionHistory = new Map<string, Array<{ success: boolean; executionTime: number; memoryUsage: number; timestamp: Date }>>(); // toolName -> history

  /**
   * Start monitoring an execution
   */
  startExecution(toolName: string, executionId: string): void {
    if (!this.executionTimes.has(toolName)) {
      this.executionTimes.set(toolName, new Map());
    }
    this.executionTimes.get(toolName)!.set(executionId, Date.now());
  }

  /**
   * Record completed execution
   */
  recordExecution(
    toolName: string, 
    executionId: string, 
    success: boolean, 
    resourceUsage?: ResourceUsageStats
  ): void {
    const startTime = this.executionTimes.get(toolName)?.get(executionId);
    if (!startTime) return;

    const executionTime = Date.now() - startTime;
    const memoryUsage = resourceUsage?.peakMemory || 0;

    // Clean up execution time tracking
    this.executionTimes.get(toolName)?.delete(executionId);

    // Add to history
    if (!this.executionHistory.has(toolName)) {
      this.executionHistory.set(toolName, []);
    }
    
    const history = this.executionHistory.get(toolName)!;
    history.push({
      success,
      executionTime,
      memoryUsage,
      timestamp: new Date()
    });

    // Keep only last 1000 executions per tool
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    // Update metrics
    this.updateMetrics(toolName);
  }

  /**
   * Get metrics for a tool
   */
  getMetrics(toolName: string): ToolPerformanceMetrics | null {
    return this.metrics.get(toolName) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, ToolPerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Update metrics for a tool
   */
  private updateMetrics(toolName: string): void {
    const history = this.executionHistory.get(toolName);
    if (!history || history.length === 0) return;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Filter to last hour for current metrics
    const recentHistory = history.filter(h => h.timestamp >= oneHourAgo);
    
    if (recentHistory.length === 0) return;

    const successfulExecutions = recentHistory.filter(h => h.success);
    const failedExecutions = recentHistory.filter(h => !h.success);
    
    const executionTimes = recentHistory.map(h => h.executionTime).sort((a, b) => a - b);
    const memoryUsages = recentHistory.map(h => h.memoryUsage);

    const metrics: ToolPerformanceMetrics = {
      executionCount: recentHistory.length,
      successRate: successfulExecutions.length / recentHistory.length,
      averageExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
      p95ExecutionTime: executionTimes[Math.floor(executionTimes.length * 0.95)] || 0,
      p99ExecutionTime: executionTimes[Math.floor(executionTimes.length * 0.99)] || 0,
      averageMemoryUsage: memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      errorRate: failedExecutions.length / recentHistory.length,
      timeoutRate: 0, // Would need to track timeout-specific failures
      lastExecution: recentHistory[recentHistory.length - 1]?.timestamp,
      collectionPeriod: {
        start: oneHourAgo,
        end: now
      }
    };

    this.metrics.set(toolName, metrics);
  }
}

/**
 * In-Memory Rate Limiter implementation
 */
class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetTime: Date }>();

  /**
   * Check if request is allowed
   */
  async isAllowed(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = new Date();
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetTime) {
      // Create new bucket or reset expired bucket
      this.buckets.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + config.windowSeconds * 1000)
      });
      return true;
    }

    if (bucket.count < config.maxRequests) {
      bucket.count++;
      return true;
    }

    // Check burst allowance
    if (config.burstSize && bucket.count < config.maxRequests + config.burstSize) {
      bucket.count++;
      return true;
    }

    return false;
  }

  /**
   * Get current usage for a key
   */
  async getUsage(key: string): Promise<{ count: number; resetTime: Date }> {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      const now = new Date();
      return { count: 0, resetTime: now };
    }
    return { count: bucket.count, resetTime: bucket.resetTime };
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }
};
}
//# sourceMappingURL=ToolExecutionEngine.js.map