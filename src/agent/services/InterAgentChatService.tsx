import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { 
  ChatMessage, 
  ChatRoom, 
  ChatParticipant,
  ChatEvent 
} from '../../types/chat.types.js';

interface ChatRoomOptions {
  maxParticipants?: number;
  isPrivate?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
@WebSocketGateway({ namespace: 'agent-chat' })
export class InterAgentChatService {
  @WebSocketServer()
  private server!: Server;
  
  private readonly logger = new Logger(InterAgentChatService.name);
  private readonly rooms = new Map<string, ChatRoom>();
  private readonly participants = new Map<string, ChatParticipant>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createRoom(options: ChatRoomOptions = {}): Promise<ChatRoom> {
    const roomId = uuidv4();
    const room: ChatRoom = {
      id: roomId,
      participants: [],
      messages: [],
      createdAt: new Date().toISOString(),
      maxParticipants: options.maxParticipants ?? Infinity,
      isPrivate: options.isPrivate ?? false,
      metadata: options.metadata ?? {},
    };

    this.rooms.set(roomId, room);
    this.logger.debug(`Created chat room: ${roomId}`);

    return room;
  }

  async joinRoom(roomId: string, participant: ChatParticipant): Promise<void> {
    const room = this.getRoom(roomId);

    if (room.participants.length >= room.maxParticipants) {
      throw new Error('Room is at maximum capacity');
    }

    if (this.isParticipantInRoom(roomId, participant.id)) {
      throw new Error('Participant is already in the room');
    }

    room.participants.push(participant);
    this.participants.set(participant.id, participant);

    await this.notifyRoomParticipants(roomId, {
      type: 'participant_joined',
      roomId,
      participant,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Participant ${participant.id} joined room ${roomId}`);
  }

  async leaveRoom(roomId: string, participantId: string): Promise<void> {
    const room = this.getRoom(roomId);
    const participantIndex = room.participants.findIndex(p => p.id === participantId);

    if (participantIndex === -1) {
      throw new Error('Participant is not in the room');
    }

    room.participants.splice(participantIndex, 1);
    
    await this.notifyRoomParticipants(roomId, {
      type: 'participant_left',
      roomId,
      participantId,
      timestamp: new Date().toISOString(),
    });

    // Clean up empty rooms
    if (room.participants.length === 0) {
      this.rooms.delete(roomId);
      this.logger.debug(`Removed empty room ${roomId}`);
    }

    this.logger.debug(`Participant ${participantId} left room ${roomId}`);
  }

  async sendMessage(roomId: string, message: ChatMessage): Promise<void> {
    const room = this.getRoom(roomId);

    if (!this.isParticipantInRoom(roomId, message.senderId)) {
      throw new Error('Sender is not in the room');
    }

    room.messages.push(message);

    await this.notifyRoomParticipants(roomId, {
      type: 'message',
      roomId,
      message,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Message sent in room ${roomId} by ${message.senderId}`);
  }

  getParticipants(roomId: string): ChatParticipant[] {
    const room = this.getRoom(roomId);
    return [...room.participants];
  }

  getRoomHistory(roomId: string): ChatMessage[] {
    const room = this.getRoom(roomId);
    return [...room.messages];
  }

  private getRoom(roomId: string): ChatRoom {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }
    return room;
  }

  private isParticipantInRoom(roomId: string, participantId: string): boolean {
    const room = this.getRoom(roomId);
    return room.participants.some(p => p.id === participantId);
  }

  private async notifyRoomParticipants(roomId: string, event: ChatEvent): Promise<void> {
    const room = this.getRoom(roomId);
    
    const failedParticipants: string[] = [];

    for (const participant of room.participants) {
      try {
        await this.server.to(participant.socketId).emit('chat_event', event);
      } catch (error) {
        failedParticipants.push(participant.id);
        this.logger.warn(`Failed to notify participant ${participant.id}: ${error}`);
      }
    }

    // Remove failed participants
    if (failedParticipants.length > 0) {
      for (const participantId of failedParticipants) {
        await this.leaveRoom(roomId, participantId);
      }
    }
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
    
    // Remove participant from all rooms
    for (const [roomId, room] of this.rooms.entries()) {
      const participant = room.participants.find(p => p.socketId === client.id);
      if (participant) {
        void this.leaveRoom(roomId, participant.id);
      }
    }
  }
}
