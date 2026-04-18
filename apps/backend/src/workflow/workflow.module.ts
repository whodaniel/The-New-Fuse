import { Module } from '@nestjs/common';
import { MassModule } from '../modules/mass/mass.module.js';
import { WorkflowExecutionGateway } from './workflow-execution.gateway.js';
import { WorkflowExecutionService } from './workflow-execution.service.js';
import { WorkflowController } from './workflow.controller.js';

@Module({
  imports: [MassModule],
  controllers: [WorkflowController],
  providers: [WorkflowExecutionService, WorkflowExecutionGateway],
  exports: [WorkflowExecutionService, WorkflowExecutionGateway],
})
export class WorkflowModule {}
