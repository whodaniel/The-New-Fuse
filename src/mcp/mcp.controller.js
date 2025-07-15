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
import { Controller, Post, Body, Get, Param, UseGuards, Query } from "@nestjs/common";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MCPAgentServer } from './MCPAgentServer.tsx';
import { MCPChatServer } from './MCPChatServer.tsx';
import { MCPWorkflowServer } from './MCPWorkflowServer.tsx';
import { MCPFuseServer } from './MCPFuseServer.tsx';
import { MCPFileCoordinationServer } from './MCPFileCoordinationServer.tsx';
import { MCPRAGServer } from './MCPRAGServer.tsx';
import { DocumentationOrchestrationService } from './services/documentation-orchestration.service.js';
import { MCPBrokerService } from './services/mcp-broker.service.tsx';
import { DirectorAgentService } from './services/director-agent.service.tsx';
/**
 * Controller that exposes MCP server capabilities via REST API
 *
 * This controller now uses the MCPBrokerService as a central entry point
 * for all MCP directives, while maintaining backward compatibility with
 * direct server access.
 */
let MCPController = class MCPController {
    agentServer;
    chatServer;
    workflowServer;
    fuseServer;
    fileCoordinationServer;
    ragServer;
    documentationOrchestrator;
    mcpBroker;
    directorAgent;
    constructor(agentServer, chatServer, workflowServer, fuseServer, fileCoordinationServer, ragServer, documentationOrchestrator, mcpBroker, directorAgent) {
        this.agentServer = agentServer;
        this.chatServer = chatServer;
        this.workflowServer = workflowServer;
        this.fuseServer = fuseServer;
        this.fileCoordinationServer = fileCoordinationServer;
        this.ragServer = ragServer;
        this.documentationOrchestrator = documentationOrchestrator;
        this.mcpBroker = mcpBroker;
        this.directorAgent = directorAgent;
    }
    // Broker endpoints
    getAllCapabilities() {
        return this.mcpBroker.getAllCapabilities();
    }
    getAllTools() {
        return this.mcpBroker.getAllTools();
    }
    executeDirective(dto) {
        return this.mcpBroker.executeDirective(dto.serverName, dto.action, dto.params, {
            sender: dto.sender,
            recipient: dto.recipient,
            metadata: dto.metadata,
        });
    }
    // Director Agent endpoints
    getTasks(status, assignedTo) {
        return this.directorAgent.getTasks({ status, assignedTo });
    }
    getTask(id) {
        return this.directorAgent.getTask(id);
    }
    createTask(dto) {
        return this.directorAgent.createTask(dto.type, dto.description, dto.params, {
            priority: dto.priority,
            metadata: dto.metadata,
        });
    }
    // Agent Server endpoints (legacy direct access)
    getAgentCapabilities() {
        return this.agentServer.getCapabilities();
    }
    executeAgentCapability(name, dto) {
        return this.agentServer.executeCapability(name, dto.params);
    }
    // Chat Server endpoints (legacy direct access)
    getChatTools() {
        return this.chatServer.getTools();
    }
    executeChatTool(name, dto) {
        return this.chatServer.executeTool(name, dto.params);
    }
    // Workflow Server endpoints (legacy direct access)
    getWorkflowTools() {
        return this.workflowServer.getTools();
    }
    executeWorkflowTool(name, dto) {
        return this.workflowServer.executeTool(name, dto.params);
    }
    // Fuse Server endpoints (legacy direct access)
    getFuseTools() {
        return this.fuseServer.getTools();
    }
    executeFuseTool(name, dto) {
        return this.fuseServer.executeTool(name, dto.params);
    }
    // File Coordination Server endpoints
    getFileCoordinationTools() {
        return this.fileCoordinationServer.getTools();
    }
    executeFileCoordinationTool(name, dto) {
        return this.fileCoordinationServer.executeTool(name, dto.params);
    }
    // RAG Server endpoints
    getRAGTools() {
        return this.ragServer.getTools();
    }
    executeRAGTool(name, dto) {
        return this.ragServer.callTool(name, dto.params);
    }
    async getRAGStatus() {
        return await this.ragServer.callTool('get_rag_status', {});
    }
    getRAGCollections() {
        return this.ragServer.getCollections();
    }
    crawlAllDocumentation() {
        return this.ragServer.crawlAllDocumentation();
    }
    performRAGQuery(dto) {
        return this.ragServer.callTool('perform_rag_query', dto);
    }
    searchCodeExamples(dto) {
        return this.ragServer.callTool('search_code_examples', dto);
    }
    searchVSCodeAPI(dto) {
        return this.ragServer.callTool('search_vscode_api', dto);
    }
    searchCopilotDocs(dto) {
        return this.ragServer.callTool('search_copilot_docs', dto);
    }
    // Documentation Orchestration endpoints
    updateAllDocumentation() {
        return this.documentationOrchestrator.updateAllDocumentation();
    }
    updateSpecificDocumentation(source, dto) {
        return this.documentationOrchestrator.updateSpecificDocumentation(source, dto);
    }
    getDocumentationStatus() {
        return this.documentationOrchestrator.getUpdateStatus();
    }
    getDocumentationHealth() {
        return this.documentationOrchestrator.performDocumentationHealthCheck();
    }
    searchAllDocumentation(dto) {
        return this.documentationOrchestrator.searchAllDocumentation(dto.query, {
            maxResults: dto.maxResults,
            includeCode: dto.includeCode,
            sourceFilter: dto.sourceFilter
        });
    }
    getDocumentationRecommendations() {
        return this.documentationOrchestrator.getDocumentationRecommendations();
    }
};
__decorate([
    Get("capabilities"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getAllCapabilities", null);
__decorate([
    Get("tools"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getAllTools", null);
__decorate([
    Post("execute"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "executeDirective", null);
__decorate([
    Get("tasks"),
    __param(0, Query('status')),
    __param(1, Query('assignedTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getTasks", null);
__decorate([
    Get("tasks/:id"),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getTask", null);
__decorate([
    Post("tasks"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "createTask", null);
__decorate([
    Get("agent/capabilities"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getAgentCapabilities", null);
__decorate([
    Post("agent/capabilities/:name"),
    __param(0, Param("name")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "executeAgentCapability", null);
__decorate([
    Get("chat/tools"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getChatTools", null);
__decorate([
    Post("chat/tools/:name"),
    __param(0, Param("name")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "executeChatTool", null);
__decorate([
    Get("workflow/tools"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getWorkflowTools", null);
__decorate([
    Post("workflow/tools/:name"),
    __param(0, Param("name")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "executeWorkflowTool", null);
__decorate([
    Get("fuse/tools"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getFuseTools", null);
__decorate([
    Post("fuse/tools/:name"),
    __param(0, Param("name")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "executeFuseTool", null);
__decorate([
    Get("file-coordination/tools"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getFileCoordinationTools", null);
__decorate([
    Post("file-coordination/tools/:name"),
    __param(0, Param("name")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "executeFileCoordinationTool", null);
__decorate([
    Get("rag/tools"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getRAGTools", null);
__decorate([
    Post("rag/tools/:name"),
    __param(0, Param("name")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "executeRAGTool", null);
__decorate([
    Get("rag/status"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "getRAGStatus", null);
__decorate([
    Get("rag/collections"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getRAGCollections", null);
__decorate([
    Post("rag/crawl-all"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "crawlAllDocumentation", null);
__decorate([
    Post("rag/query"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "performRAGQuery", null);
__decorate([
    Post("rag/search-code"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "searchCodeExamples", null);
__decorate([
    Post("rag/search-vscode-api"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "searchVSCodeAPI", null);
__decorate([
    Post("rag/search-copilot"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "searchCopilotDocs", null);
__decorate([
    Post("docs/update-all"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "updateAllDocumentation", null);
__decorate([
    Post("docs/update/:source"),
    __param(0, Param("source")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "updateSpecificDocumentation", null);
__decorate([
    Get("docs/status"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getDocumentationStatus", null);
__decorate([
    Get("docs/health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getDocumentationHealth", null);
__decorate([
    Post("docs/search"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "searchAllDocumentation", null);
__decorate([
    Get("docs/recommendations"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getDocumentationRecommendations", null);
MCPController = __decorate([
    Controller("mcp"),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [MCPAgentServer,
        MCPChatServer,
        MCPWorkflowServer,
        MCPFuseServer,
        MCPFileCoordinationServer,
        MCPRAGServer,
        DocumentationOrchestrationService,
        MCPBrokerService,
        DirectorAgentService])
], MCPController);
export { MCPController };
