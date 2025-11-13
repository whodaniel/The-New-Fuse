import { BaseCommand } from '@the-new-fuse/commands-core';
import { CLIConfigManager } from '../lib/CLIConfigManager.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
/**
 * Modular Branch Switch Command
 */
export class ModularBranchSwitchCommand extends BaseCommand {
    constructor(data) {
        super('modular.branch.switch', data, {
            name: 'Modular Branch Switch',
            description: 'Switch between modular branches (main, development-tools, examples, etc.)',
            category: 'modular',
            version: '1.0.0',
            arguments: [
                {
                    name: 'branch',
                    description: 'Branch to switch to (main, development-tools, examples-and-templates, desktop-applications, experimental)',
                    required: true
                }
            ],
            options: [
                {
                    name: 'force',
                    short: 'f',
                    description: 'Force switch even with uncommitted changes'
                },
                {
                    name: 'pull',
                    short: 'p',
                    description: 'Pull latest changes after switching'
                }
            ]
        });
    }
    async executeInternal(context) {
        const validBranches = ['main', 'development-tools', 'examples-and-templates', 'desktop-applications', 'experimental'];
        if (!validBranches.includes(this.data.branch)) {
            throw new Error(`Invalid branch. Valid branches: ${validBranches.join(', ')}`);
        }
        console.log(chalk.blue(`🔄 Switching to modular branch: ${this.data.branch}`));
        try {
            // Check for uncommitted changes
            if (!this.data.force) {
                const status = execSync('git status --porcelain', { encoding: 'utf8' });
                if (status.trim()) {
                    const { proceed } = await inquirer.prompt([{
                            type: 'confirm',
                            name: 'proceed',
                            message: 'You have uncommitted changes. Continue anyway?',
                            default: false
                        }]);
                    if (!proceed) {
                        return { success: false, message: 'Branch switch cancelled' };
                    }
                }
            }
            // Switch branch
            execSync(`git checkout ${this.data.branch}`, { stdio: 'inherit' });
            // Pull latest changes if requested
            if (this.data.pull) {
                console.log(chalk.blue('📥 Pulling latest changes...'));
                execSync(`git pull origin ${this.data.branch}`, { stdio: 'inherit' });
            }
            // Update workspace configuration
            const configManager = new CLIConfigManager();
            await configManager.set('currentModularBranch', this.data.branch);
            console.log(chalk.green(`✅ Successfully switched to ${this.data.branch} branch`));
            return {
                success: true,
                branch: this.data.branch,
                pulled: this.data.pull || false
            };
        }
        catch (error) {
            console.error(chalk.red(`❌ Failed to switch branch: ${error.message}`));
            throw error;
        }
    }
}
/**
 * Modular Feature Enable Command
 */
export class ModularFeatureEnableCommand extends BaseCommand {
    constructor(data) {
        super('modular.feature.enable', data, {
            name: 'Modular Feature Enable',
            description: 'Enable optional features from modular branches',
            category: 'modular',
            version: '1.0.0',
            arguments: [
                {
                    name: 'feature',
                    description: 'Feature to enable (test-utils, examples, desktop-apps, etc.)',
                    required: true
                }
            ],
            options: [
                {
                    name: 'install-deps',
                    short: 'i',
                    description: 'Install dependencies after enabling'
                },
                {
                    name: 'build',
                    short: 'b',
                    description: 'Build the feature after enabling'
                }
            ]
        });
    }
    async executeInternal(context) {
        const featureMap = {
            'test-utils': { branch: 'development-tools', packages: ['test-utils', 'package-template'] },
            'examples': { branch: 'examples-and-templates', packages: ['claude-agent-sdk', 'jules-cli'] },
            'desktop-apps': { branch: 'desktop-applications', packages: ['desktop-app'] },
            'experimental': { branch: 'experimental', packages: ['experimental-features'] }
        };
        const feature = featureMap[this.data.feature];
        if (!feature) {
            throw new Error(`Unknown feature: ${this.data.feature}. Available: ${Object.keys(featureMap).join(', ')}`);
        }
        console.log(chalk.blue(`🔧 Enabling feature: ${this.data.feature}`));
        try {
            // Create feature branch reference
            const featureBranchPath = path.join(process.cwd(), '.tnf', 'features', this.data.feature);
            fs.mkdirSync(path.dirname(featureBranchPath), { recursive: true });
            // Add git worktree for the feature
            execSync(`git worktree add ${featureBranchPath} ${feature.branch}`, { stdio: 'inherit' });
            // Update workspace configuration to include feature packages
            const workspaceConfig = path.join(process.cwd(), 'pnpm-workspace.yaml');
            let workspaceContent = fs.readFileSync(workspaceConfig, 'utf8');
            // Add feature packages to workspace
            const featurePackagePaths = feature.packages.map(pkg => `.tnf/features/${this.data.feature}/packages/${pkg}`);
            featurePackagePaths.forEach(pkgPath => {
                if (!workspaceContent.includes(pkgPath)) {
                    workspaceContent += `  - "${pkgPath}"\n`;
                }
            });
            fs.writeFileSync(workspaceConfig, workspaceContent);
            // Install dependencies if requested
            if (this.data.installDeps) {
                console.log(chalk.blue('📦 Installing dependencies...'));
                execSync('pnpm install', { stdio: 'inherit' });
            }
            // Build if requested
            if (this.data.build) {
                console.log(chalk.blue('🔨 Building feature...'));
                execSync(`pnpm --filter "${this.data.feature}*" build`, { stdio: 'inherit' });
            }
            // Update CLI config
            const configManager = new CLIConfigManager();
            const enabledFeatures = await configManager.get('enabledFeatures') || [];
            if (!enabledFeatures.includes(this.data.feature)) {
                enabledFeatures.push(this.data.feature);
                await configManager.set('enabledFeatures', enabledFeatures);
            }
            console.log(chalk.green(`✅ Feature ${this.data.feature} enabled successfully`));
            return {
                success: true,
                feature: this.data.feature,
                packages: feature.packages,
                installed: this.data.installDeps || false,
                built: this.data.build || false
            };
        }
        catch (error) {
            console.error(chalk.red(`❌ Failed to enable feature: ${error.message}`));
            throw error;
        }
    }
}
/**
 * Modular Feature Disable Command
 */
export class ModularFeatureDisableCommand extends BaseCommand {
    constructor(data) {
        super('modular.feature.disable', data, {
            name: 'Modular Feature Disable',
            description: 'Disable optional features and clean up workspace',
            category: 'modular',
            version: '1.0.0',
            arguments: [
                {
                    name: 'feature',
                    description: 'Feature to disable',
                    required: true
                }
            ],
            options: [
                {
                    name: 'clean',
                    short: 'c',
                    description: 'Clean build artifacts and node_modules'
                }
            ]
        });
    }
    async executeInternal(context) {
        console.log(chalk.blue(`🔧 Disabling feature: ${this.data.feature}`));
        try {
            const featureBranchPath = path.join(process.cwd(), '.tnf', 'features', this.data.feature);
            if (!fs.existsSync(featureBranchPath)) {
                throw new Error(`Feature ${this.data.feature} is not currently enabled`);
            }
            // Remove git worktree
            execSync(`git worktree remove ${featureBranchPath}`, { stdio: 'inherit' });
            // Update workspace configuration
            const workspaceConfig = path.join(process.cwd(), 'pnpm-workspace.yaml');
            let workspaceContent = fs.readFileSync(workspaceConfig, 'utf8');
            // Remove feature package paths
            const lines = workspaceContent.split('\n');
            const filteredLines = lines.filter(line => !line.includes(`.tnf/features/${this.data.feature}`));
            fs.writeFileSync(workspaceConfig, filteredLines.join('\n'));
            // Clean if requested
            if (this.data.clean) {
                console.log(chalk.blue('🧹 Cleaning build artifacts...'));
                execSync('pnpm clean', { stdio: 'inherit' });
            }
            // Update CLI config
            const configManager = new CLIConfigManager();
            const enabledFeatures = await configManager.get('enabledFeatures') || [];
            const updatedFeatures = enabledFeatures.filter(f => f !== this.data.feature);
            await configManager.set('enabledFeatures', updatedFeatures);
            console.log(chalk.green(`✅ Feature ${this.data.feature} disabled successfully`));
            return {
                success: true,
                feature: this.data.feature,
                cleaned: this.data.clean || false
            };
        }
        catch (error) {
            console.error(chalk.red(`❌ Failed to disable feature: ${error.message}`));
            throw error;
        }
    }
}
/**
 * Modular Status Command
 */
export class ModularStatusCommand extends BaseCommand {
    constructor(data) {
        super('modular.status', data, {
            name: 'Modular Status',
            description: 'Show current modular architecture status',
            category: 'modular',
            version: '1.0.0',
            arguments: [],
            options: [
                {
                    name: 'detailed',
                    short: 'd',
                    description: 'Show detailed package information'
                }
            ]
        });
    }
    async executeInternal(context) {
        console.log(chalk.blue.bold('📊 Modular Architecture Status\n'));
        try {
            const configManager = new CLIConfigManager();
            // Current branch
            const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            const configBranch = await configManager.get('currentModularBranch') || 'main';
            console.log(chalk.cyan('🌿 Current Branch:'), currentBranch);
            if (currentBranch !== configBranch) {
                console.log(chalk.yellow('⚠️  Config branch mismatch:'), configBranch);
            }
            // Enabled features
            const enabledFeatures = await configManager.get('enabledFeatures') || [];
            console.log(chalk.cyan('\n🔧 Enabled Features:'));
            if (enabledFeatures.length === 0) {
                console.log(chalk.gray('  None'));
            }
            else {
                enabledFeatures.forEach(feature => {
                    const featurePath = path.join(process.cwd(), '.tnf', 'features', feature);
                    const status = fs.existsSync(featurePath) ? chalk.green('✅') : chalk.red('❌');
                    console.log(`  ${status} ${feature}`);
                });
            }
            // Available branches
            const branches = execSync('git branch -r', { encoding: 'utf8' })
                .split('\n')
                .map(b => b.trim().replace('origin/', ''))
                .filter(b => b && !b.includes('HEAD') && ['main', 'development-tools', 'examples-and-templates', 'desktop-applications', 'experimental'].includes(b));
            console.log(chalk.cyan('\n🌿 Available Modular Branches:'));
            branches.forEach(branch => {
                const indicator = branch === currentBranch ? chalk.green('→') : ' ';
                console.log(`  ${indicator} ${branch}`);
            });
            // Package counts if detailed
            if (this.data.detailed) {
                console.log(chalk.cyan('\n📦 Package Information:'));
                const workspaceConfig = path.join(process.cwd(), 'pnpm-workspace.yaml');
                const workspaceContent = fs.readFileSync(workspaceConfig, 'utf8');
                const packagePaths = workspaceContent.match(/- "([^"]+)"/g) || [];
                console.log(`  Total workspace packages: ${packagePaths.length}`);
                const corePackages = packagePaths.filter(p => !p.includes('.tnf/features')).length;
                const featurePackages = packagePaths.filter(p => p.includes('.tnf/features')).length;
                console.log(`  Core packages: ${corePackages}`);
                console.log(`  Feature packages: ${featurePackages}`);
            }
            return {
                success: true,
                currentBranch,
                enabledFeatures,
                availableBranches: branches
            };
        }
        catch (error) {
            console.error(chalk.red(`❌ Failed to get status: ${error.message}`));
            throw error;
        }
    }
}
// Command Handlers
export class ModularBranchSwitchHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.branch.switch'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'MODULAR_BRANCH_SWITCH_ERROR',
                    details: error
                },
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.branch.switch'
                }
            };
        }
    }
    canHandle(command) {
        return command.type === 'modular.branch.switch';
    }
    getMetadata() {
        return {
            name: 'ModularBranchSwitchHandler',
            version: '1.0.0',
            description: 'Handles modular branch switching commands'
        };
    }
}
export class ModularFeatureEnableHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.feature.enable'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'MODULAR_FEATURE_ENABLE_ERROR',
                    details: error
                },
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.feature.enable'
                }
            };
        }
    }
    canHandle(command) {
        return command.type === 'modular.feature.enable';
    }
    getMetadata() {
        return {
            name: 'ModularFeatureEnableHandler',
            version: '1.0.0',
            description: 'Handles modular feature enabling commands'
        };
    }
}
export class ModularFeatureDisableHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.feature.disable'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'MODULAR_FEATURE_DISABLE_ERROR',
                    details: error
                },
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.feature.disable'
                }
            };
        }
    }
    canHandle(command) {
        return command.type === 'modular.feature.disable';
    }
    getMetadata() {
        return {
            name: 'ModularFeatureDisableHandler',
            version: '1.0.0',
            description: 'Handles modular feature disabling commands'
        };
    }
}
export class ModularStatusHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.status'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'MODULAR_STATUS_ERROR',
                    details: error
                },
                metadata: {
                    executionTime: Date.now() - context.timestamp.getTime(),
                    commandType: 'modular.status'
                }
            };
        }
    }
    canHandle(command) {
        return command.type === 'modular.status';
    }
    getMetadata() {
        return {
            name: 'ModularStatusHandler',
            version: '1.0.0',
            description: 'Handles modular status commands'
        };
    }
}
//# sourceMappingURL=modular-commands.js.map