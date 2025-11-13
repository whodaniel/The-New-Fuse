import { BaseCommand } from '@the-new-fuse/commands-core';
import { ApiClient } from '../lib/ApiClient.js';
import { CLIConfigManager } from '../lib/CLIConfigManager.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/**
 * Custom Modes List Command
 */
export class CustomModesListCommand extends BaseCommand {
    constructor(data) {
        super('modes.list', data, {
            name: 'Custom Modes List',
            description: 'List all available custom modes',
            category: 'modes',
            version: '1.0.0'
        });
    }

    async executeInternal(context) {
        const apiClient = new ApiClient();
        const configManager = new CLIConfigManager();

        try {
            // Try to load from local config first
            const localConfigPath = path.join(process.cwd(), '.tnf', 'custom-modes.json');
            let modes = [];

            if (fs.existsSync(localConfigPath)) {
                const localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
                modes = localConfig.customModes || [];
            }

            // Also try to load from backend
            try {
                const response = await apiClient.get('/modes');
                if (response.modes) {
                    modes = [...modes, ...response.modes];
                }
            } catch (error) {
                console.log(chalk.gray('  (Could not load from backend, using local config)'));
            }

            if (modes.length === 0) {
                console.log(chalk.yellow('\n📋 No custom modes found'));
                console.log(chalk.gray('Run "tnf modes create-default" to create default modes'));
                return { modes: [], count: 0 };
            }

            console.log(chalk.blue.bold(`\n📋 Available Custom Modes (${modes.length}):\n`));

            modes.forEach((mode, index) => {
                console.log(chalk.green(`  ${index + 1}. ${mode.name}`));
                console.log(chalk.cyan(`     Slug: ${mode.slug}`));
                console.log(chalk.gray(`     ${mode.roleDefinition.substring(0, 100)}...`));
                if (mode.color) {
                    console.log(chalk.magenta(`     Color: ${mode.color}`));
                }
                console.log();
            });

            return { modes, count: modes.length };
        } catch (error) {
            throw new Error(`Failed to list custom modes: ${error.message}`);
        }
    }
}

/**
 * Custom Modes Create Default Command
 */
export class CustomModesCreateDefaultCommand extends BaseCommand {
    constructor(data) {
        super('modes.create-default', data, {
            name: 'Custom Modes Create Default',
            description: 'Create default custom modes',
            category: 'modes',
            version: '1.0.0'
        });
    }

    async executeInternal(context) {
        const apiClient = new ApiClient();

        try {
            const defaultModes = [
                {
                    name: "Codebase Pathway Tracer",
                    slug: "codebase-pathway-tracer",
                    roleDefinition: "You are an expert Technical Architect & Code Analyst specializing in codebase pathway analysis. You trace logical pathways through codebases, analyzing code structure, data flow, execution paths, dependency relationships, and architectural patterns to map comprehensive logical pathways."
                },
                {
                    name: "Meta Agent Architect",
                    slug: "meta-agent-architect",
                    roleDefinition: "You are an expert Agent Designer & System Architect who designs and generates complete AI agent configurations. You analyze user requirements to create specialized agents with appropriate tools, capabilities, and domain expertise."
                },
                {
                    name: "Visual Asset Creator",
                    slug: "visual-asset-creator",
                    roleDefinition: "You are a Visual Designer & Asset Manager who creates compelling visual assets for content. You source high-quality stock photos, generate custom graphics, and optimize images for web performance while ensuring legal compliance and brand consistency."
                },
                {
                    name: "Frontend Specialist",
                    slug: "frontend-specialist",
                    roleDefinition: "You are a master UI/UX Designer & Frontend Developer specializing in creating intuitive user interfaces and exceptional user experiences. You implement responsive designs, ensure accessibility compliance, conduct user testing, and optimize frontend performance across all devices and platforms."
                }
            ];

            // Save to local config
            const configDir = path.join(process.cwd(), '.tnf');
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            const configPath = path.join(configDir, 'custom-modes.json');
            fs.writeFileSync(configPath, JSON.stringify({ customModes: defaultModes }, null, 2));

            // Also save to backend
            try {
                await apiClient.post('/modes/batch', { modes: defaultModes });
            } catch (error) {
                console.log(chalk.gray('  (Could not save to backend, saved locally only)'));
            }

            console.log(chalk.green(`\n✅ Created ${defaultModes.length} default custom modes`));
            console.log(chalk.gray(`   Saved to: ${configPath}`));

            return { modes: defaultModes, count: defaultModes.length };
        } catch (error) {
            throw new Error(`Failed to create default modes: ${error.message}`);
        }
    }
}

/**
 * Code Analysis Command
 */
export class CodeAnalysisCommand extends BaseCommand {
    constructor(data) {
        super('analysis.run', data, {
            name: 'Code Analysis',
            description: 'Analyze code files or workspace',
            category: 'analysis',
            version: '1.0.0',
            arguments: [
                {
                    name: 'target',
                    description: 'File or directory to analyze',
                    required: false
                }
            ],
            options: [
                {
                    name: 'workspace',
                    short: 'w',
                    description: 'Analyze entire workspace'
                },
                {
                    name: 'output',
                    short: 'o',
                    description: 'Output format (text, json)',
                    value: 'format'
                }
            ]
        });
    }

    async executeInternal(context) {
        const apiClient = new ApiClient();
        const target = this.data.target || process.cwd();
        const isWorkspace = this.data.workspace || !fs.existsSync(target);

        try {
            console.log(chalk.blue(`\n🔍 Analyzing ${isWorkspace ? 'workspace' : 'file'}: ${target}`));

            const response = await apiClient.post('/analysis', {
                target,
                type: isWorkspace ? 'workspace' : 'file',
                outputFormat: this.data.output || 'text'
            });

            if (this.data.output === 'json') {
                console.log(JSON.stringify(response.data, null, 2));
            } else {
                console.log(chalk.green('\n✅ Analysis complete'));
                if (response.data.summary) {
                    console.log(chalk.cyan(`   Quality Score: ${response.data.summary.qualityScore}/100`));
                    console.log(chalk.cyan(`   Issues Found: ${response.data.summary.issuesCount}`));
                    console.log(chalk.cyan(`   Files Analyzed: ${response.data.summary.filesAnalyzed}`));
                }
            }

            return response.data;
        } catch (error) {
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }
}

/**
 * Workspace Search Command
 */
export class WorkspaceSearchCommand extends BaseCommand {
    constructor(data) {
        super('workspace.search', data, {
            name: 'Workspace Search',
            description: 'AI-powered search across workspace',
            category: 'workspace',
            version: '1.0.0',
            arguments: [
                {
                    name: 'query',
                    description: 'Search query',
                    required: true
                }
            ],
            options: [
                {
                    name: 'fileTypes',
                    short: 't',
                    description: 'File types to search in',
                    value: 'types'
                },
                {
                    name: 'output',
                    short: 'o',
                    description: 'Output format (text, json)',
                    value: 'format'
                }
            ]
        });
    }

    async executeInternal(context) {
        const apiClient = new ApiClient();

        try {
            console.log(chalk.blue(`\n🔍 Searching workspace for: "${this.data.query}"`));

            const response = await apiClient.post('/workspace/search', {
                query: this.data.query,
                workspacePath: process.cwd(),
                fileTypes: this.data.fileTypes ? this.data.fileTypes.split(',') : undefined,
                outputFormat: this.data.output || 'text'
            });

            const results = response.data.results || [];

            if (results.length === 0) {
                console.log(chalk.yellow('\n📭 No results found'));
                return { results: [], count: 0 };
            }

            if (this.data.output === 'json') {
                console.log(JSON.stringify(results, null, 2));
            } else {
                console.log(chalk.green(`\n📋 Found ${results.length} results:\n`));

                results.forEach((result, index) => {
                    console.log(chalk.cyan(`${index + 1}. ${path.basename(result.file)}:${result.line}`));
                    console.log(chalk.gray(`   ${result.content.substring(0, 100)}...`));
                    console.log();
                });
            }

            return { results, count: results.length };
        } catch (error) {
            throw new Error(`Workspace search failed: ${error.message}`);
        }
    }
}

/**
 * Model Management Command
 */
export class ModelManagementCommand extends BaseCommand {
    constructor(data) {
        super('models.manage', data, {
            name: 'Model Management',
            description: 'Manage AI model providers',
            category: 'models',
            version: '1.0.0',
            options: [
                {
                    name: 'list',
                    short: 'l',
                    description: 'List available models'
                },
                {
                    name: 'switch',
                    short: 's',
                    description: 'Switch to specific model',
                    value: 'model'
                },
                {
                    name: 'compare',
                    short: 'c',
                    description: 'Compare multiple models'
                }
            ]
        });
    }

    async executeInternal(context) {
        const apiClient = new ApiClient();

        try {
            if (this.data.list) {
                return await this.listModels(apiClient);
            } else if (this.data.switch) {
                return await this.switchModel(apiClient, this.data.switch);
            } else if (this.data.compare) {
                return await this.compareModels(apiClient);
            } else {
                return await this.showModelStatus(apiClient);
            }
        } catch (error) {
            throw new Error(`Model management failed: ${error.message}`);
        }
    }

    async listModels(apiClient) {
        const response = await apiClient.get('/providers/models');

        console.log(chalk.blue.bold('\n🤖 Available AI Models:\n'));

        response.providers.forEach(provider => {
            console.log(chalk.green(`📦 ${provider.name}`));
            provider.models.forEach(model => {
                console.log(chalk.cyan(`  • ${model.name} (${model.id})`));
                console.log(chalk.gray(`    Context: ${model.contextWindow} tokens`));
                console.log(chalk.gray(`    Status: ${model.status}`));
            });
            console.log();
        });

        return response;
    }

    async switchModel(apiClient, modelId) {
        const response = await apiClient.post('/providers/switch', { modelId });

        console.log(chalk.green(`\n✅ Switched to model: ${response.model.name}`));
        console.log(chalk.gray(`   Provider: ${response.provider.name}`));

        return response;
    }

    async showModelStatus(apiClient) {
        const response = await apiClient.get('/providers/current');

        console.log(chalk.blue.bold('\n📊 Current Model Status:\n'));
        console.log(chalk.cyan(`Model: ${response.model.name}`));
        console.log(chalk.cyan(`Provider: ${response.provider.name}`));
        console.log(chalk.cyan(`Status: ${response.status}`));

        if (response.performance) {
            console.log(chalk.gray(`\nPerformance Metrics:`));
            console.log(chalk.gray(`  Requests: ${response.performance.totalRequests}`));
            console.log(chalk.gray(`  Success Rate: ${response.performance.successRate}%`));
            console.log(chalk.gray(`  Avg Response Time: ${response.performance.avgResponseTime}ms`));
        }

        return response;
    }

    async compareModels(apiClient) {
        const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'];
        const testQuery = 'Explain the benefits of microservices architecture.';

        console.log(chalk.blue(`\n⚖️ Comparing models with query: "${testQuery}"`));

        const response = await apiClient.post('/models/compare', {
            models,
            query: testQuery
        });

        console.log(chalk.green('\n📊 Comparison Results:\n'));

        response.results.forEach((result, index) => {
            console.log(chalk.cyan(`${index + 1}. ${result.model}`));
            console.log(chalk.gray(`   Response Time: ${result.responseTime}ms`));
            console.log(chalk.gray(`   Tokens Used: ${result.tokensUsed}`));
            console.log(chalk.gray(`   Preview: ${result.content.substring(0, 100)}...`));
            console.log();
        });

        return response;
    }
}

/**
 * Collaboration Command
 */
export class CollaborationCommand extends BaseCommand {
    constructor(data) {
        super('collab.manage', data, {
            name: 'Collaboration',
            description: 'Manage collaboration sessions',
            category: 'collab',
            version: '1.0.0',
            arguments: [
                {
                    name: 'action',
                    description: 'Action to perform (start, join, leave, invite)',
                    required: true
                }
            ],
            options: [
                {
                    name: 'session',
                    short: 's',
                    description: 'Session ID for join action',
                    value: 'sessionId'
                },
                {
                    name: 'email',
                    short: 'e',
                    description: 'Email for invite action',
                    value: 'email'
                }
            ]
        });
    }

    async executeInternal(context) {
        const apiClient = new ApiClient();
        const action = this.data.action;

        try {
            switch (action) {
                case 'start':
                    return await this.startSession(apiClient);
                case 'join':
                    return await this.joinSession(apiClient, this.data.session);
                case 'leave':
                    return await this.leaveSession(apiClient);
                case 'invite':
                    return await this.inviteUser(apiClient, this.data.email);
                case 'status':
                    return await this.showStatus(apiClient);
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            throw new Error(`Collaboration ${action} failed: ${error.message}`);
        }
    }

    async startSession(apiClient) {
        const sessionName = await this.promptInput('Enter session name');
        if (!sessionName) {
            throw new Error('Session name required');
        }

        const response = await apiClient.post('/collaboration/sessions', {
            name: sessionName
        });

        console.log(chalk.green(`\n✅ Collaboration session started: ${sessionName}`));
        console.log(chalk.cyan(`   Session ID: ${response.session.id}`));
        console.log(chalk.gray('   Share this ID with others to join'));

        return response;
    }

    async joinSession(apiClient, sessionId) {
        if (!sessionId) {
            sessionId = await this.promptInput('Enter session ID');
        }

        const response = await apiClient.post(`/collaboration/sessions/${sessionId}/join`, {});

        console.log(chalk.green(`\n✅ Joined session: ${response.session.name}`));
        console.log(chalk.cyan(`   Participants: ${response.session.participants.length}`));

        return response;
    }

    async leaveSession(apiClient) {
        const sessions = await apiClient.get('/collaboration/sessions/active');
        if (!sessions.activeSession) {
            throw new Error('No active session to leave');
        }

        await apiClient.post(`/collaboration/sessions/${sessions.activeSession.id}/leave`, {});

        console.log(chalk.green(`\n✅ Left session: ${sessions.activeSession.name}`));

        return { success: true };
    }

    async inviteUser(apiClient, email) {
        if (!email) {
            email = await this.promptInput('Enter email address');
        }

        const sessions = await apiClient.get('/collaboration/sessions/active');
        if (!sessions.activeSession) {
            throw new Error('No active session to invite to');
        }

        await apiClient.post(`/collaboration/sessions/${sessions.activeSession.id}/invite`, {
            email,
            role: 'editor'
        });

        console.log(chalk.green(`\n✅ Invitation sent to: ${email}`));

        return { success: true };
    }

    async showStatus(apiClient) {
        const sessions = await apiClient.get('/collaboration/sessions/active');

        if (!sessions.activeSession) {
            console.log(chalk.yellow('\n📭 No active collaboration session'));
            return { active: false };
        }

        console.log(chalk.blue.bold(`\n🤝 Active Session: ${sessions.activeSession.name}`));
        console.log(chalk.cyan(`   ID: ${sessions.activeSession.id}`));
        console.log(chalk.cyan(`   Participants: ${sessions.activeSession.participants.length}`));
        console.log(chalk.cyan(`   Status: ${sessions.activeSession.status}`));

        return sessions;
    }

    async promptInput(prompt) {
        const { default: inquirer } = await import('inquirer');
        const result = await inquirer.prompt([{
            type: 'input',
            name: 'value',
            message: prompt
        }]);
        return result.value;
    }
}

/**
 * VSCode Extension Integration Command
 */
export class VSCodeExtensionCommand extends BaseCommand {
    constructor(data) {
        super('vscode.integrate', data, {
            name: 'VSCode Extension Integration',
            description: 'Integrate with VSCode extension features',
            category: 'vscode',
            version: '1.0.0',
            options: [
                {
                    name: 'sync-modes',
                    description: 'Sync custom modes with VSCode extension'
                },
                {
                    name: 'export-config',
                    description: 'Export configuration for VSCode extension'
                },
                {
                    name: 'import-config',
                    description: 'Import configuration from VSCode extension'
                }
            ]
        });
    }

    async executeInternal(context) {
        try {
            if (this.data.syncModes) {
                return await this.syncCustomModes();
            } else if (this.data.exportConfig) {
                return await this.exportVSCodeConfig();
            } else if (this.data.importConfig) {
                return await this.importVSCodeConfig();
            } else {
                return await this.showVSCodeStatus();
            }
        } catch (error) {
            throw new Error(`VSCode integration failed: ${error.message}`);
        }
    }

    async syncCustomModes() {
        const configPath = path.join(process.cwd(), '.tnf', 'custom-modes.json');

        if (!fs.existsSync(configPath)) {
            console.log(chalk.yellow('\n📭 No local custom modes found'));
            console.log(chalk.gray('Run "tnf modes create-default" first'));
            return { synced: false };
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const modes = config.customModes || [];

        console.log(chalk.blue(`\n🔄 Syncing ${modes.length} custom modes with VSCode extension...`));

        // Export for VSCode extension
        const vscodeConfigPath = path.join(process.cwd(), 'src', 'vscode-extension', 'custom-modes-config.json');
        fs.writeFileSync(vscodeConfigPath, JSON.stringify(config, null, 2));

        console.log(chalk.green(`✅ Synced custom modes to VSCode extension`));
        console.log(chalk.gray(`   Local: ${configPath}`));
        console.log(chalk.gray(`   VSCode: ${vscodeConfigPath}`));

        return { synced: true, modes: modes.length };
    }

    async exportVSCodeConfig() {
        const exportPath = path.join(process.cwd(), 'vscode-extension-config.json');

        const config = {
            customModes: [],
            workspaceSettings: {},
            extensionSettings: {}
        };

        // Load custom modes
        const modesPath = path.join(process.cwd(), '.tnf', 'custom-modes.json');
        if (fs.existsSync(modesPath)) {
            const modesConfig = JSON.parse(fs.readFileSync(modesPath, 'utf8'));
            config.customModes = modesConfig.customModes || [];
        }

        fs.writeFileSync(exportPath, JSON.stringify(config, null, 2));

        console.log(chalk.green(`\n✅ Exported VSCode configuration to: ${exportPath}`));

        return { exported: true, path: exportPath };
    }

    async importVSCodeConfig() {
        const importPath = path.join(process.cwd(), 'vscode-extension-config.json');

        if (!fs.existsSync(importPath)) {
            throw new Error('No VSCode configuration file found to import');
        }

        const config = JSON.parse(fs.readFileSync(importPath, 'utf8'));

        // Import custom modes
        if (config.customModes && config.customModes.length > 0) {
            const modesPath = path.join(process.cwd(), '.tnf', 'custom-modes.json');
            fs.writeFileSync(modesPath, JSON.stringify({ customModes: config.customModes }, null, 2));

            console.log(chalk.green(`\n✅ Imported ${config.customModes.length} custom modes`));
        }

        return { imported: true, modes: config.customModes?.length || 0 };
    }

    async showVSCodeStatus() {
        console.log(chalk.blue.bold('\n🆚 VSCode Extension Integration Status:\n'));

        const localModesPath = path.join(process.cwd(), '.tnf', 'custom-modes.json');
        const vscodeConfigPath = path.join(process.cwd(), 'src', 'vscode-extension', 'custom-modes-config.json');

        console.log(chalk.cyan('Local Configuration:'));
        if (fs.existsSync(localModesPath)) {
            const config = JSON.parse(fs.readFileSync(localModesPath, 'utf8'));
            console.log(chalk.green(`  ✅ Custom Modes: ${config.customModes?.length || 0}`));
        } else {
            console.log(chalk.red('  ❌ No local configuration found'));
        }

        console.log(chalk.cyan('\nVSCode Extension:'));
        if (fs.existsSync(vscodeConfigPath)) {
            const config = JSON.parse(fs.readFileSync(vscodeConfigPath, 'utf8'));
            console.log(chalk.green(`  ✅ Extension Config: ${config.customModes?.length || 0} modes`));
        } else {
            console.log(chalk.red('  ❌ No VSCode extension configuration found'));
        }

        return {
            localConfigured: fs.existsSync(localModesPath),
            vscodeConfigured: fs.existsSync(vscodeConfigPath)
        };
    }
}