"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
const db_client_1 = require("./db-client");
const uuid_1 = require("uuid");
const logger_1 = require("./logger");

/**
 * ConversationManager handles database operations for conversations and messages
 */
class ConversationManager {
  async createConversation(id) {
    const conversationId = id || (0, uuid_1.v4)();
    await db_client_1.db.conversation.create({
      data: {
        id: conversationId,
        title: `Conversation ${new Date().toLocaleString()}`,
        metadata: {},
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    logger_1.logger.info(`Created conversation with ID: ${conversationId}`);
    return { conversationId };
  }

  async addMessage(conversationId, senderId, content, role, receiverId, toolCalls) {
    try {
      const conversation = await db_client_1.db.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }
      const messageId = (0, uuid_1.v4)();
      const message = await db_client_1.db.message.create({
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
      const createdToolCalls = [];
      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          const toolCall = await db_client_1.db.toolCall.create({
            data: {
              id: (0, uuid_1.v4)(),
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
      await db_client_1.db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      await this.linkConversationAgent(conversationId, senderId);
      if (receiverId) {
        await this.linkConversationAgent(conversationId, receiverId);
      }
      logger_1.logger.info(`Added message to conversation ${conversationId}`);
      return { ...message, toolCalls: createdToolCalls };
    } catch (error) {
      logger_1.logger.error(`Error adding message to conversation: ${error.message}`);
      throw error;
    }
  }

  async getHistory(conversationId) {
    try {
      const messages = await db_client_1.db.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'asc' },
      });
      const toolCalls = await db_client_1.db.toolCall.findMany();
      const toolExecutions = await db_client_1.db.toolExecution.findMany();
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
      logger_1.logger.info(`Retrieved ${enriched.length} messages for conversation ${conversationId}`);
      return enriched;
    } catch (error) {
      logger_1.logger.error(`Error retrieving conversation history: ${error.message}`);
      throw error;
    }
  }

  async archiveConversation(conversationId) {
    try {
      await db_client_1.db.conversation.update({
        where: { id: conversationId },
        data: { isArchived: true, updatedAt: new Date() },
      });
      logger_1.logger.info(`Archived conversation ${conversationId}`);
    } catch (error) {
      logger_1.logger.error(`Error archiving conversation: ${error.message}`);
      throw error;
    }
  }

  async deleteConversation(conversationId) {
    try {
      const messages = await db_client_1.db.message.findMany({ where: { conversationId } });
      const messageIds = messages.map((message) => message.id);
      for (const messageId of messageIds) {
        await db_client_1.db.toolCall.deleteMany({ where: { messageId } });
      }
      await db_client_1.db.message.deleteMany({ where: { conversationId } });
      await db_client_1.db.conversationAgent.deleteMany({ where: { conversationId } });
      await db_client_1.db.conversation.delete({ where: { id: conversationId } });
      logger_1.logger.info(`Deleted conversation ${conversationId}`);
    } catch (error) {
      logger_1.logger.error(`Error deleting conversation: ${error.message}`);
      throw error;
    }
  }

  async listConversations(agentId, includeArchived = false) {
    try {
      const filter = {};
      if (!includeArchived) {
        filter.isArchived = false;
      }
      let conversations = await db_client_1.db.conversation.findMany({
        where: filter,
        orderBy: { updatedAt: 'desc' },
      });
      if (agentId) {
        const links = await db_client_1.db.conversationAgent.findMany({ where: { agentId } });
        const allowed = new Set(links.map((link) => link.conversationId));
        conversations = conversations.filter((conv) => allowed.has(conv.id));
      }
      const allAgents = await db_client_1.db.conversationAgent.findMany();
      const allMessages = await db_client_1.db.message.findMany();
      const enriched = conversations.map((conv) => {
        const agents = allAgents.filter((link) => link.conversationId === conv.id);
        const messageCount = allMessages.filter((msg) => msg.conversationId === conv.id).length;
        return {
          ...conv,
          agents,
          _count: { messages: messageCount },
        };
      });
      logger_1.logger.info(`Retrieved ${enriched.length} conversations${agentId ? ` for agent ${agentId}` : ''}`);
      return enriched;
    } catch (error) {
      logger_1.logger.error(`Error listing conversations: ${error.message}`);
      throw error;
    }
  }

  async linkConversationAgent(conversationId, agentId) {
    const existing = await db_client_1.db.conversationAgent.findUnique({ where: { conversationId, agentId } });
    if (existing) return;
    await db_client_1.db.conversationAgent.create({
      data: {
        id: (0, uuid_1.v4)(),
        conversationId,
        agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
exports.ConversationManager = ConversationManager;
