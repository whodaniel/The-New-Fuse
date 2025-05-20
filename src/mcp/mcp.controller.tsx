import { Controller, Post, Body, Get, Param, UseGuards, Query } from "@nestjs/common";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MCPAgentServer } from './MCPAgentServer.js';
import { MCPChatServer } from './MCPChatServer.js';
import { MCPWorkflowServer } from './MCPWorkflowServer.js';
import { MCPFuseServer } from './MCPFuseServer.js';
import { MCPBrokerService } from './services/mcp-broker.service.js';
import { DirectorAgentService } from './services/director-agent.service.js';

interface ExecuteCapabilityDto {
  params: Record<string, any>;
  metadata?: Record<string, any>;
}

interface ExecuteToolDto {
  params: Record<string, any>;
  metadata?: Record<string, any>;
}

interface CreateTaskDto {
  type: string;
  description: string;
  params: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface ExecuteDirectiveDto {
  serverName: string;
  action: string;
  params: Record<string, any>;
  sender?: string;
  recipient?: string;
  metadata?: Record<string, any>;
}

/**
 * Controller that exposes MCP server capabilities via REST API
 *
 * This controller now uses the MCPBrokerService as a central entry point
 * for all MCP directives, while maintaining backward compatibility with
 * direct server access.
 */
@Controller("mcp")
@UseGuards(JwtAuthGuard)
export class MCPController {
  constructor(
    private readonly agentServer: MCPAgentServer,
    private readonly chatServer: MCPChatServer,
    private readonly workflowServer: MCPWorkflowServer,
    private readonly fuseServer: MCPFuseServer,
    private readonly mcpBroker: MCPBrokerService,
    private readonly directorAgent: DirectorAgentService,
  ) {}

  // Broker endpoints
  @Get("capabilities")
  getAllCapabilities() {
    return this.mcpBroker.getAllCapabilities();
  }

  @Get("tools")
  getAllTools() {
    return this.mcpBroker.getAllTools();
  }

  @Post("execute")
  executeDirective(@Body() dto: ExecuteDirectiveDto) {
    return this.mcpBroker.executeDirective(
      dto.serverName,
      dto.action,
      dto.params,
      {
        sender: dto.sender,
        recipient: dto.recipient,
        metadata: dto.metadata,
      }
    );
  }

  // Director Agent endpoints
  @Get("tasks")
  getTasks(
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string
  ) {
    return this.directorAgent.getTasks({ status, assignedTo });
  }

  @Get("tasks/:id")
  getTask(@Param('id') id: string) {
    return this.directorAgent.getTask(id);
  }

  @Post("tasks")
  createTask(@Body() dto: CreateTaskDto) {
    return this.directorAgent.createTask(
      dto.type,
      dto.description,
      dto.params,
      {
        priority: dto.priority,
        metadata: dto.metadata,
      }
    );
  }

  // Agent Server endpoints (legacy direct access)
  @Get("agent/capabilities")
  getAgentCapabilities() {
    return this.agentServer.getCapabilities();
  }

  @Post("agent/capabilities/:name")
  executeAgentCapability(
    @Param("name") name: string,
    @Body() dto: ExecuteCapabilityDto,
  ) {
    return this.agentServer.executeCapability(name, dto.params);
  }

  // Chat Server endpoints (legacy direct access)
  @Get("chat/tools")
  getChatTools() {
    return this.chatServer.getTools();
  }

  @Post("chat/tools/:name")
  executeChatTool(@Param("name") name: string, @Body() dto: ExecuteToolDto) {
    return this.chatServer.executeTool(name, dto.params);
  }

  // Workflow Server endpoints (legacy direct access)
  @Get("workflow/tools")
  getWorkflowTools() {
    return this.workflowServer.getTools();
  }

  @Post("workflow/tools/:name")
  executeWorkflowTool(
    @Param("name") name: string,
    @Body() dto: ExecuteToolDto,
  ) {
    return this.workflowServer.executeTool(name, dto.params);
  }

  // Fuse Server endpoints (legacy direct access)
  @Get("fuse/tools")
  getFuseTools() {
    return this.fuseServer.getTools();
  }

  @Post("fuse/tools/:name")
  executeFuseTool(@Param("name") name: string, @Body() dto: ExecuteToolDto) {
    return this.fuseServer.executeTool(name, dto.params);
  }
}
