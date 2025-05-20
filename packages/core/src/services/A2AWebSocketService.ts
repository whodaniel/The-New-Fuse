import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'ws';
import { Logger } from '../utils/logger.js';
import { A2AMessage } from '../protocols/A2AProtocolHandler.js';
import { AgentCardService } from './AgentCardService.js';
import { ProtocolAdapterService } from '../protocols/ProtocolAdapterService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  protocol: string;
  agentId?: string;
}

interface SSEClient {
  id: string;
  send: (data: string) => void;
  close: () => void;
}

@Injectable()
export class A2AWebSocketService implements OnModuleInit {
  private wss: Server;
  private clients: Map<string, WebSocketClient> = new Map();
  private logger = new Logger(A2AWebSocketService.name);
  private sseClients: Map<string, SSEClient> = new Map();

  constructor(
    private agentCardService: AgentCardService,
    private protocolAdapter: ProtocolAdapterService,
    private eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    this.initializeWebSocket();
    this.initializeSSE();
  }

  private initializeWebSocket() {
    this.wss = new Server({ port: 8080 });

    this.wss.on('connection', (ws, req) => {
      const clientId = Math.random().toString(36).substring(7);
      const protocol = req.headers['x-protocol-version'] as string || 'a2a-v2.0';

      this.clients.set(clientId, { id: clientId, ws, protocol });

      ws.on('message', async (data: string) => {
        try {
          const message = JSON.parse(data) as A2AMessage;
          await this.handleIncomingMessage(clientId, message);
        } catch (error) {
          this.logger.error('Error handling WebSocket message', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });
    });
  }

  private initializeSSE() {
    // Set up SSE endpoint using your preferred HTTP framework
    // This is a placeholder for the actual implementation
    this.eventEmitter.on('a2a.message', (message: A2AMessage) => {
      this.broadcastSSE(message);
    });
  }

  private async handleIncomingMessage(clientId: string, message: A2AMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // Check if protocol adaptation is needed
      if (client.protocol !== 'a2a-v2.0') {
        message = await this.protocolAdapter.adaptMessage(
          message,
          client.protocol,
          'a2a-v2.0'
        );
      }

      // Find target agent
      const targetAgent = this.agentCardService.getAgentById(message.header.target);
      if (!targetAgent) {
        throw new Error(`Target agent ${message.header.target} not found`);
      }

      // Emit event for message routing
      this.eventEmitter.emit('a2a.message', message);

      // Send to target clients
      this.broadcastMessage(message);
    } catch (error) {
      this.logger.error('Error processing message', error);
      this.sendErrorToClient(clientId, error);
    }
  }

  private broadcastMessage(message: A2AMessage) {
    const targetClients = Array.from(this.clients.values()).filter(
      client => !message.header.target || client.agentId === message.header.target
    );

    targetClients.forEach(async (client) => {
      try {
        const adaptedMessage = client.protocol === 'a2a-v2.0'
          ? message
          : await this.protocolAdapter.adaptMessage(message, 'a2a-v2.0', client.protocol);

        client.ws.send(JSON.stringify(adaptedMessage));
      } catch (error) {
        this.logger.error(`Error sending message to client ${client.id}`, error);
      }
    });
  }

  private broadcastSSE(message: A2AMessage) {
    this.sseClients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  private sendErrorToClient(clientId: string, error: Error) {
    const client = this.clients.get(clientId);
    if (client) {
      const errorMessage = {
        header: {
          id: Math.random().toString(36).substring(7),
          type: 'error',
          version: 'v2.0',
          priority: 'high',
          source: 'system'
        },
        body: {
          content: { error: error.message },
          metadata: { sent_at: Date.now() }
        }
      };
      client.ws.send(JSON.stringify(errorMessage));
    }
  }
}