import { z } from "zod";
import { MCPServer, MCPServerOptions } from './MCPServer.tsx';
declare const contextualMessageSchema: z.ZodObject<{
    sender: z.ZodString;
    recipient: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    context: z.ZodObject<{
        conversationId: z.ZodString;
        threadId: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        metadata?: Record<string, any>;
        conversationId?: string;
        threadId?: string;
    }, {
        metadata?: Record<string, any>;
        conversationId?: string;
        threadId?: string;
    }>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        content: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        content?: any;
    }, {
        type?: string;
        content?: any;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content?: string;
    sender?: string;
    recipient?: string;
    context?: {
        metadata?: Record<string, any>;
        conversationId?: string;
        threadId?: string;
    };
    attachments?: {
        type?: string;
        content?: any;
    }[];
}, {
    content?: string;
    sender?: string;
    recipient?: string;
    context?: {
        metadata?: Record<string, any>;
        conversationId?: string;
        threadId?: string;
    };
    attachments?: {
        type?: string;
        content?: any;
    }[];
}>;
declare const codeCollabSchema: z.ZodObject<{
    conversationId: z.ZodString;
    action: z.ZodEnum<["edit", "view", "comment", "execute"]>;
    codeBlock: z.ZodObject<{
        id: z.ZodString;
        language: z.ZodString;
        content: z.ZodString;
        lineStart: z.ZodOptional<z.ZodNumber>;
        lineEnd: z.ZodOptional<z.ZodNumber>;
        filename: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        content?: string;
        language?: string;
        lineStart?: number;
        lineEnd?: number;
        filename?: string;
    }, {
        id?: string;
        content?: string;
        language?: string;
        lineStart?: number;
        lineEnd?: number;
        filename?: string;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, any>;
    conversationId?: string;
    action?: "view" | "edit" | "comment" | "execute";
    codeBlock?: {
        id?: string;
        content?: string;
        language?: string;
        lineStart?: number;
        lineEnd?: number;
        filename?: string;
    };
}, {
    metadata?: Record<string, any>;
    conversationId?: string;
    action?: "view" | "edit" | "comment" | "execute";
    codeBlock?: {
        id?: string;
        content?: string;
        language?: string;
        lineStart?: number;
        lineEnd?: number;
        filename?: string;
    };
}>;
declare const conversationGroupSchema: z.ZodObject<{
    name: z.ZodString;
    participants: z.ZodArray<z.ZodString, "many">;
    type: z.ZodEnum<["direct", "group", "channel"]>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    type?: "direct" | "group" | "channel";
    metadata?: Record<string, any>;
    participants?: string[];
}, {
    name?: string;
    type?: "direct" | "group" | "channel";
    metadata?: Record<string, any>;
    participants?: string[];
}>;
declare const resourceAttachmentSchema: z.ZodObject<{
    resourceType: z.ZodString;
    resourceId: z.ZodString;
    messageId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, any>;
    resourceType?: string;
    resourceId?: string;
    messageId?: string;
}, {
    metadata?: Record<string, any>;
    resourceType?: string;
    resourceId?: string;
    messageId?: string;
}>;
/**
 * MCP Server implementation for the Chat System
 * Provides capabilities for contextual messaging and code collaboration
 */
export declare class MCPChatServer extends MCPServer {
    constructor(options?: MCPServerOptions);
    /**
     * Send a message with contextual information
     */
    sendWithContext(params: z.infer<typeof contextualMessageSchema>): Promise<{
        success: boolean;
        messageId: string;
    }>;
    /**
     * Handle code collaboration action
     */
    handleCodeCollab(params: z.infer<typeof codeCollabSchema>): Promise<{
        success: boolean;
        codeBlockId: string;
    }>;
    /**
     * Create a conversation group
     */
    createGroup(params: z.infer<typeof conversationGroupSchema>): Promise<{
        success: boolean;
        groupId: string;
    }>;
    /**
     * Attach a resource to a message
     */
    attachToMessage(params: z.infer<typeof resourceAttachmentSchema>): Promise<{
        success: boolean;
        attachmentId: string;
    }>;
}
export {};
//# sourceMappingURL=MCPChatServer.d.ts.map