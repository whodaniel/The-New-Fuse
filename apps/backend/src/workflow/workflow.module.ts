import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';

@Module({
  controllers: [WorkflowController],
  providers: [],
  exports: [],
})
export class WorkflowModule {}
