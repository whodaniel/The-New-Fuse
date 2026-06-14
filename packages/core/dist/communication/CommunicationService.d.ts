import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommunicationProtocol } from './CommunicationProtocol.js';
export interface UserConnection {
    userId: string;
    socketId: string;
    connectedAt: Date;
}
export declare class CommunicationService {
    private eventEmitter;
    private protocol;
    private connections;
    private userSockets;
    constructor(eventEmitter: EventEmitter2, protocol: CommunicationProtocol);
    connectUser(userId: string, socketId: string): Promise<void>;
    disconnectUser(socketId: string): Promise<void>;
    sendMessage(senderId: string, recipientId: string, type: string, payload: any): Promise<void>;
    broadcastMessage(senderId: string, type: string, payload: any): Promise<void>;
    processIncomingMessage(socketId: string, data: any): Promise<void>;
    getUserSocketId(userId: string): string | undefined;
    getConnectedUsers(): string[];
    isUserConnected(userId: string): boolean;
}
//# sourceMappingURL=CommunicationService.d.ts.map