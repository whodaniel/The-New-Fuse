import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@the-new-fuse/database';
import { AggregateService } from './building-blocks/aggregate.service';
import { CustomAgentService } from './building-blocks/custom-agent.service';
import { DebateService } from './building-blocks/debate.service';
import {
  AgentExecutorService,
  AggregateBlock,
  DebateBlock,
  MassBlocksService,
  ReflectBlock,
} from './building-blocks/mass-blocks.service';
import { ReflectService } from './building-blocks/reflect.service';
import { ToolUseService } from './building-blocks/tool-use.service';
import { MassOrchestrationService } from './mass-orchestration.service';
import { MassController } from './mass.controller';
import {
  EvaluationHarnessService,
  LlmInteractionService,
  PromptOptimizerService,
} from './prompt-optimizer.service';
import { TopologyOptimizerService } from './topology-optimizer.service';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service';
import { RedisLockService } from '../../services/redis-lock.service';

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
