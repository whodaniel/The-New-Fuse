/**
 * Message-specific validation utilities
 */

import { mcpValidator, ValidationResult } from './validator';
import {
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPMessage
} from '../interfaces/IMCPMessage';
import { MessageValidationResult } from '../types/message';
import { MCPErrorClass, MCPErrorCode, ErrorCategory, ErrorSeverity } from '../types/error';

/**
 * Message validator class for MCP protocol compliance
 */
export class MessageValidator {
  /**
   * Validate any MCP message
   */
  static validateMessage(message: any): MessageValidationResult {
    if (!message || typeof message !== 'object') {
      return {
        valid: false,
        errors: ['Message must be an object']
      };
    }

    // Check JSON-RPC version
    if (message.jsonrpc !== '2.0') {
      return {
        valid: false,
        errors: ['Message must have jsonrpc: "2.0"']
      };
    }

    // Determine message type and validate accordingly
    if (message.id !== undefined && message.method !== undefined) {
      // Request message
      return this.validateRequest(message);
    } else if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
      // Response message
      return this.validateResponse(message);
    } else if (message.method !== undefined && message.id === undefined) {
      // Notification message
      return this.validateNotification(message);
    } else {
      return {
        valid: false,
        errors: ['Unable to determine message type']
      };
    }
  }

  /**
   * Validate MCP request message
   */
  static validateRequest(request: any): MessageValidationResult {
    const result = mcpValidator.validateMCPRequest(request);
    return this.convertValidationResult(result);
  }

  /**
   * Validate MCP response message
   */
  static validateResponse(response: any): MessageValidationResult {
    const result = mcpValidator.validateMCPResponse(response);
    return this.convertValidationResult(result);
  }

  /**
   * Validate MCP notification message
   */
  static validateNotification(notification: any): MessageValidationResult {
    const result = mcpValidator.validateMCPNotification(notification);
    return this.convertValidationResult(result);
  }

  /**
   * Validate request parameters against method schema
   */
  static validateRequestParams(method: string, params: any): ValidationResult {
    // This would be extended to validate specific method parameters
    // For now, we just check that params is valid JSON
    try {
      if (params !== undefined) {
        JSON.stringify(params);
      }
      return {
        valid: true,
        errors: [],
        data: params
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid parameters for method ${method}: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate response result against method schema
   */
  static validateResponseResult(method: string, result: any): ValidationResult {
    // This would be extended to validate specific method results
    // For now, we just check that result is valid JSON
    try {
      if (result !== undefined) {
        JSON.stringify(result);
      }
      return {
        valid: true,
        errors: [],
        data: result
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid result for method ${method}: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate error object
   */
  static validateError(error: any): ValidationResult {
    if (!error || typeof error !== 'object') {
      return {
        valid: false,
        errors: ['Error must be an object']
      };
    }

    const errors: string[] = [];

    if (typeof error.code !== 'number') {
      errors.push('Error code must be a number');
    }

    if (typeof error.message !== 'string') {
      errors.push('Error message must be a string');
    }

    return {
      valid: errors.length === 0,
      errors,
      data: error
    };
  }

  /**
   * Validate message ID
   */
  static validateMessageId(id: any): ValidationResult {
    if (id === null || id === undefined) {
      return {
        valid: true,
        errors: [],
        data: id
      };
    }

    if (typeof id !== 'string' && typeof id !== 'number') {
      return {
        valid: false,
        errors: ['Message ID must be a string, number, or null']
      };
    }

    return {
      valid: true,
      errors: [],
      data: id
    };
  }

  /**
   * Validate method name
   */
  static validateMethodName(method: any): ValidationResult {
    if (typeof method !== 'string') {
      return {
        valid: false,
        errors: ['Method name must be a string']
      };
    }

    if (method.length === 0) {
      return {
        valid: false,
        errors: ['Method name cannot be empty']
      };
    }

    // Check for reserved method names (starting with rpc.)
    if (method.startsWith('rpc.') && !this.isValidRPCMethod(method)) {
      return {
        valid: false,
        errors: [`Reserved method name: ${method}`]
      };
    }

    return {
      valid: true,
      errors: [],
      data: method
    };
  }

  /**
   * Check if RPC method is valid
   */
  private static isValidRPCMethod(method: string): boolean {
    const validRPCMethods = [
      'rpc.discover',
      'rpc.ping',
      'rpc.info'
    ];
    return validRPCMethods.includes(method);
  }

  /**
   * Convert ValidationResult to MessageValidationResult
   */
  private static convertValidationResult(result: ValidationResult): MessageValidationResult {
    return {
      valid: result.valid,
      errors: result.errors,
      normalizedMessage: result.data
    };
  }

  /**
   * Create validation error
   */
  static createValidationError(message: string, details?: any): MCPErrorClass {
    return new MCPErrorClass(
      MCPErrorCode.MESSAGE_INVALID_FORMAT,
      message,
      {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        details
      }
    );
  }

  /**
   * Validate and normalize message
   */
  static validateAndNormalize(message: any): MCPMessage {
    const result = this.validateMessage(message);
    if (!result.valid) {
      throw this.createValidationError(
        `Message validation failed: ${result.errors.join(', ')}`,
        { originalMessage: message, errors: result.errors }
      );
    }
    return result.normalizedMessage as MCPMessage;
  }
}
