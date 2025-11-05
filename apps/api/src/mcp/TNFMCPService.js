var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TNFMCPService_1;
var _a, _b, _c, _d;
import { Injectable, Logger } from '@nestjs/common';
import { TheNewFuseMCPServer } from './TheNewFuseMCPServer';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { WorkflowService } from '../services/workflow.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
let TNFMCPService = TNFMCPService_1 = class TNFMCPService {
    agentService;
    chatService;
    workflowService;
    claudeDevService;
    logger = new Logger(TNFMCPService_1.name);
    mcpServer = null;
    constructor(agentService, chatService, workflowService, claudeDevService) {
        this.agentService = agentService;
        this.chatService = chatService;
        this.workflowService = workflowService;
        this.claudeDevService = claudeDevService;
    }
    async onModuleInit() {
        this.logger.log('Initializing TNF MCP Service...');
        try {
            // Create MCP server instance
            this.mcpServer = new TheNewFuseMCPServer(false); // stdio mode by default
            // Inject actual services
            this.mcpServer.setServices({
                agent: this.agentService,
                chat: this.chatService,
                workflow: this.workflowService,
                claudeDev: this.claudeDevService,
            });
            this.logger.log('TNF MCP Service initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize TNF MCP Service:', error);
            throw error;
        }
    }
    getMCPServer() {
        if (!this.mcpServer) {
            throw new Error('MCP Server not initialized');
        }
        return this.mcpServer;
    }
    async startRemoteServer(port = 3001) {
        if (!this.mcpServer) {
            throw new Error('MCP Server not initialized');
        }
        try {
            await this.mcpServer.start('http', port);
            this.logger.log(`TNF MCP Server started on port ${port}`);
        }
        catch (error) {
            this.logger.error('Failed to start remote MCP server:', error);
            throw error;
        }
    }
    async getServerStatus() {
        return {
            status: 'running',
            initialized: !!this.mcpServer,
            services: {
                agent: !!this.agentService,
                chat: !!this.chatService,
                workflow: !!this.workflowService,
                claudeDev: !!this.claudeDevService,
            },
            timestamp: new Date().toISOString(),
        };
    }
};
TNFMCPService = TNFMCPService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object, typeof (_b = typeof ChatService !== "undefined" && ChatService) === "function" ? _b : Object, typeof (_c = typeof WorkflowService !== "undefined" && WorkflowService) === "function" ? _c : Object, typeof (_d = typeof ClaudeDevAutomationService !== "undefined" && ClaudeDevAutomationService) === "function" ? _d : Object])
], TNFMCPService);
export { TNFMCPService };
//# sourceMappingURL=TNFMCPService.js.map