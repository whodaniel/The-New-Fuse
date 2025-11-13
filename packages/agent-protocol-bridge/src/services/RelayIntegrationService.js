"use strict";
/**
 * RelayIntegrationService
 * Integrates the enhanced TNF relay with the backend AgentHub
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
var RelayIntegrationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const AgentHub_1 = require("./AgentHub");
const errors_1 = require("../utils/errors");
/**
 * Service that bridges the gap between the enhanced TNF relay and the backend AgentHub
 *
 * Features:
 * - WebSocket connection management to enhanced TNF relay
 * - Message translation between relay and AgentHub protocols
 * - Agent registration bridging
 * - Task execution routing
 * - Chrome extension integration
 * - Session management for AI automation
 * - Error handling and retry mechanisms
 * - Health monitoring and auto-reconnection
 *
 * Environment Variables:
 * - TNF_RELAY_WS_URL: WebSocket URL for the relay (default: ws://localhost:3001)
 * - TNF_RELAY_HTTP_PORT: HTTP port for the relay server (default: 3007)
 * - TNF_RELAY_WS_PORT: WebSocket port for the relay server (default: 3001)
 */
let RelayIntegrationService = RelayIntegrationService_1 = class RelayIntegrationService {
    agentHub;
    eventEmitter;
    logger = new common_1.Logger(RelayIntegrationService_1.name);
    relayWebSocket = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    reconnectDelay = 5000;
    isConnected = false;
    messageQueue = [];
    registeredAgents = new Map();
    activeSessions = new Map();
    heartbeatInterval = null;
    constructor(agentHub, eventEmitter) {
        this.agentHub = agentHub;
        this.eventEmitter = eventEmitter;
    }
    async onModuleInit() {
        this.logger.log('Initializing RelayIntegrationService');
        await this.connectToRelay();
        this.setupEventListeners();
    }
    async onModuleDestroy() {
        this.logger.log('Shutting down RelayIntegrationService');
        await this.disconnect();
    }
    /**
     * Connect to the enhanced TNF relay WebSocket server
     */
    async connectToRelay() {
        // Use environment variable or default to match enhanced-tnf-relay.js default WS port
        const relayUrl = process.env.TNF_RELAY_WS_URL || 'ws://localhost:3001';
        try {
            this.logger.log(`Connecting to TNF relay at ${relayUrl});
      this.relayWebSocket = new WebSocket(relayUrl);
      
      this.relayWebSocket.on('open', () => {
        this.logger.log('Connected to TNF relay');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.processMessageQueue();
        
        // Emit connection event
        this.eventEmitter.emit('relay.connected', { url: relayUrl });
        
        // Send initialization message
        this.sendMessage({
          id: this.generateMessageId(),
          type: 'agent_registration',
          source: 'hub',
          payload: {
            type: 'hub_connected',
            capabilities: ['plan_execution', 'verification', 'orchestration', 'monitoring'],
            version: '1.0.0'
          },
          timestamp: new Date().toISOString()
        });
      });
      
      this.relayWebSocket.on('message', (data: Buffer) => {
        try {
          const message: RelayMessage = JSON.parse(data.toString());
          this.handleRelayMessage(message);
        } catch (error) {
          this.logger.error('Failed to parse relay message', error);
        }
      });
      
      this.relayWebSocket.on('error', (error) => {
        this.logger.error('Relay WebSocket error', error);
        this.eventEmitter.emit('relay.error', { error: errorToMessage(error) });
      });
      
      this.relayWebSocket.on('close', () => {
        this.logger.warn('Relay WebSocket connection closed');
        this.isConnected = false;
        this.stopHeartbeat();
        this.eventEmitter.emit('relay.disconnected');
        this.attemptReconnection();
      });
      
    } catch (error) {
      this.logger.error('Failed to connect to relay', error);
      this.attemptReconnection();
    }
  }

  /**
   * Handle incoming messages from the relay
   */
  private async handleRelayMessage(message: RelayMessage): Promise<void> {`, this.logger.debug(`Received relay message: ${message.type}`, { messageId: message.id }));
            try {
                switch (message.type) {
                    case 'agent_registration':
                        await this.handleAgentRegistration(message);
                        break;
                    case 'task_execution':
                        await this.handleTaskExecution(message);
                        break;
                    case 'status_update':
                        await this.handleStatusUpdate(message);
                        break;
                    case 'chrome_extension':
                        await this.handleChromeExtensionMessage(message);
                        break;
                    case 'session_request':
                        await this.handleSessionRequest(message);
                        break;
                    case 'error':
                        await this.handleErrorMessage(message);
                        break;
                    default:
                        this.logger.warn(Unknown, message, type, $, { message, : .type }, { message });
                }
            }
            catch (error) {
                `
      this.logger.error(Failed to handle relay message: ${message.type}`, (0, errors_1.errorToMessage)(error);
                ;
                // Send error response back to relay
                this.sendMessage({
                    id: this.generateMessageId(),
                    type: 'error',
                    source: 'hub',
                    target: message.source,
                    payload: {
                        originalMessageId: message.id,
                        error: (0, errors_1.errorToMessage)(error),
                        timestamp: new Date().toISOString()
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }
        /**
         * Handle agent registration from relay
         */
        finally {
        }
        /**
         * Handle agent registration from relay
         */
    }
    /**
     * Handle agent registration from relay
     */
    async handleAgentRegistration(message) {
        const registration = message.payload;
        this.logger.log(Registering, agent, $, { registration, : .agentId }, { capabilities: registration.capabilities });
        // Store registration locally
        this.registeredAgents.set(registration.agentId, registration);
        // Register with AgentHub
        try {
            await this.agentHub.registerAgent({
                id: registration.agentId,
                name: registration.metadata?.name || registration.agentId,
                type: registration.metadata?.type || 'RELAY_AGENT',
                status: registration.status,
            } `
        capabilities: registration.capabilities.map(cap => ({`, name, cap, description, Capability, $, { cap } `,
          parameters: {}
        })),
        configuration: {
          provider: 'relay',
          command: registration.metadata?.command || 'relay-agent',
          defaultModel: registration.metadata?.defaultModel,
          localAI: false,
          autoDetected: true,
          systemAgent: false,
          a2aEnabled: true,
          mcpEnabled: false
        },
        metadata: {
          ...registration.metadata,
          source: 'relay',
          registeredAt: new Date().toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      this.eventEmitter.emit('agent.registered', registration);
      
      // Send confirmation back to relay
      this.sendMessage({
        id: this.generateMessageId(),
        type: 'status_update',
        source: 'hub',
        target: message.source,
        payload: {
          agentId: registration.agentId,
          status: 'registered',
          message: 'Agent successfully registered with AgentHub'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.logger.error(Failed to register agent ${registration.agentId}, errorToMessage(error));
      throw error;
    }
  }

  /**
   * Handle task execution request from relay
   */
  private async handleTaskExecution(message: RelayMessage): Promise<void> {`);
            const taskExecution = message.payload;
            `
    
    this.logger.log(Executing task: ${taskExecution.taskId} on agent: ${taskExecution.agentId}`;
            ;
            try {
                // Execute task through AgentHub
                const result = await this.agentHub.executeTask(taskExecution.agentId, taskExecution.payload?.prompt || taskExecution.taskType, {
                    timeout: taskExecution.options?.timeout,
                    maxRetries: taskExecution.options?.retries,
                    context: taskExecution.context ? {
                        workspaceRoot: taskExecution.context.workspaceRoot || process.cwd(),
                        files: taskExecution.context.files || [],
                        currentFile: taskExecution.context.currentFile,
                        selection: taskExecution.context.selection,
                        metadata: taskExecution.context.metadata || taskExecution.context
                    } : undefined,
                    background: false
                });
                this.eventEmitter.emit('task.executed', { taskId: taskExecution.taskId, result });
                // Send result back to relay
                this.sendMessage({
                    id: this.generateMessageId(),
                    type: 'status_update',
                    source: 'hub',
                    target: message.source,
                    payload: {
                        taskId: taskExecution.taskId,
                        status: 'completed',
                        result,
                        completedAt: new Date().toISOString()
                    },
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                this.logger.error(Failed, to, execute, task, $, { taskExecution, : .taskId } `, errorToMessage(error));
      
      // Send error back to relay
      this.sendMessage({
        id: this.generateMessageId(),
        type: 'error',
        source: 'hub',
        target: message.source,
        payload: {
          taskId: taskExecution.taskId,
          error: errorToMessage(error),
          failedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle status updates from relay
   */
  private async handleStatusUpdate(message: RelayMessage): Promise<void> {
    const { agentId, status, metadata } = message.payload;
    
    if (agentId && this.registeredAgents.has(agentId)) {
      const registration = this.registeredAgents.get(agentId)!;
      registration.status = status;
      registration.metadata = { ...registration.metadata, ...metadata };
      
      // Update AgentHub
      await this.agentHub.updateAgentStatus(agentId, status, metadata);
      
      this.eventEmitter.emit('agent.status_updated', { agentId, status, metadata });
    }
  }

  /**
   * Handle Chrome extension messages
   */
  private async handleChromeExtensionMessage(message: RelayMessage): Promise<void> {
    const { action, data } = message.payload;
    
    this.logger.log(Handling Chrome extension action: ${action});
    
    // Route Chrome extension messages through AgentHub
    const result = await this.agentHub.handleChromeExtensionAction({
      action,
      data,
      sessionId: message.sessionId,
      timestamp: message.timestamp
    });
    
    this.eventEmitter.emit('chrome_extension.action', { action, data, result });
    
    // Send result back to relay
    this.sendMessage({
      id: this.generateMessageId(),
      type: 'chrome_extension',
      source: 'hub',
      target: message.source,
      sessionId: message.sessionId,
      payload: {`, action, $, { action } `_response,
        result,
        originalMessageId: message.id
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle session requests from relay
   */
  private async handleSessionRequest(message: RelayMessage): Promise<void> {
    const sessionRequest: SessionRequest = message.payload;
    
    this.logger.log(Handling session request: ${sessionRequest.sessionId}`, type, $, { sessionRequest, : .type });
                // Store session
                this.activeSessions.set(sessionRequest.sessionId, sessionRequest);
                // Initialize session through AgentHub
                const sessionData = await this.agentHub.initializeSession({
                    sessionId: sessionRequest.sessionId,
                    type: sessionRequest.type,
                    config: sessionRequest.config,
                    chromeExtensionId: sessionRequest.chromeExtensionId
                });
                this.eventEmitter.emit('session.started', sessionData);
                // Send session confirmation back to relay
                this.sendMessage({
                    id: this.generateMessageId(),
                    type: 'session_request',
                    source: 'hub',
                    target: message.source,
                    sessionId: sessionRequest.sessionId,
                    payload: {
                        status: 'initialized',
                        sessionData,
                        message: 'Session successfully initialized'
                    },
                    timestamp: new Date().toISOString()
                });
            }
            /**
             * Handle error messages from relay
             */
        }
        /**
         * Handle error messages from relay
         */
        finally {
        }
        /**
         * Handle error messages from relay
         */
    }
    /**
     * Handle error messages from relay
     */
    async handleErrorMessage(message) {
        const { error, context } = message.payload;
        `
    this.logger.error(Relay error: ${error}` `, { context, messageId: message.id });
    this.eventEmitter.emit('relay.message_error', { error, context, message });
  }

  /**
   * Send message to relay
   */
  private sendMessage(message: RelayMessage): void {
    if (!this.isConnected || !this.relayWebSocket) {
      this.logger.warn('Relay not connected, queuing message', { messageId: message.id });
      this.messageQueue.push(message);
      return;
    }
    
    try {
      this.relayWebSocket.send(JSON.stringify(message));
      this.logger.debug(Sent message to relay: ${message.type}, { messageId: message.id });
    } catch (error) {
      this.logger.error('Failed to send message to relay', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;
    `;
        this.logger.log(Processing, $, { this: .messageQueue.length } ` queued messages);
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(message => {
      this.sendMessage(message);
    });
  }

  /**
   * Setup event listeners for AgentHub events
   */
  private setupEventListeners(): void {
    // Listen for AgentHub events and forward to relay
    this.eventEmitter.on('agenthub.task_completed', (data) => {
      this.sendMessage({
        id: this.generateMessageId(),
        type: 'status_update',
        source: 'hub',
        payload: {
          type: 'task_completed',
          ...data
        },
        timestamp: new Date().toISOString()
      });
    });
    
    this.eventEmitter.on('agenthub.agent_status_changed', (data) => {
      this.sendMessage({
        id: this.generateMessageId(),
        type: 'status_update',
        source: 'hub',
        payload: {
          type: 'agent_status_changed',
          ...data
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.relayWebSocket) {
        this.sendMessage({
          id: this.generateMessageId(),
          type: 'status_update',
          source: 'hub',
          payload: {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt reconnection to relay
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached, giving up');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    this.logger.log(Attempting reconnection ${this.reconnectAttempts}` / $, { this: .maxReconnectAttempts } in $, { delay }, ms);
        setTimeout(() => {
            this.connectToRelay();
        }, delay);
    }
    /**
     * Disconnect from relay
     */
    async disconnect() {
        this.stopHeartbeat();
        if (this.relayWebSocket) {
            this.relayWebSocket.close();
            this.relayWebSocket = null;
        }
        this.isConnected = false;
        this.registeredAgents.clear();
        this.activeSessions.clear();
        this.messageQueue = [];
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        `
    return msg_${Date.now()}`;
        _$;
        {
            Math.random().toString(36).substr(2, 9);
        }
        `;
  }

  /**
   * Public methods for external use
   */

  /**
   * Get connection status
   */
  public getConnectionStatus(): { connected: boolean; reconnectAttempts: number; queueSize: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.messageQueue.length
    };
  }

  /**
   * Get registered agents
   */
  public getRegisteredAgents(): AgentRegistration[] {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Get active sessions
   */
  public getActiveSessions(): SessionRequest[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Force reconnection
   */
  public async forceReconnect(): Promise<void> {
    this.logger.log('Forcing reconnection to relay');
    await this.disconnect();
    this.reconnectAttempts = 0;
    await this.connectToRelay();
  }

  /**
   * Send custom message to relay
   */
  public sendCustomMessage(type: string, payload: any, target?: string): void {
    this.sendMessage({
      id: this.generateMessageId(),
      type: type as any,
      source: 'hub',
      target,
      payload,
      timestamp: new Date().toISOString()
    });
  }
};
    }
};
exports.RelayIntegrationService = RelayIntegrationService;
exports.RelayIntegrationService = RelayIntegrationService = RelayIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AgentHub_1.AgentHub, typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object])
], RelayIntegrationService);
//# sourceMappingURL=RelayIntegrationService.js.map