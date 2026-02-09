"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
const prisma_client_1 = require("./prisma-client");
const uuid_1 = require("uuid");
const logger_1 = require("./logger");
/**
 * ConversationManager handles database operations for conversations and messages
 */
class ConversationManager {
    /**
     * Create a new conversation
     * @param id Optional custom ID for the conversation
     * @returns The created conversation ID
     */
    async createConversation(id) {
        const conversationId = id || (0, uuid_1.v4)();
        await prisma_client_1.prisma.conversation.create({
            data: {
                id: conversationId,
                title: `Conversation ${new Date().toLocaleString()}`,
                metadata: {}
            }
        });
        logger_1.logger.info(`Created conversation with ID: ${conversationId}`);
        return { conversationId };
    }
    /**
     * Add a message to a conversation
     * @param conversationId The ID of the conversation
     * @param message The message to add
     * @returns The created message
     */
    async addMessage(conversationId, senderId, content, role, receiverId, toolCalls) {
        try {
            // Check if conversation exists
            const conversation = await prisma_client_1.prisma.conversation.findUnique({
                where: { id: conversationId }
            });
            if (!conversation) {
                throw new Error(`Conversation with ID ${conversationId} not found`);
            }
            // Create the message
            const message = await prisma_client_1.prisma.message.create({
                data: {
                    conversationId,
                    senderId,
                    receiverId,
                    content,
                    role,
                    timestamp: new Date(),
                    ...(toolCalls && toolCalls.length > 0 ? {
                        toolCalls: {
                            create: toolCalls.map(tc => ({
                                toolId: tc.toolId,
                                parameters: tc.parameters,
                                status: 'pending'
                            }))
                        }
                    } : {})
                },
                include: {
                    toolCalls: true
                }
            });
            // Update conversation's updatedAt timestamp
            await prisma_client_1.prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });
            logger_1.logger.info(`Added message to conversation ${conversationId}`);
            return message;
        }
        catch (error) {
            logger_1.logger.error(`Error adding message to conversation: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get the message history for a conversation
     * @param conversationId The ID of the conversation
     * @returns Array of messages
     */
    async getHistory(conversationId) {
        try {
            const messages = await prisma_client_1.prisma.message.findMany({
                where: { conversationId },
                include: {
                    toolCalls: {
                        include: {
                            execution: true
                        }
                    }
                },
                orderBy: { timestamp: 'asc' }
            });
            logger_1.logger.info(`Retrieved ${messages.length} messages for conversation ${conversationId}`);
            return messages;
        }
        catch (error) {
            logger_1.logger.error(`Error retrieving conversation history: ${error.message}`);
            throw error;
        }
    }
    /**
     * Archive a conversation
     * @param conversationId The ID of the conversation to archive
     */
    async archiveConversation(conversationId) {
        try {
            await prisma_client_1.prisma.conversation.update({
                where: { id: conversationId },
                data: { isArchived: true }
            });
            logger_1.logger.info(`Archived conversation ${conversationId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error archiving conversation: ${error.message}`);
            throw error;
        }
    }
    /**
     * Delete a conversation and all its messages
     * @param conversationId The ID of the conversation to delete
     */
    async deleteConversation(conversationId) {
        try {
            await prisma_client_1.prisma.conversation.delete({
                where: { id: conversationId }
            });
            logger_1.logger.info(`Deleted conversation ${conversationId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting conversation: ${error.message}`);
            throw error;
        }
    }
    /**
     * List all conversations, optionally filtering by agent
     * @param agentId Optional agent ID to filter by
     * @param includeArchived Whether to include archived conversations
     * @returns Array of conversations
     */
    async listConversations(agentId, includeArchived = false) {
        try {
            const filter = {};
            if (!includeArchived) {
                filter.isArchived = false;
            }
            let conversations;
            if (agentId) {
                conversations = await prisma_client_1.prisma.conversation.findMany({
                    where: {
                        ...filter,
                        agents: {
                            some: {
                                agentId
                            }
                        }
                    },
                    include: {
                        agents: true,
                        _count: {
                            select: { messages: true }
                        }
                    },
                    orderBy: { updatedAt: 'desc' }
                });
            }
            else {
                conversations = await prisma_client_1.prisma.conversation.findMany({
                    where: filter,
                    include: {
                        agents: true,
                        _count: {
                            select: { messages: true }
                        }
                    },
                    orderBy: { updatedAt: 'desc' }
                });
            }
            logger_1.logger.info(`Retrieved ${conversations.length} conversations${agentId ? ` for agent ${agentId}` : ''}`);
            return conversations;
        }
        catch (error) {
            logger_1.logger.error(`Error listing conversations: ${error.message}`);
            throw error;
        }
    }
}
exports.ConversationManager = ConversationManager;
//# sourceMappingURL=conversation-manager.js.map