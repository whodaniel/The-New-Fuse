/**
 * Tool Execution Engine with timeout and resource limits
 *
 * This module provides a comprehensive tool execution engine that enforces
 * resource limits, timeouts, and provides monitoring capabilities.
 */
import { EventEmitter } from 'events';
import { JSONSchema, RateLimitConfig, ResourceLimits, ToolHandler, ToolPermissions, ToolResult, ValidationResult } from '../interfaces/IMCPTool.js';
import { ToolExecutionContext, ToolExecutionLog, ToolSandboxConfig } from '../types/tool.js';
/**
 * Tool execution options interface
 */
export interface ToolExecutionOptions {
    /** Execution timeout in milliseconds */
    timeout?: number;
    /** Resource limits for execution */
    resourceLimits?: ResourceLimits;
    /** Execution context */
    context?: Record<string, any>;
    /** Enable execution monitoring */
    monitoring?: boolean;
    /** Sandbox configuration */
    sandbox?: ToolSandboxConfig;
    /** Execution priority */
    priority?: 'low' | 'normal' | 'high';
}
/**
 * Tool execution result with enhanced metadata
 */
export interface EnhancedToolResult extends ToolResult {
    /** Execution context */
    executionContext?: ToolExecutionContext;
    /** Execution logs */
    logs?: ToolExecutionLog[];
    /** Resource usage statistics */
    resourceUsage?: ResourceUsageStats;
}
/**
 * Resource usage statistics interface
 */
export interface ResourceUsageStats {
    /** CPU time used in milliseconds */
    cpuTime: number;
    /** Peak memory usage in bytes */
    peakMemory: number;
    /** Number of file operations */
    fileOperations: number;
    /** Number of network operations */
    networkOperations: number;
    /** Execution start time */
    startTime: Date;
    /** Execution end time */
    endTime: Date;
}
/**
 * Tool execution monitor interface
 */
export interface ToolExecutionMonitor {
    /** Monitor execution progress */
    onProgress?(context: ToolExecutionContext, progress: number): void;
    /** Monitor resource usage */
    onResourceUsage?(context: ToolExecutionContext, usage: ResourceUsageStats): void;
    /** Monitor execution completion */
    onComplete?(context: ToolExecutionContext, result: EnhancedToolResult): void;
    /** Monitor execution errors */
    onError?(context: ToolExecutionContext, error: Error): void;
    /** Monitor security violations */
    onSecurityViolation?(context: ToolExecutionContext, violation: SecurityViolation): void;
}
/**
 * Security violation interface
 */
export interface SecurityViolation {
    /** Violation type */
    type: 'sandbox_escape' | 'permission_denied' | 'resource_abuse' | 'network_violation' | 'file_access_violation';
    /** Violation description */
    description: string;
    /** Violation severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Violation timestamp */
    timestamp: Date;
    /** Additional violation data */
    data?: any;
}
/**
 * Tool security context interface
 */
export interface ToolSecurityContext {
    /** User/agent executing the tool */
    principal: string;
    /** User roles */
    roles: string[];
    /** Session ID */
    sessionId?: string;
    /** IP address */
    ipAddress?: string;
    /** Additional security metadata */
    metadata?: Record<string, any>;
}
/**
 * Tool performance metrics interface
 */
export interface ToolPerformanceMetrics {
    /** Execution count */
    executionCount: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Average execution time in milliseconds */
    averageExecutionTime: number;
    /** 95th percentile execution time */
    p95ExecutionTime: number;
    /** 99th percentile execution time */
    p99ExecutionTime: number;
    /** Average memory usage in bytes */
    averageMemoryUsage: number;
    /** Peak memory usage in bytes */
    peakMemoryUsage: number;
    /** Error rate (0-1) */
    errorRate: number;
    /** Timeout rate (0-1) */
    timeoutRate: number;
    /** Last execution timestamp */
    lastExecution?: Date;
    /** Metrics collection period */
    collectionPeriod: {
        start: Date;
        end: Date;
    };
}
/**
 * Rate limiter interface
 */
export interface RateLimiter {
    /** Check if request is allowed */
    isAllowed(key: string, config: RateLimitConfig): Promise<boolean>;
    /** Get current usage for a key */
    getUsage(key: string): Promise<{
        count: number;
        resetTime: Date;
    }>;
    /** Reset rate limit for a key */
    reset(key: string): Promise<void>;
}
/**
 * Tool Execution Engine class
 *
 * Provides comprehensive tool execution with resource management,
 * timeout handling, security controls, and monitoring capabilities.
 */
export declare class ToolExecutionEngine extends EventEmitter {
    private readonly activeExecutions;
    private readonly executionHistory;
    private readonly resourceMonitor;
    private readonly securityManager;
    private readonly performanceMonitor;
    private readonly rateLimiter;
    private readonly defaultTimeout;
    private readonly defaultResourceLimits;
    constructor(defaultTimeout?: number, // 30 seconds
    defaultResourceLimits?: ResourceLimits, rateLimiter?: RateLimiter);
    /**
     * Execute a tool with comprehensive security, monitoring and resource management
     */
    executeToolSecurely(handler: ToolHandler, params: any, permissions: ToolPermissions, securityContext: ToolSecurityContext, options?: ToolExecutionOptions): Promise<EnhancedToolResult>;
    /**
     * Execute a tool with comprehensive monitoring and resource management (legacy method)
     */
    executeToolWithLimits(handler: ToolHandler, params: any, options?: ToolExecutionOptions): Promise<EnhancedToolResult>;
    /**
     * Perform security checks before tool execution
     */
    private performSecurityChecks;
    /**
     * Execute tool with security constraints, timeout and resource limits
     */
    private executeWithSecurityConstraints;
    /**
     * Execute tool in sandbox environment
     */
    private executeInSandbox;
    /**
     * Execute tool with timeout and resource constraints
     */
    private executeWithConstraints;
    /**
     * Validate tool execution result
     */
    private validateToolResult;
    /**
     * Get tool performance metrics
     */
    getToolPerformanceMetrics(toolName: string): ToolPerformanceMetrics | null;
    /**
     * Get all performance metrics
     */
    getAllPerformanceMetrics(): Map<string, ToolPerformanceMetrics>;
    /**
     * Get security violations for a time period
     */
    getSecurityViolations(since?: Date): SecurityViolation[];
    /**
     * Validate tool parameters with enhanced JSON Schema validation
     */
    validateToolParameters(schema: JSONSchema, params: any, strict?: boolean): Promise<ValidationResult>;
    /**
     * Get active executions
     */
    getActiveExecutions(): ToolExecutionContext[];
    /**
     * Get execution history
     */
    getExecutionHistory(limit?: number): EnhancedToolResult[];
    /**
     * Cancel an active execution
     */
    cancelExecution(executionId: string): Promise<boolean>;
    /**
     * Get execution statistics
     */
    getExecutionStatistics(): {
        totalExecutions: number;
        activeExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
    };
    /**
     * Generate unique execution ID
     */
    private generateExecutionId;
    /**
     * Add log entry
     */
    private addLog;
}
//# sourceMappingURL=ToolExecutionEngine.d.ts.map