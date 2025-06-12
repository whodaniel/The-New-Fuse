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
    private readonly fileCoordinationServer: MCPFileCoordinationServer,
    private readonly ragServer: MCPRAGServer,
    private readonly documentationOrchestrator: DocumentationOrchestrationService,
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

  // File Coordination Server endpoints
  @Get("file-coordination/tools")
  getFileCoordinationTools() {
    return this.fileCoordinationServer.getTools();
  }

  @Post("file-coordination/tools/:name")
  executeFileCoordinationTool(
    @Param("name") name: string,
    @Body() dto: ExecuteToolDto,
  ) {
    return this.fileCoordinationServer.executeTool(name, dto.params);
  }

  // RAG Server endpoints
  @Get("rag/tools")
  getRAGTools() {
    return this.ragServer.getTools();
  }

  @Post("rag/tools/:name")
  executeRAGTool(
    @Param("name") name: string,
    @Body() dto: ExecuteToolDto,
  ) {
    return this.ragServer.callTool(name, dto.params);
  }

  @Get("rag/status")
  async getRAGStatus() {
    return await this.ragServer.callTool('get_rag_status', {});
  }

  @Get("rag/collections")
  getRAGCollections() {
    return this.ragServer.getCollections();
  }

  @Post("rag/crawl-all")
  crawlAllDocumentation() {
    return this.ragServer.crawlAllDocumentation();
  }

  @Post("rag/query")
  performRAGQuery(@Body() dto: { query: string; collection_name?: string; max_results?: number; include_code?: boolean }) {
    return this.ragServer.callTool('perform_rag_query', dto);
  }

  @Post("rag/search-code")
  searchCodeExamples(@Body() dto: { query: string; language?: string; framework?: string; max_results?: number }) {
    return this.ragServer.callTool('search_code_examples', dto);
  }

  @Post("rag/search-vscode-api")
  searchVSCodeAPI(@Body() dto: { api_name: string; include_examples?: boolean; max_results?: number }) {
    return this.ragServer.callTool('search_vscode_api', dto);
  }

  @Post("rag/search-copilot")
  searchCopilotDocs(@Body() dto: { topic: string; include_examples?: boolean; max_results?: number }) {
    return this.ragServer.callTool('search_copilot_docs', dto);
  }

  // Documentation Orchestration endpoints
  @Post("docs/update-all")
  updateAllDocumentation() {
    return this.documentationOrchestrator.updateAllDocumentation();
  }

  @Post("docs/update/:source")
  updateSpecificDocumentation(
    @Param("source") source: string,
    @Body() dto: { url?: string; max_depth?: number; max_pages?: number }
  ) {
    return this.documentationOrchestrator.updateSpecificDocumentation(source, dto);
  }

  @Get("docs/status")
  getDocumentationStatus() {
    return this.documentationOrchestrator.getUpdateStatus();
  }

  @Get("docs/health")
  getDocumentationHealth() {
    return this.documentationOrchestrator.performDocumentationHealthCheck();
  }

  @Post("docs/search")
  searchAllDocumentation(@Body() dto: {
    query: string;
    maxResults?: number;
    includeCode?: boolean;
    sourceFilter?: string[];
  }) {
    return this.documentationOrchestrator.searchAllDocumentation(dto.query, {
      maxResults: dto.maxResults,
      includeCode: dto.includeCode,
      sourceFilter: dto.sourceFilter
    });
  }

  @Get("docs/recommendations")
  getDocumentationRecommendations() {
    return this.documentationOrchestrator.getDocumentationRecommendations();
  }
}
