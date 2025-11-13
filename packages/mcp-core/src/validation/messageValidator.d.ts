/**
 * Message-specific validation utilities
 */
import { ValidationResult } from './validator';
import { MCPMessage } from '../interfaces/IMCPMessage';
import { MessageValidationResult } from '../types/message';
import { MCPErrorClass } from '../types/error';
/**
 * Message validator class for MCP protocol compliance
 */
export declare class MessageValidator {
    /**
     * Validate any MCP message
     */
    static validateMessage(message: any): MessageValidationResult;
    /**
     * Validate MCP request message
     */
    static validateRequest(request: any): MessageValidationResult;
    /**
     * Validate MCP response message
     */
    static validateResponse(response: any): MessageValidationResult;
    /**
     * Validate MCP notification message
     */
    static validateNotification(notification: any): MessageValidationResult;
    /**
     * Validate request parameters against method schema
     */
    static validateRequestParams(method: string, params: any): ValidationResult;
    /**
     * Validate response result against method schema
     */
    static validateResponseResult(method: string, result: any): ValidationResult;
    /**
     * Validate error object
     */
    static validateError(error: any): ValidationResult;
    /**
     * Validate message ID
     */
    static validateMessageId(id: any): ValidationResult;
    /**
     * Validate method name
     */
    static validateMethodName(method: any): ValidationResult;
    /**
     * Check if RPC method is valid
     */
    private static isValidRPCMethod;
    /**
     * Convert ValidationResult to MessageValidationResult
     */
    private static convertValidationResult;
    /**
     * Create validation error
     */
    static createValidationError(message: string, details?: any): MCPErrorClass;
    /**
     * Validate and normalize message
     */
    static validateAndNormalize(message: any): MCPMessage;
}
//# sourceMappingURL=messageValidator.d.ts.map