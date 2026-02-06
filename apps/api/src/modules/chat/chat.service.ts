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
        where: (chats, { eq, and }) => and(eq(chats.id, id), eq(chats.userId, userId)),
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
        where: (agents, { eq, and }) => and(eq(agents.id, agentId), eq(agents.userId, userId)),
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
        isEdited: false,
      } as any);

      // Re-fetch with relations
      const fullMessage = await this.db.client.query.messages.findFirst({
        where: (m, { eq }) => eq(m.id, message.id),
        with: {
          agent: true,
          sender: true,
        },
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
          // Cursor pagination example: { id: cursor }, skip: 1
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
        where: (agents, { eq, and }) => and(eq(agents.id, agentId), eq(agents.userId, userId)),
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get the agent's LLM provider configuration
      const llmProvider = await this.db.llmConfigs.findById(agent.llmProviderId || agent.defaultLLMProviderId);

      if (!llmProvider || !llmProvider.enabled) {
        throw new Error('LLM provider not found or disabled');
      }

      const systemPrompt =
        ((agent.config as Record<string, unknown>)?.systemPrompt as string) ||
        agent.systemPrompt ||
        'You are a helpful assistant.';

      const response = await this.generateAIResponse(prompt, systemPrompt, llmProvider);

      return response;
    } catch (error) {
      this.logger.error('Error generating agent response:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }

  /**
   * Generate AI response using configured LLM provider
   */
  private async generateAIResponse(prompt: string, systemPrompt: string, llmProvider: any): Promise<string> {
    try {
      // Import the LLM provider service dynamically
      const { LLMProviderService } = await import('../llm/llm-provider.service');
      
      // Select appropriate LLM service based on provider type
      const providerConfig = {
        provider: llmProvider.provider,
        model: llmProvider.modelName,
        apiKey: llmProvider.apiKey,
        apiEndpoint: llmProvider.apiEndpoint,
      };

      // Make the API call
      const response = await this.callLLMAPI(prompt, systemPrompt, providerConfig);
      
      return response;
    } catch (error) {
      this.logger.error('Error calling LLM API:', error);
      throw error;
    }
  }

  /**
   * Call LLM API (OpenAI-compatible format for most providers)
   */
  private async callLLMAPI(prompt: string, systemPrompt: string, config: any): Promise<string> {
    const { default: axios } = await import('axios');
    
    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ];

    const response = await axios.post(
      `${config.apiEndpoint}/chat/completions`,
      {
        model: config.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
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
