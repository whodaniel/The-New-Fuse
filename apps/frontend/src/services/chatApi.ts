import { apiRequest } from '../utils/api';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: string;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  type?: 'text' | 'code' | 'image' | 'file';
}

export interface ChatAgent {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  type: 'assistant' | 'specialist' | 'admin';
  systemPrompt: string;
  voice?: string;
  model: string;
  profilePictureUrl?: string;
}

export interface ConversationRule {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface SynthesisJob {
  id: string;
  summary: string;
  imagePrompts: string[];
  timestamp: Date;
  status: 'processing' | 'completed' | 'failed';
}

export interface Chat {
  id: string;
  messages: Message[];
  agents: ChatAgent[];
  createdAt: string;
  updatedAt: string;
}

class ChatApiService {
  private baseUrl = '/api/chat';

  async getChats(): Promise<Chat[]> {
    try {
      const response = await apiRequest(`${this.baseUrl}`, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }

  async getChat(chatId: string): Promise<Chat | null> {
    try {
      const response = await apiRequest(`${this.baseUrl}/${chatId}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat:', error);
      return null;
    }
  }

  async createChat(chatData: Partial<Chat>): Promise<Chat | null> {
    try {
      const response = await apiRequest(`${this.baseUrl}`, {
        method: 'POST',
        data: chatData,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }

  async addMessage(chatId: string, messageData: Partial<Message>): Promise<Message | null> {
    try {
      const response = await apiRequest(`${this.baseUrl}/${chatId}/messages`, {
        method: 'POST',
        data: messageData,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  async generateAgentResponse(chatId: string, prompt: string, agentId: string): Promise<string | null> {
    try {
      const response = await apiRequest(`${this.baseUrl}/${chatId}/generate-response`, {
        method: 'POST',
        data: { prompt, agentId },
      });
      return response.data?.response;
    } catch (error) {
      console.error('Error generating agent response:', error);
      return null;
    }
  }

  async automateConversation(chatId: string, conversationGoal?: string): Promise<boolean> {
    try {
      const response = await apiRequest(`${this.baseUrl}/${chatId}/automate`, {
        method: 'POST',
        data: { conversationGoal },
      });
      return response.data?.success || false;
    } catch (error) {
      console.error('Error automating conversation:', error);
      return false;
    }
  }

  async createConversationRule(ruleData: Omit<ConversationRule, 'id'>): Promise<ConversationRule | null> {
    try {
      const response = await apiRequest(`${this.baseUrl}/rules`, {
        method: 'POST',
        data: ruleData,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating conversation rule:', error);
      return null;
    }
  }

  async getConversationRules(): Promise<ConversationRule[]> {
    try {
      const response = await apiRequest(`${this.baseUrl}/rules/all`, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching conversation rules:', error);
      return [];
    }
  }

  async createSynthesisJob(jobData: Omit<SynthesisJob, 'id'>): Promise<SynthesisJob | null> {
    try {
      const response = await apiRequest(`${this.baseUrl}/synthesis`, {
        method: 'POST',
        data: jobData,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating synthesis job:', error);
      return null;
    }
  }

  async getSynthesisJobs(): Promise<SynthesisJob[]> {
    try {
      const response = await apiRequest(`${this.baseUrl}/synthesis/all`, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching synthesis jobs:', error);
      return [];
    }
  }

  // Mock AI API calls for development
  async callTextApi(prompt: string, systemPrompt = "You are a helpful assistant."): Promise<string> {
    try {
      // Replace with actual AI service integration
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const responses = [
        `Based on your prompt: "${prompt.substring(0, 50)}...", here's my response.`,
        `I understand you're asking about: ${prompt.substring(0, 40)}. Let me help with that.`,
        `That's an interesting question. Regarding "${prompt.substring(0, 45)}...", I think...`,
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      console.error('Error calling text API:', error);
      throw error;
    }
  }

  async callImageApi(prompt: string): Promise<string> {
    try {
      // Mock image generation - replace with actual service
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Return a placeholder image data
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA2VjE4TTYgMTJIMTgiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
    } catch (error) {
      console.error('Error calling image API:', error);
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();