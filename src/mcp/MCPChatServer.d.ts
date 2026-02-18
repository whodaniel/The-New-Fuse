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
    }, z.core.$strip>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        content: z.ZodAny;
    }, z.core.$strip>>>;
}, z.core.$strip>;
declare const codeCollabSchema: z.ZodObject<{
    conversationId: z.ZodString;
    action: z.ZodEnum<{
        execute: "execute";
        view: "view";
        comment: "comment";
        edit: "edit";
    }>;
    codeBlock: z.ZodObject<{
        id: z.ZodString;
        language: z.ZodString;
        content: z.ZodString;
        lineStart: z.ZodOptional<z.ZodNumber>;
        lineEnd: z.ZodOptional<z.ZodNumber>;
        filename: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
declare const conversationGroupSchema: z.ZodObject<{
    name: z.ZodString;
    participants: z.ZodArray<z.ZodString>;
    type: z.ZodEnum<{
        group: "group";
        direct: "direct";
        channel: "channel";
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
declare const resourceAttachmentSchema: z.ZodObject<{
    resourceType: z.ZodString;
    resourceId: z.ZodString;
    messageId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
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