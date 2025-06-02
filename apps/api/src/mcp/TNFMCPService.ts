import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { TheNewFuseMCPServer } from '../../../../src/mcp/TheNewFuseMCPServer';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { WorkflowService } from '../services/workflow.service';
import { MonitoringService } from '../services/monitoring.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';

@Injectable()
export class TNFMCPService implements OnModuleInit {
  private readonly logger = new Logger(TNFMCPService.name);
  private mcpServer: TheNewFuseMCPServer;

  constructor(
    private readonly agentService: AgentService,
    private readonly chatService: ChatService,
    private readonly workflowService: WorkflowService,
    private readonly monitoringService: MonitoringService,
    private readonly claudeDevService: ClaudeDevAutomationService,
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
        monitoring: this.monitoringService,
        claudeDev: this.claudeDevService,
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
        monitoring: !!this.monitoringService,
        claudeDev: !!this.claudeDevService,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
