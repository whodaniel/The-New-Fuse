// Enhanced A2A Debugging Service - Advanced debugging tools for multi-agent communication
// Provides message tracing, conversation analysis, and real-time debugging capabilities

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import { RedisCacheService } from '../../cache/src/redis-cache.service';

// Debug interfaces
export interface A2ADebugMessage {
  id: string;
  messageId: string;
  sessionId: string;
  timestamp: number;
  fromAgent: string;
  toAgent: string;
  messageType: string;
  priority: number;
  payload: any;
  metadata: {
    routingPath: string[];
    processingTime: number;
    retryCount: number;
    errors: string[];
    debugLevel: DebugLevel;
  };
  status: 'sent' | 'received' | 'processed' | 'failed' | 'timeout';
  stackTrace?: string;
  performanceMetrics: {
    sendTime: number;
    receiveTime?: number;
    processTime?: number;
    totalLatency?: number;
    bandwidth?: number;
  };
}

export interface ConversationTrace {
  id: string;
  participants: string[];
  startTime: number;
  endTime?: number;
  messages: A2ADebugMessage[];
  status: 'active' | 'completed' | 'failed' | 'timeout';
  summary: {
    totalMessages: number;
    avgLatency: number;
    errorCount: number;
    duration: number;
  };
  flowDiagram: ConversationFlow[];
}

export interface ConversationFlow {
  step: number;
  fromAgent: string;
  toAgent: string;
  messageType: string;
  timestamp: number;
  latency: number;
  success: boolean;
  error?: string;
}

export interface AgentDebugInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
  activeConversations: string[];
  messageStats: {
    sent: number;
    received: number;
    processed: number;
    failed: number;
  };
  performanceMetrics: {
    avgResponseTime: number;
    reliability: number;
    throughput: number;
    errorRate: number;
  };
  debugSessions: string[];
  lastActivity: number;
}

export interface DebugSession {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  filters: DebugFilter[];
  capturedMessages: A2ADebugMessage[];
  conversations: ConversationTrace[];
  agents: string[];
  status: 'active' | 'paused' | 'stopped';
  settings: DebugSettings;
}

export interface DebugFilter {
  type: 'agent' | 'messageType' | 'priority' | 'keyword' | 'timeRange';
  value: any;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  enabled: boolean;
}

export interface DebugSettings {
  capturePayloads: boolean;
  captureStackTraces: boolean;
  maxMessages: number;
  maxConversations: number;
  retentionTime: number; // milliseconds
  realTimeUpdates: boolean;
  verboseLogging: boolean;
}

export enum DebugLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

export interface MessageAnalysis {
  messageId: string;
  analysis: {
    routingEfficiency: number;
    latencyAnalysis: {
      category: 'excellent' | 'good' | 'acceptable' | 'slow' | 'critical';
      bottlenecks: string[];
      recommendations: string[];
    };
    errorAnalysis: {
      hasErrors: boolean;
      errorTypes: string[];
      recoverability: 'automatic' | 'manual' | 'critical';
    };
    performanceScore: number;
    suggestions: string[];
  };
}

@Injectable()
export class A2ADebuggerService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(A2ADebuggerService.name);

  // Debug data storage
  private debugSessions: Map<string, DebugSession> = new Map();
  private capturedMessages: Map<string, A2ADebugMessage> = new Map();
  private conversations: Map<string, ConversationTrace> = new Map();
  private agentInfo: Map<string, AgentDebugInfo> = new Map();
  private messageAnalytics: Map<string, MessageAnalysis> = new Map();

  // Active monitoring
  private activeSessionId: string | null = null;
  private isCapturing = false;
  private messageBuffer: A2ADebugMessage[] = [];

  // Configuration
  private readonly config = {
    maxSessionsInMemory: 50,
    maxMessagesPerSession: 10000,
    maxConversationLength: 1000,
    messageBufferSize: 5000,
    cleanupInterval: 300000, // 5 minutes
    realTimeThrottleMs: 100,
    compressionThreshold: 1024,
  };

  private cleanupInterval: NodeJS.Timeout;
  private bufferFlushInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private cacheService: RedisCacheService
  ) {
    super();
    this.setupEventHandlers();
  }

  async onModuleInit(): Promise<void> {
    await this.initializeDebugger();
    this.startPeriodicCleanup();
    this.startBufferFlushing();
    this.logger.log('A2A Debugger Service initialized');
  }

  // Debug session management
  async createDebugSession(
    name: string,
    description: string,
    settings?: Partial<DebugSettings>
  ): Promise<string> {
    const sessionId = this.generateSessionId();

    const defaultSettings: DebugSettings = {
      capturePayloads: true,
      captureStackTraces: false,
      maxMessages: 5000,
      maxConversations: 100,
      retentionTime: 3600000, // 1 hour
      realTimeUpdates: true,
      verboseLogging: false,
    };

    const session: DebugSession = {
      id: sessionId,
      name,
      description,
      startTime: Date.now(),
      filters: [],
      capturedMessages: [],
      conversations: [],
      agents: [],
      status: 'active',
      settings: { ...defaultSettings, ...settings },
    };

    this.debugSessions.set(sessionId, session);

    // Cache session for persistence
    await this.cacheService.set(`debug_session:${sessionId}`, session, {
      ttl: session.settings.retentionTime / 1000,
    });

    this.logger.log(`Debug session created: ${sessionId} - ${name}`);
    this.emit('sessionCreated', session);

    return sessionId;
  }

  async stopDebugSession(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.status = 'stopped';
    session.endTime = Date.now();

    // Generate session summary
    const summary = this.generateSessionSummary(session);
    await this.cacheService.set(`debug_session_summary:${sessionId}`, summary, { ttl: 86400 });

    this.logger.log(`Debug session stopped: ${sessionId}`);
    this.emit('sessionStopped', session);

    return true;
  }

  async setActiveSession(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId);
    if (!session || session.status !== 'active') return false;

    this.activeSessionId = sessionId;
    this.isCapturing = true;

    this.logger.log(`Active debug session set: ${sessionId}`);
    return true;
  }

  // Message capture and tracing
  async captureMessage(message: any): Promise<void> {
    if (!this.isCapturing || !this.activeSessionId) return;

    const debugMessage: A2ADebugMessage = {
      id: this.generateMessageId(),
      messageId: message.id,
      sessionId: this.activeSessionId,
      timestamp: Date.now(),
      fromAgent: message.fromAgent,
      toAgent: message.toAgent,
      messageType: message.type,
      priority: message.priority,
      payload: this.shouldCapturePayload() ? message.payload : '[PAYLOAD_HIDDEN]',
      metadata: {
        routingPath: message.metadata?.routingPath || [],
        processingTime: message.metadata?.processingTime || 0,
        retryCount: message.retryCount || 0,
        errors: [],
        debugLevel: DebugLevel.INFO,
      },
      status: 'sent',
      performanceMetrics: {
        sendTime: Date.now(),
        bandwidth: JSON.stringify(message).length,
      },
    };

    // Add to buffer for batch processing
    this.messageBuffer.push(debugMessage);

    // Process immediately if buffer is full
    if (this.messageBuffer.length >= this.config.messageBufferSize) {
      await this.flushMessageBuffer();
    }

    // Real-time updates
    if (this.shouldSendRealTimeUpdates()) {
      this.emit('messageCapture', debugMessage);
    }
  }

  async captureMessageResponse(messageId: string, response: any): Promise<void> {
    const debugMessage = this.capturedMessages.get(messageId);
    if (!debugMessage) return;

    debugMessage.status = response.success ? 'processed' : 'failed';
    debugMessage.performanceMetrics.receiveTime = Date.now();
    debugMessage.performanceMetrics.processTime = response.processingTime;
    debugMessage.performanceMetrics.totalLatency =
      debugMessage.performanceMetrics.receiveTime - debugMessage.performanceMetrics.sendTime;

    if (!response.success) {
      debugMessage.metadata.errors.push(response.error);
      debugMessage.metadata.debugLevel = DebugLevel.ERROR;
    }

    // Update conversation trace
    await this.updateConversationTrace(debugMessage);

    this.emit('messageUpdate', debugMessage);
  }

  // Conversation tracing
  async startConversationTrace(participants: string[]): Promise<string> {
    const conversationId = this.generateConversationId();

    const conversation: ConversationTrace = {
      id: conversationId,
      participants,
      startTime: Date.now(),
      messages: [],
      status: 'active',
      summary: {
        totalMessages: 0,
        avgLatency: 0,
        errorCount: 0,
        duration: 0,
      },
      flowDiagram: [],
    };

    this.conversations.set(conversationId, conversation);

    this.logger.debug(`Conversation trace started: ${conversationId}`);
    this.emit('conversationStarted', conversation);

    return conversationId;
  }

  async endConversationTrace(conversationId: string): Promise<ConversationTrace | null> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    conversation.status = 'completed';
    conversation.endTime = Date.now();
    conversation.summary = this.calculateConversationSummary(conversation);

    // Generate flow diagram
    conversation.flowDiagram = this.generateConversationFlow(conversation);

    this.logger.debug(`Conversation trace ended: ${conversationId}`);
    this.emit('conversationEnded', conversation);

    return conversation;
  }

  // Message analysis
  async analyzeMessage(messageId: string): Promise<MessageAnalysis> {
    const debugMessage = this.capturedMessages.get(messageId);
    if (!debugMessage) {
      throw new Error(`Message not found: ${messageId}`);
    }

    const analysis: MessageAnalysis = {
      messageId,
      analysis: {
        routingEfficiency: this.calculateRoutingEfficiency(debugMessage),
        latencyAnalysis: this.analyzeLatency(debugMessage),
        errorAnalysis: this.analyzeErrors(debugMessage),
        performanceScore: this.calculatePerformanceScore(debugMessage),
        suggestions: this.generateSuggestions(debugMessage),
      },
    };

    this.messageAnalytics.set(messageId, analysis);
    return analysis;
  }

  async analyzeConversation(conversationId: string): Promise<{
    conversation: ConversationTrace;
    analysis: {
      efficiency: number;
      bottlenecks: string[];
      patterns: string[];
      recommendations: string[];
    };
  }> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const analysis = {
      efficiency: this.calculateConversationEfficiency(conversation),
      bottlenecks: this.identifyBottlenecks(conversation),
      patterns: this.identifyPatterns(conversation),
      recommendations: this.generateConversationRecommendations(conversation),
    };

    return { conversation, analysis };
  }

  // Agent debugging
  async getAgentDebugInfo(agentId: string): Promise<AgentDebugInfo | null> {
    let agentInfo = this.agentInfo.get(agentId);

    if (!agentInfo) {
      // Create agent info if not exists
      agentInfo = await this.createAgentDebugInfo(agentId);
      if (agentInfo) {
        this.agentInfo.set(agentId, agentInfo);
      }
    }

    return agentInfo || null;
  }

  async updateAgentActivity(
    agentId: string,
    activity: {
      messagesSent?: number;
      messagesReceived?: number;
      messagesProcessed?: number;
      messagesFailed?: number;
      responseTime?: number;
    }
  ): Promise<void> {
    const agentInfo = await this.getAgentDebugInfo(agentId);
    if (!agentInfo) return;

    // Update message stats
    if (activity.messagesSent) agentInfo.messageStats.sent += activity.messagesSent;
    if (activity.messagesReceived) agentInfo.messageStats.received += activity.messagesReceived;
    if (activity.messagesProcessed) agentInfo.messageStats.processed += activity.messagesProcessed;
    if (activity.messagesFailed) agentInfo.messageStats.failed += activity.messagesFailed;

    // Update performance metrics
    if (activity.responseTime) {
      agentInfo.performanceMetrics.avgResponseTime =
        (agentInfo.performanceMetrics.avgResponseTime + activity.responseTime) / 2;
    }

    agentInfo.lastActivity = Date.now();

    // Recalculate derived metrics
    this.updateAgentMetrics(agentInfo);
  }

  // Debug utilities
  async setDebugFilters(sessionId: string, filters: DebugFilter[]): Promise<boolean> {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.filters = filters;

    this.logger.debug(`Debug filters updated for session: ${sessionId}`);
    return true;
  }

  async exportDebugSession(sessionId: string): Promise<{
    session: DebugSession;
    messages: A2ADebugMessage[];
    conversations: ConversationTrace[];
    analytics: MessageAnalysis[];
  }> {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`);
    }

    const messages = session.capturedMessages;
    const conversations = session.conversations
      .map((id) => this.conversations.get(id))
      .filter(Boolean);
    const analytics = messages
      .map((msg) => this.messageAnalytics.get(msg.messageId))
      .filter(Boolean);

    return {
      session,
      messages,
      conversations,
      analytics,
    };
  }

  // Real-time debugging
  async enableRealTimeDebugging(sessionId: string, socketConnection?: any): Promise<boolean> {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.settings.realTimeUpdates = true;

    // Set up real-time event forwarding if socket provided
    if (socketConnection) {
      this.setupRealTimeForwarding(sessionId, socketConnection);
    }

    return true;
  }

  async getDebugDashboard(): Promise<{
    activeSessions: number;
    totalMessages: number;
    activeConversations: number;
    topAgents: Array<{ id: string; messageCount: number }>;
    recentErrors: Array<{ messageId: string; error: string; timestamp: number }>;
    performanceOverview: {
      avgLatency: number;
      errorRate: number;
      throughput: number;
    };
  }> {
    const activeSessions = Array.from(this.debugSessions.values()).filter(
      (session) => session.status === 'active'
    ).length;

    const totalMessages = this.capturedMessages.size;

    const activeConversations = Array.from(this.conversations.values()).filter(
      (conv) => conv.status === 'active'
    ).length;

    const topAgents = Array.from(this.agentInfo.values())
      .sort((a, b) => b.messageStats.sent - a.messageStats.sent)
      .slice(0, 5)
      .map((agent) => ({
        id: agent.id,
        messageCount: agent.messageStats.sent + agent.messageStats.received,
      }));

    const recentErrors = Array.from(this.capturedMessages.values())
      .filter((msg) => msg.metadata.errors.length > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((msg) => ({
        messageId: msg.messageId,
        error: msg.metadata.errors[0],
        timestamp: msg.timestamp,
      }));

    const allMessages = Array.from(this.capturedMessages.values());
    const avgLatency =
      allMessages.length > 0
        ? allMessages.reduce((sum, msg) => sum + (msg.performanceMetrics.totalLatency || 0), 0) /
          allMessages.length
        : 0;

    const errorRate =
      allMessages.length > 0
        ? (allMessages.filter((msg) => msg.status === 'failed').length / allMessages.length) * 100
        : 0;

    const throughput = allMessages.length; // Messages per session

    return {
      activeSessions,
      totalMessages,
      activeConversations,
      topAgents,
      recentErrors,
      performanceOverview: {
        avgLatency,
        errorRate,
        throughput,
      },
    };
  }

  // Private helper methods
  private async initializeDebugger(): Promise<void> {
    // Load persisted debug sessions
    // Implementation would restore sessions from cache
    this.logger.debug('A2A Debugger initialized');
  }

  private setupEventHandlers(): void {
    this.on('messageCapture', (message: A2ADebugMessage) => {
      // Handle real-time message capture
    });

    this.on('conversationStarted', (conversation: ConversationTrace) => {
      // Handle conversation start
    });

    this.on('sessionCreated', (session: DebugSession) => {
      // Handle session creation
    });
  }

  private async flushMessageBuffer(): Promise<void> {
    if (this.messageBuffer.length === 0) return;

    const session = this.activeSessionId ? this.debugSessions.get(this.activeSessionId) : null;
    if (!session) return;

    // Process messages in buffer
    for (const message of this.messageBuffer) {
      // Apply filters
      if (this.passesFilters(message, session.filters)) {
        this.capturedMessages.set(message.messageId, message);
        session.capturedMessages.push(message);

        // Update conversation trace
        await this.updateConversationTrace(message);
      }
    }

    // Clear buffer
    this.messageBuffer = [];

    // Trim session messages if needed
    if (session.capturedMessages.length > session.settings.maxMessages) {
      session.capturedMessages = session.capturedMessages.slice(-session.settings.maxMessages);
    }
  }

  private passesFilters(message: A2ADebugMessage, filters: DebugFilter[]): boolean {
    for (const filter of filters) {
      if (!filter.enabled) continue;

      if (!this.evaluateFilter(message, filter)) {
        return false;
      }
    }
    return true;
  }

  private evaluateFilter(message: A2ADebugMessage, filter: DebugFilter): boolean {
    switch (filter.type) {
      case 'agent':
        return filter.operator === 'equals'
          ? message.fromAgent === filter.value || message.toAgent === filter.value
          : true;
      case 'messageType':
        return filter.operator === 'equals'
          ? message.messageType === filter.value
          : message.messageType.includes(filter.value);
      case 'priority':
        return this.evaluateNumericFilter(message.priority, filter.value, filter.operator);
      default:
        return true;
    }
  }

  private evaluateNumericFilter(value: number, filterValue: number, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return value === filterValue;
      case 'greater':
        return value > filterValue;
      case 'less':
        return value < filterValue;
      default:
        return true;
    }
  }

  private async updateConversationTrace(message: A2ADebugMessage): Promise<void> {
    // Find or create conversation trace
    const conversationId = this.findOrCreateConversation(message);
    const conversation = this.conversations.get(conversationId);

    if (conversation) {
      conversation.messages.push(message);
      conversation.summary.totalMessages++;
    }
  }

  private findOrCreateConversation(message: A2ADebugMessage): string {
    // Simple logic - find conversation with same participants
    for (const [id, conversation] of this.conversations) {
      if (
        conversation.participants.includes(message.fromAgent) &&
        conversation.participants.includes(message.toAgent)
      ) {
        return id;
      }
    }

    // Create new conversation
    const conversationId = this.generateConversationId();
    const conversation: ConversationTrace = {
      id: conversationId,
      participants: [message.fromAgent, message.toAgent],
      startTime: message.timestamp,
      messages: [],
      status: 'active',
      summary: { totalMessages: 0, avgLatency: 0, errorCount: 0, duration: 0 },
      flowDiagram: [],
    };

    this.conversations.set(conversationId, conversation);
    return conversationId;
  }

  private calculateRoutingEfficiency(message: A2ADebugMessage): number {
    const routingPath = message.metadata.routingPath;
    const optimalHops = 1; // Direct communication
    const actualHops = routingPath.length;

    return actualHops === 0 ? 100 : Math.max(0, 100 - (actualHops - optimalHops) * 20);
  }

  private analyzeLatency(message: A2ADebugMessage): MessageAnalysis['analysis']['latencyAnalysis'] {
    const latency = message.performanceMetrics.totalLatency || 0;

    let category: 'excellent' | 'good' | 'acceptable' | 'slow' | 'critical';
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    if (latency < 100) {
      category = 'excellent';
    } else if (latency < 500) {
      category = 'good';
    } else if (latency < 1000) {
      category = 'acceptable';
    } else if (latency < 5000) {
      category = 'slow';
      bottlenecks.push('High network latency');
      recommendations.push('Check network connection');
    } else {
      category = 'critical';
      bottlenecks.push('Very high latency');
      recommendations.push('Investigate system performance');
    }

    return { category, bottlenecks, recommendations };
  }

  private analyzeErrors(message: A2ADebugMessage): MessageAnalysis['analysis']['errorAnalysis'] {
    const hasErrors = message.metadata.errors.length > 0;
    const errorTypes = message.metadata.errors;

    let recoverability: 'automatic' | 'manual' | 'critical' = 'automatic';

    if (hasErrors) {
      if (message.metadata.retryCount > 2) {
        recoverability = 'manual';
      }
      if (errorTypes.some((error) => error.includes('critical') || error.includes('fatal'))) {
        recoverability = 'critical';
      }
    }

    return { hasErrors, errorTypes, recoverability };
  }

  private calculatePerformanceScore(message: A2ADebugMessage): number {
    let score = 100;

    // Deduct for latency
    const latency = message.performanceMetrics.totalLatency || 0;
    if (latency > 1000) score -= 20;
    else if (latency > 500) score -= 10;

    // Deduct for errors
    if (message.metadata.errors.length > 0) score -= 30;

    // Deduct for retries
    score -= message.metadata.retryCount * 10;

    return Math.max(0, score);
  }

  private generateSuggestions(message: A2ADebugMessage): string[] {
    const suggestions: string[] = [];

    if (message.performanceMetrics.totalLatency > 1000) {
      suggestions.push('Consider optimizing message routing');
    }

    if (message.metadata.retryCount > 1) {
      suggestions.push('Investigate connection stability');
    }

    if (message.metadata.errors.length > 0) {
      suggestions.push('Review error handling logic');
    }

    return suggestions;
  }

  private shouldCapturePayload(): boolean {
    const session = this.activeSessionId ? this.debugSessions.get(this.activeSessionId) : null;
    return session?.settings.capturePayloads ?? true;
  }

  private shouldSendRealTimeUpdates(): boolean {
    const session = this.activeSessionId ? this.debugSessions.get(this.activeSessionId) : null;
    return session?.settings.realTimeUpdates ?? false;
  }

  private generateSessionId(): string {
    return `debug_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `debug_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConversationId(): string {
    return `debug_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createAgentDebugInfo(agentId: string): Promise<AgentDebugInfo> {
    return {
      id: agentId,
      name: `Agent ${agentId}`,
      type: 'unknown',
      status: 'online',
      capabilities: [],
      activeConversations: [],
      messageStats: { sent: 0, received: 0, processed: 0, failed: 0 },
      performanceMetrics: { avgResponseTime: 0, reliability: 1.0, throughput: 0, errorRate: 0 },
      debugSessions: [],
      lastActivity: Date.now(),
    };
  }

  private updateAgentMetrics(agentInfo: AgentDebugInfo): void {
    const total = agentInfo.messageStats.sent + agentInfo.messageStats.received;
    agentInfo.performanceMetrics.errorRate =
      total > 0 ? (agentInfo.messageStats.failed / total) * 100 : 0;

    agentInfo.performanceMetrics.reliability =
      Math.max(0, 100 - agentInfo.performanceMetrics.errorRate) / 100;
  }

  private calculateConversationSummary(
    conversation: ConversationTrace
  ): ConversationTrace['summary'] {
    const messages = conversation.messages;
    const duration = conversation.endTime ? conversation.endTime - conversation.startTime : 0;

    const avgLatency =
      messages.length > 0
        ? messages.reduce((sum, msg) => sum + (msg.performanceMetrics.totalLatency || 0), 0) /
          messages.length
        : 0;

    const errorCount = messages.filter((msg) => msg.metadata.errors.length > 0).length;

    return {
      totalMessages: messages.length,
      avgLatency,
      errorCount,
      duration,
    };
  }

  private generateConversationFlow(conversation: ConversationTrace): ConversationFlow[] {
    return conversation.messages.map((msg, index) => ({
      step: index + 1,
      fromAgent: msg.fromAgent,
      toAgent: msg.toAgent,
      messageType: msg.messageType,
      timestamp: msg.timestamp,
      latency: msg.performanceMetrics.totalLatency || 0,
      success: msg.status === 'processed',
      error: msg.metadata.errors[0],
    }));
  }

  private calculateConversationEfficiency(conversation: ConversationTrace): number {
    const messages = conversation.messages;
    if (messages.length === 0) return 100;

    const successfulMessages = messages.filter((msg) => msg.status === 'processed').length;
    return (successfulMessages / messages.length) * 100;
  }

  private identifyBottlenecks(conversation: ConversationTrace): string[] {
    const bottlenecks: string[] = [];
    const messages = conversation.messages;

    const highLatencyMessages = messages.filter(
      (msg) => (msg.performanceMetrics.totalLatency || 0) > 2000
    );

    if (highLatencyMessages.length > 0) {
      bottlenecks.push('High latency messages detected');
    }

    const errorMessages = messages.filter((msg) => msg.metadata.errors.length > 0);
    if (errorMessages.length > messages.length * 0.1) {
      bottlenecks.push('High error rate');
    }

    return bottlenecks;
  }

  private identifyPatterns(conversation: ConversationTrace): string[] {
    const patterns: string[] = [];
    const messages = conversation.messages;

    // Look for repeated message types
    const messageTypes = messages.map((msg) => msg.messageType);
    const typeFrequency = messageTypes.reduce(
      (acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(typeFrequency).forEach(([type, count]) => {
      if (count > messages.length * 0.5) {
        patterns.push(`Frequent ${type} messages`);
      }
    });

    return patterns;
  }

  private generateConversationRecommendations(conversation: ConversationTrace): string[] {
    const recommendations: string[] = [];

    if (conversation.summary.errorCount > 0) {
      recommendations.push('Review error handling between agents');
    }

    if (conversation.summary.avgLatency > 1000) {
      recommendations.push('Optimize communication latency');
    }

    if (conversation.messages.length > 100) {
      recommendations.push('Consider breaking down complex conversations');
    }

    return recommendations;
  }

  private generateSessionSummary(session: DebugSession): any {
    return {
      id: session.id,
      name: session.name,
      duration: session.endTime ? session.endTime - session.startTime : 0,
      messageCount: session.capturedMessages.length,
      conversationCount: session.conversations.length,
      agentCount: session.agents.length,
    };
  }

  private setupRealTimeForwarding(sessionId: string, socketConnection: any): void {
    const forwardMessage = (message: A2ADebugMessage) => {
      if (message.sessionId === sessionId) {
        socketConnection.emit('debugMessage', message);
      }
    };

    this.on('messageCapture', forwardMessage);
    this.on('messageUpdate', forwardMessage);
  }

  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  private startBufferFlushing(): void {
    this.bufferFlushInterval = setInterval(async () => {
      await this.flushMessageBuffer();
    }, this.config.realTimeThrottleMs);
  }

  private performCleanup(): void {
    const now = Date.now();

    // Clean up old sessions
    for (const [sessionId, session] of this.debugSessions) {
      if (
        session.status === 'stopped' &&
        session.endTime &&
        now - session.endTime > session.settings.retentionTime
      ) {
        this.debugSessions.delete(sessionId);
        this.logger.debug(`Cleaned up old debug session: ${sessionId}`);
      }
    }

    // Clean up old messages
    const messageIds = Array.from(this.capturedMessages.keys());
    for (const messageId of messageIds) {
      const message = this.capturedMessages.get(messageId);
      if (message && now - message.timestamp > 3600000) {
        // 1 hour
        this.capturedMessages.delete(messageId);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Stop all active sessions
    for (const sessionId of this.debugSessions.keys()) {
      await this.stopDebugSession(sessionId);
    }

    this.logger.log('A2A Debugger Service shutdown complete');
  }
}
