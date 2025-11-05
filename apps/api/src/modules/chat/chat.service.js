var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
var _a, _b, _c;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from '../../agents/agents.service';
import { logError, createErrorResponse } from '../../utils/error-handling';
import { LlmService } from '../../llm/llm.service';
let ChatService = ChatService_1 = class ChatService {
    prisma;
    agentsService;
    llmService;
    logger = new Logger(ChatService_1.name);
    constructor(prisma, agentsService, llmService) {
        this.prisma = prisma;
        this.agentsService = agentsService;
        this.llmService = llmService;
    }
    async findAll(userId) {
        try {
            // Get all chat sessions for the user
            const chats = await this.prisma.chat?.findMany({
                where: { userId },
                include: {
                    messages: {
                        orderBy: { timestamp: 'asc' },
                        include: {
                            agent: true
                        }
                    },
                    agent: true
                }
            }) || [];
            return chats;
        }
        catch (error) {
            logError('Error fetching chats', error, this.logger);
            return [];
        }
    }
    async findOne(id, userId) {
        try {
            const chat = await this.prisma.chat?.findFirst({
                where: { id, userId },
                include: {
                    messages: {
                        orderBy: { timestamp: 'asc' },
                        include: {
                            agent: true
                        }
                    },
                    agent: true
                }
            });
            if (!chat) {
                return { id, messages: [], agent: null };
            }
            return chat;
        }
        catch (error) {
            logError('Error fetching chat', error, this.logger);
            return { id, messages: [], agent: null };
        }
    }
    async create(userId, createChatDto) {
        try {
            const chat = await this.prisma.chat?.create({
                data: {
                    ...createChatDto,
                    userId,
                },
                include: {
                    messages: true,
                    agent: true
                }
            });
            return chat || { id: Date.now().toString(), ...createChatDto };
        }
        catch (error) {
            logError('Error creating chat', error, this.logger);
            return { id: Date.now().toString(), ...createChatDto };
        }
    }
    async addMessage(chatId, userId, messageData) {
        try {
            const message = await this.prisma.message?.create({
                data: {
                    ...messageData,
                    chatId,
                    senderId: userId,
                    timestamp: new Date(),
                },
                include: {
                    agent: true
                }
            });
            return message || { id: Date.now().toString(), ...messageData };
        }
        catch (error) {
            logError('Error adding message', error, this.logger);
            return { id: Date.now().toString(), ...messageData };
        }
    }
    async createConversationRule(userId, ruleData) {
        try {
            // Note: Using conversation model instead of non-existent conversationRule
            const rule = await this.prisma.conversation?.create({
                data: {
                    initiatorId: ruleData.sourceId,
                    topic: `Rule: ${ruleData.sourceId} -> ${ruleData.targetId}`,
                    metadata: {
                        sourceId: ruleData.sourceId,
                        targetId: ruleData.targetId,
                        userId: userId,
                        type: 'rule'
                    }
                }
            });
            return rule || { id: Date.now().toString(), ...ruleData };
        }
        catch (error) {
            logError('Error creating conversation rule', error, this.logger);
            return { id: Date.now().toString(), ...ruleData };
        }
    }
    async getConversationRules(userId) {
        try {
            // Note: Filtering conversations that represent rules
            const rules = await this.prisma.conversation?.findMany({
                where: {
                    metadata: {
                        path: ['userId'],
                        equals: userId
                    }
                }
            }) || [];
            return rules.filter(r => r.metadata && r.metadata.type === 'rule');
        }
        catch (error) {
            logError('Error fetching conversation rules', error, this.logger);
            return [];
        }
    }
    async generateAgentResponse(prompt, agentId, userId) {
        try {
            // Get the agent details
            const agents = await this.agentsService.findAll(userId);
            const agent = agents.find(a => a.id === agentId);
            if (!agent) {
                throw new Error('Agent not found');
            }
            const response = await this.llmService.generateAgentResponse(prompt, agent.config?.systemPrompt || 'You are a helpful assistant.');
            return response;
        }
        catch (error) {
            logError('Error generating agent response', error, this.logger);
            return 'I apologize, but I encountered an error while processing your request.';
        }
    }
    async createSynthesisJob(userId, jobData) {
        try {
            // Mock implementation for synthesis job creation
            const jobId = `synthesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.log(`Creating synthesis job for user ${userId}: ${jobId}`, jobData);
            return {
                id: jobId,
                userId,
                status: 'pending',
                createdAt: new Date(),
                ...jobData
            };
        }
        catch (error) {
            logError('Error creating synthesis job', error, this.logger);
            return createErrorResponse(error, 'Failed to create synthesis job');
        }
    }
    async getSynthesisJobs(userId) {
        try {
            // Mock implementation for getting synthesis jobs
            this.logger.log(`Getting synthesis jobs for user ${userId}`);
            return [
                {
                    id: `synthesis_${Date.now()}_1`,
                    userId,
                    status: 'completed',
                    createdAt: new Date(),
                    result: 'Mock synthesis result'
                }
            ];
        }
        catch (error) {
            logError('Error getting synthesis jobs', error, this.logger);
            return [];
        }
    }
    async automateConversation(chatId, userId, conversationGoal) {
        try {
            // Get chat with agent
            const chat = await this.findOne(chatId, userId);
            // Note: Rules functionality removed as synthesisJob model doesn't exist
            if (!chat.agent) {
                throw new Error('No agent found in chat');
            }
            // Start automated conversation flow
            const firstAgent = chat.agent;
            const initialPrompt = conversationGoal
                ? `As ${firstAgent.name}, start the conversation based on this goal: "${conversationGoal}"`
                : `As ${firstAgent.name}, start a new conversation.`;
            const response = await this.generateAgentResponse(initialPrompt, firstAgent.id, userId);
            await this.addMessage(chatId, userId, {
                content: response,
                sender: 'agent',
                agentId: firstAgent.id,
                agentName: firstAgent.name,
                type: 'text'
            });
            return { success: true, message: 'Automation started' };
        }
        catch (error) {
            logError('Error automating conversation', error, this.logger);
            return createErrorResponse(error, 'Failed to automate conversation');
        }
    }
};
ChatService = ChatService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AgentsService !== "undefined" && AgentsService) === "function" ? _b : Object, typeof (_c = typeof LlmService !== "undefined" && LlmService) === "function" ? _c : Object])
], ChatService);
export { ChatService };
//# sourceMappingURL=chat.service.js.map