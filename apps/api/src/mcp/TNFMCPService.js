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
var TNFMCPService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNFMCPService = void 0;
const common_1 = require("@nestjs/common");
const TheNewFuseMCPServer_1 = require("../../../../src/mcp/TheNewFuseMCPServer");
const agent_service_1 = require("../services/agent.service");
const chat_service_1 = require("../services/chat.service");
const workflow_service_1 = require("../services/workflow.service");
const monitoring_service_1 = require("../services/monitoring.service");
const ClaudeDevAutomationService_1 = require("../services/ClaudeDevAutomationService");
let TNFMCPService = TNFMCPService_1 = class TNFMCPService {
    agentService;
    chatService;
    workflowService;
    monitoringService;
    claudeDevService;
    logger = new common_1.Logger(TNFMCPService_1.name);
    mcpServer;
    constructor(agentService, chatService, workflowService, monitoringService, claudeDevService) {
        this.agentService = agentService;
        this.chatService = chatService;
        this.workflowService = workflowService;
        this.monitoringService = monitoringService;
        this.claudeDevService = claudeDevService;
    }
    async onModuleInit() {
        this.logger.log('Initializing TNF MCP Service...');
        try {
            // Create MCP server instance
            this.mcpServer = new TheNewFuseMCPServer_1.TheNewFuseMCPServer(false); // stdio mode by default
            // Inject actual services
            this.mcpServer.setServices({
                agent: this.agentService,
                chat: this.chatService,
                workflow: this.workflowService,
                monitoring: this.monitoringService,
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
                monitoring: !!this.monitoringService,
                claudeDev: !!this.claudeDevService,
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.TNFMCPService = TNFMCPService;
exports.TNFMCPService = TNFMCPService = TNFMCPService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [agent_service_1.AgentService,
        chat_service_1.ChatService,
        workflow_service_1.WorkflowService,
        monitoring_service_1.MonitoringService,
        ClaudeDevAutomationService_1.ClaudeDevAutomationService])
], TNFMCPService);
