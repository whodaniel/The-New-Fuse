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
var _a, _b;
import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { CreateMessageDto } from '../dtos/message.dto';
import { AuthGuard } from '../guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
__decorate([
    Get('rooms'),
    ApiOperation({ summary: 'Get all chat rooms' }),
    ApiResponse({ status: 200, description: 'Return all chat rooms' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRooms", null);
__decorate([
    Get('rooms/:roomId'),
    ApiOperation({ summary: 'Get chat room by id' }),
    ApiResponse({ status: 200, description: 'Return chat room by id' }),
    __param(0, Param('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRoom", null);
__decorate([
    Get('rooms/:roomId/messages'),
    ApiOperation({ summary: 'Get messages in room' }),
    ApiResponse({ status: 200, description: 'Return messages in room' }),
    __param(0, Param('roomId')),
    __param(1, Query('limit')),
    __param(2, Query('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    Post('rooms/:roomId/messages'),
    ApiOperation({ summary: 'Send message to room' }),
    ApiResponse({ status: 201, description: 'Message sent successfully' }),
    __param(0, Param('roomId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof CreateMessageDto !== "undefined" && CreateMessageDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    Get('analytics'),
    ApiOperation({ summary: 'Get chat analytics' }),
    ApiResponse({ status: 200, description: 'Return chat analytics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getAnalytics", null);
ChatController = __decorate([
    ApiTags('chat'),
    Controller('chat'),
    UseGuards(AuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof ChatService !== "undefined" && ChatService) === "function" ? _a : Object])
], ChatController);
export { ChatController };
//# sourceMappingURL=chat.controller.js.map