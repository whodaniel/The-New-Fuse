var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MCPAgentServer } from './MCPAgentServer.tsx';
import { MCPChatServer } from './MCPChatServer.tsx';
import { MCPWorkflowServer } from './MCPWorkflowServer.tsx';
import { MCPFuseServer } from './MCPFuseServer.tsx';
import { MCPFileCoordinationServer } from './MCPFileCoordinationServer.tsx';
import { MCPRAGServer } from './MCPRAGServer.tsx';
import { MCPController } from './mcp.controller.tsx';
import { MCPBrokerService } from './services/mcp-broker.service.tsx';
import { MCPRAGClientService } from './services/mcp-rag-client.service.js';
import { RAGConfigurationService } from './services/rag-configuration.service.js';
import { DocumentationOrchestrationService } from './services/documentation-orchestration.service.js';
import { DirectorAgentService } from './services/director-agent.service.tsx';
import { AgentModule } from '../modules/agent.module.js';
/**
 * MCP Module that provides all MCP server implementations and coordination services
 * This module integrates the Model Context Protocol into The New Fuse platform,
 * including the file creation coordination system.
 */
let MCPModule = class MCPModule {
};
MCPModule = __decorate([
    Module({
        imports: [
            ConfigModule,
            ScheduleModule.forRoot(),
            AgentModule
        ],
        providers: [
            MCPAgentServer,
            MCPChatServer,
            MCPWorkflowServer,
            MCPFuseServer,
            MCPFileCoordinationServer,
            MCPRAGServer,
            MCPBrokerService,
            MCPRAGClientService,
            RAGConfigurationService,
            DocumentationOrchestrationService,
            DirectorAgentService
        ],
        controllers: [
            MCPController
        ],
        exports: [
            MCPAgentServer,
            MCPChatServer,
            MCPWorkflowServer,
            MCPFuseServer,
            MCPFileCoordinationServer,
            MCPRAGServer,
            MCPBrokerService,
            MCPRAGClientService,
            RAGConfigurationService,
            DocumentationOrchestrationService,
            DirectorAgentService
        ],
    })
], MCPModule);
export { MCPModule };
