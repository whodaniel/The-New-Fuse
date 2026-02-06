import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { WorkflowTemplatesModule } from '../workflow-templates/workflow-templates.module';
import { MCPA2ABridge } from './mcp-a2a-bridge.service';
import { MCPServerService } from './mcp-server.service';
import { MCPToolRegistry } from './mcp-tool-registry.service';
import { MCPController } from './mcp.controller';

/**
 * MCP Module
 *
 * Provides Model Context Protocol (MCP) server implementation for The New Fuse,
 * enabling standardized agent communication and tool execution.
 */
@Module({
  imports: [WorkflowTemplatesModule, AgentModule],
  controllers: [MCPController],
  providers: [MCPServerService, MCPToolRegistry, MCPA2ABridge],
  exports: [MCPServerService, MCPToolRegistry, MCPA2ABridge],
})
export class MCPModule {}
