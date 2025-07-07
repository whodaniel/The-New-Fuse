/**
 * Workflow Module
 * Organizes all workflow-related components
 */

import { Module } from '@nestjs/common';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowService } from './services/workflow.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, PrismaService],
  exports: [WorkflowService]
})
export class WorkflowModule {}
