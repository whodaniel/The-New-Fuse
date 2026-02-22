import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService, MessageRole } from '@the-new-fuse/database';
import { AgentsService } from '../../agents/agents.service';

/**
 * ChatService handles agent-based chat conversations.
 * Migrated to Drizzle ORM.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private db: DatabaseService,
    private agentsService: AgentsService
  ) {}

  /**
   * Find all chats for a user (via their agents)
   */
  async findAll(userId: string) {
    try {
      // Get chats directly using Drizzle Query API
      // Assuming 'chats' schema is available via client.query
      return await this.db.client.query.chats.findMany({
        where: (chats, { eq }) => eq(chats.userId, userId),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.timestamp)],
            with: {
              agent: true,
              sender: true,
            },
          },
          agent: true,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching chats:', error);
      return [];
    }
  }

  /**
   * Find a specific chat by ID
   */
  async findOne(id: string, userId: string) {
    try {
      const chat = await this.db.client.query.chats.findFirst({
        where: (chats, { eq, and }) => and(
          eq(chats.id, id),
          eq(chats.userId, userId)
        ),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.timestamp)],
            with: {
              agent: true,
              sender: true,
            },
          },
          agent: true,
        },
      });

      return chat || null;
    } catch (error) {
      this.logger.error('Error fetching chat:', error);
      return null;
    }
  }

  /**
   * Create a new chat with an agent
   */
  async create(userId: string, agentId: string, title?: string) {
    try {
      // Verify the agent belongs to the user
      const agent = await this.db.client.query.agents.findFirst({
        where: (agents, { eq, and }) => and(eq(agents.id, agentId), eq(agents.userId, userId))
      });

      if (!agent) {
        throw new Error('Agent not found or does not belong to user');
      }

      // Create using repository for convenience
      const chat = await this.db.chats.createChat({
        userId,
        agentId,
        title: title || `Chat with ${agent.name}`,
        // Default values usually handled by DB defaults, but providing explicitly if needed
      } as any); // Type cast if repository input type is strict about optional fields

      // Re-fetch to return with relations
      const fullChat = await this.findOne(chat.id, userId);
      if (!fullChat) throw new Error('Failed to retrieve created chat');
      
      return fullChat;
    } catch (error) {
      this.logger.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Add a message to a chat
   */
  async addMessage(
    chatId: string,
    content: string,
    role: MessageRole,
    options?: {
      senderId?: string;
      agentId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    try {
      // Create message
      const message = await this.db.chats.createMessage({
        chatId,
        content,
        role,
        senderId: options?.senderId,
        agentId: options?.agentId,
        metadata: options?.metadata as any,
        roomId: null, // Chat message, not room
        timestamp: new Date(),
        isDeleted: false,
        isEphemeral: false,
        isEdited: false
      } as any);

      // Re-fetch with relations
      const fullMessage = await this.db.client.query.messages.findFirst({
          where: (m, { eq }) => eq(m.id, message.id),
          with: {
              agent: true,
              sender: true
          }
      });

      return fullMessage;
    } catch (error) {
      this.logger.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat with pagination
   */
  async getMessages(chatId: string, options?: { limit?: number; cursor?: string }) {
    try {
      // Drizzle Query API with limit
      // Cursor pagination is trickier in generic Drizzle without explicit 'where' logic
      // But we can use limit.
      const messages = await this.db.client.query.messages.findMany({
        where: (msg, { eq, and, lt }) => {
            const conditions = [eq(msg.chatId, chatId)];
            // If cursor provided, assuming cursor is an ID ?? Or timestamp based?
            // Drizzle cursor: { id: cursor }, skip: 1
            // Drizzle doesn't support 'cursor' + 'skip' directly in findMany options (it has offset).
            // Emulating cursor requires knowing the sort column value of the cursor.
            // For now, ignoring cursor logic for simplicity or falling back to simple limit.
            // TODO: Implement proper cursor pagination if critical.
            return and(...conditions);
        },
        limit: options?.limit || 50,
        orderBy: (msg, { desc }) => [desc(msg.timestamp)],
        with: {
          agent: true,
          sender: true,
        },
      });

      return messages;
    } catch (error) {
      this.logger.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Generate an agent response for a prompt
   */
  async generateAgentResponse(prompt: string, agentId: string, userId: string) {
    try {
      // Get the agent details
      const agent = await this.db.client.query.agents.findFirst({
        where: (agents, { eq, and }) => and(eq(agents.id, agentId), eq(agents.userId, userId))
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // TODO: Replace with actual AI service integration
      const systemPrompt =
        ((agent.config as Record<string, unknown>)?.systemPrompt as string) ||
        agent.systemPrompt ||
        'You are a helpful assistant.';

      const response = await this.mockAIResponse(prompt, systemPrompt);

      return response;
    } catch (error) {
      this.logger.error('Error generating agent response:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }

  /**
   * Mock AI response - to be replaced with actual AI integration
   */
  private async mockAIResponse(prompt: string, _systemPrompt: string): Promise<string> {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    // Return a mock response based on the prompt
    const responses = [
      `Based on your message about "${prompt.substring(0, 30)}...", I can help you with that.`,
      `I understand you're asking about: ${prompt.substring(0, 50)}. Let me provide some insights.`,
      `That's an interesting question about "${prompt.substring(0, 40)}...". Here's my perspective:`,
      `Regarding your inquiry, I'd like to share some thoughts.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Delete a chat and its messages
   */
  async delete(chatId: string, userId: string) {
    try {
      // Verify ownership
      const chat = await this.findOne(chatId, userId);
      if (!chat) throw new Error('Chat not found or access denied');

      // Soft delete using repository
      await this.db.chats.softDeleteChat(chatId);

      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting chat:', error);
      throw error;
    }
  }

  // Future features implementation pending Schema updates
}
