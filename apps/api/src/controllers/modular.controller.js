var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
let ModularController = class ModularController {
    validBranches = [
        'main',
        'development-tools',
        'examples-and-templates',
        'desktop-applications',
        'experimental'
    ];
    featureMap = {
        'test-utils': { branch: 'development-tools', packages: ['test-utils', 'package-template'] },
        'examples': { branch: 'examples-and-templates', packages: ['claude-agent-sdk', 'jules-cli'] },
        'desktop-apps': { branch: 'desktop-applications', packages: ['desktop-app'] },
        'experimental': { branch: 'experimental', packages: ['experimental-features'] }
    };
    async getStatus(detailed) {
        try {
            // Get current branch
            const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            // Get available branches
            const availableBranches = execSync('git branch -r', { encoding: 'utf8' })
                .split('\n')
                .map(b => b.trim().replace('origin/', ''))
                .filter(b => b && !b.includes('HEAD') && this.validBranches.includes(b));
            // Get enabled features by checking for feature directories
            const enabledFeatures = [];
            const featuresDir = path.join(process.cwd(), '.tnf', 'features');
            if (fs.existsSync(featuresDir)) {
                const featureDirs = fs.readdirSync(featuresDir, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);
                enabledFeatures.push(...featureDirs);
            }
            let packageCounts;
            if (detailed === 'true') {
                packageCounts = await this.getPackageCounts();
            }
            return {
                currentBranch,
                enabledFeatures,
                availableBranches,
                packageCounts
            };
        }
        catch (error) {
            throw new HttpException(`Failed to get modular status: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async switchBranch(request) {
        try {
            if (!this.validBranches.includes(request.branch)) {
                throw new HttpException(`Invalid branch. Valid branches: ${this.validBranches.join(', ')}`, HttpStatus.BAD_REQUEST);
            }
            // Check for uncommitted changes if not forcing
            if (!request.force) {
                const status = execSync('git status --porcelain', { encoding: 'utf8' });
                if (status.trim()) {
                    throw new HttpException('You have uncommitted changes. Use force=true to override.', HttpStatus.CONFLICT);
                }
            }
            // Switch branch
            execSync(`git checkout ${request.branch}`, { stdio: 'pipe' });
            // Pull latest changes if requested
            if (request.pull) {
                execSync(`git pull origin ${request.branch}`, { stdio: 'pipe' });
            }
            return {
                success: true,
                branch: request.branch,
                pulled: request.pull || false,
                message: `Successfully switched to ${request.branch} branch`
            };
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(`Failed to switch branch: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async enableFeature(request) {
        try {
            const feature = this.featureMap[request.feature];
            if (!feature) {
                throw new HttpException(`Unknown feature: ${request.feature}. Available: ${Object.keys(this.featureMap).join(', ')}`, HttpStatus.BAD_REQUEST);
            }
            // Create feature directory structure
            const featureBranchPath = path.join(process.cwd(), '.tnf', 'features', request.feature);
            fs.mkdirSync(path.dirname(featureBranchPath), { recursive: true });
            // Add git worktree for the feature
            execSync(`git worktree add ${featureBranchPath} ${feature.branch}`, { stdio: 'pipe' });
            // Update workspace configuration
            await this.updateWorkspaceConfig(request.feature, feature.packages, true);
            // Install dependencies if requested
            if (request.installDeps) {
                execSync('pnpm install', { stdio: 'pipe' });
            }
            // Build if requested
            if (request.build) {
                execSync(`pnpm --filter "${request.feature}*" build`, { stdio: 'pipe' });
            }
            return {
                success: true,
                feature: request.feature,
                packages: feature.packages,
                installed: request.installDeps || false,
                built: request.build || false,
                message: `Feature ${request.feature} enabled successfully`
            };
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(`Failed to enable feature: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async disableFeature(request) {
        try {
            const featureBranchPath = path.join(process.cwd(), '.tnf', 'features', request.feature);
            if (!fs.existsSync(featureBranchPath)) {
                throw new HttpException(`Feature ${request.feature} is not currently enabled`, HttpStatus.BAD_REQUEST);
            }
            // Remove git worktree
            execSync(`git worktree remove ${featureBranchPath}`, { stdio: 'pipe' });
            // Update workspace configuration
            await this.updateWorkspaceConfig(request.feature, [], false);
            // Clean if requested
            if (request.clean) {
                execSync('pnpm clean', { stdio: 'pipe' });
            }
            return {
                success: true,
                feature: request.feature,
                cleaned: request.clean || false,
                message: `Feature ${request.feature} disabled successfully`
            };
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(`Failed to disable feature: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPackageCounts() {
        try {
            const workspaceConfig = path.join(process.cwd(), 'pnpm-workspace.yaml');
            const workspaceContent = fs.readFileSync(workspaceConfig, 'utf8');
            const packagePaths = workspaceContent.match(/- "([^"]+)"/g) || [];
            const total = packagePaths.length;
            const feature = packagePaths.filter(p => p.includes('.tnf/features')).length;
            const core = total - feature;
            return { total, core, feature };
        }
        catch (error) {
            return { total: 0, core: 0, feature: 0 };
        }
    }
    async updateWorkspaceConfig(feature, packages, enable) {
        const workspaceConfig = path.join(process.cwd(), 'pnpm-workspace.yaml');
        let workspaceContent = fs.readFileSync(workspaceConfig, 'utf8');
        if (enable) {
            // Add feature packages to workspace
            const featurePackagePaths = packages.map(pkg => `.tnf/features/${feature}/packages/${pkg}`);
            featurePackagePaths.forEach(pkgPath => {
                if (!workspaceContent.includes(pkgPath)) {
                    workspaceContent += `  - "${pkgPath}"\n`;
                }
            });
        }
        else {
            // Remove feature package paths
            const lines = workspaceContent.split('\n');
            const filteredLines = lines.filter(line => !line.includes(`.tnf/features/${feature}`));
            workspaceContent = filteredLines.join('\n');
        }
        fs.writeFileSync(workspaceConfig, workspaceContent);
    }
};
__decorate([
    Get('status'),
    ApiOperation({ summary: 'Get current modular architecture status' }),
    ApiResponse({ status: 200, description: 'Modular status retrieved successfully' }),
    __param(0, Query('detailed')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModularController.prototype, "getStatus", null);
__decorate([
    Post('switch'),
    ApiOperation({ summary: 'Switch to a different modular branch' }),
    ApiBody({ type: Object, description: 'Branch switch configuration' }),
    ApiResponse({ status: 200, description: 'Branch switched successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModularController.prototype, "switchBranch", null);
__decorate([
    Post('enable'),
    ApiOperation({ summary: 'Enable an optional feature' }),
    ApiBody({ type: Object, description: 'Feature enable configuration' }),
    ApiResponse({ status: 200, description: 'Feature enabled successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModularController.prototype, "enableFeature", null);
__decorate([
    Post('disable'),
    ApiOperation({ summary: 'Disable an optional feature' }),
    ApiBody({ type: Object, description: 'Feature disable configuration' }),
    ApiResponse({ status: 200, description: 'Feature disabled successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModularController.prototype, "disableFeature", null);
ModularController = __decorate([
    ApiTags('modular'),
    Controller('api/modular')
], ModularController);
export { ModularController };
//# sourceMappingURL=modular.controller.js.map