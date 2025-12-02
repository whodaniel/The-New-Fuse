import { Module } from '@nestjs/common';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
import { WorkflowService } from '../services/workflow.service';
import { TNFMCPController } from './TNFMCPController';
import { TNFMCPService } from './TNFMCPService';

@Module({
  imports: [PrismaModule],
  providers: [
    TNFMCPService,
    AgentService,
    ChatService,
    WorkflowService,
    ClaudeDevAutomationService,
  ],
  controllers: [TNFMCPController],
  exports: [TNFMCPService],
})
export class TNFMCPModule {}
