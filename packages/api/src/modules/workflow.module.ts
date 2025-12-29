/**
 * Workflow Module
 * Organizes all workflow-related components using Drizzle ORM
 */

import { Module } from '@nestjs/common';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowRepository, WorkflowExecutionRepository } from '../repositories/workflow.repository';

@Module({
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowRepository,
    WorkflowExecutionRepository,
  ],
  exports: [WorkflowService, WorkflowRepository]
})
export class WorkflowModule {}
