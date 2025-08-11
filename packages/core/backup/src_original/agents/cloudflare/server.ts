import { Injectable, Logger } from '@nestjs/common';
import { CloudflareAgent } from './cloudflare-agent';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ServerState {
  messages: Message[];
  isProcessing: boolean;
  lastActivity: Date;
}

@Injectable()
export class CloudflareServer {
  private readonly logger = new Logger(CloudflareServer.name);
  private state: ServerState = {
    messages: [],
    isProcessing: false,
    lastActivity: new Date()
  };

  constructor(private readonly cloudflareAgent: CloudflareAgent) {}

  async processMessage(message: Message): Promise<Message> {
    try {
      this.logger.log('Processing message', { role: message.role });
      
      this.state.messages.push(message);
      this.state.isProcessing = true;
      this.state.lastActivity = new Date();

      // Process the message with the Cloudflare agent
      const response = await this.generateResponse(message);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      this.state.messages.push(assistantMessage);
      this.state.isProcessing = false;
      
      return assistantMessage;
    } catch (error) {
      this.logger.error('Error processing message', { error });
      this.state.isProcessing = false;
      throw new Error('Failed to process message');
    }
  }

  private async generateResponse(message: Message): Promise<string> {
    // Generate response based on message content
    // This would integrate with AI services or predefined responses
    return `Processed: ${message.content}`;
  }

  async getState(): Promise<ServerState> {
    return { ...this.state };
  }

  async clearMessages(): Promise<void> {
    this.state.messages = [];
    this.state.lastActivity = new Date();
    this.logger.log('Messages cleared');
  }

  async getRecentMessages(limit: number = 10): Promise<Message[]> {
    return this.state.messages.slice(-limit);
  }
}