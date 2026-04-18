import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@the-new-fuse/database';
import { AggregateService } from './building-blocks/aggregate.service.js';
import { CustomAgentService } from './building-blocks/custom-agent.service.js';
import { DebateService } from './building-blocks/debate.service.js';
import {
  AgentExecutorService,
  AggregateBlock,
  DebateBlock,
  MassBlocksService,
  ReflectBlock,
} from './building-blocks/mass-blocks.service.js';
import { ReflectService } from './building-blocks/reflect.service.js';
import { ToolUseService } from './building-blocks/tool-use.service.js';
import { MassOrchestrationService } from './mass-orchestration.service.js';
import { MassController } from './mass.controller.js';
import {
  EvaluationHarnessService,
  LlmInteractionService,
  PromptOptimizerService,
} from './prompt-optimizer.service.js';
import { TopologyOptimizerService } from './topology-optimizer.service.js';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service.js';
import { RedisLockService } from '../../services/redis-lock.service.js';

@Module({
  imports: [ConfigModule, DrizzleModule.forRootAsync()],
  controllers: [MassController],
  providers: [
    MassOrchestrationService,
    RedisLockService,
    PromptOptimizerService,
    EvaluationHarnessService,
    LlmInteractionService,
    TopologyOptimizerService,
    WorkflowPromptOptimizerService,
    AggregateService,
    ReflectService,
    DebateService,
    CustomAgentService,
    ToolUseService,
    AggregateBlock,
    AgentExecutorService,
    MassBlocksService,
    ReflectBlock,
    DebateBlock,
  ],
  exports: [
    MassOrchestrationService,
    PromptOptimizerService,
    EvaluationHarnessService,
    LlmInteractionService,
    TopologyOptimizerService,
    WorkflowPromptOptimizerService,
    AggregateService,
    ReflectService,
    DebateService,
    CustomAgentService,
    ToolUseService,
    AggregateBlock,
    AgentExecutorService,
    MassBlocksService,
    ReflectBlock,
    DebateBlock,
  ],
})
export class MassModule {}
