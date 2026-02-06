import { Module } from '@nestjs/common';
import { WorkflowTemplatesController } from './workflow-templates.controller';
import { WorkflowTemplatesService } from './workflow-templates.service';

@Module({
  controllers: [WorkflowTemplatesController],
  providers: [WorkflowTemplatesService],
  exports: [WorkflowTemplatesService],
})
export class WorkflowTemplatesModule {}
