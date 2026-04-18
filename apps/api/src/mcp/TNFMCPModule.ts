import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';
import {
  WORKFLOW_ENGINE_PROVIDER,
  WORKFLOW_EXECUTOR_PROVIDER,
} from '../providers/workflow-stubs.provider.js';
import { AgentApiGrantsService } from '../services/agent-api-grants.service.js';
import { AgentService } from '../services/agent.service.js';
import { ChatService } from '../services/chat.service.js';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService.js';
import { WorkflowService } from '../services/workflow.service.js';
import { WebsocketGateway } from '../websocket/websocket.gateway.js';
import { TNFMCPController } from './TNFMCPController.js';
import { TNFMCPService } from './TNFMCPService.js';
import { CacheService } from '../cache/cache.service.js';

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
