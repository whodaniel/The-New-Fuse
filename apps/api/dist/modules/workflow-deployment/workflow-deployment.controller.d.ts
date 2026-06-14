import { CloudflareDeploymentService } from './cloudflare-deployment.service';
export declare class WorkflowDeploymentController {
    private readonly deploymentService;
    constructor(deploymentService: CloudflareDeploymentService);
    deploy(id: string, workflow: any): Promise<any>;
}
//# sourceMappingURL=workflow-deployment.controller.d.ts.map