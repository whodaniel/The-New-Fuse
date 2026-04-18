import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService.js';
import { AgentApiGrantsService } from '../services/agent-api-grants.service.js';
import { AgentService } from '../services/agent.service.js';
import { ChatService } from '../services/chat.service.js';
import { WorkflowService } from '../services/workflow.service.js';
import { TheNewFuseMCPServer } from './TheNewFuseMCPServer.js';

@Injectable()
export class TNFMCPService implements OnModuleInit {
  private readonly logger = new Logger(TNFMCPService.name);
  private mcpServer!: TheNewFuseMCPServer;

  constructor(
    private readonly agentService: AgentService,
    private readonly chatService: ChatService,
    private readonly workflowService: WorkflowService,
    private readonly claudeDevService: ClaudeDevAutomationService,
    private readonly agentGrantsService: AgentApiGrantsService
  ) {}

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
        agentGrants: this.agentGrantsService,
      });

      this.logger.log('TNF MCP Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TNF MCP Service:', error);
      throw error;
    }
  }

  getMCPServer(): TheNewFuseMCPServer {
    return this.mcpServer;
  }

  async startRemoteServer(port: number = 3001): Promise<void> {
    if (!this.mcpServer) {
      throw new Error('MCP Server not initialized');
    }

    try {
      await this.mcpServer.start('http', port);
      this.logger.log(`TNF MCP Server started on port ${port}`);
    } catch (error) {
      this.logger.error('Failed to start remote MCP server:', error);
      throw error;
    }
  }

  async getServerStatus(): Promise<any> {
    return {
      status: 'running',
      initialized: !!this.mcpServer,
      services: {
        agent: !!this.agentService,
        chat: !!this.chatService,
        workflow: !!this.workflowService,
        claudeDev: !!this.claudeDevService,
        agentGrants: !!this.agentGrantsService,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
