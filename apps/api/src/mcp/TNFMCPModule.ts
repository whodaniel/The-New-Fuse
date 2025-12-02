import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { WebSocketGateway } from '../gateways/websocket.gateway';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
import { WorkflowService } from '../services/workflow.service';
import { TNFMCPController } from './TNFMCPController';
import { TNFMCPService } from './TNFMCPService';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, Message])],
  providers: [
    TNFMCPService,
    AgentService,
    ChatService,
    WorkflowService,
    ClaudeDevAutomationService,
    WebSocketGateway,
  ],
  controllers: [TNFMCPController],
  exports: [TNFMCPService],
})
export class TNFMCPModule {}
