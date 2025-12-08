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

  async generateAgentResponse(
    chatId: string,
    prompt: string,
    agentId: string
  ): Promise<string | null> {
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

  async createConversationRule(
    ruleData: Omit<ConversationRule, 'id'>
  ): Promise<ConversationRule | null> {
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
  async callTextApi(
    prompt: string,
    systemPrompt = 'You are a helpful assistant.'
  ): Promise<string> {
    try {
      const response = await apiRequest<{ text: string }>(`${this.baseUrl}/text-completion`, {
        method: 'POST',
        data: { prompt, systemPrompt },
      });
      return response.data?.text || 'No response received.';
    } catch (error) {
      console.error('Error calling text API:', error);
      throw error;
    }
  }

  async callImageApi(prompt: string): Promise<string> {
    try {
      const response = await apiRequest<{ imageUrl: string }>(`${this.baseUrl}/image-generation`, {
        method: 'POST',
        data: { prompt },
      });
      return response.data?.imageUrl || '';
    } catch (error) {
      console.error('Error calling image API:', error);
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();
