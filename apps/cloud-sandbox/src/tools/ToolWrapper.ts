/**
 * Tool Wrapper System
 *
 * Wraps cloud sandbox MCP tools with:
 * - Consistent error handling
 * - Type validation
 * - Retry logic
 * - Timeout handling
 * - Metrics tracking
 *
 * Makes tools callable by AI agents with proper context and safety.
 */

import { Logger } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/CloudSandboxAuthGuard';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: unknown[];
  validation?: (value: unknown) => boolean;
  sanitize?: (value: unknown) => unknown;
}

export interface ToolSchema {
  name: string;
  description: string;
  category: 'browser' | 'filesystem' | 'execution' | 'system' | 'monitoring';
  parameters: ToolParameter[];
  returns: {
    type: string;
    description: string;
  };
  examples?: Array<{
    description: string;
    params: Record<string, unknown>;
    expectedResult: unknown;
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number; // milliseconds
  retryable?: boolean;
}

export interface ToolExecutionContext {
  user: AuthenticatedUser;
  toolName: string;
  params: Record<string, unknown>;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  executionTime: number;
  retried: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Tool Wrapper
 *
 * Provides a consistent interface for tool execution with built-in safety.
 */
export class ToolWrapper {
  private readonly logger = new Logger(ToolWrapper.name);
  private readonly schema: ToolSchema;
  private readonly handler: (
    params: Record<string, unknown>,
    context: ToolExecutionContext
  ) => Promise<unknown>;

  constructor(
    schema: ToolSchema,
    handler: (params: Record<string, unknown>, context: ToolExecutionContext) => Promise<unknown>
  ) {
    this.schema = schema;
    this.handler = handler;
  }

  /**
   * Execute tool with full validation and error handling
   */
  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Validate parameters
      const validationResult = this.validateParameters(context.params);
      if (!validationResult.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: validationResult.errors,
          },
          executionTime: Date.now() - startTime,
          retried: false,
        };
      }

      // Step 2: Sanitize parameters
      const sanitizedParams = this.sanitizeParameters(context.params);

      // Step 3: Execute with timeout
      const timeout = this.schema.timeout || 30000; // Default 30s
      const result = await this.executeWithTimeout(
        () => this.handler(sanitizedParams, context),
        timeout
      );

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        retried: false,
      };
    } catch (error) {
      // Step 4: Handle errors with retry logic
      const shouldRetry =
        this.schema.retryable && (context.retryCount || 0) < 3 && this.isRetriableError(error);

      if (shouldRetry) {
        this.logger.warn(
          `Tool ${this.schema.name} failed, retrying... (attempt ${(context.retryCount || 0) + 1}/3)`
        );

        await this.delay(1000 * (context.retryCount || 0 + 1)); // Exponential backoff

        return await this.execute({
          ...context,
          retryCount: (context.retryCount || 0) + 1,
        });
      }

      return {
        success: false,
        error: {
          code: this.getErrorCode(error),
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        executionTime: Date.now() - startTime,
        retried: (context.retryCount || 0) > 0,
      };
    }
  }

  /**
   * Get tool schema (for AI agents to understand the tool)
   */
  getSchema(): ToolSchema {
    return this.schema;
  }

  /**
   * Get MCP-compatible schema
   */
  getMCPSchema() {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of this.schema.parameters) {
      properties[param.name] = {
        type: param.type,
        description: param.description,
      };

      if (param.enum) {
        properties[param.name].enum = param.enum;
      }

      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      name: this.schema.name,
      description: this.schema.description,
      inputSchema: {
        type: 'object',
        properties,
        required,
      },
    };
  }

  /**
   * Validate parameters against schema
   */
  private validateParameters(params: Record<string, unknown>): {
    valid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];

    for (const param of this.schema.parameters) {
      const value = params[param.name];

      // Check required
      if (param.required && (value === undefined || value === null)) {
        errors.push(`Parameter '${param.name}' is required`);
        continue;
      }

      // Skip validation for optional undefined params
      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      if (!this.checkType(value, param.type)) {
        errors.push(`Parameter '${param.name}' must be of type ${param.type}, got ${typeof value}`);
      }

      // Check enum
      if (param.enum && !param.enum.includes(value)) {
        errors.push(`Parameter '${param.name}' must be one of: ${param.enum.join(', ')}`);
      }

      // Custom validation
      if (param.validation && !param.validation(value)) {
        errors.push(`Parameter '${param.name}' failed validation`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Sanitize parameters
   */
  private sanitizeParameters(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const param of this.schema.parameters) {
      const value = params[param.name];

      if (value === undefined || value === null) {
        if (param.default !== undefined) {
          sanitized[param.name] = param.default;
        }
        continue;
      }

      if (param.sanitize) {
        sanitized[param.name] = param.sanitize(value);
      } else {
        sanitized[param.name] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if value matches expected type
   */
  private checkType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Check if error is retriable
   */
  private isRetriableError(error: unknown): boolean {
    if (error instanceof Error) {
      const retriableMessages = [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'network',
        'timeout',
        'temporarily unavailable',
      ];

      return retriableMessages.some((msg) =>
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
    }

    return false;
  }

  /**
   * Get error code from error
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) return 'TIMEOUT';
      if (error.message.includes('permission')) return 'PERMISSION_DENIED';
      if (error.message.includes('not found')) return 'NOT_FOUND';
      if (error.message.includes('network')) return 'NETWORK_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Tool Registry
 *
 * Manages all wrapped tools
 */
export class ToolRegistry {
  private readonly tools: Map<string, ToolWrapper> = new Map();
  private readonly logger = new Logger(ToolRegistry.name);

  /**
   * Register a tool
   */
  register(wrapper: ToolWrapper): void {
    const schema = wrapper.getSchema();
    this.tools.set(schema.name, wrapper);
    this.logger.log(`Registered tool: ${schema.name} (${schema.category})`);
  }

  /**
   * Get tool by name
   */
  get(name: string): ToolWrapper | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAll(): ToolWrapper[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolSchema['category']): ToolWrapper[] {
    return this.getAll().filter((tool) => tool.getSchema().category === category);
  }

  /**
   * Get MCP-compatible tool list
   */
  getMCPTools(): Array<{ name: string; description: string; inputSchema: any }> {
    return this.getAll().map((tool) => tool.getMCPSchema());
  }

  /**
   * Execute a tool
   */
  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const tool = this.tools.get(context.toolName);

    if (!tool) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${context.toolName}' not found`,
        },
        executionTime: 0,
        retried: false,
      };
    }

    return await tool.execute(context);
  }
}
