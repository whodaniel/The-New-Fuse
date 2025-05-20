/**
 * Workflow Module
 * Organizes all workflow-related components
 */

import { Module } from '@nestjs/common';
import { WorkflowController } from './controllers/workflow.controller.js';
import { WorkflowService } from './services/workflow.service.js';
import { PrismaService } from '../services/prisma.service.js';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, PrismaService],
  exports: [WorkflowService]
})
export class WorkflowModule {}
