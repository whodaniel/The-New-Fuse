import { Module } from '@nestjs/common';
import { TNFMCPService } from './TNFMCPService.js';
import { TNFMCPController } from './TNFMCPController.js';
import { AgentService } from '../services/agent.service.js';
import { ChatService } from '../services/chat.service.js';
import { WorkflowService } from '../services/workflow.service.js';
import { MonitoringService } from '../services/monitoring.service.js';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService.js';

@Module({
  providers: [
    TNFMCPService,
    AgentService,
    ChatService,
    WorkflowService,
    MonitoringService,
    ClaudeDevAutomationService,
  ],
  controllers: [TNFMCPController],
  exports: [TNFMCPService],
})
export class TNFMCPModule {}
