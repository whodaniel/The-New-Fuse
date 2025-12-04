/**
 * MCP Protocol Validator using AJV
 */

import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import { schemas } from './schemas';
import { MCPErrorClass, MCPErrorCode, ErrorCategory, ErrorSeverity } from '../types/error';

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors if any */
  errors: string[];
  /** Normalized/coerced data */
  data?: any;
}

/**
 * MCP Protocol Validator class
 */
export class MCPValidator {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: false, // Disable type coercion to preserve original types
      strict: false
    });

    // Add basic format validation manually
    this.ajv.addFormat('uri', /^[a-zA-Z][a-zA-Z0-9+.-]*:.+/); // More flexible URI pattern
    this.ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // Compile all schemas
    this.compileSchemas();
  }

  /**
   * Compile all validation schemas
   */
  private compileSchemas(): void {
    for (const [name, schema] of Object.entries(schemas)) {
      try {
        const validator = this.ajv.compile(schema);
        this.validators.set(name, validator);
      } catch (error) {
        throw new MCPErrorClass(
          MCPErrorCode.SYSTEM_CONFIGURATION_ERROR,
          `Failed to compile schema '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
          { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.CRITICAL }
        );
      }
    }
  }

  /**
   * Validate JSON-RPC request
   */
  validateJSONRPCRequest(data: any): ValidationResult {
    return this.validate('jsonrpcRequest', data);
  }

  /**
   * Validate JSON-RPC response
   */
  validateJSONRPCResponse(data: any): ValidationResult {
    return this.validate('jsonrpcResponse', data);
  }

  /**
   * Validate JSON-RPC notification
   */
  validateJSONRPCNotification(data: any): ValidationResult {
    return this.validate('jsonrpcNotification', data);
  }

  /**
   * Validate MCP request
   */
  validateMCPRequest(data: any): ValidationResult {
    return this.validate('mcpRequest', data);
  }

  /**
   * Validate MCP response
   */
  validateMCPResponse(data: any): ValidationResult {
    return this.validate('mcpResponse', data);
  }

  /**
   * Validate MCP notification
   */
  validateMCPNotification(data: any): ValidationResult {
    return this.validate('mcpNotification', data);
  }

  /**
   * Validate MCP resource
   */
  validateMCPResource(data: any): ValidationResult {
    return this.validate('mcpResource', data);
  }

  /**
   * Validate MCP tool
   */
  validateMCPTool(data: any): ValidationResult {
    return this.validate('mcpTool', data);
  }

  /**
   * Validate MCP capability
   */
  validateMCPCapability(data: any): ValidationResult {
    return this.validate('mcpCapability', data);
  }

  /**
   * Validate MCP service info
   */
  validateMCPServiceInfo(data: any): ValidationResult {
    return this.validate('mcpServiceInfo', data);
  }

  /**
   * Generic validation method
   */
  validate(schemaName: string, data: any): ValidationResult {
    const validator = this.validators.get(schemaName);
    if (!validator) {
      return {
        valid: false,
        errors: [`Unknown schema: ${schemaName}`]
      };
    }

    // Create a deep copy to avoid mutating the original data
    const dataCopy = JSON.parse(JSON.stringify(data));
    const valid = validator(dataCopy);

    if (valid) {
      return {
        valid: true,
        errors: [],
        data: dataCopy
      };
    }

    const errors = validator.errors?.map(error => {
      const path = error.instancePath || 'root';
      const message = error.message || 'validation failed';
      return `${path}: ${message}`;
    }) || ['Unknown validation error'];

    return {
      valid: false,
      errors
    };
  }

  /**
   * Add custom schema
   */
  addSchema(name: string, schema: any): void {
    try {
      const validator = this.ajv.compile(schema);
      this.validators.set(name, validator);
    } catch (error) {
      throw new MCPErrorClass(
        MCPErrorCode.SYSTEM_CONFIGURATION_ERROR,
        `Failed to compile custom schema '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.HIGH }
      );
    }
  }

  /**
   * Remove custom schema
   */
  removeSchema(name: string): boolean {
    return this.validators.delete(name);
  }

  /**
   * Get list of available schemas
   */
  getSchemaNames(): string[] {
    return Array.from(this.validators.keys());
  }

  /**
   * Check if schema exists
   */
  hasSchema(name: string): boolean {
    return this.validators.has(name);
  }

  /**
   * Validate and throw error if invalid
   */
  validateOrThrow(schemaName: string, data: any): any {
    const result = this.validate(schemaName, data);
    if (!result.valid) {
      throw new MCPErrorClass(
        MCPErrorCode.MESSAGE_INVALID_FORMAT,
        `Validation failed for ${schemaName}: ${result.errors.join(', ')}`,
        {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          details: { errors: result.errors, schema: schemaName }
        }
      );
    }
    return result.data;
  }
}

/**
 * Global validator instance
 */
export const mcpValidator = new MCPValidator();
