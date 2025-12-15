/**
 * The New Fuse VSCode Extension - Chat Service
 * Version 9.0.0 - Clean Architecture
 *
 * Manages chat history, message handling, and conversation state
 */

import { ConfigManager } from '../core/config';
import { ChatMessage, FileAttachment } from '../core/types';
import { generateId } from '../utils/helpers';
import { log } from '../utils/logger';
import { getAIService } from './AIService';

const CHAT_HISTORY_KEY = 'chatHistory';
const MAX_HISTORY_LENGTH = 100;

/**
 * Chat Service for managing conversations
 */
export class ChatService {
  private static instance: ChatService;
  private messages: ChatMessage[] = [];
  private attachments: FileAttachment[] = [];
  private onMessageCallbacks: Array<(message: ChatMessage) => void> = [];
  private onClearCallbacks: Array<() => void> = [];

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async initialize(): Promise<void> {
    log.info('Initializing Chat Service');

    // Load persisted chat history
    const config = ConfigManager.getInstance();
    const savedMessages = config.getState<ChatMessage[]>(CHAT_HISTORY_KEY, []);
    this.messages = savedMessages;

    log.info(`Loaded ${this.messages.length} messages from history`);
  }

  /**
   * Get all messages
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Add a message to the chat
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.trimHistory();
    this.persistHistory();
    this.notifyMessageAdded(message);
  }

  /**
   * Send a user message and get AI response
   */
  async sendMessage(content: string): Promise<ChatMessage> {
    // Create user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      metadata: this.attachments.length > 0 ? { attachments: [...this.attachments] } : undefined,
    };

    this.addMessage(userMessage);
    this.clearAttachments();

    // Build context with attachments
    let fullContent = content;
    if (userMessage.metadata?.attachments) {
      const attachmentContext = userMessage.metadata.attachments
        .filter((a) => a.content)
        .map((a) => `\n\n--- File: ${a.name} ---\n${a.content}`)
        .join('');
      fullContent = content + attachmentContext;
    }

    // Get AI response
    const aiService = getAIService();

    try {
      const startTime = Date.now();
      const response = await aiService.chat({
        messages: this.getContextMessages(),
        systemPrompt: this.getSystemPrompt(),
      });

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          model: response.model,
          tokens: response.usage?.totalTokens,
          processingTime: Date.now() - startTime,
        },
      };

      this.addMessage(assistantMessage);
      return assistantMessage;
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `❌ Error: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      };

      this.addMessage(errorMessage);
      throw error;
    }
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messages = [];
    this.persistHistory();
    this.notifyClear();
  }

  /**
   * Start a new chat
   */
  newChat(): ChatMessage {
    this.clearMessages();

    const welcomeMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content:
        "🚀 **Welcome to The New Fuse!**\n\nI'm your AI assistant. How can I help you today?\n\n**Quick Tips:**\n- Type `/` to see available commands\n- Use `@` to add context\n- Drop files to include them in the conversation",
      timestamp: new Date().toISOString(),
    };

    this.addMessage(welcomeMessage);
    return welcomeMessage;
  }

  /**
   * Add file attachments
   */
  addAttachments(files: FileAttachment[]): void {
    this.attachments.push(...files);
    log.debug(`Added ${files.length} attachments`);
  }

  /**
   * Get current attachments
   */
  getAttachments(): FileAttachment[] {
    return [...this.attachments];
  }

  /**
   * Clear attachments
   */
  clearAttachments(): void {
    this.attachments = [];
  }

  /**
   * Subscribe to new messages
   */
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.onMessageCallbacks.push(callback);
    return () => {
      const index = this.onMessageCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onMessageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to chat clear
   */
  onClear(callback: () => void): () => void {
    this.onClearCallbacks.push(callback);
    return () => {
      const index = this.onClearCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onClearCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get messages for AI context (last N messages)
   */
  private getContextMessages(): ChatMessage[] {
    // Get last 20 messages for context
    return this.messages.slice(-20);
  }

  /**
   * Get system prompt
   */
  private getSystemPrompt(): string {
    return `You are The New Fuse AI Assistant, a helpful and knowledgeable coding companion.

You help users with:
- Writing, reviewing, and debugging code
- Explaining programming concepts
- Suggesting improvements and best practices
- Answering technical questions

Guidelines:
- Be concise but thorough
- Use code examples when helpful
- Format responses with markdown
- Acknowledge when you're unsure about something`;
  }

  private trimHistory(): void {
    if (this.messages.length > MAX_HISTORY_LENGTH) {
      this.messages = this.messages.slice(-MAX_HISTORY_LENGTH);
    }
  }

  private async persistHistory(): Promise<void> {
    try {
      const config = ConfigManager.getInstance();
      await config.setState(CHAT_HISTORY_KEY, this.messages);
    } catch (error) {
      log.error('Failed to persist chat history', error);
    }
  }

  private notifyMessageAdded(message: ChatMessage): void {
    for (const callback of this.onMessageCallbacks) {
      try {
        callback(message);
      } catch (error) {
        log.error('Error in message callback', error);
      }
    }
  }

  private notifyClear(): void {
    for (const callback of this.onClearCallbacks) {
      try {
        callback();
      } catch (error) {
        log.error('Error in clear callback', error);
      }
    }
  }
}

// Export singleton getter
export function getChatService(): ChatService {
  return ChatService.getInstance();
}
