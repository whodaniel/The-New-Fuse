"use strict";
/**
 * Google Jules Adapter for The New Fuse Framework
 *
 * Integrates Google's Jules asynchronous coding agent with The New Fuse
 * agent orchestration system via the Jules API (v1alpha).
 *
 * This adapter provides:
 * - Jules API session management
 * - A2A protocol message translation
 * - Source context handling (GitHub repositories)
 * - Asynchronous task execution and monitoring
 * - Activity tracking and status updates
 *
 * @see https://developers.google.com/jules/api
 * @version 1.0.0
 * @since 2025-10-04
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GoogleJulesAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleJulesAdapter = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const prisma_enums_1 = require("../types/prisma-enums");
let GoogleJulesAdapter = GoogleJulesAdapter_1 = class GoogleJulesAdapter extends events_1.EventEmitter {
    logger = new common_1.Logger(GoogleJulesAdapter_1.name);
    config;
    httpClient;
    activeSessions = new Map();
    rateLimits;
    constructor(config) {
        super();
        this.config = {
            baseUrl: 'https://jules.googleapis.com/v1alpha',
            ...config
        };
        // Initialize HTTP client
        this.httpClient = axios_1.default.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': this.config.apiKey
            },
            timeout: 30000 // 30 second timeout
        });
        // Initialize rate limit tracker based on usage tier
        this.rateLimits = this.initializeRateLimits(config.usageTier || 'free');
        this.logger.log(`Initializing Google Jules Adapter for agent: ${config.agentId});`, this.logger.log(`Usage tier: ${config.usageTier || 'free'}`));
    }
    /**
     * Initialize rate limits based on usage tier
     */
    initializeRateLimits(tier) {
        const limits = {
            free: { daily: 15, concurrent: 3 },
            pro: { daily: 100, concurrent: 15 },
            ultra: { daily: 300, concurrent: 60 }
        };
        const tierLimits = limits[tier];
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return {
            dailyTasksUsed: 0,
            concurrentTasks: 0,
            dailyLimit: tierLimits.daily,
            concurrentLimit: tierLimits.concurrent,
            resetTime: tomorrow
        };
    }
    /**
     * Check if rate limits allow new task
     */
    checkRateLimits() {
        const now = new Date();
        // Reset daily counter if past reset time
        if (now >= this.rateLimits.resetTime) {
            this.rateLimits.dailyTasksUsed = 0;
            this.rateLimits.resetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
        // Check limits
        const dailyOk = this.rateLimits.dailyTasksUsed < this.rateLimits.dailyLimit;
        const concurrentOk = this.rateLimits.concurrentTasks < this.rateLimits.concurrentLimit;
        if (!dailyOk) {
            this.logger.warn(Daily, task, limit, reached($, { this: .rateLimits.dailyLimit }));
        }
        if (!concurrentOk) {
            `
      this.logger.warn(Concurrent task limit reached (${this.rateLimits.concurrentLimit}`;
            ;
        }
        return dailyOk && concurrentOk;
    }
    /**
     * List available sources (GitHub repositories)
     */
    async listSources() {
        try {
            const response = await this.httpClient.get('/sources');
            return response.data.sources || [];
        }
        catch (error) {
            this.logger.error(Failed, to, list, sources, $, { this: .getErrorMessage(error) });
            throw error;
        }
    }
    /**
     * Create a new Jules session
     */
    async createSession(params) {
        try {
            // Check rate limits
            if (!this.checkRateLimits()) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            // Use default source if not provided
            const source = params.sourceContext || this.config.defaultSource;
            if (!source) {
                throw new Error('Source context is required. Please specify a GitHub repository.');
            }
            const requestBody = {} `
        prompt: params.prompt,`;
            sourceContext: {
                source: sources / github / $;
                {
                    source.owner;
                }
                `/${source.repo}
        }`;
            }
            ;
            `

      this.logger.debug(Creating Jules session with prompt: ${params.prompt.substring(0, 50)}`;
            ;
            const response = await this.httpClient.post('/sessions', requestBody);
            const session = response.data;
            // Track session
            this.activeSessions.set(session.name, session);
            this.rateLimits.dailyTasksUsed++;
            this.rateLimits.concurrentTasks++;
            this.logger.log(Session, created, $, { session, : .name } `);
      this.emit('session:created', session);

      return session;
    } catch (error) {
      this.logger.error(Failed to create session: ${this.getErrorMessage(error)});
      throw error;
    }
  }

  /**
   * Send a message to an existing session
   */
  async sendMessage(sessionId: string, message: string): Promise<void> {
    try {
      const requestBody = {
        message: {
          content: message
        }
      };
`, await this.httpClient.post(/sessions/$, { sessionId }, sendMessage, requestBody));
            `
      this.logger.debug(Message sent to session ${sessionId}`;
            ;
            this.emit('session:message_sent', { sessionId, message });
        }
        catch (error) {
            this.logger.error(Failed, to, send, message, $, { this: .getErrorMessage(error) });
            throw error;
        }
    }
    /**
     * Get session status
     */
    async getSession(sessionId) {
        `
    try {`;
        const response = await this.httpClient.get(`/sessions/${sessionId});
      const session: JulesSession = response.data;

      // Update local cache
      this.activeSessions.set(session.name, session);

      return session;
    } catch (error) {
      this.logger.error(Failed to get session: ${this.getErrorMessage(error)});
      throw error;
    }
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<JulesSession[]> {
    try {
      const response = await this.httpClient.get('/sessions');
      return response.data.sessions || [];`);
    }
    catch(error) {
        `
      this.logger.error(`;
        Failed;
        to;
        list;
        sessions: $;
        {
            this.getErrorMessage(error);
        }
        ;
        throw error;
    }
};
exports.GoogleJulesAdapter = GoogleJulesAdapter;
exports.GoogleJulesAdapter = GoogleJulesAdapter = GoogleJulesAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], GoogleJulesAdapter);
/**
 * Poll session until completion or timeout
 */
async;
waitForSessionCompletion(sessionId, string, options, {
    pollInterval: number, // milliseconds
    timeout: number
} = {});
Promise < JulesSession > {
    const: pollInterval = options.pollInterval || 5000, // 5 seconds
    const: timeout = options.timeout || this.config.sessionDefaults?.timeout || 300000, // 5 minutes
    const: startTime = Date.now(),
    while(Date) { }, : .now() - startTime < timeout
};
{
    const session = await this.getSession(sessionId);
    if (session.state === 'COMPLETED' || session.state === 'FAILED') {
        // Update concurrent task count
        if (this.activeSessions.has(session.name)) {
            this.rateLimits.concurrentTasks--;
            this.activeSessions.delete(session.name);
        }
        this.emit('session:completed', session);
        return session;
    }
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
}
`
    throw new Error(Session ${sessionId} timed out after ${timeout}`;
ms;
;
/**
 * Translate A2A message to Jules session
 */
async;
handleA2AMessage(message, AgentProtocolBridge_1.ProtocolMessage);
Promise < AgentProtocolBridge_1.ProtocolMessage > {
    const: a2aMessage = message.payload,
    try: {
        // Extract task details from A2A message
        const: prompt = this.a2aMessageToPrompt(a2aMessage),
        const: sourceContext = this.extractSourceContext(a2aMessage),
        // Create Jules session
        const: session = await this.createSession({
            prompt,
            sourceContext,
            autoApprove: this.config.sessionDefaults?.autoApprove
        }),
        // Wait for session completion (asynchronous coding task)
        const: completedSession = await this.waitForSessionCompletion(this.extractSessionId(session.name)),
        // Convert result back to A2A response
        return: this.julesResponseToA2A(a2aMessage, completedSession, message)
    }, catch(error) {
        this.logger.error(Failed, to, handle, A2A, message, $, { this: .getErrorMessage(error) } `);
      return this.createErrorResponse(a2aMessage, error, message);
    }
  }

  /**
   * Convert A2A message to Jules prompt
   */
  private a2aMessageToPrompt(a2aMessage: A2AMessage): string {
    const parts: string[] = [];

    // Add context header
    parts.push('=== Automated Task from The New Fuse Framework ===');
    parts.push(Task Type: ${a2aMessage.type});`, parts.push(Priority, $, { a2aMessage, : .priority } `);
    parts.push('');

    // Add the main task
    if (typeof a2aMessage.payload === 'string') {
      parts.push(a2aMessage.payload);
    } else {
      parts.push('Task Details:');
      parts.push(JSON.stringify(a2aMessage.payload, null, 2));
    }

    // Add metadata context
    if (a2aMessage.metadata) {
      parts.push('');
      parts.push('Additional Context:');
      parts.push(JSON.stringify(a2aMessage.metadata, null, 2));
    }

    return parts.join('\n');
  }

  /**
   * Extract source context from A2A message metadata
   */
  private extractSourceContext(a2aMessage: A2AMessage): { owner: string; repo: string } | undefined {
    // Check metadata for GitHub context
    if (a2aMessage.metadata?.github) {
      return {
        owner: a2aMessage.metadata.github.owner,
        repo: a2aMessage.metadata.github.repo
      };
    }

    // Check metadata for repository info
    if (a2aMessage.metadata?.repository) {
      const match = a2aMessage.metadata.repository.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2]
        };
      }
    }

    // Return default source
    return this.config.defaultSource;
  }

  /**
   * Extract session ID from session name
   */
  private extractSessionId(sessionName: string): string {
    return sessionName.replace('sessions/', '');
  }

  /**
   * Convert Jules response to A2A message
   */
  private julesResponseToA2A(
    originalMessage: A2AMessage,
    julesSession: JulesSession,
    originalProtocolMessage: ProtocolMessage
  ): ProtocolMessage {
    const responseMessage: A2AMessage = {
      id: jules-response-${Date.now()}`, fromAgent, this.config.agentId, toAgent, originalMessage.fromAgent, type, a2a_core_1.A2AMessageType.DATA_RESPONSE, payload, {
            sessionId: julesSession.name,
            state: julesSession.state,
            sourceContext: julesSession.sourceContext,
            completedAt: julesSession.updateTime,
            success: julesSession.state === 'COMPLETED'
        }, priority, originalMessage.priority, timestamp, Date.now(), metadata, {
            correlationId: originalMessage.id,
            originalType: originalMessage.type,
            processedBy: 'google-jules',
            processedAt: new Date().toISOString(),
            sessionName: julesSession.name
        }));
    },
    return: {
        id: protocol - $
    }
};
{
    responseMessage.id;
}
type: a2a_core_1.A2AMessageType.DATA_RESPONSE,
    protocol;
prisma_enums_1.ProtocolType.A2A_V1,
    payload;
responseMessage,
    metadata;
{
    originalProtocolMessage.metadata,
        translatedFrom;
    prisma_enums_1.ProtocolType.GOOGLE_JULES,
        translatedAt;
    new Date().toISOString();
}
timestamp: new Date();
;
createErrorResponse(originalMessage, a2a_core_1.A2AMessage, error, unknown, originalProtocolMessage, AgentProtocolBridge_1.ProtocolMessage);
AgentProtocolBridge_1.ProtocolMessage;
{
    const errorMessage = {} `
      id: jules-error-${Date.now()}`, fromAgent, config, agentId, toAgent, type, payload, priority, timestamp;
    (),
        metadata;
    {
        correlationId: originalMessage.id,
            errorType;
        'jules_api_error';
        return {
            id: protocol - $
        };
        {
            errorMessage.id;
        }
        `,
      type: A2AMessageType.ERROR_NOTIFICATION,
      protocol: ProtocolType.A2A_V1,
      payload: errorMessage,
      metadata: {
        ...originalProtocolMessage.metadata,
        errorOccurred: true,
        errorAt: new Date().toISOString()
      },
      timestamp: new Date()
    };
  }

  /**
   * Get error message from unknown error type
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message;
    }
    return String(error);
  }

  /**
   * Get adapter status
   */
  getStatus(): {
    agentId: string;
    agentName: string;
    activeSessions: number;
    rateLimits: RateLimitTracker;
    config: Partial<GoogleJulesConfig>;
  } {
    return {
      agentId: this.config.agentId,
      agentName: this.config.agentName,
      activeSessions: this.activeSessions.size,
      rateLimits: { ...this.rateLimits },
      config: {
        baseUrl: this.config.baseUrl,
        defaultSource: this.config.defaultSource,
        usageTier: this.config.usageTier,
        sessionDefaults: this.config.sessionDefaults
      }
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.activeSessions.clear();
    this.removeAllListeners();
    this.logger.log(Google Jules Adapter destroyed for agent: ${this.config.agentId}`;
        ;
    }
}
//# sourceMappingURL=GoogleJulesAdapter.js.map