/**
 * Workflow Module
 * Organizes all workflow-related components using Drizzle ORM
 */

import { Module } from '@nestjs/common';
import { WorkflowController } from './controllers/workflow.controller.js';
import { WorkflowService } from '../services/workflow.service.js';
import { WorkflowRepository, WorkflowExecutionRepository } from '../repositories/workflow.repository.js';

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
