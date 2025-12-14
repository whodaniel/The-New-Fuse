const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const os = require('os');

/**
 * CLIBridge - Full synergy between VSCode Extension and TNF CLI
 * Enables bidirectional communication and task delegation
 */
class CLIBridge extends EventEmitter {
    constructor(context, logger) {
        super();
        this.context = context;
        this.logger = logger;

        // CLI configuration
        this.cliPath = path.join(__dirname, '../../../../src/cli/tnf-cli-agent.ts');
        this.cliExecutable = 'tsx'; // TypeScript executor
        this.cliProcess = null;

        // Workspace configuration
        this.workspacePath = context.workspaceState.get('workspacePath') || process.cwd();
        this.tnfConfigPath = path.join(os.homedir(), '.tnf', 'config.json');
        this.workspaceConfigPath = path.join(this.workspacePath, '.tnf', 'workspace.json');

        // Task management
        this.activeTasks = new Map();
        this.taskHistory = [];

        // Agent orchestration
        this.availableAgents = [];
        this.activeAgents = new Map();

        // Communication queues
        this.commandQueue = [];
        this.isProcessing = false;

        this.initialized = false;
    }

    /**
     * Initialize CLI Bridge
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.logger.info('Initializing CLI Bridge...');

            // Ensure CLI exists
            await this._validateCLI();

            // Load CLI configuration
            await this._loadCLIConfiguration();

            // Discover available agents
            await this._discoverAgents();

            // Setup workspace integration
            await this._setupWorkspaceIntegration();

            // Start CLI relay server connection
            await this._connectToRelayServer();

            this.initialized = true;
            this.logger.success('CLI Bridge initialized successfully');
            this.emit('initialized');
        } catch (error) {
            this.logger.error('Failed to initialize CLI Bridge:', error);
            throw error;
        }
    }

    /**
     * Validate TNF CLI exists
     */
    async _validateCLI() {
        try {
            if (!fs.existsSync(this.cliPath)) {
                throw new Error(`CLI not found at: ${this.cliPath}`);
            }
            this.logger.info('CLI validated:', this.cliPath);
        } catch (error) {
            this.logger.warn('CLI validation failed, using fallback');
            // Fallback to globally installed tnf
            this.cliExecutable = 'tnf';
            this.cliPath = null;
        }
    }

    /**
     * Load CLI configuration
     */
    async _loadCLIConfiguration() {
        try {
            if (fs.existsSync(this.tnfConfigPath)) {
                const config = JSON.parse(fs.readFileSync(this.tnfConfigPath, 'utf-8'));
                this.cliConfig = config;
                this.logger.info('CLI configuration loaded');
            } else {
                this.cliConfig = {};
                this.logger.warn('No CLI configuration found, using defaults');
            }
        } catch (error) {
            this.logger.error('Failed to load CLI configuration:', error);
            this.cliConfig = {};
        }
    }

    /**
     * Discover available CLI agents
     */
    async _discoverAgents() {
        try {
            const result = await this.executeCommand('agents', ['list'], { json: true });

            if (result.success) {
                this.availableAgents = result.agents || [
                    { id: 'code-assistant', name: 'Code Assistant', capabilities: ['code-analysis', 'code-generation'] },
                    { id: 'project-manager', name: 'Project Manager', capabilities: ['project-analysis'] },
                    { id: 'documentation-writer', name: 'Documentation Writer', capabilities: ['documentation-generation'] },
                    { id: 'test-engineer', name: 'Test Engineer', capabilities: ['test-generation'] },
                    { id: 'deployment-specialist', name: 'Deployment Specialist', capabilities: ['deployment-config'] },
                    { id: 'security-auditor', name: 'Security Auditor', capabilities: ['security-analysis'] }
                ];
                this.logger.success(`Discovered ${this.availableAgents.length} CLI agents`);
            }
        } catch (error) {
            this.logger.warn('Failed to discover agents, using defaults:', error);
            // Fallback to known agents
            this.availableAgents = [
                { id: 'code-assistant', name: 'Code Assistant' },
                { id: 'project-manager', name: 'Project Manager' },
                { id: 'documentation-writer', name: 'Documentation Writer' },
                { id: 'test-engineer', name: 'Test Engineer' },
                { id: 'deployment-specialist', name: 'Deployment Specialist' },
                { id: 'security-auditor', name: 'Security Auditor' }
            ];
        }
    }

    /**
     * Setup workspace integration
     */
    async _setupWorkspaceIntegration() {
        try {
            // Check if workspace is initialized
            if (fs.existsSync(this.workspaceConfigPath)) {
                const workspaceConfig = JSON.parse(fs.readFileSync(this.workspaceConfigPath, 'utf-8'));
                this.workspaceConfig = workspaceConfig;
                this.logger.info('Workspace integration ready');
            } else {
                this.logger.info('Workspace not initialized, call initializeWorkspace() to setup');
            }
        } catch (error) {
            this.logger.error('Failed to setup workspace integration:', error);
        }
    }

    /**
     * Connect to TNF CLI relay server
     */
    async _connectToRelayServer() {
        try {
            // The relay server allows VSCode <-> CLI bidirectional communication
            this.relayEndpoint = process.env.TNF_RELAY_ENDPOINT || 'http://localhost:3333';
            this.logger.info('Relay server endpoint:', this.relayEndpoint);
            // Connection will be established on first command
        } catch (error) {
            this.logger.warn('Relay server connection deferred');
        }
    }

    /**
     * Execute CLI command
     */
    async executeCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            this.logger.info(`Executing CLI command: tnf ${command} ${args.join(' ')}`);

            let cliArgs = [command, ...args];

            // Add options as flags
            if (options.json) cliArgs.push('--json');
            if (options.verbose) cliArgs.push('--verbose');
            if (options.provider) cliArgs.push('--provider', options.provider);
            if (options.model) cliArgs.push('--model', options.model);

            let spawnCommand = this.cliExecutable;
            let spawnArgs = [];

            if (this.cliPath) {
                // Use tsx to run TypeScript CLI
                spawnArgs = [this.cliPath, ...cliArgs];
            } else {
                // Use globally installed tnf
                spawnArgs = cliArgs;
            }

            const process = spawn(spawnCommand, spawnArgs, {
                cwd: this.workspacePath,
                env: {
                    ...process.env,
                    TNF_VSCODE_INTEGRATION: 'true',
                    TNF_WORKSPACE: this.workspacePath
                }
            });

            let stdout = '';
            let stderr = '';
            const startTime = Date.now();

            process.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                this.emit('output', { taskId, type: 'stdout', data: output });
            });

            process.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                this.emit('output', { taskId, type: 'stderr', data: output });
            });

            process.on('close', (code) => {
                const executionTime = Date.now() - startTime;

                if (code === 0) {
                    let result;
                    try {
                        result = options.json ? JSON.parse(stdout) : { output: stdout };
                    } catch {
                        result = { output: stdout };
                    }

                    const taskResult = {
                        success: true,
                        taskId,
                        command,
                        args,
                        result,
                        executionTime,
                        timestamp: new Date().toISOString()
                    };

                    this.taskHistory.push(taskResult);
                    this.emit('taskCompleted', taskResult);

                    resolve(taskResult);
                } else {
                    const error = {
                        success: false,
                        taskId,
                        command,
                        args,
                        error: stderr || 'Command failed',
                        exitCode: code,
                        executionTime,
                        timestamp: new Date().toISOString()
                    };

                    this.taskHistory.push(error);
                    this.emit('taskFailed', error);

                    reject(new Error(error.error));
                }
            });

            process.on('error', (error) => {
                reject(error);
            });

            // Track active task
            this.activeTasks.set(taskId, { process, command, args, startTime });
        });
    }

    /**
     * Run specific agent
     */
    async runAgent(agentId, task, options = {}) {
        this.logger.info(`Running agent: ${agentId}`);

        try {
            const result = await this.executeCommand('agents', ['run', agentId, task], {
                json: true,
                ...options
            });

            this.activeAgents.set(agentId, {
                task,
                startTime: Date.now(),
                status: 'running'
            });

            this.emit('agentStarted', { agentId, task });

            return result;
        } catch (error) {
            this.logger.error(`Agent ${agentId} failed:`, error);
            throw error;
        }
    }

    /**
     * Start interactive chat session
     */
    async startChat(options = {}) {
        this.logger.info('Starting CLI chat session...');

        // For interactive chat, we'll spawn a persistent process
        const chatProcess = spawn(
            this.cliExecutable,
            this.cliPath ? [this.cliPath, 'chat', '--json'] : ['chat', '--json'],
            {
                cwd: this.workspacePath,
                env: {
                    ...process.env,
                    TNF_VSCODE_INTEGRATION: 'true'
                }
            }
        );

        chatProcess.stdout.on('data', (data) => {
            const output = data.toString();
            this.emit('chatMessage', { type: 'response', content: output });
        });

        chatProcess.stderr.on('data', (data) => {
            this.emit('chatMessage', { type: 'error', content: data.toString() });
        });

        this.chatProcess = chatProcess;
        this.emit('chatStarted');

        return chatProcess;
    }

    /**
     * Send message to chat session
     */
    async sendChatMessage(message) {
        if (!this.chatProcess) {
            throw new Error('Chat session not started');
        }

        this.chatProcess.stdin.write(message + '\n');
        this.emit('chatMessage', { type: 'user', content: message });
    }

    /**
     * Stop chat session
     */
    async stopChat() {
        if (this.chatProcess) {
            this.chatProcess.kill();
            this.chatProcess = null;
            this.emit('chatStopped');
        }
    }

    /**
     * Initialize workspace with TNF CLI
     */
    async initializeWorkspace(workspacePath = this.workspacePath) {
        this.logger.info('Initializing TNF workspace:', workspacePath);

        try {
            await this.executeCommand('init', [workspacePath], { verbose: true });

            // Reload workspace config
            await this._setupWorkspaceIntegration();

            this.logger.success('Workspace initialized successfully');
            this.emit('workspaceInitialized', { path: workspacePath });

            return { success: true, path: workspacePath };
        } catch (error) {
            this.logger.error('Workspace initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get CLI configuration
     */
    async getConfiguration(key) {
        try {
            const result = await this.executeCommand('config', ['get', key], { json: true });
            return result.value;
        } catch (error) {
            this.logger.warn(`Failed to get config ${key}:`, error);
            return null;
        }
    }

    /**
     * Set CLI configuration
     */
    async setConfiguration(key, value) {
        try {
            await this.executeCommand('config', ['set', key, value]);
            this.logger.success(`Configuration set: ${key} = ${value}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to set config ${key}:`, error);
            return false;
        }
    }

    /**
     * Get available agents
     */
    getAvailableAgents() {
        return this.availableAgents;
    }

    /**
     * Get active tasks
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.entries()).map(([id, task]) => ({
            id,
            ...task
        }));
    }

    /**
     * Get task history
     */
    getTaskHistory(limit = 10) {
        return this.taskHistory.slice(-limit);
    }

    /**
     * Cancel task
     */
    async cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (task && task.process) {
            task.process.kill();
            this.activeTasks.delete(taskId);
            this.emit('taskCancelled', { taskId });
            return true;
        }
        return false;
    }

    /**
     * Get CLI status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            cliPath: this.cliPath,
            workspacePath: this.workspacePath,
            workspaceInitialized: !!this.workspaceConfig,
            availableAgents: this.availableAgents.length,
            activeTasks: this.activeTasks.size,
            activeAgents: this.activeAgents.size,
            chatActive: !!this.chatProcess,
            relayEndpoint: this.relayEndpoint
        };
    }

    /**
     * Cleanup
     */
    async cleanup() {
        this.logger.info('Cleaning up CLI Bridge...');

        // Stop chat session
        await this.stopChat();

        // Cancel active tasks
        for (const [taskId] of this.activeTasks) {
            await this.cancelTask(taskId);
        }

        this.initialized = false;
        this.emit('cleanup');
    }
}

module.exports = CLIBridge;