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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthenticatedRequest } from '../../types/request.types';
// Mock auth guard for compatibility - replace with actual auth guard
class MockAuthGuard {
    canActivate() {
        return true;
    }
}
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getChats(req) {
        const userId = req.user?.id || 'default-user'; // Fallback for development
        return this.chatService.findAll(userId);
    }
    async getChat(id, req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.findOne(id, userId);
    }
    async createChat(createChatDto, req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.create(userId, createChatDto);
    }
    async addMessage(chatId, messageData, req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.addMessage(chatId, userId, messageData);
    }
    async automateConversation(chatId, automateDto, req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.automateConversation(chatId, userId, automateDto.conversationGoal);
    }
    async createConversationRule(ruleData, req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.createConversationRule(userId, ruleData);
    }
    async getConversationRules(req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.getConversationRules(userId);
    }
    async createSynthesisJob(jobData, req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.createSynthesisJob(userId, jobData);
    }
    async getSynthesisJobs(req) {
        const userId = req.user?.id || 'default-user';
        return this.chatService.getSynthesisJobs(userId);
    }
    async generateResponse(chatId, generateDto, req) {
        const userId = req.user?.id || 'default-user';
        const response = await this.chatService.generateAgentResponse(generateDto.prompt, generateDto.agentId, userId);
        return { response };
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all chats for user' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChats", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get chat by ID' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChat", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create new chat' }),
    __param(0, Body()),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_d = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createChat", null);
__decorate([
    Post(':id/messages'),
    ApiOperation({ summary: 'Add message to chat' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_e = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMessage", null);
__decorate([
    Post(':id/automate'),
    ApiOperation({ summary: 'Start automated conversation' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_f = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "automateConversation", null);
__decorate([
    Post('rules'),
    ApiOperation({ summary: 'Create conversation rule' }),
    __param(0, Body()),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_g = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createConversationRule", null);
__decorate([
    Get('rules/all'),
    ApiOperation({ summary: 'Get all conversation rules' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversationRules", null);
__decorate([
    Post('synthesis'),
    ApiOperation({ summary: 'Create synthesis job' }),
    __param(0, Body()),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_j = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createSynthesisJob", null);
__decorate([
    Get('synthesis/all'),
    ApiOperation({ summary: 'Get all synthesis jobs' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSynthesisJobs", null);
__decorate([
    Post(':id/generate-response'),
    ApiOperation({ summary: 'Generate agent response' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_l = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _l : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "generateResponse", null);
ChatController = __decorate([
    ApiTags('chat'),
    Controller('chat'),
    UseGuards(MockAuthGuard),
    ApiBearerAuth(),
    __metadata("design:paramtypes", [typeof (_a = typeof ChatService !== "undefined" && ChatService) === "function" ? _a : Object])
], ChatController);
export { ChatController };
//# sourceMappingURL=chat.controller.js.map