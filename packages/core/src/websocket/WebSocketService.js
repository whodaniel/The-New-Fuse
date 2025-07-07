var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebSocketService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
let WebSocketService = WebSocketService_1 = class WebSocketService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(WebSocketService_1.name);
    }
    async onModuleInit() {
        const port = Number(this.configService.get('WS_PORT', 8080));
        this.wss = new WebSocket.Server({ port });
        this.wss.on('connection', (ws) => {
            this.logger.log('WebSocket client connected');
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleMessage(ws, data);
                }
                catch (error) {
                    this.logger.error('Failed to parse WebSocket message: ' + error.message);
                }
            });
            ws.on('close', () => {
                this.logger.log('WebSocket client disconnected');
            });
            ws.on('error', (error) => {
                this.logger.error('WebSocket error: ' + error.message);
            });
        });
        this.logger.log(`WebSocket server started on port ${port}`);
    }
    async onModuleDestroy() {
        if (this.wss) {
            this.wss.close(() => {
                this.logger.log('WebSocket server closed');
            });
        }
    }
    handleMessage(ws, data) {
        this.logger.debug('Received message:', data);
        // Send acknowledgment
        ws.send(JSON.stringify({
            type: 'ack',
            timestamp: new Date().toISOString()
        }));
    }
    broadcast(message) {
        if (this.wss) {
            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }
};
WebSocketService = WebSocketService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], WebSocketService);
export { WebSocketService };
