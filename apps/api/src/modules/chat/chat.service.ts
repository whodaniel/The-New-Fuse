import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from '../../agents/agents.service';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  type?: 'text' | 'code' | 'image' | 'file';
}

interface ConversationRule {
  id: string;
  sourceId: string;
  targetId: string;
}

interface SynthesisJob {
  id: string;
  summary: string;
  imagePrompts: string[];
  timestamp: Date;
  status: 'processing' | 'completed' | 'failed';
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private agentsService: AgentsService,
  ) {}

  async findAll(userId: string) {
    try {
      // Get all chat sessions for the user
      const chats = await this.prisma.chat?.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              agent: true
            }
          },
          agents: true
        }
      }) || [];
      
      return chats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const chat = await this.prisma.chat?.findFirst({
        where: { id, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              agent: true
            }
          },
          agents: true
        }
      });
      
      if (!chat) {
        return { id, messages: [], agents: [] };
      }
      
      return chat;
    } catch (error) {
      console.error('Error fetching chat:', error);
      return { id, messages: [], agents: [] };
    }
  }

  async create(userId: string, createChatDto: any) {
    try {
      const chat = await this.prisma.chat?.create({
        data: {
          ...createChatDto,
          userId,
        },
        include: {
          messages: true,
          agents: true
        }
      });
      
      return chat || { id: Date.now().toString(), ...createChatDto };
    } catch (error) {
      console.error('Error creating chat:', error);
      return { id: Date.now().toString(), ...createChatDto };
    }
  }

  async addMessage(chatId: string, userId: string, messageData: Partial<Message>) {
    try {
      const message = await this.prisma.message?.create({
        data: {
          ...messageData,
          chatId,
          userId,
          createdAt: new Date(),
        },
        include: {
          agent: true
        }
      });
      
      return message || { id: Date.now().toString(), ...messageData };
    } catch (error) {
      console.error('Error adding message:', error);
      return { id: Date.now().toString(), ...messageData };
    }
  }

  async createConversationRule(userId: string, ruleData: Omit<ConversationRule, 'id'>) {
    try {
      const rule = await this.prisma.conversationRule?.create({
        data: {
          ...ruleData,
          userId,
        }
      });
      
      return rule || { id: Date.now().toString(), ...ruleData };
    } catch (error) {
      console.error('Error creating conversation rule:', error);
      return { id: Date.now().toString(), ...ruleData };
    }
  }

  async getConversationRules(userId: string) {
    try {
      const rules = await this.prisma.conversationRule?.findMany({
        where: { userId }
      }) || [];
      
      return rules;
    } catch (error) {
      console.error('Error fetching conversation rules:', error);
      return [];
    }
  }

  async createSynthesisJob(userId: string, jobData: Omit<SynthesisJob, 'id'>) {
    try {
      const job = await this.prisma.synthesisJob?.create({
        data: {
          ...jobData,
          userId,
        }
      });
      
      return job || { id: Date.now().toString(), ...jobData };
    } catch (error) {
      console.error('Error creating synthesis job:', error);
      return { id: Date.now().toString(), ...jobData };
    }
  }

  async getSynthesisJobs(userId: string) {
    try {
      const jobs = await this.prisma.synthesisJob?.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' }
      }) || [];
      
      return jobs;
    } catch (error) {
      console.error('Error fetching synthesis jobs:', error);
      return [];
    }
  }

  async generateAgentResponse(prompt: string, agentId: string, userId: string) {
    try {
      // Get the agent details
      const agents = await this.agentsService.findAll(userId);
      const agent = agents.find(a => a.id === agentId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Mock AI response generation - replace with actual AI service integration
      const response = await this.mockAIResponse(prompt, (agent.config as any)?.systemPrompt || 'You are a helpful assistant.');
      
      return response;
    } catch (error) {
      console.error('Error generating agent response:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }

  private async mockAIResponse(prompt: string, systemPrompt: string): Promise<string> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Return a mock response based on the prompt
    const responses = [
      `Based on your message about "${prompt.substring(0, 30)}...", I can help you with that.`,
      `I understand you're asking about: ${prompt.substring(0, 50)}. Let me provide some insights.`,
      `That's an interesting question about "${prompt.substring(0, 40)}...". Here's my perspective:`,
      `Regarding your inquiry: "${prompt.substring(0, 45)}...", I'd like to share some thoughts.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async automateConversation(chatId: string, userId: string, conversationGoal?: string) {
    try {
      // Get chat with agents and rules
      const chat = await this.findOne(chatId, userId);
      const rules = await this.getConversationRules(userId);
      
      if (!chat.agents || chat.agents.length === 0) {
        throw new Error('No agents found in chat');
      }

      // Start automated conversation flow
      const firstAgent = chat.agents[0];
      const initialPrompt = conversationGoal 
        ? `As ${firstAgent.name}, start the conversation based on this goal: "${conversationGoal}"`
        : `As ${firstAgent.name}, start a new conversation.`;
      
      const response = await this.generateAgentResponse(initialPrompt, firstAgent.id, userId);
      
      await this.addMessage(chatId, userId, {
        content: response,
        sender: 'agent',
        agentId: firstAgent.id,
        agentName: firstAgent.name,
        type: 'text'
      });
      
      return { success: true, message: 'Automation started' };
    } catch (error) {
      console.error('Error automating conversation:', error);
      return { success: false, message: error.message };
    }
  }
}