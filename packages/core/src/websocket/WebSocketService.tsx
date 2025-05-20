import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { ConfigService } from '../config/ConfigService.js';

interface WebSocketMessage {
  type: string;
  payload: unknown;
}

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {
  private wss: Server;
  private readonly clients: Set<WebSocket> = new Set();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const port = Number(this.configService.get('WS_PORT')) || 8080;
    this.wss = new Server({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        try {
          const data: WebSocketMessage = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.wss.close(() => {
        this.clients.clear();
        resolve();
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.warn('Unknown message type:', message.type);
        break;
    }
  }

  broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}