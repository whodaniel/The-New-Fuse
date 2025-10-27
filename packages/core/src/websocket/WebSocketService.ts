import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketService.name);
  private wss: WebSocket.Server;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const port = Number(this.configService.get('WS_PORT', 8080));
    this.wss = new WebSocket.Server({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      this.logger.log('WebSocket client connected');

      ws.on('message', (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          this.logger.error('Failed to parse WebSocket message: ' + (error as Error).message);
        }
      });

      ws.on('close', () => {
        this.logger.log('WebSocket client disconnected');
      });

      ws.on('error', (error: Error) => {
        this.logger.error('WebSocket error: ' + error.message);
      });
    });

    this.logger.log(`WebSocket server started on port ${port}`);
  }

  onModuleDestroy() {
    if (this.wss) {
      this.wss.close(() => {
        this.logger.log('WebSocket server closed');
      });
    }
  }

  private handleMessage(ws: WebSocket, data: any) {
    this.logger.debug('Received message:', data);
    // Send acknowledgment
    ws.send(JSON.stringify({
      type: 'ack',
      timestamp: new Date().toISOString()
    }));
  }

  broadcast(message: any) {
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }
}
