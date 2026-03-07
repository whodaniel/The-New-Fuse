import { Module } from '@nestjs/common';
import { MassModule } from '../modules/mass/mass.module';
import { WorkflowExecutionGateway } from './workflow-execution.gateway';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowController } from './workflow.controller';

@Module({
  imports: [MassModule],
  controllers: [WorkflowController],
  providers: [WorkflowExecutionService, WorkflowExecutionGateway],
  exports: [WorkflowExecutionService, WorkflowExecutionGateway],
})
export class WorkflowModule {}
