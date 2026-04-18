import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudflareDeploymentService } from './cloudflare-deployment.service.js';
import { WorkflowDeploymentController } from './workflow-deployment.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [WorkflowDeploymentController],
  providers: [CloudflareDeploymentService],
  exports: [CloudflareDeploymentService],
})
export class WorkflowDeploymentModule {}
