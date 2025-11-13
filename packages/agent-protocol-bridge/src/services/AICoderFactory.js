"use strict";
/**
 * AI Coder Factory
 * Manages spawning, configuring, and coordinating AI coder instances
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICoderFactory = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const WebSocket = __importStar(require("ws"));
const uuid_1 = require("uuid");
class AICoderFactory extends events_1.EventEmitter {
    a2aService;
    instances = new Map();
    collaborationSessions = new Map();
    availablePorts = new Set();
    electronAppPath;
    maxInstances = 20;
    basePort = 3001;
    constructor(a2aService, electronAppPath) {
        super();
        this.a2aService = a2aService;
        this.electronAppPath = electronAppPath || this.findElectronApp();
        this.initializePortPool();
    }
    /**
     * Initialize available port pool for headless workers
     */
    initializePortPool() {
        for (let i = 0; i < this.maxInstances; i++) {
            this.availablePorts.add(this.basePort + i);
        }
    }
    /**
     * Find the Electron desktop app path
     */
    findElectronApp() {
        // Try common locations for the Electron app
        const possiblePaths = [
            path.resolve(__dirname, '../../../../apps/electron-desktop/dist/main/main.js'),
            path.resolve(__dirname, '../../../electron-desktop/dist/main/main.js'),
            path.resolve(process.cwd(), 'apps/electron-desktop/dist/main/main.js'),
            path.resolve(process.cwd(), 'electron-desktop/dist/main/main.js'),
        ];
        for (const appPath of possiblePaths) {
            try {
                if (require('fs').existsSync(appPath)) {
                    return appPath;
                }
            }
            catch (error) {
                // Continue to next path
            }
        }
        throw new Error('Could not find Electron desktop app. Please specify electronAppPath in constructor.');
    }
    /**
     * Get next available port
     */
    getNextAvailablePort() {
        if (this.availablePorts.size === 0) {
            throw new Error('No available ports for new AI coder instances');
        }
        const port = this.availablePorts.values().next().value;
        this.availablePorts.delete(port);
        return port;
    }
    /**
     * Release a port back to the pool
     */
    releasePort(port) {
        this.availablePorts.add(port);
    }
    /**
     * Spawn a new AI coder instance
     */
    async spawnAICoderInstance(request) {
        try {
            const agentId = `ai-coder-${request.agentType}-${(0, uuid_1.v4)().substr(0, 8)};
      const port = this.getNextAvailablePort();

      // Create AI coder configuration
      const config: AICoderConfiguration = {
        id: agentId,`;
            name: $;
            {
                request.agentType;
            }
            `-${request.specialization || 'general'}`,
                displayName;
            $;
            {
                request.agentType.charAt(0).toUpperCase() + request.agentType.slice(1);
            }
            AI;
            Coder,
                type;
            'AI_CODER',
                aiCoderType;
            request.agentType,
                status;
            'SPAWNING', `
        description: AI coder instance for ${request.specialization || 'general'}`;
            development,
                capabilities;
            this.createAICoderCapabilities(request),
                configuration;
            {
                provider: request.agentType,
                    model;
                request.model,
                    version;
                request.version,
                    isolationMode;
                'headless_worker',
                    endpoint;
                ws: //localhost:${port}`,
                 projectPath: request.projectPath,
                    preferences;
                request.preferences || {
                    primaryLanguages: [],
                    frameworks: [],
                    codeStyle: 'prettier',
                    linting: true,
                    formatting: true,
                    typeChecking: true
                },
                    limits;
                {
                    maxTokens: request.limits?.maxTokens || 8192,
                        timeout;
                    request.limits?.timeout || 120,
                        maxRetries;
                    3,
                        rateLimit;
                    request.limits?.rateLimit || { requests: 60, window: 60 };
                }
                collaboration: {
                    allowPeerReview: request.collaboration?.allowPeerReview ?? true,
                        allowConsensus;
                    request.collaboration?.allowConsensus ?? true,
                        trustLevel;
                    request.collaboration?.trustLevel || 'medium',
                        specializations;
                    request.specialization ? [request.specialization] : [];
                }
            }
            workspace: await this.analyzeWorkspace(request.projectPath, request.workspace),
                metadata;
            {
                spawnedAt: new Date().toISOString(),
                    requesterId;
                'ai-coder-factory',
                    pid;
                null; // Will be set after spawn
            }
            provider: 'ai-coder-factory',
                userId;
            'system',
                createdAt;
            new Date(),
                updatedAt;
            new Date();
        }
        finally // Spawn the headless worker process
         { }
        ;
        // Spawn the headless worker process
        const workerInstance = await this.spawnHeadlessWorker(config, port);
        // Register with A2A service if available
        if (this.a2aService) {
            await this.registerWithA2A(config);
        }
        this.emit('aiCoderSpawned', config);
        return {
            agentId,
            status: 'spawning',
            endpoint: ws, //localhost:${port},
            capabilities: config.capabilities,
            workspace: config.workspace,
            estimatedStartupTime: 10000 // 10 seconds
        };
    }
    catch(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            agentId: '',
            status: 'failed',
            errors: [errorMessage]
        };
    }
}
exports.AICoderFactory = AICoderFactory;
async;
spawnHeadlessWorker(config, ai_coder_types_1.AICoderConfiguration, port, number);
Promise < HeadlessWorkerInstance > {
    return: new Promise((resolve, reject) => {
        const args = [
            '--headless',
            '--port', port.toString(),
            '--extension-id', this.mapAICoderTypeToExtension(config.aiCoderType),
            '--project-path', config.workspace.rootPath,
            '--model', config.configuration.model || '',
            '--version', config.configuration.version || ''
        ];
        `
      console.log(Spawning AI coder instance: ${this.electronAppPath} ${args.join(' ')}`;
    }),
    const: process = (0, child_process_1.spawn)('node', [this.electronAppPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
            ...process.env,
            NODE_ENV: 'production',
            AI_CODER_MODE: 'true',
            AI_CODER_TYPE: config.aiCoderType,
            AI_CODER_PROJECT_PATH: config.workspace.rootPath
        }
    }),
    const: instance, HeadlessWorkerInstance = {
        agentId: config.id,
        process,
        port,
        websocketClient: null,
        status: 'spawning',
        config,
        lastActivity: new Date(),
        metrics: {
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            averageExecutionTime: 0,
            tokensUsed: 0
        }
    },
    // Track the instance
    this: .instances.set(config.id, instance),
    config, : .metadata.pid = process.pid,
    let, startupOutput = '',
    const: startupTimeout = setTimeout(() => {
        reject(new Error(`Headless worker startup timeout. Output: ${startupOutput}));
      }, 30000);

      process.stdout?.on('data', (data) => {
        startupOutput += data.toString();`, console.log([$, { config, : .id } `] STDOUT:, data.toString().trim());
        
        // Check for successful startup indicators
        if (data.toString().includes('Headless worker initialized') || 
            data.toString().includes(WebSocket server listening on port ${port}`])), {
            instance, : .status = 'ready',
            config, : .status = 'ACTIVE',
            // Connect WebSocket client
            this: .connectWebSocketClient(instance).then(() => {
                resolve(instance);
            }).catch(reject)
        });
    }),
    process, : .stderr?.on('data', (data) => {
        console.error([$, { config, : .id }], STDERR, data.toString().trim());
        startupOutput += data.toString();
    }),
    process, : .on('error', (error) => {
        `
        console.error([${config.id}`;
        Process;
        error: , error;
    }),
    this: .instances.delete(config.id),
    this: .releasePort(port)
};
;
process.on('exit', (code, signal) => {
    console.log([$, { config, : .id } `] Process exited with code ${code}, signal ${signal});
        instance.status = 'error';
        config.status = 'OFFLINE';
        this.instances.delete(config.id);
        this.releasePort(port);
        this.emit('aiCoderStopped', config.id, code, signal);
      });
    });
  }

  /**
   * Connect WebSocket client to headless worker
   */
  private async connectWebSocketClient(instance: HeadlessWorkerInstance): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(ws://localhost:${instance.port});
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        instance.websocketClient = ws;`,
        instance.status = 'ready']);
    `
        console.log([${instance.agentId}`;
    WebSocket;
    connected;
});
// Send initial configuration
ws.send(JSON.stringify({
    type: 'configure',
    id: 'initial-config',
    payload: {
        agentId: instance.agentId,
        configuration: instance.config.configuration,
        workspace: instance.config.workspace
    }
}));
resolve();
;
ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        this.handleWorkerMessage(instance, message);
    }
    catch (error) {
        console.error([$, { instance, : .agentId }], Failed, to, parse, message, error);
    }
});
ws.on('error', (error) => {
    `
        clearTimeout(timeout);`;
    console.error(`[${instance.agentId}] WebSocket error:, error);
        reject(error);
      });

      ws.on('close', () => {
        instance.websocketClient = null;
        if (instance.status !== 'stopping') {
          instance.status = 'error';
          console.log([${instance.agentId}] WebSocket disconnected unexpectedly);
        }
      });
    });
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(instance: HeadlessWorkerInstance, message: any): void {
    const { type, id, payload } = message;
    
    switch (type) {
      case 'ready':
        instance.status = 'ready';
        instance.lastActivity = new Date();
        break;
        
      case 'task_completed':
        instance.metrics.totalTasks++;
        instance.metrics.successfulTasks++;
        instance.status = 'ready';
        instance.currentTask = undefined;
        instance.lastActivity = new Date();
        
        if (payload.executionTime) {
          this.updateAverageExecutionTime(instance, payload.executionTime);
        }
        
        this.emit('taskCompleted', instance.agentId, payload);
        break;
        
      case 'task_failed':
        instance.metrics.totalTasks++;
        instance.metrics.failedTasks++;
        instance.status = 'ready';
        instance.currentTask = undefined;
        instance.lastActivity = new Date();
        
        this.emit('taskFailed', instance.agentId, payload);
        break;
        `, 'error', `
        console.error(`[$], { instance, : .agentId }, Worker, error, payload);
    instance.status = 'error';
    break;
    `
        console.log([${instance.agentId}] Unknown message type: ${type}`;
});
updateAverageExecutionTime(instance, HeadlessWorkerInstance, newTime, number);
void {
    const: metrics = instance.metrics,
    const: totalTasks = metrics.totalTasks,
    const: currentAvg = metrics.averageExecutionTime,
    metrics, : .averageExecutionTime = ((currentAvg * (totalTasks - 1)) + newTime) / totalTasks
};
createAICoderCapabilities(request, ai_coder_types_1.AICoderSpawnRequest);
ai_coder_types_1.AICoderCapability[];
{
    return request.capabilities.map(cap => ({
        name: cap,
        description: $
    }), { cap } ` capability for ${request.agentType},
      parameters: {},
      specialization: request.specialization,
      languages: request.preferences?.languages || [],
      frameworks: request.preferences?.frameworks || [],
      confidence: 0.8 // Default confidence
    }));
  }

  /**
   * Analyze workspace and extract context
   */
  private async analyzeWorkspace(
    projectPath: string, 
    workspaceConfig?: any
  ): Promise<AICoderWorkspaceContext> {
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {`);
    throw new Error(Project, path, is, not, a, directory, $, { projectPath } ``);
}
// Basic workspace analysis
const workspace = {
    rootPath: projectPath,
    gitBranch: await this.getCurrentGitBranch(projectPath),
    contextFiles: workspaceConfig?.contextFiles || [],
    excludePatterns: workspaceConfig?.excludePatterns || [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '*.log'
    ],
    dependencies: await this.analyzeDependencies(projectPath),
    buildConfig: await this.analyzeBuildConfig(projectPath),
    testConfig: await this.analyzeTestConfig(projectPath)
};
return workspace;
try { }
catch (error) {
    console.warn(Failed, to, analyze, workspace, $, { projectPath }, error);
    return {
        rootPath: projectPath,
        contextFiles: [],
        excludePatterns: ['node_modules/**', '.git/**'],
        dependencies: {}
    };
}
async;
getCurrentGitBranch(projectPath, string);
Promise < string | undefined > {
    try: {
        const: { spawn: child_process_1.spawn } = require('child_process'),
        return: new Promise((resolve) => {
            const git = (0, child_process_1.spawn)('git', ['branch', '--show-current'], { cwd: projectPath });
            let output = '';
            git.stdout.on('data', (data) => {
                output += data.toString().trim();
            });
            git.on('close', (code) => {
                resolve(code === 0 ? output : undefined);
            });
            git.on('error', () => resolve(undefined));
        })
    }, catch(error) {
        return undefined;
    }
};
async;
analyzeDependencies(projectPath, string);
Promise < any > {
    try: {
        const: packageJsonPath = path.join(projectPath, 'package.json'),
        const: packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8'),
        const: packageJson = JSON.parse(packageJsonContent),
        return: {
            package: packageJson,
            lockfile: await this.findLockfile(projectPath),
            devDependencies: packageJson.devDependencies
        }
    }, catch(error) {
        // Try other dependency files (requirements.txt, Cargo.toml, etc.)
        return {};
    }
};
async;
findLockfile(projectPath, string);
Promise < string | undefined > {
    const: lockfiles = ['package-lock.json', 'pnpm.lock', 'pnpm-lock.yaml', 'bun.lockb'],
    for(, lockfile, of, lockfiles) {
        try {
            const lockfilePath = path.join(projectPath, lockfile);
            await fs.access(lockfilePath);
            return lockfile;
        }
        catch (error) {
            // Continue to next
        }
    },
    return: undefined
};
async;
analyzeBuildConfig(projectPath, string);
Promise < any > {
    const: buildConfigs = [
        'webpack.config.js',
        'vite.config.js',
        'rollup.config.js',
        'tsconfig.json',
        'next.config.js'
    ],
    for(, config, of, buildConfigs) {
        try {
            const configPath = path.join(projectPath, config);
            await fs.access(configPath);
            return {
                buildSystem: config.split('.')[0],
                configFiles: [config],
                outputDir: 'dist' // Default
            };
        }
        catch (error) {
            // Continue to next
        }
    },
    return: undefined
};
async;
analyzeTestConfig(projectPath, string);
Promise < any > {
    const: testConfigs = [
        'jest.config.js',
        'vitest.config.js',
        'cypress.config.js',
        'playwright.config.js'
    ],
    for(, config, of, testConfigs) {
        try {
            const configPath = path.join(projectPath, config);
            await fs.access(configPath);
            return {
                framework: config.split('.')[0],
                configFiles: [config],
                testDir: 'test',
                coverage: true
            };
        }
        catch (error) {
            // Continue to next
        }
    },
    return: undefined
};
mapAICoderTypeToExtension(aiCoderType, ai_coder_types_1.AICoderType);
string;
{
    const extensionMap = {
        'claude': 'anthropic.claude-dev',
        'copilot': 'github.copilot',
        'cursor': 'cursor.cursor-vscode',
        'cline': 'saoudrizwan.claude-dev',
        'aider': 'paul-gauthier.aider-vscode',
        'continue': 'continue.continue',
        'sourcegraph': 'sourcegraph.cody-ai'
    };
    return extensionMap[aiCoderType] || aiCoderType;
}
async;
registerWithA2A(config, ai_coder_types_1.AICoderConfiguration);
Promise < void  > {
    : .a2aService, return: ,
    try: {
        await, this: .a2aService.registerAgent({
            name: config.name,
            type: 'AI_CODER',
            capabilities: config.capabilities.map(cap => cap.name),
            endpoint: config.configuration.endpoint,
            metadata: {
                aiCoderType: config.aiCoderType,
                specializations: config.configuration.collaboration.specializations,
                projectPath: config.configuration.projectPath,
                ...config.metadata
            }
        })
    } `
      console.log(Registered AI coder ${config.name}`, with: A2A, service
};
try { }
catch (error) {
    console.warn(Failed, to, register, AI, coder, $, { config, : .name } ` with A2A:, error);
    }
  }

  /**
   * Get status of AI coder instances
   */
  getAICoderStatus(agentId?: string): AICoderStatus[] {
    const instances = agentId ? 
      [this.instances.get(agentId)].filter(Boolean) :
      Array.from(this.instances.values());

    return instances.map(instance => ({
      agentId: instance!.agentId,
      name: instance!.config.name,
      aiCoderType: instance!.config.aiCoderType,
      status: this.mapInstanceStatusToAICoderStatus(instance!.status),
      currentTask: instance!.currentTask,
      capabilities: instance!.config.capabilities,
      specializations: instance!.config.configuration.collaboration.specializations,
      workspace: {
        path: instance!.config.workspace.rootPath,
        branch: instance!.config.workspace.gitBranch,
        lastSync: instance!.lastActivity
      },
      performance: {
        totalTasks: instance!.metrics.totalTasks,
        successRate: instance!.metrics.totalTasks > 0 ? 
          instance!.metrics.successfulTasks / instance!.metrics.totalTasks : 0,
        averageTime: instance!.metrics.averageExecutionTime,
        qualityScore: this.calculateQualityScore(instance!)
      },
      health: {
        uptime: Date.now() - new Date(instance!.config.createdAt).getTime(),
        responseTime: 0, // TODO: Implement
        errorRate: instance!.metrics.totalTasks > 0 ? 
          instance!.metrics.failedTasks / instance!.metrics.totalTasks : 0
      },
      collaboration: {
        reviewsGiven: 0, // TODO: Implement
        reviewsReceived: 0, // TODO: Implement
        consensusParticipation: 0, // TODO: Implement
        trustScore: 0.8 // TODO: Calculate based on peer reviews
      },
      lastActivity: instance!.lastActivity,
      endpoint: instance!.config.configuration.endpoint
    }));
  }

  /**
   * Map instance status to AI coder status
   */
  private mapInstanceStatusToAICoderStatus(status: string): 'idle' | 'busy' | 'offline' | 'error' {
    switch (status) {
      case 'ready': return 'idle';
      case 'busy': return 'busy';
      case 'spawning': return 'busy';
      case 'error': return 'error';
      case 'stopping': return 'offline';
      default: return 'offline';
    }
  }

  /**
   * Calculate quality score for an instance
   */
  private calculateQualityScore(instance: HeadlessWorkerInstance): number {
    const metrics = instance.metrics;
    if (metrics.totalTasks === 0) return 0.5; // Default score
    
    const successRate = metrics.successfulTasks / metrics.totalTasks;
    const timeEfficiency = Math.min(1, 60000 / Math.max(metrics.averageExecutionTime, 1000)); // 60s baseline
    
    return (successRate * 0.7) + (timeEfficiency * 0.3);
  }

  /**
   * Stop an AI coder instance
   */
  async stopAICoderInstance(agentId: string): Promise<boolean> {
    const instance = this.instances.get(agentId);
    if (!instance) {
      return false;
    }

    try {
      instance.status = 'stopping';
      
      // Close WebSocket connection
      if (instance.websocketClient) {
        instance.websocketClient.close();
        instance.websocketClient = null;
      }
      
      // Terminate the process
      if (instance.process && !instance.process.killed) {
        instance.process.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (!instance.process.killed) {
            instance.process.kill('SIGKILL');
          }
        }, 5000);
      }
      
      // Release port and remove instance
      this.releasePort(instance.port);
      this.instances.delete(agentId);
      
      // Unregister from A2A service
      if (this.a2aService) {
        try {
          await this.a2aService.unregisterAgent(agentId);
        } catch (error) {
          console.warn(Failed to unregister agent ${agentId} from A2A:, error);
        }
      }
      
      this.emit('aiCoderStopped', agentId);
      return true;
      
    } catch (error) {`, console.error(`Failed to stop AI coder instance ${agentId}:, error);
      return false;
    }
  }

  /**
   * Stop all AI coder instances
   */
  async stopAllInstances(): Promise<void> {
    const stopPromises = Array.from(this.instances.keys()).map(agentId => 
      this.stopAICoderInstance(agentId)
    );
    
    await Promise.allSettled(stopPromises);
  }

  /**
   * Get instance by agent ID
   */
  getInstance(agentId: string): HeadlessWorkerInstance | undefined {
    return this.instances.get(agentId);
  }

  /**
   * Get all active instances
   */
  getAllInstances(): HeadlessWorkerInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instances by criteria
   */
  getInstancesByCriteria(criteria: {
    aiCoderType?: AICoderType;
    specialization?: SpecializationType;
    status?: string;
    capabilities?: string[];
  }): HeadlessWorkerInstance[] {
    return Array.from(this.instances.values()).filter(instance => {
      if (criteria.aiCoderType && instance.config.aiCoderType !== criteria.aiCoderType) {
        return false;
      }
      
      if (criteria.specialization && 
          !instance.config.configuration.collaboration.specializations.includes(criteria.specialization)) {
        return false;
      }
      
      if (criteria.status && instance.status !== criteria.status) {
        return false;
      }
      
      if (criteria.capabilities && criteria.capabilities.length > 0) {
        const instanceCapabilities = instance.config.capabilities.map(cap => cap.name);
        if (!criteria.capabilities.every(cap => instanceCapabilities.includes(cap as any))) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Coordinate multiple AI coders for a task`
        * /`, async, coordinateAICoders(request, ai_coder_types_1.AICoderCoordinationRequest), Promise < ai_coder_types_1.AICoderCoordinationResponse > {
        const: coordinationId = coord - $
    }, { uuidv4() { }, : .substr(0, 8) }));
    try {
        // Select agents based on strategy and criteria
        const selectedAgents = await this.selectAgentsForTask(request);
        if (selectedAgents.length === 0) {
            throw new Error('No suitable AI coder agents found for the task');
        }
        // Create main task`
        const mainTask = {} `
        id: `, task;
        -$;
        {
            (0, uuid_1.v4)().substr(0, 8);
        }
        type: request.type,
            title;
        request.task,
            description;
        request.requirements.functionality,
            priority;
        request.context.priority,
            status;
        'pending',
            codeContext;
        {
            language: request.context.language,
                framework;
            request.context.framework,
                files;
            request.context.files,
                dependencies;
            [];
        }
        requirements: request.requirements,
            coordination;
        {
            strategy: request.coordination.strategy,
                assignedAgents;
            selectedAgents.map(a => a.agentId),
                consensusThreshold;
            request.coordination.consensusThreshold || 0.6;
        }
        execution: { }
        createdAt: new Date(),
            updatedAt;
        new Date(),
            createdBy;
        'ai-coder-factory',
            workspace;
        request.workspace.path,
            gitCommit;
        request.workspace.gitCommit;
    }
    finally // Create collaboration session
     { }
    ;
    // Create collaboration session
    const session = {
        id: coordinationId,
        taskId: mainTask.id,
        strategy: request.coordination.strategy,
        participants: selectedAgents.map(a => a.agentId),
        status: 'active',
        results: new Map(),
        createdAt: new Date(),
        deadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes default
    };
    this.collaborationSessions.set(coordinationId, session);
    // Execute based on coordination strategy
    const assignedAgents = await this.assignTasksToAgents(mainTask, selectedAgents, session);
    return {
        coordinationId,
        taskPlan: {
            mainTask,
            subTasks: [],
            dependencies: {}
        },
        assignedAgents,
        estimatedCompletion: session.deadline,
        strategy: request.coordination.strategy,
        status: 'executing'
    };
}
try { }
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
        coordinationId,
        taskPlan: {
            mainTask: {},
            subTasks: [],
            dependencies: {}
        },
        assignedAgents: [],
        estimatedCompletion: new Date(),
        strategy: request.coordination.strategy,
        status: 'failed'
    };
}
async;
selectAgentsForTask(request, ai_coder_types_1.AICoderCoordinationRequest);
Promise < HeadlessWorkerInstance[] > {
    let, candidates = Array.from(this.instances.values())
        .filter(instance => instance.status === 'ready' &&
        this.instanceSupportsLanguage(instance, request.context.language)),
    // Filter by specific agent IDs if provided
    if(request) { }, : .coordination.agentIds && request.coordination.agentIds.length > 0
};
{
    candidates = candidates.filter(instance => request.coordination.agentIds.includes(instance.agentId));
}
// Filter by specializations if provided
if (request.coordination.specializations && request.coordination.specializations.length > 0) {
    candidates = candidates.filter(instance => request.coordination.specializations.some(spec => instance.config.configuration.collaboration.specializations.includes(spec)));
}
// Sort by performance and availability
candidates.sort((a, b) => {
    const scoreA = this.calculateAgentScore(a, request);
    const scoreB = this.calculateAgentScore(b, request);
    return scoreB - scoreA;
});
// Return based on strategy
switch (request.coordination.strategy) {
    case 'single':
        return candidates.slice(0, 1);
    case 'collaborative':
    case 'voting':
    case 'review_chain':
        return candidates.slice(0, Math.min(3, candidates.length));
    case 'specialized':
        return this.selectSpecializedAgents(candidates, request);
    case 'consensus':
        return candidates.slice(0, Math.min(5, candidates.length));
    default:
        return candidates.slice(0, 1);
}
instanceSupportsLanguage(instance, HeadlessWorkerInstance, language, string);
boolean;
{
    const supportedLanguages = instance.config.capabilities
        .flatMap(cap => cap.languages || []);
    return supportedLanguages.includes(language) ||
        supportedLanguages.length === 0; // No restrictions
}
calculateAgentScore(instance, HeadlessWorkerInstance, request, ai_coder_types_1.AICoderCoordinationRequest);
number;
{
    let score = 0;
    // Base performance score
    score += this.calculateQualityScore(instance) * 40;
    // Language/framework match
    const capabilities = instance.config.capabilities;
    const supportsLanguage = capabilities.some(cap => cap.languages?.includes(request.context.language));
    if (supportsLanguage)
        score += 20;
    const supportsFramework = request.context.framework && capabilities.some(cap => cap.frameworks?.includes(request.context.framework));
    if (supportsFramework)
        score += 15;
    // Task type capability match
    const supportsTaskType = capabilities.some(cap => cap.name === request.type);
    if (supportsTaskType)
        score += 15;
    // Specialization match
    const hasSpecialization = request.coordination.specializations?.some(spec => instance.config.configuration.collaboration.specializations.includes(spec));
    if (hasSpecialization)
        score += 10;
    return score;
}
selectSpecializedAgents(candidates, HeadlessWorkerInstance[], request, ai_coder_types_1.AICoderCoordinationRequest);
HeadlessWorkerInstance[];
{
    const specializations = request.coordination.specializations || [];
    const selected = [];
    // Try to get one agent per specialization
    for (const specialization of specializations) {
        const specialist = candidates.find(instance => instance.config.configuration.collaboration.specializations.includes(specialization) &&
            !selected.includes(instance));
        if (specialist) {
            selected.push(specialist);
        }
    }
    // Fill with best remaining candidates if needed
    const remaining = candidates.filter(c => !selected.includes(c));
    selected.push(...remaining.slice(0, Math.max(0, 3 - selected.length)));
    return selected;
}
async;
assignTasksToAgents(task, ai_coder_types_1.AICoderTask, agents, HeadlessWorkerInstance[], session, CollaborationSession);
Promise < Array < { agentId: string, role: string, tasks: string[] } >> {
    const: assignments, Array() { agentId: string; role: string; tasks: string[]; }
} > ;
[];
switch (session.strategy) {
    case 'single':
        assignments.push({
            agentId: agents[0].agentId,
            role: 'primary',
            tasks: [task.id]
        });
        await this.sendTaskToAgent(agents[0], task);
        break;
    case 'collaborative':
        // All agents work on the same task
        for (const agent of agents) {
            assignments.push({
                agentId: agent.agentId,
                role: 'primary',
                tasks: [task.id]
            });
            await this.sendTaskToAgent(agent, task);
        }
        break;
    case 'voting':
        // All agents propose solutions, then vote
        for (const agent of agents) {
            assignments.push({
                agentId: agent.agentId,
                role: 'voter',
                tasks: [task.id]
            });
            await this.sendTaskToAgent(agent, task);
        }
        break;
    case 'review_chain':
        // First agent implements, others review in sequence
        if (agents.length > 0) {
            assignments.push({
                agentId: agents[0].agentId,
                role: 'primary',
                tasks: [task.id]
            });
            await this.sendTaskToAgent(agents[0], task);
            for (let i = 1; i < agents.length; i++) {
                assignments.push({
                    agentId: agents[i].agentId,
                    role: 'reviewer',
                    tasks: [task.id]
                });
            }
        }
        break;
    case 'specialized':
        // Assign based on specializations
        for (const agent of agents) {
            const role = this.determineAgentRole(agent, task);
            assignments.push({
                agentId: agent.agentId,
                role,
                tasks: [task.id]
            });
            await this.sendTaskToAgent(agent, task);
        }
        break;
    case 'consensus':
        // All agents work independently, then reach consensus
        for (const agent of agents) {
            assignments.push({
                agentId: agent.agentId,
                role: 'primary',
                tasks: [task.id]
            });
            await this.sendTaskToAgent(agent, task);
        }
        // Set up consensus voting
        session.consensus = {
            threshold: task.coordination.consensusThreshold || 0.6,
            votes: new Map()
        };
        break;
}
return assignments;
async;
sendTaskToAgent(agent, HeadlessWorkerInstance, task, ai_coder_types_1.AICoderTask);
Promise < void  > {} `
    if (!agent.websocketClient || agent.status !== 'ready') {`;
throw new Error(Agent, $, { agent, : .agentId }, is, not, ready, to, receive, tasks `);
    }

    agent.status = 'busy';
    agent.currentTask = task.id;
    agent.lastActivity = new Date();

    const message = {
      type: 'execute_task',
      id: task.id,
      payload: {
        task,
        workspace: agent.config.workspace,
        context: this.buildExecutionContext(agent, task)
      }
    };

    agent.websocketClient.send(JSON.stringify(message));
    this.emit('taskAssigned', task);
  }

  /**
   * Determine agent role based on specialization
   */
  private determineAgentRole(agent: HeadlessWorkerInstance, task: AICoderTask): string {
    const specializations = agent.config.configuration.collaboration.specializations;
    
    if (specializations.includes('frontend' as SpecializationType) && 
        (task.codeContext.framework === 'react' || task.codeContext.framework === 'vue')) {
      return 'frontend_specialist';
    }
    
    if (specializations.includes('backend' as SpecializationType) && 
        (task.codeContext.framework === 'express' || task.codeContext.framework === 'nestjs')) {
      return 'backend_specialist';
    }
    
    if (specializations.includes('testing' as SpecializationType) && task.type === 'testing') {
      return 'testing_specialist';
    }
    
    return 'primary';
  }

  /**
   * Build execution context for an agent
   */
  private buildExecutionContext(agent: HeadlessWorkerInstance, task: AICoderTask): AICoderExecutionContext {
    return {
      executionId: exec-${(0, uuid_1.v4)().substr(0, 8)}`, agentId, agent.agentId, sessionId, 'current-session', requestId, task.id, workspace, agent.config.workspace.rootPath, timestamp, new Date(), metadata, {
    taskType: task.type,
    priority: task.priority,
    language: task.codeContext.language
}, codebase, {
    language: task.codeContext.language,
    framework: task.codeContext.framework,
    testFramework: agent.config.workspace.testConfig?.framework,
    buildSystem: agent.config.workspace.buildConfig?.buildSystem,
    dependencies: task.codeContext.dependencies || [],
    structure: {
        sourceDir: 'src',
        testDir: 'test',
        configDir: '.',
        docsDir: 'docs',
        git: {
            branch: agent.config.workspace.gitBranch || 'main',
            uncommittedChanges: agent.config.workspace.gitStatus?.uncommittedChanges || false,
            conflictMarkers: agent.config.workspace.gitStatus?.conflictMarkers,
            lastCommit: agent.config.workspace.gitStatus?.currentCommit,
            remoteUrl: undefined
        },
        collaboration: {
            activeAgents: [],
            sharedFiles: task.codeContext.files,
            conflictResolution: 'auto',
            reviewQueue: []
        },
        quality: {
            linting: agent.config.configuration.preferences.linting || false,
            formatting: agent.config.configuration.preferences.formatting || false,
            typeChecking: agent.config.configuration.preferences.typeChecking || false,
            testing: true,
            coverage: task.requirements.testCoverage
        }
    }
}
/**
 * Handle consensus voting
 */
, 
/**
 * Handle consensus voting
 */
async, handleConsensusVoting(coordinationId, string, agentId, string, vote, any), Promise < void  > {
    const: session = this.collaborationSessions.get(coordinationId),
    if(, session) { }
} || !session.consensus);
{
    throw new Error('Invalid consensus session');
}
session.consensus.votes.set(agentId, vote);
// Check if we have enough votes
if (session.consensus.votes.size >= session.participants.length) {
    await this.processConsensusResults(session);
}
async;
processConsensusResults(session, CollaborationSession);
Promise < void  > {
    if(, session) { }, : .consensus, return: ,
    const: votes = Array.from(session.consensus.votes.values()),
    const: agreementScores = this.calculateAgreementScores(votes),
    // Find the solution with highest agreement
    const: bestSolution = this.findBestConsensusolution(votes, agreementScores),
    if(agreementScores, [bestSolution]) { }
} >= session.consensus.threshold;
{
    session.consensus.finalDecision = bestSolution;
    session.status = 'completed';
    this.emit('consensusReached', session.taskId, bestSolution);
}
{
    // No consensus reached, may need conflict resolution
    session.status = 'reviewing';
    this.emit('conflictDetected', session.taskId, votes);
}
calculateAgreementScores(votes, any[]);
Record < string, number > {
    const: solutions
};
{ }
;
for (const vote of votes) {
    const solutionKey = this.getSolutionKey(vote);
    solutions[solutionKey] = (solutions[solutionKey] || 0) + 1;
}
const totalVotes = votes.length;
const scores = {};
for (const [solution, count] of Object.entries(solutions)) {
    scores[solution] = count / totalVotes;
}
return scores;
getSolutionKey(vote, any);
string;
{
    // Simple hash of the solution for comparison
    // In a real implementation, this would be more sophisticated
    return JSON.stringify(vote).substring(0, 50);
}
findBestConsensusolution(votes, any[], scores, (Record));
string;
{
    let bestSolution = '';
    let bestScore = 0;
    for (const [solution, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestSolution = solution;
        }
    }
    return bestSolution;
}
/**
 * Get collaboration session status
 */
getCollaborationSession(coordinationId, string);
CollaborationSession | undefined;
{
    return this.collaborationSessions.get(coordinationId);
}
/**
 * Cancel collaboration session
 */
async;
cancelCollaborationSession(coordinationId, string);
Promise < boolean > {
    const: session = this.collaborationSessions.get(coordinationId),
    if(, session) { }, return: false,
    // Cancel tasks for all participants
    for(, participantId, of, session) { }, : .participants
};
{
    const instance = this.instances.get(participantId);
    if (instance && instance.currentTask === session.taskId) {
        await this.cancelAgentTask(instance);
    }
}
session.status = 'failed';
this.collaborationSessions.delete(coordinationId);
this.emit('collaborationEnded', session.participants, session.taskId, 'cancelled');
return true;
async;
cancelAgentTask(agent, HeadlessWorkerInstance);
Promise < void  > {
    if(agent) { }, : .websocketClient && agent.currentTask
};
{
    const message = {
        type: 'cancel_task',
        id: agent.currentTask,
        payload: {}
    };
    agent.websocketClient.send(JSON.stringify(message));
    agent.status = 'ready';
    agent.currentTask = undefined;
}
/**
 * Cleanup resources
 */
async;
cleanup();
Promise < void  > {
    await, this: .stopAllInstances(),
    this: .collaborationSessions.clear(),
    this: .removeAllListeners()
};
//# sourceMappingURL=AICoderFactory.js.map