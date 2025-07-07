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
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
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
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all chats for user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChat", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new chat' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createChat", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Add message to chat' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Post)(':id/automate'),
    (0, swagger_1.ApiOperation)({ summary: 'Start automated conversation' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "automateConversation", null);
__decorate([
    (0, common_1.Post)('rules'),
    (0, swagger_1.ApiOperation)({ summary: 'Create conversation rule' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createConversationRule", null);
__decorate([
    (0, common_1.Get)('rules/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all conversation rules' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversationRules", null);
__decorate([
    (0, common_1.Post)('synthesis'),
    (0, swagger_1.ApiOperation)({ summary: 'Create synthesis job' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createSynthesisJob", null);
__decorate([
    (0, common_1.Get)('synthesis/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all synthesis jobs' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSynthesisJobs", null);
__decorate([
    (0, common_1.Post)(':id/generate-response'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate agent response' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "generateResponse", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chat'),
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(MockAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
