import { OnModuleInit } from '@nestjs/common';
import { TheNewFuseMCPServer } from '../../../../src/mcp/TheNewFuseMCPServer';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { WorkflowService } from '../services/workflow.service';
import { MonitoringService } from '../services/monitoring.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
export declare class TNFMCPService implements OnModuleInit {
    private readonly agentService;
    private readonly chatService;
    private readonly workflowService;
    private readonly monitoringService;
    private readonly claudeDevService;
    private readonly logger;
    private mcpServer;
    constructor(agentService: AgentService, chatService: ChatService, workflowService: WorkflowService, monitoringService: MonitoringService, claudeDevService: ClaudeDevAutomationService);
    onModuleInit(): Promise<void>;
    getMCPServer(): TheNewFuseMCPServer;
    startRemoteServer(port?: number): Promise<void>;
    getServerStatus(): Promise<any>;
}
