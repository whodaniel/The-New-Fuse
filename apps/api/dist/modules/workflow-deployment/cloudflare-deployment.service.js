"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CloudflareDeploymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareDeploymentService = void 0;
// @ts-nocheck
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const workflow_engine_1 = require("@the-new-fuse/workflow-engine");
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("node:os"));
const node_util_1 = require("node:util");
const execAsync = (0, node_util_1.promisify)(node_child_process_1.exec);
let CloudflareDeploymentService = CloudflareDeploymentService_1 = class CloudflareDeploymentService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CloudflareDeploymentService_1.name);
        this.transpiler = new workflow_engine_1.CloudflareWorkflowTranspiler();
    }
    /**
     * Deploys a TNF UnifiedWorkflow to Cloudflare.
     */
    async deployWorkflow(workflow) {
        const apiToken = this.configService.get('CLOUDFLARE_API_TOKEN');
        const accountId = this.configService.get('CLOUDFLARE_ACCOUNT_ID');
        if (!apiToken || !accountId) {
            throw new common_1.InternalServerErrorException('Cloudflare credentials not configured');
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
TNF_API_URL = "${this.configService.get('VITE_API_URL') || 'http://localhost:3001'}"

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
        }
        catch (error) {
            this.logger.error(`Deployment failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Cloudflare deployment failed: ${error.message}`);
        }
        finally {
            // Cleanup
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            catch (e) {
                this.logger.warn(`Failed to cleanup temp dir: ${tempDir}`);
            }
        }
    }
    sanitizeName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    sanitizeClassName(name) {
        return name.replace(/[^a-zA-Z0-9]/g, '') + 'Workflow';
    }
};
exports.CloudflareDeploymentService = CloudflareDeploymentService;
exports.CloudflareDeploymentService = CloudflareDeploymentService = CloudflareDeploymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CloudflareDeploymentService);
//# sourceMappingURL=cloudflare-deployment.service.js.map