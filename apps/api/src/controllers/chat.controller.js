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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("../services/chat.service");
const message_dto_1 = require("../dtos/message.dto");
const auth_guard_1 = require("../guards/auth.guard");
const swagger_1 = require("@nestjs/swagger");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getRooms() {
        return this.chatService.getRooms();
    }
    async getRoom(roomId) {
        return this.chatService.getRoom(roomId);
    }
    async getMessages(roomId, limit, offset) {
        return this.chatService.getMessages(roomId, { limit, offset });
    }
    async sendMessage(roomId, createMessageDto) {
        return this.chatService.sendMessage(roomId, createMessageDto);
    }
    async getAnalytics() {
        return this.chatService.getAnalytics();
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('rooms'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all chat rooms' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all chat rooms' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRooms", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat room by id' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return chat room by id' }),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages in room' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return messages in room' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send message to room' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return chat analytics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getAnalytics", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chat'),
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
