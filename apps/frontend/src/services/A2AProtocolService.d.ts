import { z } from 'zod';
declare const a2aMessageV1Schema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    timestamp: z.ZodNumber;
    sender: z.ZodString;
    recipient: z.ZodOptional<z.ZodString>;
    payload: z.ZodAny;
    metadata: z.ZodObject<{
        priority: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
        }>;
        timeout: z.ZodOptional<z.ZodNumber>;
        retryCount: z.ZodOptional<z.ZodNumber>;
        protocol_version: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const a2aMessageV2Schema: z.ZodObject<{
    header: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        version: z.ZodString;
        priority: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
        }>;
        source: z.ZodString;
        target: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    body: z.ZodObject<{
        content: z.ZodAny;
        metadata: z.ZodObject<{
            sent_at: z.ZodNumber;
            timeout: z.ZodOptional<z.ZodNumber>;
            retries: z.ZodOptional<z.ZodNumber>;
            trace_id: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type A2AMessageV1 = z.infer<typeof a2aMessageV1Schema>;
export type A2AMessageV2 = z.infer<typeof a2aMessageV2Schema>;
export type A2AMessage = A2AMessageV1 | A2AMessageV2;
/**
 * Service for A2A protocol operations
 */
export declare class A2AProtocolService {
    private apiBaseUrl;
    private defaultProtocolVersion;
    constructor(defaultProtocolVersion?: string);
    /**
     * Creates a new A2A message
     * @param type Message type
     * @param payload Message payload
     * @param sender Message sender
     * @param recipient Message recipient
     * @param options Additional options
     * @returns The created message
     */
    createMessage(type: string, payload: any, sender: string, recipient?: string, options?: {
        priority?: 'low' | 'medium' | 'high';
        timeout?: number;
        retryCount?: number;
        protocolVersion?: string;
    }): A2AMessage;
    /**
     * Creates a new A2A message (v1.0)
     * @param type Message type
     * @param payload Message payload
     * @param sender Message sender
     * @param recipient Message recipient
     * @param options Additional options
     * @returns The created message
     */
    private createMessageV1;
    /**
     * Creates a new A2A message (v2.0)
     * @param type Message type
     * @param payload Message payload
     * @param sender Message sender
     * @param recipient Message recipient
     * @param options Additional options
     * @returns The created message
     */
    private createMessageV2;
    /**
     * Transforms a message from one version to another
     * @param message The message to transform
     * @param targetVersion The target version
     * @returns The transformed message
     */
    transformMessage(message: A2AMessage, targetVersion: string): A2AMessage;
    /**
     * Gets the version of a message
     * @param message The message
     * @returns The message version
     */
    getMessageVersion(message: A2AMessage): string;
    /**
     * Validates a message
     * @param message The message to validate
     * @returns The validated message
     */
    validateMessage(message: A2AMessage): A2AMessage;
    /**
     * Sends a message
     * @param message The message to send
     * @returns The response
     */
    sendMessage(message: A2AMessage): Promise<any>;
    /**
     * Broadcasts a message
     * @param message The message to broadcast
     * @returns The response
     */
    broadcastMessage(message: A2AMessage): Promise<any>;
    /**
     * Sends a request and waits for a response
     * @param message The request message
     * @param timeout Timeout in milliseconds
     * @returns The response
     */
    sendRequestAndWaitForResponse(message: A2AMessage, timeout?: number): Promise<any>;
}
export declare const a2aProtocolService: A2AProtocolService;
export {};
