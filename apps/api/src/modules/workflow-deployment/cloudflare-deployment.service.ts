// @ts-nocheck
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
import { CloudflareWorkflowTranspiler, UnifiedWorkflow } from '@the-new-fuse/workflow-engine';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class CloudflareDeploymentService {
  private readonly logger = new Logger(CloudflareDeploymentService.name);
  private readonly transpiler = new CloudflareWorkflowTranspiler();

  constructor(private configService: ConfigService) {}

  /**
   * Deploys a TNF UnifiedWorkflow to Cloudflare.
   */
  async deployWorkflow(workflow: UnifiedWorkflow): Promise<any> {
    const apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');
    const accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');

    if (!apiToken || !accountId) {
      throw new InternalServerErrorException('Cloudflare credentials not configured');
    }

    const tempDir = path.join(os.tmpdir(), `tnf-cf-${workflow.id}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // 1. Transpile code
      const workerCode = this.transpiler.transpile(workflow);
      const workerPath = path.join(tempDir, 'index.ts');
      fs.writeFileSync(workerPath, workerCode);

      // 2. Generate wrangler.toml
      const wranglerConfig = `
name = "tnf-workflow-${this.sanitizeName(workflow.name)}"
main = "index.ts"
compatibility_date = "2024-04-03"

[vars]
TNF_API_URL = "${this.configService.get<string>('VITE_API_URL') || 'http://localhost:3001'}"

[[workflows]]
name = "${this.sanitizeName(workflow.name)}"
binding = "WORKFLOW"
class_name = "${this.sanitizeClassName(workflow.name)}"
`.trim();
      
      fs.writeFileSync(path.join(tempDir, 'wrangler.toml'), wranglerConfig);

      // 3. Execute Deployment
      this.logger.log(`Deploying workflow ${workflow.name} to Cloudflare...`);
      
      const { stdout, stderr } = await execAsync('npx wrangler deploy', {
        cwd: tempDir,
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: apiToken,
          CLOUDFLARE_ACCOUNT_ID: accountId,
        },
      });

      if (stderr && !stderr.includes('Success')) {
        this.logger.error(`Wrangler error: ${stderr}`);
      }

      this.logger.log(`Successfully deployed ${workflow.name}`);

      return {
        success: true,
        workflowId: workflow.id,
        deploymentOutput: stdout,
        dashboardUrl: `https://dash.cloudflare.com/${accountId}/workers/services/view/tnf-workflow-${this.sanitizeName(workflow.name)}`,
      };

    } catch (error) {
      this.logger.error(`Deployment failed: ${error.message}`);
      throw new InternalServerErrorException(`Cloudflare deployment failed: ${error.message}`);
    } finally {
      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        this.logger.warn(`Failed to cleanup temp dir: ${tempDir}`);
      }
    }
  }

  private sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  private sanitizeClassName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '') + 'Workflow';
  }
}
