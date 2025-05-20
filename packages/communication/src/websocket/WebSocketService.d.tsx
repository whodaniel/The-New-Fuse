import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp?: number;
}
export declare class WebSocketService implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly authService;
    private server;
    private readonly logger;
    private connectedClients;
    constructor(authService: AuthService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    broadcastMessage(message: WebSocketMessage): Promise<void>;
    sendToUser(userId: string, message: WebSocketMessage): Promise<void>;
    private findUserIdBySocket;
    private broadcastUserStatus;
}
export {};
