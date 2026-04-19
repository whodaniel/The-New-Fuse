import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@the-new-fuse/database';
import {
  WORKFLOW_ENGINE_PROVIDER,
  WORKFLOW_EXECUTOR_PROVIDER,
} from '../providers/workflow-stubs.provider';
import { AgentApiGrantsService } from '../services/agent-api-grants.service';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
import { WorkflowService } from '../services/workflow.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { TNFMCPController } from './TNFMCPController';
import { TNFMCPService } from './TNFMCPService';
import { CacheService } from '../cache/cache.service';

@Module({
  // DatabaseModule provides DrizzleService (Drizzle-backed) for all services
  imports: [DatabaseModule, ConfigModule, JwtModule],
  providers: [
    CacheService,
    TNFMCPService,
    AgentService,
    ChatService,
    WorkflowService,
    ClaudeDevAutomationService,
    AgentApiGrantsService,
    WebsocketGateway,
    // Stub providers for WorkflowService dependencies (until real implementations are available)
    WORKFLOW_ENGINE_PROVIDER,
    WORKFLOW_EXECUTOR_PROVIDER,
  ],
  controllers: [TNFMCPController],
  exports: [TNFMCPService],
})
export class TNFMCPModule {}
