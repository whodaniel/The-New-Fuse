import { Logger } from '@the-new-fuse/utils';
import WebSocket, { Server as WebSocketServer, IncomingMessage } from 'ws';
import { Agent } from '../types/agent.js';
import { Pipeline } from '../types/pipeline.js';
import { EventEmitter } from 'events';

interface ExtendedWebSocket extends WebSocket {
  id?: string;
}

export class WebSocketManager extends EventEmitter {
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private wss: WebSocketServer;
  
  constructor(
    private readonly logger: Logger,
    port: number = 8080
  ) {
    super();
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
      const clientId = req.headers['x-client-id'] as string;
      ws.id = clientId;
      this.clients.set(clientId, ws);

      ws.on('message', (message: string) => {
        this.handleMessage(clientId, message);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });
    });
  }

  public broadcastAgentUpdate(agent: Agent): void {
    this.broadcast('agent:update', agent);
  }

  public broadcastPipelineUpdate(pipeline: Pipeline): void {
    this.broadcast('pipeline:update', pipeline);
  }

  private handleMessage(clientId: string, message: string): void {
    try {
      const data = JSON.parse(message);
      this.emit('message', { clientId, data });
    } catch (error) {
      this.logger.error('Failed to parse WebSocket message', {
        clientId,
        message,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private broadcast(event: string, data: unknown): void {
    const message = JSON.stringify({ event, data });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}