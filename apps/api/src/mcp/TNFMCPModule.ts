import { Module } from '@nestjs/common';
import { TNFMCPService } from './TNFMCPService';
import { TNFMCPController } from './TNFMCPController';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { WorkflowService } from '../services/workflow.service';
import { MonitoringService } from '../services/monitoring.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';

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
