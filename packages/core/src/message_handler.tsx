import { createLogger } from '../loggingConfig.js';
import { DatabaseManager } from './database.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosError } from 'axios';
import { createBridge } from '../domain/core/bridges.js';
import { CommunicationBus } from '../domain/core/communication.js';
import { MessageType, MessagePriority } from '../domain/core/types.js';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('message_handler');

// Initialize database manager
const dbManager = new DatabaseManager();

// Initialize Redis bridge
const bridgeConfig = {
  type: 'redis',
  host: 'localhost',
  port: 6379
};

const communicationConfig = {
  default: { maxRequests: 10, windowMs: 1000 },
  circuitBreaker: { resetTimeoutMs: 5000, failureThreshold: 5, halfOpenRequests: 2 },
  retryPolicy: { maxAttempts: 3, initialDelayMs: 100, backoffFactor: 2, maxDelayMs: 1000 }
};

const bridge = createBridge(bridgeConfig);

export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  FUNCTION = "function"
}

export enum MessageType {
  CHAT = "chat",
  COMMAND = "command",
  STREAM = "stream",
  STATUS = "status",
  RESPONSE = "response"
}

export enum Provider {
  LITELLM = "litellm",
  OPENROUTER = "openrouter"
}

export interface AgentMetadata {
  name: string;
  description: string;
  capabilities: string[];
  personalityTraits: string[];
  communicationStyle: string;
  expertiseAreas: string[];
}

export interface MessageData {
  messageId: string;
  role: MessageRole;
  content: string;
  messageType: MessageType;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export class Message {
  public readonly role: MessageRole;
  public readonly content: string;
  public readonly messageType: MessageType;
  public readonly metadata: Record<string, unknown>;
  public readonly messageId: string;
  public readonly timestamp: Date;

  constructor(
    role: MessageRole,
    content: string,
    messageType: MessageType = MessageType.CHAT,
    metadata?: Record<string, unknown>,
    messageId?: string,
    timestamp?: Date
  ) {
    if (!Object.values(MessageRole).includes(role)) {
      throw new Error(`Invalid role type: ${role}`);
    }
    if (!Object.values(MessageType).includes(messageType)) {
      throw new Error(`Invalid message type: ${messageType}`);
    }
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    this.role = role;
    this.content = content;
    this.messageType = messageType;
    this.metadata = metadata || {};
    this.messageId = messageId || uuidv4();
    this.timestamp = timestamp || new Date();
  }

  public toData(): MessageData {
    return {
      messageId: this.messageId,
      role: this.role,
      content: this.content,
      messageType: this.messageType,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString()
    };
  }

  public static fromData(data: MessageData): Message {
    try {
      return new Message(
        data.role as MessageRole,
        data.content,
        data.messageType as MessageType,
        data.metadata,
        data.messageId,
        new Date(data.timestamp)
      );
    } catch (error) {
      logger.error('Error creating message from dict:', error);
      throw new Error(`Failed to create message from data: ${error}`);
    }
  }
}

interface ConversationMessage {
  role: string;
  content: string;
}

export class LLMAgent {
  private readonly name: string;
  private readonly apiKey: string;
  private readonly model: string;
  public readonly metadata: AgentMetadata;
  private conversationContext: ConversationMessage[];

  constructor(
    name: string,
    apiKey: string,
    model: string = "anthropic/claude-2"
  ) {
    this.name = name;
    this.apiKey = apiKey;
    this.model = model;

    // Define agent-specific metadata
    this.metadata = {
      name,
      description: name === "Cascade"
        ? "Cascade is a knowledgeable and analytical AI assistant"
        : "Cline is a creative and collaborative AI assistant",
      capabilities: [
        "Natural language understanding",
        "Context-aware responses",
        "Knowledge integration",
        "Collaborative problem-solving"
      ],
      personalityTraits: name === "Cascade"
        ? ["Analytical and precise", "Detail-oriented", "Systematic", "Logical"]
        : ["Creative and intuitive", "Big-picture focused", "Adaptable", "Imaginative"],
      communicationStyle: name === "Cascade"
        ? "Clear and structured"
        : "Engaging and conversational",
      expertiseAreas: name === "Cascade"
        ? ["Data analysis", "Technical documentation", "System design", "Process optimization"]
        : ["Creative problem-solving", "Brainstorming", "Innovation", "Collaboration"]
    };

    // Initialize conversation context with agent's personality
    this.conversationContext = [{
      role: "system",
      content: [
        `You are ${name}, an AI assistant with the following characteristics:`,
        `- Description: ${this.metadata.description}`,
        `- Communication style: ${this.metadata.communicationStyle}`,
        `- Key traits: ${this.metadata.personalityTraits.join(', ')}`,
        `- Expertise areas: ${this.metadata.expertiseAreas.join(', ')}`
      ].join('\n')
    }];
  }

  public async generateResponse(prompt: string): Promise<string> {
    try {
      // Add user message to context
      this.conversationContext.push({
        role: "user",
        content: prompt
      });

      // Limit context size
      if (this.conversationContext.length > 10) {
        this.conversationContext = [
          this.conversationContext[0],
          ...this.conversationContext.slice(-9)
        ];
      }

      // Prepare headers
      const headers = {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://openrouter.ai/docs",
        "X-Title": `LLM Chat Interface - ${this.name}`
      };

      // Prepare request data
      const data = {
        model: this.model,
        messages: this.conversationContext,
        stream: false,
        temperature: 0.7,
        max_tokens: 1000
      };

      logger.debug('Sending request to OpenRouter API:', { data });

      // Make API request
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        data,
        { headers }
      );

      // Check response status
      if(response.status !== 200) {
        logger.error('OpenRouter API error:', {
          status: response.status,
          data: response.data
        });
        return `Unable to generate response. Status code: ${response.status}`;
      }

      // Process response
      const responseData = response.data;
      logger.debug('OpenRouter API response:', { responseData });

      if (!responseData.choices?.length) {
        logger.error('Unexpected API response format:', { responseData });
        return "Unexpected response format from API";
      }

      // Extract content
      const content = responseData.choices[0].message.content;

      // Add assistant's response to context
      this.conversationContext.push({
        role: "assistant",
        content
      });

      return content;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error(`Request error for ${this.name}:`, {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          error: axiosError.message
        });
        return `Error: Network or API request failed - ${axiosError.message}`;
      }

      logger.error(`Unexpected error for ${this.name}:`, error);
      return `An unexpected error occurred - ${error}`;
    }
  }
}

export class ChatManager {
  private cascade: LLMAgent;
  private cline: LLMAgent;
  private messageHistory: Message[];
  private maxMemoryMessages: number;
  private isPaused: boolean;
  private isStopped: boolean;
  private readonly lock: Promise<void>;
  private cascadeBus: CommunicationBus;
  private clineBus: CommunicationBus;

  constructor() {
    // Get API keys from environment
    const cascadeApiKey = (process as any).env.CASCADE_API_KEY;
    const clineApiKey = (process as any).env.CLINE_API_KEY;

    if (!cascadeApiKey || !clineApiKey) {
      throw new Error('Missing required API keys');
    }

    this.cascade = new LLMAgent(
      "Cascade",
      cascadeApiKey,
      (process as any).env.CASCADE_MODEL || "anthropic/claude-2"
    );

    this.cline = new LLMAgent(
      "Cline",
      clineApiKey,
      (process as any).env.CLINE_MODEL || "anthropic/claude-2"
    );

    this.messageHistory = [];
    this.maxMemoryMessages = parseInt((process as any).env.MAX_MEMORY_MESSAGES || "1000", 10);
    this.isPaused = false;
    this.isStopped = false;
    this.lock = Promise.resolve();

    // Initialize communication buses
    this.cascadeBus = new CommunicationBus(bridge, communicationConfig);
    this.clineBus = new CommunicationBus(bridge, communicationConfig);

    // Subscribe to messages
    this.subscribeToMessages();
  }

  private subscribeToMessages(): void {
    this.cascadeBus.subscribe('cascade', async (message) => {
      const response = await this.cline.generateResponse(message.content);
      await this.clineBus.send({
        id: uuidv4(),
        type: MessageType.RESPONSE,
        sender: 'cascade',
        recipient: 'cline',
        content: response,
        sequence: message.sequence + 1,
        timestamp: new Date().toISOString(),
        priority: MessagePriority.NORMAL
      });
    });

    this.clineBus.subscribe('cline', async (message) => {
      const response = await this.cascade.generateResponse(message.content);
      await this.cascadeBus.send({
        id: uuidv4(),
        type: MessageType.RESPONSE,
        sender: 'cline',
        recipient: 'cascade',
        content: response,
        sequence: message.sequence + 1,
        timestamp: new Date().toISOString(),
        priority: MessagePriority.NORMAL
      });
    });
  }

  async startChat(): Promise<void> {
    // Start initial conversation
    const initialMessage = {
      id: uuidv4(),
      type: MessageType.CHAT,
      sender: 'cascade',
      recipient: 'cline',
      content: 'Hello, Cline!',
      sequence: 0,
      timestamp: new Date().toISOString(),
      priority: MessagePriority.NORMAL
    };
    await this.cascadeBus.send(initialMessage);
  }

  public clearMessages(): void {
    this.messageHistory = [];
    this.isPaused = false;
    this.isStopped = false;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public stopProcess(): void {
    this.isStopped = true;
    this.isPaused = false;
  }

  public addMessage(message: Message): boolean {
    if (this.isStopped || this.isPaused) {
      return false;
    }

    // Add agent metadata based on the agent
    let enhancedMessage = message;
    if (message.metadata) {
      const agent = message.metadata?.fromAgent;
      if (agent === 'cascade') {
        enhancedMessage = new Message(
          message.role,
          message.content,
          message.messageType,
          { ...message.metadata, ...this.cascade.metadata },
          message.messageId,
          message.timestamp
        );
      } else if (agent === 'cline') {
        enhancedMessage = new Message(
          message.role,
          message.content,
          message.messageType,
          { ...message.metadata, ...this.cline.metadata },
          message.messageId,
          message.timestamp
        );
      }
    }

    this.messageHistory.push(enhancedMessage);

    // Limit message history size
    if (this.messageHistory.length > this.maxMemoryMessages) {
      this.messageHistory.shift();
    }

    return true;
  }

  public async *sendMessage(content: string, toAgent: string): AsyncGenerator<Message, void, unknown> {
    if (!content || typeof content !== 'string') {
      throw new Error('Message content must be a non-empty string');
    }

    if (toAgent !== 'cascade' && toAgent !== 'cline') {
      throw new Error(`Invalid agent specified: ${toAgent}`);
    }

    try {
      const agent = toAgent === 'cascade' ? this.cascade : this.cline;
      const userMessage = new Message(
        MessageRole.USER,
        content,
        MessageType.CHAT
      );

      this.addMessage(userMessage);
      yield userMessage;

      const response = await agent.generateResponse(content);

      const responseMessage = new Message(
        MessageRole.ASSISTANT,
        response,
        MessageType.STREAM
      );

      this.addMessage(responseMessage);
      yield responseMessage;

    } catch (error) {
      logger.error('Error processing message:', error);
      const errorMessage = new Message(
        MessageRole.ASSISTANT,
        `Error: ${error}`,
        MessageType.STATUS
      );
      this.addMessage(errorMessage);
      yield errorMessage;
    }
  }
}
