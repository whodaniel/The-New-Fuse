/**
 * ConversationManager handles database operations for conversations and messages
 */
export declare class ConversationManager {
    /**
     * Create a new conversation
     * @param id Optional custom ID for the conversation
     * @returns The created conversation ID
     */
    createConversation(id?: string): Promise<{
        conversationId: string;
    }>;
    /**
     * Add a message to a conversation
     * @param conversationId The ID of the conversation
     * @param message The message to add
     * @returns The created message
     */
    addMessage(conversationId: string, senderId: string, content: string, role: string, receiverId?: string, toolCalls?: any[]): Promise<any>;
    /**
     * Get the message history for a conversation
     * @param conversationId The ID of the conversation
     * @returns Array of messages
     */
    getHistory(conversationId: string): Promise<any[]>;
    /**
     * Archive a conversation
     * @param conversationId The ID of the conversation to archive
     */
    archiveConversation(conversationId: string): Promise<void>;
    /**
     * Delete a conversation and all its messages
     * @param conversationId The ID of the conversation to delete
     */
    deleteConversation(conversationId: string): Promise<void>;
    /**
     * List all conversations, optionally filtering by agent
     * @param agentId Optional agent ID to filter by
     * @param includeArchived Whether to include archived conversations
     * @returns Array of conversations
     */
    listConversations(agentId?: string, includeArchived?: boolean): Promise<any[]>;
}
//# sourceMappingURL=conversation-manager.d.ts.map