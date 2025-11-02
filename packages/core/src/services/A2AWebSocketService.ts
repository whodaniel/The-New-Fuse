import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'ws';
import { Logger } from '../utils/logger';
import { A2AMessage } from '../protocols/A2AProtocolHandler';
import { AgentCardService } from './AgentCardService';
import { ProtocolAdapterService } from '../protocols/ProtocolAdapterService';

@Injectable()
export class A2AWebSocketService implements OnModuleInit {
  private readonly logger = new Logger(A2AWebSocketService.name);
  private wss: Server;
  private eventEmitter: any;

  constructor(
    private readonly agentCardService: AgentCardService,
    private readonly protocolAdapter: ProtocolAdapterService
  ) {}

  async onModuleInit() {
    this.initializeSSE();
    this.wss = new Server({ port: 8080 });
    this.wss.on('connection', (ws, req) => {
      const protocol = req.headers['sec-websocket-protocol'];
      ws.on('message', (data) => {
        const context = { protocol };
        this.logger.error('message', context);
      });
      ws.on('close', () => {
        this.logger.log('Connection closed');
      });
    });
    this.eventEmitter.on('a2a.message', (data) => {
      this.eventEmitter.emit('event', data);
      this.logger.error('message', { data });
    });
  }

  private initializeSSE() {
    this.logger.log('Initializing SSE');
  }

  async sendMessage(message: A2AMessage) {
    this.logger.log('Sending message', message);
  }

  async broadcast(message: A2AMessage) {
    this.logger.log('Broadcasting message', message);
  }
}
