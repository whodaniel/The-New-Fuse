import { ConfigService } from '@nestjs/config';
import { UnifiedWorkflow } from '@the-new-fuse/workflow-engine';
export declare class CloudflareDeploymentService {
    private configService;
    private readonly logger;
    private readonly transpiler;
    constructor(configService: ConfigService);
    /**
     * Deploys a TNF UnifiedWorkflow to Cloudflare.
     */
    deployWorkflow(workflow: UnifiedWorkflow): Promise<any>;
    private sanitizeName;
    private sanitizeClassName;
}
//# sourceMappingURL=cloudflare-deployment.service.d.ts.map