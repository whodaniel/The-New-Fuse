// core/chat_stream_manager.ts
import { MessageHandler } from './message_handler';

export enum Provider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  LOCAL = 'local',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: Provider;
}

export interface StreamOptions {
  provider: Provider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class ChatStreamManager {
  private messages: ChatMessage[] = [];
  private handlers: Map<string, MessageHandler> = new Map();

  constructor() {}

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  getMessageById(id: string): ChatMessage | undefined {
    return this.messages.find(msg => msg.id === id);
  }

  clearMessages(): void {
    this.messages = [];
  }

  registerHandler(id: string, handler: MessageHandler): void {
    this.handlers.set(id, handler);
  }

  unregisterHandler(id: string): void {
    this.handlers.delete(id);
  }

  async processStream(
    messages: ChatMessage[],
    options: StreamOptions,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const handler = this.handlers.get(options.provider);
    if (!handler) {
      throw new Error(`No handler registered for provider: ${options.provider}`);
    }

    let fullResponse = '';
    
    try {
      const stream = await handler.createStream(messages, options);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Error processing stream:', error);
      throw error;
    }
  }

  async sendMessage(
    content: string,
    options: StreamOptions,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date(),
      provider: options.provider,
    };

    this.addMessage(userMessage);

    const response = await this.processStream(
      this.getMessages(),
      options,
      onChunk,
    );

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      provider: options.provider,
    };

    this.addMessage(assistantMessage);

    return response;
  }
}