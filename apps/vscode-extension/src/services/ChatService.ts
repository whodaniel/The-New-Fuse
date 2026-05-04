/**
 * The New Fuse VSCode Extension - Chat Service
 * Version 9.2.0 - Frontier Capabilities
 *
 * Manages chat history, message handling, and conversation state
 * Now with tool orchestration and streaming support
 */

import { ConfigManager } from '../core/config';
import { ChatMessage, FileAttachment } from '../core/types';
import { generateId } from '../utils/helpers';
import { log } from '../utils/logger';
import { getToolOrchestrationService } from './ToolOrchestrationService';

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
  private onStreamingChunkCallbacks: Array<(messageId: string, chunk: string) => void> = [];

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
   * Now with tool orchestration and streaming support
   */
  async sendMessage(content: string, enableStreaming: boolean = false): Promise<ChatMessage> {
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

    // Create assistant message placeholder for streaming
    const assistantMessageId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      metadata: {},
    };

    if (enableStreaming) {
      // Add empty assistant message for streaming updates
      this.addMessage(assistantMessage);
    }

    // Get tool orchestration service
    const orchestrationService = getToolOrchestrationService();

    try {
      const startTime = Date.now();

      // Execute conversation with tool support
      const result = await orchestrationService.executeConversationWithTools(
        this.getContextMessages(),
        this.getSystemPrompt(),
        enableStreaming
          ? (chunk: string) => {
              // Update assistant message content incrementally
              assistantMessage.content += chunk;
              this.notifyStreamingChunk(assistantMessageId, chunk);
            }
          : undefined
      );

      // Update or create assistant message with final result
      const finalMessage: ChatMessage = {
        ...assistantMessage,
        content: result.finalMessage.content,
        metadata: {
          model: result.finalMessage.metadata?.model,
          tokens: result.finalMessage.metadata?.tokens,
          processingTime: Date.now() - startTime,
          toolCallsCount: result.toolCalls.length,
          iterations: result.iterations,
        },
      };

      if (enableStreaming) {
        // Update existing message
        const messageIndex = this.messages.findIndex((m) => m.id === assistantMessageId);
        if (messageIndex >= 0) {
          this.messages[messageIndex] = finalMessage;
          this.persistHistory();
          this.notifyMessageAdded(finalMessage);
        }
      } else {
        // Add new message
        this.addMessage(finalMessage);
      }

      return finalMessage;
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: `❌ Error: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      };

      if (enableStreaming) {
        // Update existing message
        const messageIndex = this.messages.findIndex((m) => m.id === assistantMessageId);
        if (messageIndex >= 0) {
          this.messages[messageIndex] = errorMessage;
          this.persistHistory();
          this.notifyMessageAdded(errorMessage);
        }
      } else {
        this.addMessage(errorMessage);
      }

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
   * Subscribe to streaming chunks
   */
  onStreamingChunk(callback: (messageId: string, chunk: string) => void): () => void {
    this.onStreamingChunkCallbacks.push(callback);
    return () => {
      const index = this.onStreamingChunkCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onStreamingChunkCallbacks.splice(index, 1);
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
   * Get system prompt with tool awareness
   */
  private getSystemPrompt(): string {
    return `You are The New Fuse AI Assistant, a frontier-level coding companion with powerful workspace capabilities.

CAPABILITIES:
- Full workspace access (search files, read code, explore structure)
- Tool execution via Model Context Protocol (MCP)
- Multi-provider LLM routing
- Real-time code analysis

AVAILABLE ACTIONS:
- Search workspace files using glob patterns
- Find text/code across all files (grep functionality)
- Read any file in the workspace
- Explore workspace structure and symbols
- Execute MCP tools for extended functionality

GUIDELINES:
- Use tools proactively to explore the codebase before answering
- Always read relevant files before suggesting changes
- Search the workspace to find related code
- Provide specific, actionable suggestions with file:line references
- Be concise but thorough
- Use code examples when helpful
- Format responses with markdown

When asked about code, FIRST use your tools to:
1. Search for relevant files
2. Read the actual implementation
3. Analyze the context
4. Then provide informed answers`;
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

  private notifyStreamingChunk(messageId: string, chunk: string): void {
    for (const callback of this.onStreamingChunkCallbacks) {
      try {
        callback(messageId, chunk);
      } catch (error) {
        log.error('Error in streaming chunk callback', error);
      }
    }
  }
}

// Export singleton getter
export function getChatService(): ChatService {
  return ChatService.getInstance();
}
