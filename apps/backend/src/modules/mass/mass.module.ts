import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MassController } from './mass.controller';
import { MassOrchestrationService } from './mass-orchestration.service';
import { PromptOptimizerService } from './prompt-optimizer.service';
import { TopologyOptimizerService } from './topology-optimizer.service';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service';
import { AggregateService } from './building-blocks/aggregate.service';
import { ReflectService } from './building-blocks/reflect.service';
import { DebateService } from './building-blocks/debate.service';
import { CustomAgentService } from './building-blocks/custom-agent.service';
import { ToolUseService } from './building-blocks/tool-use.service';

@Module({
  imports: [PrismaModule],
  controllers: [MassController],
  providers: [
    MassOrchestrationService,
    PromptOptimizerService,
    TopologyOptimizerService,
    WorkflowPromptOptimizerService,
    AggregateService,
    ReflectService,
    DebateService,
    CustomAgentService,
    ToolUseService
  ],
  exports: [
    MassOrchestrationService,
    PromptOptimizerService,
    TopologyOptimizerService,
    WorkflowPromptOptimizerService,
    AggregateService,
    ReflectService,
    DebateService,
    CustomAgentService,
    ToolUseService
  ]
})
export class MassModule {}
