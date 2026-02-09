import { prisma } from './prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * ConversationManager handles database operations for conversations and messages
 */
export class ConversationManager {
  /**
   * Create a new conversation
   * @param id Optional custom ID for the conversation
   * @returns The created conversation ID
   */
  async createConversation(id?: string): Promise<{ conversationId: string }> {
    const conversationId = id || uuidv4();
    
    await prisma.conversation.create({
      data: {
        id: conversationId,
        title: `Conversation ${new Date().toLocaleString()}`,
        metadata: {}
      }
    });
    
    logger.info(`Created conversation with ID: ${conversationId}`);
    return { conversationId };
  }
  
  /**
   * Add a message to a conversation
   * @param conversationId The ID of the conversation
   * @param message The message to add
   * @returns The created message
   */
  async addMessage(
    conversationId: string, 
    senderId: string,
    content: string, 
    role: string,
    receiverId?: string,
    toolCalls?: any[]
  ): Promise<any> {
    try {
      // Check if conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
      
      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }
      
      // Create the message
      const message = await prisma.message.create({
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
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
      
      logger.info(`Added message to conversation ${conversationId}`);
      return message;
    } catch (error) {
      logger.error(`Error adding message to conversation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get the message history for a conversation
   * @param conversationId The ID of the conversation
   * @returns Array of messages
   */
  async getHistory(conversationId: string): Promise<any[]> {
    try {
      const messages = await prisma.message.findMany({
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
      
      logger.info(`Retrieved ${messages.length} messages for conversation ${conversationId}`);
      return messages;
    } catch (error) {
      logger.error(`Error retrieving conversation history: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Archive a conversation
   * @param conversationId The ID of the conversation to archive
   */
  async archiveConversation(conversationId: string): Promise<void> {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { isArchived: true }
      });
      
      logger.info(`Archived conversation ${conversationId}`);
    } catch (error) {
      logger.error(`Error archiving conversation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a conversation and all its messages
   * @param conversationId The ID of the conversation to delete
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await prisma.conversation.delete({
        where: { id: conversationId }
      });
      
      logger.info(`Deleted conversation ${conversationId}`);
    } catch (error) {
      logger.error(`Error deleting conversation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * List all conversations, optionally filtering by agent
   * @param agentId Optional agent ID to filter by
   * @param includeArchived Whether to include archived conversations
   * @returns Array of conversations
   */
  async listConversations(agentId?: string, includeArchived = false): Promise<any[]> {
    try {
      const filter: any = {};
      
      if (!includeArchived) {
        filter.isArchived = false;
      }
      
      let conversations;
      
      if (agentId) {
        conversations = await prisma.conversation.findMany({
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
      } else {
        conversations = await prisma.conversation.findMany({
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
      
      logger.info(`Retrieved ${conversations.length} conversations${agentId ? ` for agent ${agentId}` : ''}`);
      return conversations;
    } catch (error) {
      logger.error(`Error listing conversations: ${error.message}`);
      throw error;
    }
  }
}