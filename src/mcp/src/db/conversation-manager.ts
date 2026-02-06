import { db } from './db-client.js';
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

    await db.conversation.create({
      data: {
        id: conversationId,
        title: `Conversation ${new Date().toLocaleString()}`,
        metadata: {},
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info(`Created conversation with ID: ${conversationId}`);
    return { conversationId };
  }

  /**
   * Add a message to a conversation
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
      const conversation = await db.conversation.findUnique({ where: { id: conversationId } });

      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }

      const messageId = uuidv4();
      const message = await db.message.create({
        data: {
          id: messageId,
          conversationId,
          senderId,
          receiverId,
          content,
          role,
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const createdToolCalls: any[] = [];
      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          const toolCall = await db.toolCall.create({
            data: {
              id: uuidv4(),
              messageId,
              toolId: call.toolId,
              parameters: call.parameters,
              status: 'pending',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          createdToolCalls.push(toolCall);
        }
      }

      await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      await this.linkConversationAgent(conversationId, senderId);
      if (receiverId) {
        await this.linkConversationAgent(conversationId, receiverId);
      }

      logger.info(`Added message to conversation ${conversationId}`);
      return { ...message, toolCalls: createdToolCalls };
    } catch (error: any) {
      logger.error(`Error adding message to conversation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the message history for a conversation
   */
  async getHistory(conversationId: string): Promise<any[]> {
    try {
      const messages = await db.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'asc' },
      });

      const toolCalls = await db.toolCall.findMany();
      const toolExecutions = await db.toolExecution.findMany();
      const executionsByToolCall = new Map(toolExecutions.map((exec) => [exec.toolCallId, exec]));

      const enriched = messages.map((message) => {
        const messageToolCalls = toolCalls
          .filter((call) => call.messageId === message.id)
          .map((call) => ({
            ...call,
            execution: executionsByToolCall.get(call.id) ?? null,
          }));
        return { ...message, toolCalls: messageToolCalls };
      });

      logger.info(`Retrieved ${enriched.length} messages for conversation ${conversationId}`);
      return enriched;
    } catch (error: any) {
      logger.error(`Error retrieving conversation history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    try {
      await db.conversation.update({
        where: { id: conversationId },
        data: { isArchived: true, updatedAt: new Date() },
      });

      logger.info(`Archived conversation ${conversationId}`);
    } catch (error: any) {
      logger.error(`Error archiving conversation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const messages = await db.message.findMany({ where: { conversationId } });
      const messageIds = messages.map((message) => message.id);

      for (const messageId of messageIds) {
        await db.toolCall.deleteMany({ where: { messageId } });
      }

      await db.message.deleteMany({ where: { conversationId } });
      await db.conversationAgent.deleteMany({ where: { conversationId } });
      await db.conversation.delete({ where: { id: conversationId } });

      logger.info(`Deleted conversation ${conversationId}`);
    } catch (error: any) {
      logger.error(`Error deleting conversation: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all conversations, optionally filtering by agent
   */
  async listConversations(agentId?: string, includeArchived = false): Promise<any[]> {
    try {
      const filter: any = {};

      if (!includeArchived) {
        filter.isArchived = false;
      }

      let conversations = await db.conversation.findMany({
        where: filter,
        orderBy: { updatedAt: 'desc' },
      });

      if (agentId) {
        const links = await db.conversationAgent.findMany({ where: { agentId } });
        const allowed = new Set(links.map((link) => link.conversationId));
        conversations = conversations.filter((conv) => allowed.has(conv.id));
      }

      const allAgents = await db.conversationAgent.findMany();
      const allMessages = await db.message.findMany();

      const enriched = conversations.map((conv) => {
        const agents = allAgents.filter((link) => link.conversationId === conv.id);
        const messageCount = allMessages.filter((msg) => msg.conversationId === conv.id).length;
        return {
          ...conv,
          agents,
          _count: { messages: messageCount },
        };
      });

      logger.info(
        `Retrieved ${enriched.length} conversations${agentId ? ` for agent ${agentId}` : ''}`
      );
      return enriched;
    } catch (error: any) {
      logger.error(`Error listing conversations: ${error.message}`);
      throw error;
    }
  }

  private async linkConversationAgent(conversationId: string, agentId: string): Promise<void> {
    const existing = await db.conversationAgent.findUnique({ where: { conversationId, agentId } });
    if (existing) return;
    await db.conversationAgent.create({
      data: {
        id: uuidv4(),
        conversationId,
        agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
