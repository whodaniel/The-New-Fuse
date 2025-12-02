import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@the-new-fuse/database';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { WebSocketGateway } from '../gateways/websocket.gateway';
import {
  WORKFLOW_ENGINE_PROVIDER,
  WORKFLOW_EXECUTOR_PROVIDER,
} from '../providers/workflow-stubs.provider';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
import { WorkflowService } from '../services/workflow.service';
import { TNFMCPController } from './TNFMCPController';
import { TNFMCPService } from './TNFMCPService';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([ChatRoom, Message])],
  providers: [
    TNFMCPService,
    AgentService,
    ChatService,
    WorkflowService,
    ClaudeDevAutomationService,
    WebSocketGateway,
    // Stub providers for WorkflowService dependencies (until real implementations are available)
    WORKFLOW_ENGINE_PROVIDER,
    WORKFLOW_EXECUTOR_PROVIDER,
  ],
  controllers: [TNFMCPController],
  exports: [TNFMCPService],
})
export class TNFMCPModule {}
