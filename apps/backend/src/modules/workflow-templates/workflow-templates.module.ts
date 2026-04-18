import { Module } from '@nestjs/common';
import { WorkflowTemplatesController } from './workflow-templates.controller.js';
import { WorkflowTemplatesService } from './workflow-templates.service.js';

@Module({
  controllers: [WorkflowTemplatesController],
  providers: [WorkflowTemplatesService],
  exports: [WorkflowTemplatesService]
})
export class WorkflowTemplatesModule {}
