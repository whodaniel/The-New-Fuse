import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { CreateMessageDto } from '../dtos/message.dto';
import { WebSocketGateway } from '../gateways/websocket.gateway';
export declare class ChatService {
    private readonly chatRoomRepository;
    private readonly messageRepository;
    private readonly websocketGateway;
    constructor(chatRoomRepository: Repository<ChatRoom>, messageRepository: Repository<Message>, websocketGateway: WebSocketGateway);
    getRooms(): Promise<ChatRoom[]>;
    getRoom(roomId: string): Promise<ChatRoom>;
    getMessages(roomId: string, options: {
        limit: number;
        offset: number;
    }): Promise<Message[]>;
    sendMessage(roomId: string, createMessageDto: CreateMessageDto): Promise<Message>;
    getAnalytics(): Promise<any>;
}
