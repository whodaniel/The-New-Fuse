"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_room_entity_1 = require("../entities/chat-room.entity");
const message_entity_1 = require("../entities/message.entity");
const websocket_gateway_1 = require("../gateways/websocket.gateway");
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
            throw new common_1.NotFoundException('Chat room not found');
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
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_room_entity_1.ChatRoom)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        websocket_gateway_1.WebSocketGateway])
], ChatService);
