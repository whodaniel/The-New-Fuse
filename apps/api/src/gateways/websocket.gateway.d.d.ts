import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Message } from '../entities/message.entity.js';
export declare class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, roomId: string): Promise<void>;
    handleLeaveRoom(client: Socket, roomId: string): Promise<void>;
    emitMessage(roomId: string, message: Message): void;
}
