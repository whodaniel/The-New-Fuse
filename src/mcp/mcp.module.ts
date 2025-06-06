import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MCPAgentServer } from './MCPAgentServer.js';
import { MCPChatServer } from './MCPChatServer.js';
import { MCPWorkflowServer } from './MCPWorkflowServer.js';
import { MCPFuseServer } from './MCPFuseServer.js';
import { MCPFileCoordinationServer } from './MCPFileCoordinationServer.js';
import { MCPRAGServer } from './MCPRAGServer.js';
import { MCPController } from './mcp.controller.js';
import { MCPBrokerService } from './services/mcp-broker.service.js';
import { MCPRAGClientService } from './services/mcp-rag-client.service.js';
import { RAGConfigurationService } from './services/rag-configuration.service.js';
import { DocumentationOrchestrationService } from './services/documentation-orchestration.service.js';
import { DirectorAgentService } from './services/director-agent.service.js';
import { AgentModule } from '../modules/agent.module.js';

/**
 * MCP Module that provides all MCP server implementations and coordination services
 * This module integrates the Model Context Protocol into The New Fuse platform,
 * including the file creation coordination system.
 */
@Module({
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
export class MCPModule {}
