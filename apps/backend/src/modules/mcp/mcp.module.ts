import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module.js';
import { WorkflowTemplatesModule } from '../workflow-templates/workflow-templates.module.js';
import { AdminMCPController } from './admin-mcp.controller.js';
import { MCPA2ABridge } from './mcp-a2a-bridge.service.js';
import { McpApiController } from './mcp-api.controller.js';
import { MCPServerService } from './mcp-server.service.js';
import { MCPToolRegistry } from './mcp-tool-registry.service.js';
import { MCPController } from './mcp.controller.js';

/**
 * MCP Module
 *
 * Provides Model Context Protocol (MCP) server implementation for The New Fuse,
 * enabling standardized agent communication and tool execution.
 */
@Module({
  imports: [WorkflowTemplatesModule, AgentModule],
  controllers: [MCPController, McpApiController, AdminMCPController],
  providers: [MCPServerService, MCPToolRegistry, MCPA2ABridge],
  exports: [MCPServerService, MCPToolRegistry, MCPA2ABridge],
})
export class MCPModule {}
