/**
 * Message serialization utilities for MCP protocol
 */
import { MCPMessage } from '../interfaces/IMCPMessage';
import { MCPErrorClass } from '../types/error';
/**
 * Serialization options interface
 */
export interface SerializationOptions {
    /** Whether to include metadata in serialization */
    includeMeta?: boolean;
    /** Whether to pretty print JSON */
    prettyPrint?: boolean;
    /** Custom replacer function for JSON.stringify */
    replacer?: (key: string, value: any) => any;
    /** Space parameter for JSON.stringify */
    space?: string | number;
}
/**
 * Deserialization options interface
 */
export interface DeserializationOptions {
    /** Whether to validate the message after deserialization */
    validate?: boolean;
    /** Whether to normalize the message */
    normalize?: boolean;
    /** Custom reviver function for JSON.parse */
    reviver?: (key: string, value: any) => any;
}
/**
 * Serialization result interface
 */
export interface SerializationResult {
    /** Whether serialization was successful */
    success: boolean;
    /** Serialized data (if successful) */
    data?: string;
    /** Error information (if failed) */
    error?: MCPErrorClass;
    /** Serialization metadata */
    metadata?: {
        /** Original message size in bytes */
        originalSize: number;
        /** Serialized size in bytes */
        serializedSize: number;
        /** Serialization time in milliseconds */
        serializationTime: number;
    };
}
/**
 * Deserialization result interface
 */
export interface DeserializationResult {
    /** Whether deserialization was successful */
    success: boolean;
    /** Deserialized message (if successful) */
    message?: MCPMessage;
    /** Error information (if failed) */
    error?: MCPErrorClass;
    /** Deserialization metadata */
    metadata?: {
        /** Serialized size in bytes */
        serializedSize: number;
        /** Deserialized size in bytes */
        deserializedSize: number;
        /** Deserialization time in milliseconds */
        deserializationTime: number;
    };
}
/**
 * Message serializer class for MCP protocol
 */
export declare class MessageSerializer {
    /**
     * Serialize MCP message to JSON string
     */
    static serialize(message: MCPMessage, options?: SerializationOptions): SerializationResult;
    /**
     * Deserialize JSON string to MCP message
     */
    static deserialize(data: string, options?: DeserializationOptions): DeserializationResult;
    /**
     * Serialize multiple messages as a batch
     */
    static serializeBatch(messages: MCPMessage[], options?: SerializationOptions): SerializationResult;
    /**
     * Deserialize batch of messages
     */
    static deserializeBatch(data: string, options?: DeserializationOptions): DeserializationResult[];
    /**
     * Prepare message for serialization
     */
    private static prepareForSerialization;
    /**
     * Normalize message after deserialization
     */
    private static normalizeMessage;
    /**
     * Default replacer function for JSON.stringify
     */
    private static defaultReplacer;
    /**
     * Default reviver function for JSON.parse
     */
    private static defaultReviver;
    /**
     * Calculate approximate object size in bytes
     */
    private static calculateObjectSize;
}
/**
 * Utility functions for common serialization tasks
 */
export declare class SerializationUtils {
    /**
     * Create a serializable copy of a message
     */
    static createSerializableCopy(message: MCPMessage): any;
    /**
     * Validate serialization roundtrip
     */
    static validateRoundtrip(message: MCPMessage): boolean;
    /**
     * Compare message structures for equality
     */
    private static compareMessageStructure;
    /**
     * Get message size statistics
     */
    static getMessageSizeStats(messages: MCPMessage[]): {
        totalSize: number;
        averageSize: number;
        minSize: number;
        maxSize: number;
        count: number;
    };
}
//# sourceMappingURL=serialization.d.ts.map