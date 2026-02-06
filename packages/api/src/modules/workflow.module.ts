/**
 * Workflow Module
 * Organizes all workflow-related components using Drizzle ORM
 */

import { Module } from '@nestjs/common';
import {
  WorkflowExecutionRepository,
  WorkflowRepository,
} from '../repositories/workflow.repository';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowController } from './controllers/workflow.controller';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowRepository, WorkflowExecutionRepository],
  exports: [WorkflowService, WorkflowRepository],
})
export class WorkflowModule {}
