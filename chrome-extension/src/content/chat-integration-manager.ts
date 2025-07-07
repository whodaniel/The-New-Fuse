/**
 * Advanced Chat Integration Manager
 * Handles integration with various chat platforms and AI services
 */

import { Logger } from '../utils/logger';
import { AIElementDetector } from './ai-element-detector';
import { ElementInfo } from './element-selector';

export interface ChatPlatform {
  name: string;
  domain: string;
  patterns: {
    inputSelectors: string[];
    buttonSelectors: string[];
    outputSelectors: string[];
    messageSelectors: string[];
  };
  features: {
    supportsMarkdown: boolean;
    supportsCodeBlocks: boolean;
    supportsFiles: boolean;
    supportsStreaming: boolean;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
  sender: 'user' | 'assistant' | 'system';
  platform: string;
  metadata?: {
    edited?: boolean;
    reactions?: string[];
    thread?: string;
  };
}

export interface ChatSession {
  id: string;
  platform: string;
  title: string;
  messages: ChatMessage[];
  startTime: number;
  lastActivity: number;
  participants: string[];
}

export class ChatIntegrationManager {
  private logger: Logger;
  private aiDetector: AIElementDetector;
  private platforms: Map<string, ChatPlatform>;
  private currentSession: ChatSession | null = null;
  private messageObserver: MutationObserver | null = null;
  private extractedMessages: ChatMessage[] = [];

  constructor() {
    this.logger = new Logger({
      name: 'ChatIntegrationManager',
      level: 'info',
      saveToStorage: true
    });

    this.aiDetector = new AIElementDetector();
    this.platforms = new Map();
    this.initializePlatforms();
  }

  private initializePlatforms(): void {
    const platforms: ChatPlatform[] = [
      {
        name: 'ChatGPT',
        domain: 'chat.openai.com',
        patterns: {
          inputSelectors: [
            'textarea[data-id]',
            '#prompt-textarea',
            '.ProseMirror',
            '[contenteditable="true"]'
          ],
          buttonSelectors: [
            '[data-testid="send-button"]',
            'button[aria-label*="Send"]',
            '.send-button'
          ],
          outputSelectors: [
            '[data-message-author-role="assistant"]',
            '.markdown',
            '.message-content'
          ],
          messageSelectors: [
            '[data-message-id]',
            '.conversation-turn',
            '.message'
          ]
        },
        features: {
          supportsMarkdown: true,
          supportsCodeBlocks: true,
          supportsFiles: true,
          supportsStreaming: true
        }
      },
      {
        name: 'Claude',
        domain: 'claude.ai',
        patterns: {
          inputSelectors: [
            '.ProseMirror',
            '[contenteditable="true"]',
            'textarea'
          ],
          buttonSelectors: [
            '[aria-label*="Send"]',
            'button[type="submit"]',
            '.send-button'
          ],
          outputSelectors: [
            '[data-is-streaming]',
            '.font-claude-message',
            '.message-content'
          ],
          messageSelectors: [
            '.font-claude-message',
            '.message',
            '[data-message]'
          ]
        },
        features: {
          supportsMarkdown: true,
          supportsCodeBlocks: true,
          supportsFiles: true,
          supportsStreaming: true
        }
      },
      {
        name: 'Gemini',
        domain: 'gemini.google.com',
        patterns: {
          inputSelectors: [
            '.ql-editor',
            '[contenteditable="true"]',
            'textarea'
          ],
          buttonSelectors: [
            '[aria-label*="Send"]',
            '.send-button',
            'button[type="submit"]'
          ],
          outputSelectors: [
            '.model-response',
            '.response-container',
            '.message-content'
          ],
          messageSelectors: [
            '.conversation-turn',
            '.message',
            '.chat-message'
          ]
        },
        features: {
          supportsMarkdown: true,
          supportsCodeBlocks: true,
          supportsFiles: false,
          supportsStreaming: true
        }
      },
      {
        name: 'Discord',
        domain: 'discord.com',
        patterns: {
          inputSelectors: [
            '[data-slate-editor="true"]',
            '.slateTextArea',
            'div[role="textbox"]'
          ],
          buttonSelectors: [
            '[aria-label*="Send"]',
            '.sendButton',
            'button[type="submit"]'
          ],
          outputSelectors: [
            '.messageContent',
            '.markup',
            '.message-content'
          ],
          messageSelectors: [
            '.message',
            '[id^="chat-messages"]',
            '.messageListItem'
          ]
        },
        features: {
          supportsMarkdown: true,
          supportsCodeBlocks: true,
          supportsFiles: true,
          supportsStreaming: false
        }
      },
      {
        name: 'Slack',
        domain: 'slack.com',
        patterns: {
          inputSelectors: [
            '.ql-editor',
            '[data-qa="message_input"]',
            '[contenteditable="true"]'
          ],
          buttonSelectors: [
            '[data-qa="texty_send_button"]',
            '.c-button--primary',
            '[aria-label*="Send"]'
          ],
          outputSelectors: [
            '.c-message__body',
            '.p-rich_text_section',
            '.message-content'
          ],
          messageSelectors: [
            '.c-message',
            '[data-qa="message"]',
            '.c-message_kit__message'
          ]
        },
        features: {
          supportsMarkdown: false,
          supportsCodeBlocks: true,
          supportsFiles: true,
          supportsStreaming: false
        }
      }
    ];

    platforms.forEach(platform => {
      this.platforms.set(platform.domain, platform);
    });
  }

  /**
   * Initialize chat integration for the current page
   */
  public async initializeForCurrentPage(): Promise<boolean> {
    const domain = window.location.hostname;
    const platform = this.detectPlatform(domain);
    
    if (!platform) {
      this.logger.info(`No specific platform detected for ${domain}, using AI detection`);
      return this.initializeGenericChat();
    }

    this.logger.info(`Initializing integration for ${platform.name}`);
    return this.initializePlatformSpecific(platform);
  }

  private detectPlatform(domain: string): ChatPlatform | null {
    // Direct match
    if (this.platforms.has(domain)) {
      return this.platforms.get(domain)!;
    }

    // Subdomain match
    for (const [platformDomain, platform] of this.platforms) {
      if (domain.includes(platformDomain)) {
        return platform;
      }
    }

    return null;
  }

  private async initializeGenericChat(): Promise<boolean> {
    try {
      const elements = await this.aiDetector.detectChatElements();
      
      if (elements.input.length === 0) {
        this.logger.warn('No chat input elements detected');
        return false;
      }

      // Create a generic session
      this.currentSession = {
        id: this.generateSessionId(),
        platform: 'generic',
        title: document.title || 'Unknown Chat',
        messages: [],
        startTime: Date.now(),
        lastActivity: Date.now(),
        participants: ['user', 'assistant']
      };

      // Start monitoring for messages
      this.startMessageMonitoring();
      
      this.logger.info('Generic chat integration initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize generic chat:', error);
      return false;
    }
  }

  private async initializePlatformSpecific(platform: ChatPlatform): Promise<boolean> {
    try {
      // Create platform-specific session
      this.currentSession = {
        id: this.generateSessionId(),
        platform: platform.name,
        title: document.title || platform.name,
        messages: [],
        startTime: Date.now(),
        lastActivity: Date.now(),
        participants: ['user', 'assistant']
      };

      // Extract existing messages
      await this.extractExistingMessages(platform);
      
      // Start monitoring for new messages
      this.startMessageMonitoring(platform);
      
      this.logger.info(`${platform.name} integration initialized with ${this.extractedMessages.length} existing messages`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize ${platform.name} integration:`, error);
      return false;
    }
  }

  private async extractExistingMessages(platform: ChatPlatform): Promise<void> {
    const messageElements = this.findElementsBySelectors(platform.patterns.messageSelectors);
    
    for (const element of messageElements) {
      const message = this.extractMessageFromElement(element, platform);
      if (message) {
        this.extractedMessages.push(message);
        if (this.currentSession) {
          this.currentSession.messages.push(message);
        }
      }
    }

    // Sort messages by timestamp
    this.extractedMessages.sort((a, b) => a.timestamp - b.timestamp);
  }

  private extractMessageFromElement(element: HTMLElement, platform: ChatPlatform): ChatMessage | null {
    try {
      const content = this.extractMessageContent(element, platform);
      if (!content) return null;

      const sender = this.determineSender(element, platform);
      const timestamp = this.extractTimestamp(element) || Date.now();

      return {
        id: this.generateMessageId(),
        content,
        timestamp,
        sender,
        platform: platform.name,
        metadata: {
          edited: this.isMessageEdited(element),
          reactions: this.extractReactions(element),
          thread: this.extractThreadInfo(element)
        }
      };
    } catch (error) {
      this.logger.warn('Failed to extract message from element:', error);
      return null;
    }
  }

  private extractMessageContent(element: HTMLElement, platform: ChatPlatform): string {
    // Try different content extraction strategies
    const strategies = [
      () => element.querySelector('.markdown')?.textContent,
      () => element.querySelector('.message-content')?.textContent,
      () => element.querySelector('.markup')?.textContent,
      () => element.textContent
    ];

    for (const strategy of strategies) {
      const content = strategy();
      if (content && content.trim()) {
        return content.trim();
      }
    }

    return '';
  }

  private determineSender(element: HTMLElement, platform: ChatPlatform): 'user' | 'assistant' | 'system' {
    // Platform-specific sender detection
    const classList = element.className.toLowerCase();
    const attributes = Array.from(element.attributes).map(attr => 
      `${attr.name}="${attr.value}"`
    ).join(' ').toLowerCase();

    // Check for assistant/bot indicators
    if (classList.includes('assistant') || 
        classList.includes('bot') || 
        classList.includes('ai') ||
        attributes.includes('role="assistant"') ||
        attributes.includes('author-role="assistant"')) {
      return 'assistant';
    }

    // Check for user indicators
    if (classList.includes('user') || 
        classList.includes('human') ||
        attributes.includes('role="user"') ||
        attributes.includes('author-role="user"')) {
      return 'user';
    }

    // Check for system messages
    if (classList.includes('system') || 
        classList.includes('notice') ||
        attributes.includes('role="system"')) {
      return 'system';
    }

    // Default heuristic: odd/even positioning
    const messageElements = document.querySelectorAll(platform.patterns.messageSelectors.join(', '));
    const index = Array.from(messageElements).indexOf(element);
    return index % 2 === 0 ? 'user' : 'assistant';
  }

  private extractTimestamp(element: HTMLElement): number | null {
    // Try to find timestamp elements
    const timeSelectors = [
      'time',
      '.timestamp',
      '.time',
      '[datetime]',
      '.message-time'
    ];

    for (const selector of timeSelectors) {
      const timeElement = element.querySelector(selector);
      if (timeElement) {
        const datetime = timeElement.getAttribute('datetime') || 
                        timeElement.getAttribute('data-timestamp') ||
                        timeElement.textContent;
        
        if (datetime) {
          const parsed = new Date(datetime).getTime();
          if (!isNaN(parsed)) return parsed;
        }
      }
    }

    return null;
  }

  private isMessageEdited(element: HTMLElement): boolean {
    return element.querySelector('.edited') !== null ||
           element.textContent?.includes('(edited)') === true;
  }

  private extractReactions(element: HTMLElement): string[] {
    const reactions: string[] = [];
    const reactionElements = element.querySelectorAll('.reaction, .emoji-reaction');
    
    reactionElements.forEach(reaction => {
      const emoji = reaction.textContent?.trim();
      if (emoji) reactions.push(emoji);
    });

    return reactions;
  }

  private extractThreadInfo(element: HTMLElement): string | undefined {
    const threadElement = element.querySelector('[data-thread-id]');
    return threadElement?.getAttribute('data-thread-id') || undefined;
  }

  private startMessageMonitoring(platform?: ChatPlatform): void {
    // Clean up existing observer
    if (this.messageObserver) {
      this.messageObserver.disconnect();
    }

    const targetSelectors = platform ? 
      platform.patterns.messageSelectors : 
      ['.messages', '.chat', '.conversation', '[role="log"]'];

    const target = this.findElementsBySelectors(targetSelectors)[0] || document.body;

    this.messageObserver = new MutationObserver((mutations) => {
      this.handleMutations(mutations, platform);
    });

    this.messageObserver.observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  private handleMutations(mutations: MutationRecord[], platform?: ChatPlatform): void {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            this.processNewNode(node, platform);
          }
        });
      }
    }
  }

  private processNewNode(node: HTMLElement, platform?: ChatPlatform): void {
    const messageSelectors = platform ? 
      platform.patterns.messageSelectors : 
      ['.message', '.chat-message', '[data-message]'];

    // Check if the node itself is a message
    if (this.matchesSelectors(node, messageSelectors)) {
      this.processNewMessage(node, platform);
    }

    // Check for message elements within the node
    const messageElements = this.findElementsBySelectors(messageSelectors, node);
    messageElements.forEach(element => {
      this.processNewMessage(element, platform);
    });
  }

  private processNewMessage(element: HTMLElement, platform?: ChatPlatform): void {
    if (!this.currentSession) return;

    const message = platform ? 
      this.extractMessageFromElement(element, platform) :
      this.extractGenericMessage(element);

    if (message && !this.isDuplicateMessage(message)) {
      this.extractedMessages.push(message);
      this.currentSession.messages.push(message);
      this.currentSession.lastActivity = Date.now();

      // Emit message event
      this.emitMessageEvent(message);
    }
  }

  private extractGenericMessage(element: HTMLElement): ChatMessage | null {
    const content = element.textContent?.trim();
    if (!content) return null;

    return {
      id: this.generateMessageId(),
      content,
      timestamp: Date.now(),
      sender: 'assistant', // Default assumption
      platform: 'generic'
    };
  }

  private isDuplicateMessage(message: ChatMessage): boolean {
    return this.extractedMessages.some(existing => 
      existing.content === message.content &&
      Math.abs(existing.timestamp - message.timestamp) < 1000
    );
  }

  private emitMessageEvent(message: ChatMessage): void {
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'NEW_CHAT_MESSAGE',
      payload: {
        message,
        session: this.currentSession
      }
    });
  }

  private findElementsBySelectors(selectors: string[], root: HTMLElement | Document = document): HTMLElement[] {
    const elements: HTMLElement[] = [];
    
    selectors.forEach(selector => {
      try {
        const matches = root.querySelectorAll(selector);
        matches.forEach(el => {
          if (el instanceof HTMLElement) {
            elements.push(el);
          }
        });
      } catch (error) {
        this.logger.warn(`Invalid selector: ${selector}`, error);
      }
    });

    return elements;
  }

  private matchesSelectors(element: HTMLElement, selectors: string[]): boolean {
    return selectors.some(selector => {
      try {
        return element.matches(selector);
      } catch (error) {
        return false;
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send a message to the chat
   */
  public async sendMessage(content: string): Promise<boolean> {
    try {
      const inputElement = await this.findChatInput();
      if (!inputElement) {
        throw new Error('Chat input not found');
      }

      const sendButton = await this.findSendButton();
      if (!sendButton) {
        throw new Error('Send button not found');
      }

      // Set the input content
      await this.setInputContent(inputElement, content);
      
      // Click send button
      await this.clickSendButton(sendButton);
      
      this.logger.info('Message sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      return false;
    }
  }

  private async findChatInput(): Promise<HTMLElement | null> {
    const bestInput = await this.aiDetector.getBestChatInput();
    if (bestInput) {
      return document.querySelector(bestInput.selector) as HTMLElement;
    }
    return null;
  }

  private async findSendButton(): Promise<HTMLElement | null> {
    const bestButton = await this.aiDetector.getBestSendButton();
    if (bestButton) {
      return document.querySelector(bestButton.selector) as HTMLElement;
    }
    return null;
  }

  private async setInputContent(inputElement: HTMLElement, content: string): Promise<void> {
    if (inputElement.tagName.toLowerCase() === 'textarea' || 
        inputElement.tagName.toLowerCase() === 'input') {
      (inputElement as HTMLInputElement).value = content;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (inputElement.contentEditable === 'true') {
      inputElement.textContent = content;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private async clickSendButton(sendButton: HTMLElement): Promise<void> {
    sendButton.click();
  }

  /**
   * Get current chat session
   */
  public getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  /**
   * Get extracted messages
   */
  public getMessages(): ChatMessage[] {
    return [...this.extractedMessages];
  }

  /**
   * Clear current session
   */
  public clearSession(): void {
    if (this.messageObserver) {
      this.messageObserver.disconnect();
      this.messageObserver = null;
    }
    
    this.currentSession = null;
    this.extractedMessages = [];
  }
}
