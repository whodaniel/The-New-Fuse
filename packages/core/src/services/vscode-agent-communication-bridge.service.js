"use strict";
/**
 * VSCode Agent Communication Bridge Service
 * Enables seamless bidirectional communication between AI agents and VSCode extensions
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
var VSCodeAgentCommunicationBridge_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeAgentCommunicationBridge = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const ws_1 = require("ws");
let VSCodeAgentCommunicationBridge = VSCodeAgentCommunicationBridge_1 = class VSCodeAgentCommunicationBridge {
    eventEmitter;
    logger = new common_1.Logger(VSCodeAgentCommunicationBridge_1.name);
    wss;
    extensionConnections = new Map();
    messageHandlers = new Map();
    heartbeatInterval;
    bridgeConfig = {
        port: 8765,
        heartbeatInterval: 30000,
        messageTimeout: 60000,
        maxRetries: 3
    };
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.initializeCommunicationBridge();
        this.setupMessageHandlers();
    }
    /**
     * Initialize the WebSocket server for VSCode extension communication
     */
    async initializeCommunicationBridge() {
        try {
            this.wss = new ws_1.WebSocketServer({
                port: this.bridgeConfig.port,
                path: '/vscode-agent-bridge'
            });
            this.wss.on('connection', (ws, request) => {
                this.handleExtensionConnection(ws, request);
            });
            this.startHeartbeatService();
            this.logger.log(`VSCode Agent Communication Bridge started on port ${this.bridgeConfig.port});
    } catch (error) {
      this.logger.error('Failed to initialize communication bridge', error as any);
      throw error;
    }
  }

  /**
   * Handle new VSCode extension connection
   */
  private handleExtensionConnection(ws: WebSocket, request: any): void {
    const connectionId = this.generateConnectionId();

    ws.on('message', (data) => {
      this.handleExtensionMessage(connectionId, data);
    });

    ws.on('close', () => {
      this.handleExtensionDisconnection(connectionId);
    });

    ws.on('error', (error) => {`, this.logger.error(`WebSocket error for connection ${connectionId}`, error));
            this.handleExtensionError(connectionId, error);
        }
        finally // Send connection acknowledgment
         { }
        ;
        // Send connection acknowledgment
        this.sendMessage(ws, {
            id: this.generateMessageId(),
            type: 'event',
            source: 'bridge',
            sourceId: 'vscode-agent-bridge',
            payload: {
                event: 'connection_established',
                connectionId,
                bridgeVersion: '1.0.0',
                capabilities: [
                    'agent_delegation',
                    'bidirectional_communication',
                    'real_time_events',
                    'extension_coordination',
                    'context_sharing'
                ]
            },
            timestamp: new Date(),
            priority: 'medium'
        });
        this.logger.debug(VSCode, extension, connected, $, { connectionId });
    }
    /**
     * Handle incoming messages from VSCode extensions
     */
    async handleExtensionMessage(connectionId, data) {
        try {
            const message = JSON.parse(data.toString());
            const connection = this.extensionConnections.get(connectionId);
            // Update connection activity
            if (connection) {
                connection.lastActivity = new Date();
            }
            `
      this.logger.debug(Received message from extension ${connectionId}`;
            message.type;
            ;
            switch (message.type) {
                case 'command':
                    await this.handleExtensionCommand(connectionId, message);
                    break;
                case 'request':
                    await this.handleExtensionRequest(connectionId, message);
                    break;
                case 'response':
                    await this.handleExtensionResponse(connectionId, message);
                    break;
                case 'event':
                    await this.handleExtensionEvent(connectionId, message);
                    break;
                case 'heartbeat':
                    await this.handleHeartbeat(connectionId, message);
                    break;
                default:
                    this.logger.warn(Unknown, message, type, $, { message, : .type });
            }
            // Emit general message event
            this.eventEmitter.emit('vscode.extension.message', {
                connectionId,
                message,
                extension: connection
            });
            `
`;
        }
        catch (error) {
            this.logger.error(Failed, to, handle, extension, message, from, $, { connectionId } `, error as any);
      this.sendErrorResponse(connectionId, error);
    }
  }

  /**
   * Handle VSCode extension commands
   */
  private async handleExtensionCommand(connectionId: string, message: AgentExtensionMessage): Promise<void> {
    const connection = this.extensionConnections.get(connectionId);
    if (!connection) return;

    const { command, payload } = message;

    switch (command) {
      case 'register_extension':
        await this.registerExtension(connectionId, payload);
        break;

      case 'delegate_to_agent':
        await this.delegateToAgent(connectionId, payload as AgentDelegationRequest);
        break;

      case 'request_agent_analysis':
        await this.requestAgentAnalysis(connectionId, payload);
        break;

      case 'coordinate_with_extensions':
        await this.coordinateWithExtensions(connectionId, payload);
        break;

      case 'share_context':
        await this.shareContext(connectionId, payload);
        break;

      default:
        this.logger.warn(Unknown extension command: ${command});
    }
  }` `
  private async handleExtensionRequest(connectionId: string, message: AgentExtensionMessage): Promise<void> {
    this.logger.debug(Handling extension request: ${message.command}`);
        }
    }
    async handleExtensionResponse(connectionId, message) {
        this.logger.debug(Handling, extension, response);
        for (; ; )
            : $;
        {
            message.correlationId;
        }
        ;
    }
};
exports.VSCodeAgentCommunicationBridge = VSCodeAgentCommunicationBridge;
exports.VSCodeAgentCommunicationBridge = VSCodeAgentCommunicationBridge = VSCodeAgentCommunicationBridge_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], VSCodeAgentCommunicationBridge);
`
`;
async;
handleExtensionEvent(connectionId, string, message, AgentExtensionMessage);
Promise < void  > {
    this: .logger.debug(Handling, extension, event, $, { message, : .payload.event } `);
  }

  /**
   * Register VSCode extension with the bridge
   */
  private async registerExtension(connectionId: string, payload: any): Promise<void> {
    const connection: VSCodeExtensionConnection = {
      id: connectionId,
      extensionId: payload.extensionId,
      extensionName: payload.extensionName,
      websocket: this.getWebSocketByConnectionId(connectionId),
      capabilities: payload.capabilities || [],
      status: 'connected',
      lastActivity: new Date(),
      version: payload.version || '1.0.0'
    };

    this.extensionConnections.set(connectionId, connection);

    // Notify agents of new extension
    this.eventEmitter.emit('vscode.extension.registered', {
      connectionId,
      extension: connection
    });

    // Send registration confirmation
    await this.sendExtensionMessage(connectionId, {
      type: 'response',
      payload: {
        success: true,
        message: 'Extension registered successfully',
        connectionId,
        bridgeCapabilities: [
          'agent_federation_integration',
          'multi_agent_coordination',
          'real_time_collaboration',
          'context_synchronization'
        ]
      }
    });

    this.logger.log(Registered extension: ${payload.extensionName} (${payload.extensionId}`)
};
async;
delegateToAgent(connectionId, string, request, AgentDelegationRequest);
Promise < void  > {
    try: {
        // Emit agent delegation request
        const: delegationId = this.generateMessageId(),
        this: .eventEmitter.emit('agent.delegation.request', {
            delegationId,
            extensionConnectionId: connectionId,
            agentId: request.agentId,
            taskType: request.taskType,
            payload: request.payload,
            context: request.context,
            coordination: request.coordination
        }),
        // Send acknowledgment to extension
        await, this: .sendExtensionMessage(connectionId, {
            type: 'response',
            payload: {
                success: true,
                delegationId,
                message: Task, delegated, to, agent, $
            }
        }, { request, : .agentId }, estimatedCompletion, this.estimateTaskCompletion(request.taskType))
    }
};
;
`
      this.logger.log(Delegated task to agent ${request.agentId} from extension ${connectionId}` `);
    } catch (error) {
      this.logger.error('Failed to delegate to agent', error as any);
      await this.sendErrorResponse(connectionId, error);
    }
  }

  /**
   * Request analysis from AI agent
   */
  private async requestAgentAnalysis(connectionId: string, payload: any): Promise<void> {
    const analysisId = this.generateMessageId();

    this.eventEmitter.emit('agent.analysis.request', {
      analysisId,
      extensionConnectionId: connectionId,
      analysisType: payload.analysisType,
      context: payload.context,
      requirements: payload.requirements
    });

    await this.sendExtensionMessage(connectionId, {
      type: 'response',
      payload: {
        success: true,
        analysisId,
        message: 'Analysis request submitted to agent federation');
  }

  /**
   * Coordinate with multiple VSCode extensions
   */
  private async coordinateWithExtensions(connectionId: string, payload: any): Promise<void> {
    const coordinationId = this.generateMessageId();
    const targetExtensions = payload.targetExtensions || [];

    // Broadcast coordination request to target extensions
    for (const targetExtensionId of targetExtensions) {
      const targetConnection = this.findExtensionConnection(targetExtensionId);
      if (targetConnection) {
        await this.sendExtensionMessage(targetConnection.id, {
          type: 'request',
          payload: {
            requestType: 'coordination_invitation',
            coordinationId,
            initiatorExtension: this.extensionConnections.get(connectionId)?.extensionId,
            coordinationTask: payload.task,
            requiredCapabilities: payload.requiredCapabilities
          },
          requiresResponse: true
        });
      }
    }

    // Emit coordination event
    this.eventEmitter.emit('vscode.extension.coordination', {
      coordinationId,
      initiatorConnectionId: connectionId,
      targetExtensions,
      task: payload.task
    });
  }

  /**
   * Share context between extensions and agents
   */
  private async shareContext(connectionId: string, payload: any): Promise<void> {
    const contextId = this.generateMessageId();

    // Broadcast context to interested parties
    this.eventEmitter.emit('context.shared', {
      contextId,
      sourceExtension: connectionId,
      contextType: payload.contextType,
      context: payload.context,
      targetAudience: payload.targetAudience || 'all'
    });

    // Distribute to other extensions if requested
    if (payload.shareWithExtensions) {
      for (const [connId, connection] of this.extensionConnections) {
        if (connId !== connectionId) {
          await this.sendExtensionMessage(connId, {
            type: 'event',
            payload: {
              event: 'context_shared',
              contextId,
              sourceExtension: this.extensionConnections.get(connectionId)?.extensionId,
              context: payload.context
            }
          });
        }
      }
    }
  }

  /**
   * Handle extension disconnect
   */
  private handleExtensionDisconnection(connectionId: string): void {
    const connection = this.extensionConnections.get(connectionId);
    if (connection) {
      connection.status = 'disconnected';

      this.eventEmitter.emit('vscode.extension.disconnected', {
        connectionId,
        extension: connection
      });

      this.extensionConnections.delete(connectionId);
      this.logger.log(Extension disconnected: ${connection.extensionName});
    }
  }

  /**
   * Send message to agent from bridge (used by agents to communicate with extensions)
   */
  async sendMessageToExtension(extensionId: string, message: any): Promise<boolean> {
    const connection = this.findExtensionConnection(extensionId);
    if (!connection || connection.status !== 'connected') {`;
this.logger.warn(Extension, $, { extensionId } ` not available for messaging);
      return false;
    }

    try {
      await this.sendExtensionMessage(connection.id, {
        type: 'command',
        payload: {
          command: 'agent_message',
          data: message,
          timestamp: new Date()
        }
      });

      return true;
    } catch (error) {
      this.logger.error(Failed to send message to extension ${extensionId}`, error);
return false;
/**
 * Broadcast message to all connected extensions
 */
async;
broadcastToExtensions(message, any, filter ?  : (connection) => boolean);
Promise < number > {
    let, sentCount = 0,
    : .extensionConnections.values()
};
{
    if (filter && !filter(connection))
        continue;
    if (connection.status !== 'connected')
        continue;
    try {
        await this.sendExtensionMessage(connection.id, {
            type: 'event',
            payload: {
                event: 'broadcast_message',
                message,
                timestamp: new Date()
            }
        });
        sentCount++;
    }
    catch (error) {
        this.logger.error(Failed, to, broadcast, to, extension, $, { connection, : .extensionId }, error);
    }
}
return sentCount;
/**
 * Request capabilities from all connected extensions
 */
async;
requestExtensionCapabilities();
Promise < Map < string, string[] >> {
    const: capabilities = new Map(),
    : .extensionConnections.values()
};
{
    if (connection.status === 'connected') {
        capabilities.set(connection.extensionId, connection.capabilities);
    }
}
return capabilities;
findExtensionConnection(extensionId, string);
VSCodeExtensionConnection | null;
{
    for (const connection of this.extensionConnections.values()) {
        if (connection.extensionId === extensionId) {
            return connection;
        }
    }
    return null;
}
async;
sendExtensionMessage(connectionId, string, messageData, (Partial));
Promise < void  > {
    const: connection = this.extensionConnections.get(connectionId),
    if(, connection) { }
} || connection.status !== 'connected';
{
    `
      throw new Error(`;
    Extension;
    connection;
    $;
    {
        connectionId;
    }
    not;
    available;
    ;
}
const message = {
    id: this.generateMessageId(),
    type: messageData.type || 'event',
    source: 'bridge',
    sourceId: 'vscode-agent-bridge',
    targetId: connection.extensionId,
    payload: messageData.payload || {},
    timestamp: new Date(),
    priority: messageData.priority || 'medium',
    ...messageData
};
if (connection.websocket) {
    this.sendMessage(connection.websocket, message);
}
sendMessage(ws, ws_1.WebSocket, message, any);
void {
    if(ws) { }, : .readyState === ws_1.WebSocket.OPEN
};
{
    ws.send(JSON.stringify(message));
}
async;
sendErrorResponse(connectionId, string, error, any);
Promise < void  > {
    try: {
        await, this: .sendExtensionMessage(connectionId, {
            type: 'response',
            payload: {
                success: false,
                error: error.message || 'Unknown error',
                timestamp: new Date()
            }
        })
    }, catch(sendError) {
        this.logger.error('Failed to send error response', sendError);
    }
};
setupMessageHandlers();
void {
    // Listen for agent responses to extension requests
    this: .eventEmitter.on('agent.delegation.response', (data) => {
        this.handleAgentDelegationResponse(data);
    }),
    this: .eventEmitter.on('agent.analysis.response', (data) => {
        this.handleAgentAnalysisResponse(data);
    }),
    // Listen for agent-initiated extension interactions
    this: .eventEmitter.on('agent.extension.command', (data) => {
        this.handleAgentExtensionCommand(data);
    })
};
async;
handleAgentDelegationResponse(data, any);
Promise < void  > {
    const: { extensionConnectionId, delegationId, response, success } = data,
    await, this: .sendExtensionMessage(extensionConnectionId, {
        type: 'response',
        payload: {
            responseType: 'delegation_result',
            delegationId,
            success,
            result: response,
            timestamp: new Date()
        },
        correlationId: delegationId
    })
};
async;
handleAgentAnalysisResponse(data, any);
Promise < void  > {
    const: { extensionConnectionId, analysisId, analysis, confidence } = data,
    await, this: .sendExtensionMessage(extensionConnectionId, {
        type: 'response',
        payload: {
            responseType: 'analysis_result',
            analysisId,
            analysis,
            confidence,
            timestamp: new Date()
        },
        correlationId: analysisId
    })
};
async;
handleAgentExtensionCommand(data, any);
Promise < void  > {
    const: { extensionId, command, args, context } = data,
    const: success = await this.sendMessageToExtension(extensionId, {
        type: 'agent_command',
        command,
        args,
        context,
        timestamp: new Date()
    })
} `
`;
if (success) {
    this.logger.debug(Sent, agent, command, $, { command }, to, extension, $, { extensionId } `);
    }
  }

  /**
   * Start heartbeat service
   */
  private startHeartbeatService(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [connectionId, connection] of this.extensionConnections) {
        if (connection.status === 'connected') {
          const timeSinceActivity = Date.now() - connection.lastActivity.getTime();

          if (timeSinceActivity > this.bridgeConfig.heartbeatInterval * 2) {
            this.logger.warn(Extension ${connection.extensionId} appears inactive);
            connection.status = 'error';
          } else if (connection.websocket) {
            // Send heartbeat
            this.sendMessage(connection.websocket, {
              id: this.generateMessageId(),
              type: 'heartbeat',
              source: 'bridge',
              sourceId: 'vscode-agent-bridge',
              payload: { timestamp: new Date() },
              timestamp: new Date(),
              priority: 'low'
            });
          }
        }
      }
    }, this.bridgeConfig.heartbeatInterval);
  }

  /**
   * Handle heartbeat from extension
   */
  private async handleHeartbeat(connectionId: string, message: AgentExtensionMessage): Promise<void> {
    const connection = this.extensionConnections.get(connectionId);
    if (connection) {
      connection.lastActivity = new Date();
      connection.status = 'connected';
    }
  }

  /**
   * Handle extension errors
   */
  private handleExtensionError(connectionId: string, error: any): void {
    console.log('DEBUG: handleExtensionError - error:', error, 'typeof:', typeof error);
    const connection = this.extensionConnections.get(connectionId);
    if (connection) {
      connection.status = 'error';

      this.eventEmitter.emit('vscode.extension.error', {
        connectionId,
        extension: connection,
        error: (error as any).message
      });
    }
  }

  /**
   * Estimate task completion time
   */
  private estimateTaskCompletion(taskType: string): number {
    const estimationMap: Record<string, number> = {
      'code_generation': 30000,
      'code_review': 45000,
      'code_analysis': 20000,
      'refactoring': 60000,
      'documentation': 40000,
      'debugging': 90000,
      'testing': 50000
    };

    return estimationMap[taskType] || 30000; // Default 30 seconds
  }

  /**
   * Get WebSocket by connection ID
   */
  private getWebSocketByConnectionId(connectionId: string): WebSocket | null {
    const connection = this.extensionConnections.get(connectionId);
    return connection?.websocket || null;
  }

  /**
   * Generate unique connection ID`
        * /`, private, generateConnectionId(), string, {
        return: ext_conn_$
    }, { Date, : .now() } `_${Math.random().toString(36).substr(2, 9)};
  }

  /**
   * Generate unique message ID`
        * /`, private, generateMessageId(), string, {
        return: msg_$
    }, { Date, : .now() } `_${Math.random().toString(36).substr(2, 9)}`);
}
/**
 * Get bridge status
 */
getBridgeStatus();
any;
{
    const connections = Array.from(this.extensionConnections.values());
    return {
        serverPort: this.bridgeConfig.port,
        totalConnections: connections.length,
        connectionsByStatus: {
            connected: connections.filter(c => c.status === 'connected').length,
            disconnected: connections.filter(c => c.status === 'disconnected').length,
            error: connections.filter(c => c.status === 'error').length
        },
        extensions: connections.map(c => ({
            id: c.extensionId,
            name: c.extensionName,
            status: c.status,
            capabilities: c.capabilities,
            lastActivity: c.lastActivity,
            version: c.version
        })),
        uptime: process.uptime()
    };
}
/**
 * Cleanup resources
 */
async;
cleanup();
Promise < void  > {
    : .heartbeatInterval
};
{
    clearInterval(this.heartbeatInterval);
}
// Close all WebSocket connections
for (const connection of this.extensionConnections.values()) {
    if (connection.websocket && connection.websocket.readyState === ws_1.WebSocket.OPEN) {
        connection.websocket.close();
    }
}
if (this.wss) {
    this.wss.close();
}
this.extensionConnections.clear();
this.logger.log('VSCode Agent Communication Bridge cleaned up');
//# sourceMappingURL=vscode-agent-communication-bridge.service.js.map