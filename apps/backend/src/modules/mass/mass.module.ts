import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AggregateService } from './building-blocks/aggregate.service';
import { CustomAgentService } from './building-blocks/custom-agent.service';
import { DebateService } from './building-blocks/debate.service';
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
import { AggregateBlock, AgentExecutorService, MassBlocksService } from './building-blocks/mass-blocks.service';

@Module({
  imports: [PrismaModule],
  controllers: [MassController],
  providers: [
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
  ],
})
export class MassModule {}
