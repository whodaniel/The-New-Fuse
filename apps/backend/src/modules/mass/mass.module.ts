import { Module } from '@nestjs/common';
import { PrismaModule } from '../lib/prisma/prisma.module.js';
import { MassController } from './mass.controller.js';
import { MassOrchestrationService } from './mass-orchestration.service.js';
import { PromptOptimizerService } from './prompt-optimizer.service.js';
import { TopologyOptimizerService } from './topology-optimizer.service.js';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service.js';
import { AggregateService } from './building-blocks/aggregate.service.js';
import { ReflectService } from './building-blocks/reflect.service.js';
import { DebateService } from './building-blocks/debate.service.js';
import { CustomAgentService } from './building-blocks/custom-agent.service.js';
import { ToolUseService } from './building-blocks/tool-use.service.js';

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
