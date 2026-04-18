import { Controller, Post, Param, UseGuards, NotFoundException, Body } from '@nestjs/common';
import { CloudflareDeploymentService } from './cloudflare-deployment.service.js';
// @ts-ignore
// @ts-ignore
import { UnifiedWorkflow } from '@the-new-fuse/workflow-engine';

@Controller('workflow')
export class WorkflowDeploymentController {
  constructor(private readonly deploymentService: CloudflareDeploymentService) {}

  @Post(':id/deploy-to-cloudflare')
  async deploy(@Param('id') id: string, @Body() workflow: UnifiedWorkflow) {
    // Note: In a production scenario, we would fetch the workflow from the database
    // using the ID. For this implementation, we expect the full workflow object in the body
    // to allow for deploying "draft" versions from the UI.
    
    if (!workflow) {
      throw new NotFoundException('Workflow definition required');
    }

    return await this.deploymentService.deployWorkflow(workflow);
  }
}
