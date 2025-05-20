import WebSocket from 'ws';
import { Logger } from 'winston';
import { EventEmitter } from 'events';
import { Agent, Pipeline } from '@the-new-fuse/types';

export class WebSocketManager extends EventEmitter {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocket> = new Map<string, WebSocket>();

  constructor(
    private port: number,
    private logger: Logger
  ) {
    super();
    this.wss = new WebSocket.Server({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = req.headers['x-client-id'] as string;
      this.clients.set(clientId, ws);

      ws.on('message', (message: WebSocket.Data) => {
        this.handleMessage(clientId, message);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocket.Data): void {
    try {
      const data = JSON.parse(message.toString());
      this.emit('message', { clientId, data });
    } catch (error) {
      this.logger.error('Failed to parse WebSocket message', error);
    }
  }

  broadcastAgentUpdate(agent: Agent): void {
    this.broadcast('agent:update', agent);
  }

  broadcastPipelineUpdate(pipeline: Pipeline): void {
    this.broadcast('pipeline:update', pipeline);
  }

  broadcast(event: string, data: unknown): void {
    try {
      const message = JSON.stringify({ event, data });

      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      this.logger.error('Failed to broadcast message', error);
    }
  }
}