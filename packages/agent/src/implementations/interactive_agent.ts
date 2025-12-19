/**
 * Interactive Agent Implementation
 * An agent designed for interactive, conversational workflows with users
 * Supports multi-turn dialogues, context retention, and dynamic responses
 */

import { IAgent } from '../interfaces/IAgent';

export interface InteractiveConfig {
  agentId: string;
  name: string;
  personality?: string;
  welcomeMessage?: string;
  maxContextLength?: number;
  responseTimeout?: number;
}

export interface InteractiveMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    intent?: string;
    entities?: string[];
  };
}

export interface InteractiveSession {
  sessionId: string;
  userId?: string;
  messages: InteractiveMessage[];
  context: Record<string, unknown>;
  startTime: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'ended';
}

export interface InteractiveResponse {
  message: InteractiveMessage;
  suggestions?: string[];
  actions?: InteractiveAction[];
  shouldContinue: boolean;
}

export interface InteractiveAction {
  type: 'button' | 'link' | 'form' | 'confirm';
  label: string;
  value: string;
  data?: Record<string, unknown>;
}

export class InteractiveAgent implements IAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly type = 'interactive';
  public readonly capabilities = [
    'conversation',
    'context_retention',
    'sentiment_analysis',
    'intent_detection',
    'dynamic_responses',
    'action_suggestions',
  ];

  private config: InteractiveConfig;
  private memory: Map<string, unknown> = new Map();
  private state: Record<string, unknown> = {};
  private isInitialized = false;
  private sessions: Map<string, InteractiveSession> = new Map();

  constructor(config: InteractiveConfig) {
    this.id = config.agentId;
    this.name = config.name;
    this.config = {
      personality: 'helpful and friendly assistant',
      welcomeMessage: 'Hello! How can I help you today?',
      maxContextLength: 50,
      responseTimeout: 30000,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log(`[InteractiveAgent:${this.id}] Initializing...`);
    this.state = {
      status: 'ready',
      personality: this.config.personality,
      lastActive: new Date().toISOString(),
      totalSessions: 0,
      totalMessages: 0,
    };
    this.isInitialized = true;
    console.log(`[InteractiveAgent:${this.id}] Ready`);
  }

  async process(message: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { action, payload } = message;

    switch (action) {
      case 'start_session':
        return this.startSession(payload.userId);
      case 'chat':
        return this.chat(payload.sessionId, payload.content);
      case 'end_session':
        return this.endSession(payload.sessionId);
      case 'get_session':
        return this.getSession(payload.sessionId);
      case 'set_context':
        return this.setSessionContext(payload.sessionId, payload.context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async learn(data: unknown): Promise<void> {
    const patterns = (await this.retrieveFromMemory('interaction_patterns')) || [];
    await this.saveToMemory('interaction_patterns', [...patterns, data]);
  }

  async saveToMemory(key: string, value: unknown): Promise<void> {
    this.memory.set(key, value);
  }

  async retrieveFromMemory(key: string): Promise<any> {
    return this.memory.get(key);
  }

  async getState(): Promise<any> {
    return {
      ...this.state,
      isInitialized: this.isInitialized,
      activeSessions: Array.from(this.sessions.values()).filter((s) => s.status === 'active')
        .length,
    };
  }

  async setState(state: unknown): Promise<void> {
    this.state = { ...this.state, ...(state as Record<string, unknown>) };
  }

  async sendMessage(message: any): Promise<void> {
    console.log(`[InteractiveAgent:${this.id}] Sending:`, message);
  }

  async receiveMessage(message: any): Promise<void> {
    console.log(`[InteractiveAgent:${this.id}] Received:`, message);
    await this.process(message);
  }

  async handleError(error: Error): Promise<void> {
    console.error(`[InteractiveAgent:${this.id}] Error:`, error.message);
    this.state = { ...this.state, lastError: error.message, status: 'error' };
  }

  // Interactive-specific methods
  async startSession(userId?: string): Promise<InteractiveSession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const welcomeMessage: InteractiveMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: this.config.welcomeMessage || 'Hello!',
      timestamp: new Date(),
    };

    const session: InteractiveSession = {
      sessionId,
      userId,
      messages: [welcomeMessage],
      context: {},
      startTime: new Date(),
      lastActivity: new Date(),
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    this.state = {
      ...this.state,
      totalSessions: ((this.state.totalSessions as number) || 0) + 1,
      lastActive: new Date().toISOString(),
    };

    console.log(`[InteractiveAgent:${this.id}] Started session: ${sessionId}`);
    return session;
  }

  async chat(sessionId: string, content: string): Promise<InteractiveResponse> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error(`Invalid or inactive session: ${sessionId}`);
    }

    // Add user message
    const userMessage: InteractiveMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        sentiment: this.analyzeSentiment(content),
        intent: this.detectIntent(content),
        entities: this.extractEntities(content),
      },
    };
    session.messages.push(userMessage);

    // Generate response
    const response = await this.generateResponse(session, userMessage);

    // Add assistant message
    session.messages.push(response.message);
    session.lastActivity = new Date();

    // Trim context if needed
    if (session.messages.length > (this.config.maxContextLength || 50)) {
      const systemMessages = session.messages.filter((m) => m.role === 'system');
      const recentMessages = session.messages.slice(-(this.config.maxContextLength || 50));
      session.messages = [...systemMessages, ...recentMessages];
    }

    this.state = {
      ...this.state,
      totalMessages: ((this.state.totalMessages as number) || 0) + 2,
      lastActive: new Date().toISOString(),
    };

    return response;
  }

  private async generateResponse(
    session: InteractiveSession,
    userMessage: InteractiveMessage
  ): Promise<InteractiveResponse> {
    // In production, this would call an LLM
    const intent = userMessage.metadata?.intent || 'general';

    let responseContent: string;
    let suggestions: string[] = [];
    let actions: InteractiveAction[] = [];

    switch (intent) {
      case 'greeting':
        responseContent = "Hello! It's great to hear from you. How can I assist you today?";
        suggestions = [
          'Tell me about your features',
          'I need help with a task',
          'Show me examples',
        ];
        break;

      case 'help':
        responseContent =
          "I'm here to help! I can assist you with conversations, answer questions, and guide you through various tasks.";
        actions = [
          { type: 'button', label: 'View Features', value: 'features' },
          { type: 'button', label: 'Get Started', value: 'start' },
        ];
        break;

      case 'farewell':
        responseContent = 'Goodbye! Feel free to come back anytime you need assistance. Take care!';
        break;

      case 'question':
        responseContent = `That's a great question! Let me think about "${userMessage.content.substring(0, 50)}..."`;
        break;

      default:
        responseContent = `I understand you're saying: "${userMessage.content.substring(0, 100)}". How would you like me to help with this?`;
        suggestions = ['Tell me more', 'Take action', 'Explain further'];
    }

    const assistantMessage: InteractiveMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
    };

    return {
      message: assistantMessage,
      suggestions,
      actions,
      shouldContinue: intent !== 'farewell',
    };
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positive = ['good', 'great', 'awesome', 'love', 'thanks', 'thank', 'happy', 'excellent'];
    const negative = ['bad', 'hate', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed'];

    const lowerContent = content.toLowerCase();

    if (positive.some((word) => lowerContent.includes(word))) return 'positive';
    if (negative.some((word) => lowerContent.includes(word))) return 'negative';
    return 'neutral';
  }

  private detectIntent(content: string): string {
    const lowerContent = content.toLowerCase();

    if (/^(hi|hello|hey|greetings)/i.test(lowerContent)) return 'greeting';
    if (/^(bye|goodbye|see you|farewell)/i.test(lowerContent)) return 'farewell';
    if (/help|assist|support|how (do|can|to)/i.test(lowerContent)) return 'help';
    if (/\?$/.test(content)) return 'question';

    return 'general';
  }

  private extractEntities(content: string): string[] {
    // Simple entity extraction - in production, use NLP
    const entities: string[] = [];

    // Extract quoted strings
    const quoted = content.match(/"([^"]+)"/g);
    if (quoted) entities.push(...quoted.map((q) => q.replace(/"/g, '')));

    // Extract capitalized words (potential proper nouns)
    const words = content.split(/\s+/);
    words.forEach((word) => {
      if (
        word.length > 2 &&
        word[0] === word[0].toUpperCase() &&
        word[0] !== word[0].toLowerCase()
      ) {
        entities.push(word);
      }
    });

    return [...new Set(entities)];
  }

  async endSession(sessionId: string): Promise<InteractiveSession | null> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      console.log(`[InteractiveAgent:${this.id}] Ended session: ${sessionId}`);
      return session;
    }
    return null;
  }

  async getSession(sessionId: string): Promise<InteractiveSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async setSessionContext(sessionId: string, context: Record<string, unknown>): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context = { ...session.context, ...context };
      return true;
    }
    return false;
  }
}

export default InteractiveAgent;
