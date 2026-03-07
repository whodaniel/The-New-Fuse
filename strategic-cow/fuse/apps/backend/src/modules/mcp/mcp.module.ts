import { Module } from '@nestjs/common';
import { MCPServerService } from './mcp-server.service';
import { MCPToolRegistry } from './mcp-tool-registry.service';
import { MCPA2ABridge } from './mcp-a2a-bridge.service';
import { MCPController } from './mcp.controller';
import { AdminMCPController } from './admin-mcp.controller';
import { WorkflowTemplatesModule } from '../workflow-templates/workflow-templates.module';
import { AgentModule } from '../agent/agent.module';

/**
 * MCP Module
 *
 * Provides Model Context Protocol (MCP) server implementation for The New Fuse,
 * enabling standardized agent communication and tool execution.
 */
@Module({
  imports: [
    WorkflowTemplatesModule,
    AgentModule,
  ],
  controllers: [MCPController, AdminMCPController],
  providers: [
    MCPServerService,
    MCPToolRegistry,
    MCPA2ABridge,
  ],
  exports: [
    MCPServerService,
    MCPToolRegistry,
    MCPA2ABridge,
  ],
})
export class MCPModule {}
