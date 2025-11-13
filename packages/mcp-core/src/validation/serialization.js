/**
 * Message serialization utilities for MCP protocol
 */
import { MCPErrorClass, MCPErrorCode, ErrorCategory, ErrorSeverity } from '../types/error';
import { MessageValidator } from './messageValidator';
/**
 * Message serializer class for MCP protocol
 */
export class MessageSerializer {
    /**
     * Serialize MCP message to JSON string
     */
    static serialize(message, options = {}) {
        const startTime = Date.now();
        const originalSize = this.calculateObjectSize(message);
        try {
            // Create a copy of the message for serialization
            const messageToSerialize = this.prepareForSerialization(message, options);
            // Use a Set to track circular references
            const seen = new WeakSet();
            const replacer = (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        throw new Error('Converting circular structure to JSON');
                    }
                    seen.add(value);
                }
                // Apply custom replacer if provided, otherwise use default
                return options.replacer ? options.replacer(key, value) : this.defaultReplacer(key, value);
            };
            // Serialize to JSON
            const serialized = JSON.stringify(messageToSerialize, replacer, options.prettyPrint ? (options.space || 2) : undefined);
            const endTime = Date.now();
            const serializedSize = Buffer.byteLength(serialized, 'utf8');
            return {
                success: true,
                data: serialized,
                metadata: {
                    originalSize,
                    serializedSize,
                    serializationTime: endTime - startTime
                }
            };
        }
        catch (error) {
            const endTime = Date.now();
            return {
                success: false,
                error: new MCPErrorClass(MCPErrorCode.MESSAGE_INVALID_FORMAT, `Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                    category: ErrorCategory.PROTOCOL,
                    severity: ErrorSeverity.MEDIUM,
                    retryable: false,
                    details: {
                        originalMessage: message,
                        serializationTime: endTime - startTime
                    }
                })
            };
        }
    }
    /**
     * Deserialize JSON string to MCP message
     */
    static deserialize(data, options = {}) {
        const startTime = Date.now();
        const serializedSize = Buffer.byteLength(data, 'utf8');
        try {
            // Parse JSON
            const parsed = JSON.parse(data, options.reviver || this.defaultReviver);
            // Validate if requested
            if (options.validate) {
                const validationResult = MessageValidator.validateMessage(parsed);
                if (!validationResult.valid) {
                    throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
                }
            }
            // Normalize if requested
            const message = options.normalize ? this.normalizeMessage(parsed) : parsed;
            const endTime = Date.now();
            const deserializedSize = this.calculateObjectSize(message);
            return {
                success: true,
                message: message,
                metadata: {
                    serializedSize,
                    deserializedSize,
                    deserializationTime: endTime - startTime
                }
            };
        }
        catch (error) {
            const endTime = Date.now();
            return {
                success: false,
                error: new MCPErrorClass(MCPErrorCode.MESSAGE_INVALID_FORMAT, `Deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                    category: ErrorCategory.PROTOCOL,
                    severity: ErrorSeverity.MEDIUM,
                    retryable: false,
                    details: {
                        originalData: data,
                        deserializationTime: endTime - startTime
                    }
                })
            };
        }
    }
    /**
     * Serialize multiple messages as a batch
     */
    static serializeBatch(messages, options = {}) {
        const startTime = Date.now();
        const originalSize = messages.reduce((total, msg) => total + (msg ? this.calculateObjectSize(msg) : 0), 0);
        try {
            const serializedMessages = messages.map((message, index) => {
                if (!message) {
                    throw new Error(`Message at index ${index} is null or undefined`);
                }
                const result = this.serialize(message, { ...options, prettyPrint: false });
                if (!result.success) {
                    throw result.error;
                }
                return result.data;
            });
            const batchData = JSON.stringify(serializedMessages, undefined, options.prettyPrint ? (options.space || 2) : undefined);
            const endTime = Date.now();
            const serializedSize = Buffer.byteLength(batchData, 'utf8');
            return {
                success: true,
                data: batchData,
                metadata: {
                    originalSize,
                    serializedSize,
                    serializationTime: endTime - startTime
                }
            };
        }
        catch (error) {
            const endTime = Date.now();
            return {
                success: false,
                error: error instanceof MCPErrorClass ? error : new MCPErrorClass(MCPErrorCode.MESSAGE_INVALID_FORMAT, `Batch serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                    category: ErrorCategory.PROTOCOL,
                    severity: ErrorSeverity.MEDIUM,
                    retryable: false,
                    details: {
                        messageCount: messages.length,
                        serializationTime: endTime - startTime
                    }
                })
            };
        }
    }
    /**
     * Deserialize batch of messages
     */
    static deserializeBatch(data, options = {}) {
        const startTime = Date.now();
        try {
            const batchData = JSON.parse(data);
            if (!Array.isArray(batchData)) {
                throw new Error('Batch data must be an array');
            }
            return batchData.map((messageData) => {
                return this.deserialize(messageData, options);
            });
        }
        catch (error) {
            const endTime = Date.now();
            const errorResult = {
                success: false,
                error: new MCPErrorClass(MCPErrorCode.MESSAGE_INVALID_FORMAT, `Batch deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                    category: ErrorCategory.PROTOCOL,
                    severity: ErrorSeverity.MEDIUM,
                    retryable: false,
                    details: {
                        originalData: data,
                        deserializationTime: endTime - startTime
                    }
                })
            };
            return [errorResult];
        }
    }
    /**
     * Prepare message for serialization
     */
    static prepareForSerialization(message, options) {
        const prepared = { ...message };
        // Handle metadata inclusion
        if (!options.includeMeta && 'meta' in prepared) {
            delete prepared.meta;
        }
        // Convert Date objects to ISO strings
        if ('meta' in prepared && prepared.meta) {
            if (prepared.meta.timestamp instanceof Date) {
                prepared.meta.timestamp = prepared.meta.timestamp.toISOString();
            }
        }
        return prepared;
    }
    /**
     * Normalize message after deserialization
     */
    static normalizeMessage(message) {
        const normalized = { ...message };
        // Convert ISO strings back to Date objects
        if (normalized.meta) {
            if (typeof normalized.meta.timestamp === 'string') {
                try {
                    normalized.meta.timestamp = new Date(normalized.meta.timestamp);
                }
                catch {
                    // Keep as string if conversion fails
                }
            }
        }
        return normalized;
    }
    /**
     * Default replacer function for JSON.stringify
     */
    static defaultReplacer(key, value) {
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    }
    /**
     * Default reviver function for JSON.parse
     */
    static defaultReviver(key, value) {
        // Convert ISO strings back to Date objects for known timestamp fields
        if (key === 'timestamp' && typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        return value;
    }
    /**
     * Calculate approximate object size in bytes
     */
    static calculateObjectSize(obj) {
        try {
            return Buffer.byteLength(JSON.stringify(obj), 'utf8');
        }
        catch {
            return 0;
        }
    }
}
/**
 * Utility functions for common serialization tasks
 */
export class SerializationUtils {
    /**
     * Create a serializable copy of a message
     */
    static createSerializableCopy(message) {
        return MessageSerializer['prepareForSerialization'](message, { includeMeta: true });
    }
    /**
     * Validate serialization roundtrip
     */
    static validateRoundtrip(message) {
        try {
            // First check if the message can be serialized at all
            JSON.stringify(message);
            const serialized = MessageSerializer.serialize(message);
            if (!serialized.success)
                return false;
            const deserialized = MessageSerializer.deserialize(serialized.data, { validate: true });
            if (!deserialized.success)
                return false;
            // Basic structure comparison
            return this.compareMessageStructure(message, deserialized.message);
        }
        catch {
            return false;
        }
    }
    /**
     * Compare message structures for equality
     */
    static compareMessageStructure(msg1, msg2) {
        // Compare basic JSON-RPC fields
        if (msg1.jsonrpc !== msg2.jsonrpc)
            return false;
        if ('id' in msg1 && 'id' in msg2 && msg1.id !== msg2.id)
            return false;
        if ('method' in msg1 && 'method' in msg2 && msg1.method !== msg2.method)
            return false;
        // For more detailed comparison, we'd need deep equality check
        // This is a simplified version for basic validation
        return true;
    }
    /**
     * Get message size statistics
     */
    static getMessageSizeStats(messages) {
        if (messages.length === 0) {
            return { totalSize: 0, averageSize: 0, minSize: 0, maxSize: 0, count: 0 };
        }
        const sizes = messages.map(msg => MessageSerializer['calculateObjectSize'](msg));
        const totalSize = sizes.reduce((sum, size) => sum + size, 0);
        return {
            totalSize,
            averageSize: totalSize / messages.length,
            minSize: Math.min(...sizes),
            maxSize: Math.max(...sizes),
            count: messages.length
        };
    }
}
//# sourceMappingURL=serialization.js.map