// core/chat_stream_manager.ts
import { MessageHandler } from '../communication/message_handler';

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

  unregisterHandler(id: string): boolean {
    return this.handlers.delete(id);
  }

  async streamChat(message: ChatMessage, options: StreamOptions): Promise<void> {
    // Stub implementation for streaming chat
    this.addMessage(message);

    // Emit to handlers
    for (const handler of this.handlers.values()) {
      await handler.handle(message);
    }
  }

  getHandler(id: string): MessageHandler | undefined {
    return this.handlers.get(id);
  }
}
