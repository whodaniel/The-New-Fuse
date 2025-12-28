import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AgentsService } from '../../agents/agents.service';
import { MessageRole } from '@the-new-fuse/database/generated/prisma';

/**
 * ChatService handles agent-based chat conversations.
 * 
 * Note: This service works with the Chat model (agent conversations).
 * For multi-user chat rooms, see ChatRoom model and related services.
 * 
 * Schema notes:
 * - Chat: Single agent per chat, optional userId
 * - Message: Uses senderId for user, agentId for agent, chatId to connect to Chat
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private agentsService: AgentsService,
  ) {}

  /**
   * Find all chats for a user (via their agents)
   */
  async findAll(userId: string) {
    try {
      // Get chats through the user's agents
      const chats = await this.prisma.chat.findMany({
        where: {
          agent: {
            userId: userId,
          },
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
            include: {
              agent: true,
              sender: true,
            },
          },
          agent: true,
        },
      });
      
      return chats;
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
      const chat = await this.prisma.chat.findFirst({
        where: { 
          id,
          agent: {
            userId: userId,
          },
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
            include: {
              agent: true,
              sender: true,
            },
          },
          agent: true,
        },
      });
      
      if (!chat) {
        return null;
      }
      
      return chat;
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
      const agent = await this.prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!agent) {
        throw new Error('Agent not found or does not belong to user');
      }

      const chat = await this.prisma.chat.create({
        data: {
          title: title || `Chat with ${agent.name}`,
          agentId: agentId,
          userId: userId,
        },
        include: {
          messages: true,
          agent: true,
        },
      });
      
      return chat;
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
      const message = await this.prisma.message.create({
        data: {
          content,
          role,
          chatId,
          senderId: options?.senderId,
          agentId: options?.agentId,
          metadata: options?.metadata as any,
        },
        include: {
          agent: true,
          sender: true,
        },
      });
      
      return message;
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
      const messages = await this.prisma.message.findMany({
        where: { chatId },
        take: options?.limit || 50,
        ...(options?.cursor && {
          cursor: { id: options.cursor },
          skip: 1,
        }),
        orderBy: { timestamp: 'desc' },
        include: {
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
      const agent = await this.prisma.agent.findFirst({
        where: { id: agentId, userId },
      });
      
      if (!agent) {
        throw new Error('Agent not found');
      }

      // TODO: Replace with actual AI service integration
      const systemPrompt = (agent.config as Record<string, unknown>)?.systemPrompt as string 
        || agent.systemPrompt 
        || 'You are a helpful assistant.';
      
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
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
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
      // Verify ownership through agent
      const chat = await this.prisma.chat.findFirst({
        where: {
          id: chatId,
          agent: { userId },
        },
      });

      if (!chat) {
        throw new Error('Chat not found or access denied');
      }

      // Soft delete by setting deletedAt
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting chat:', error);
      throw error;
    }
  }

  // ============================================================================
  // TODO: Future Features - Requires Schema Updates
  // ============================================================================
  // 
  // The following features are planned but require Prisma schema updates:
  // 
  // 1. ConversationRule - For defining routing/automation rules between agents
  //    Suggested schema:
  //    model ConversationRule {
  //      id        String   @id @default(uuid())
  //      userId    String
  //      sourceId  String   // Source agent or trigger
  //      targetId  String   // Target agent
  //      condition Json?    // Conditions for rule activation
  //      ...
  //    }
  //
  // 2. SynthesisJob - For AI-powered conversation summarization
  //    Suggested schema:
  //    model SynthesisJob {
  //      id           String   @id @default(uuid())
  //      userId       String
  //      chatId       String?
  //      summary      String
  //      imagePrompts String[]
  //      status       String   // 'processing' | 'completed' | 'failed'
  //      ...
  //    }
  //
  // These should be added to packages/database/prisma/schema.prisma when needed.
  // ============================================================================
}