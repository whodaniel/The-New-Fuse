var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { WebSocketGateway } from '../gateways/websocket.gateway';
let ChatService = class ChatService {
    chatRoomRepository;
    messageRepository;
    websocketGateway;
    constructor(chatRoomRepository, messageRepository, websocketGateway) {
        this.chatRoomRepository = chatRoomRepository;
        this.messageRepository = messageRepository;
        this.websocketGateway = websocketGateway;
    }
    async getRooms() {
        return this.chatRoomRepository.find();
    }
    async getRoom(roomId) {
        const room = await this.chatRoomRepository.findOne({
            where: { id: roomId },
            relations: ['messages'],
        });
        if (!room) {
            throw new NotFoundException('Chat room not found');
        }
        return room;
    }
    async getMessages(roomId, options) {
        const room = await this.getRoom(roomId);
        return this.messageRepository.find({
            where: { room: { id: room.id } },
            take: options.limit,
            skip: options.offset,
            order: { timestamp: 'DESC' },
        });
    }
    async sendMessage(roomId, createMessageDto) {
        const room = await this.getRoom(roomId);
        const message = this.messageRepository.create({
            ...createMessageDto,
            room,
        });
        await this.messageRepository.save(message);
        // Notify connected clients through WebSocket
        this.websocketGateway.emitMessage(roomId, message);
        return message;
    }
    async getAnalytics() {
        const [totalRooms, totalMessages] = await Promise.all([
            this.chatRoomRepository.count(),
            this.messageRepository.count(),
        ]);
        return {
            totalRooms,
            totalMessages,
            timestamp: new Date(),
        };
    }
};
ChatService = __decorate([
    Injectable(),
    __param(0, InjectRepository(ChatRoom)),
    __param(1, InjectRepository(Message)),
    __metadata("design:paramtypes", [Repository,
        Repository, typeof (_a = typeof WebSocketGateway !== "undefined" && WebSocketGateway) === "function" ? _a : Object])
], ChatService);
export { ChatService };
//# sourceMappingURL=chat.service.js.map