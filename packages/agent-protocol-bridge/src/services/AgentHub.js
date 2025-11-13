"use strict";
/**
 * AgentHub.ts
 *
 * Central service for managing AI agent communication, TRAYCER-style.
 * Handles task delegation, command execution, and agent discovery.
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
exports.AgentHub = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const ProtobufAdapter_1 = require("../adapters/ProtobufAdapter");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
class AgentHub extends events_1.EventEmitter {
    a2aService;
    mcpClient;
    messageRouter;
    agentsDirectory;
    discoveryService;
    communicationBridge;
    protobufAdapter;
    agents = new Map();
    runningProcesses = new Map();
    agentProcesses = new Map(); // agentId -> Set(processId)
    taskQueue = new Map();
    a2aAgents = new Map();
    constructor(a2aService, mcpClient, messageRouter, agentsDirectory, discoveryService, communicationBridge, protobufAdapter) {
        super();
        this.a2aService = a2aService;
        this.mcpClient = mcpClient;
        this.messageRouter = messageRouter;
        this.agentsDirectory = agentsDirectory;
        this.discoveryService = discoveryService;
        this.communicationBridge = communicationBridge;
        // Use injected adapter or create a new one if not provided
        this.protobufAdapter = protobufAdapter || new ProtobufAdapter_1.ProtobufAdapter();
        this.initializeAgents();
        this.initializeServiceIntegration();
    }
    /**
     * Initialize agents using discovery service or fallback to legacy loading
     */
    async initializeAgents() {
        if (this.discoveryService) {
            // Use discovery service
            this.setupDiscoveryServiceEvents();
            const agents = this.discoveryService.getAllAgents();
            for (const entry of agents) {
                this.registerAgent(entry.configuration);
            }
        }
        else {
            // Fallback to legacy loading
            await this.loadAgentConfigurations();
        }
    }
    /**
     * Setup event listeners for discovery service
     */
    setupDiscoveryServiceEvents() {
        if (!this.discoveryService)
            return;
        this.discoveryService.on('agentsDiscovered', (agents) => {
            agents.forEach(entry => this.registerAgent(entry.configuration));
        });
        this.discoveryService.on('agentReloaded', (entry) => {
            this.registerAgent(entry.configuration);
        });
        this.discoveryService.on('agentRemoved', (agentId) => {
            this.agents.delete(agentId);
            this.a2aAgents.delete(agentId);
            this.emit('agentRemoved', agentId);
        });
    }
    /**
     * Register a single agent configuration
     */
    async registerAgent(config) {
        this.agents.set(config.id, config);
        this.emit('agentRegistered', config);
        // Register with A2A service if enabled
        await this.registerWithA2AService(config);
    }
    /**
     * Initialize service integration with A2A and MCP
     */
    async initializeServiceIntegration() {
        if (this.a2aService) {
            this.a2aService.on('agent.registered', this.handleA2AAgentRegistered.bind(this));
            this.a2aService.on('agent.updated', this.handleA2AAgentUpdated.bind(this));
            this.a2aService.on('message.sent', this.handleA2AMessage.bind(this));
        }
        if (this.messageRouter) {
            this.messageRouter.on('message', this.handleRoutedMessage.bind(this));
        }
    }
    /**
     * Load agent configurations from local-ai-agents directory
     */
    async loadAgentConfigurations() {
        try {
            const agentsDir = this.agentsDirectory || path.resolve(process.cwd(), 'local-ai-agents');
            const configFiles = await fs.readdir(agentsDir);
            for (const file of configFiles) {
                if (file.endsWith('.json')) {
                    const configPath = path.join(agentsDir, file);
                    const configData = await fs.readFile(configPath, 'utf-8');
                    const config = JSON.parse(configData);
                    // Ensure proper date conversion
                    if (typeof config.createdAt === 'string') {
                        config.createdAt = new Date(config.createdAt);
                    }
                    if (typeof config.updatedAt === 'string') {
                        config.updatedAt = new Date(config.updatedAt);
                    }
                    // Set enabled status based on configuration
                    config.enabled = config.status === 'ACTIVE';
                    // Enable sensible defaults for A2A registration (legacy mode only)
                    if (config.configuration && typeof config.configuration.a2aEnabled !== 'boolean') {
                        const isLocal = !!config.configuration.localAI;
                        config.configuration.a2aEnabled = isLocal; // default enable for local CLIs
                    }
                    await this.registerAgent(config);
                }
            }
            console.log(`Loaded ${this.agents.size} agent configurations);
    } catch (error) {
      console.error('Failed to load agent configurations:', error);
    }
  }

  /**
   * Register agent with A2A service
   */
  private async registerWithA2AService(config: AgentConfiguration): Promise<void> {
    if (!this.a2aService || !config.configuration.a2aEnabled) {
      return;
    }

    try {
      const a2aAgent = await this.a2aService.registerAgent({
        name: config.name,
        type: config.type === 'ASSISTANT' ? AgentType.AI : AgentType.SYSTEM,
        capabilities: config.capabilities.map(cap => cap.name.toLowerCase()),
        endpoint: config.configuration.command,
        metadata: {
          ...config.metadata,
          displayName: config.displayName || config.name,
          provider: config.provider,
          systemPrompt: config.systemPrompt,
        },
      });

      this.a2aAgents.set(config.id, a2aAgent);`, console.log(`Registered agent ${config.name}`));
            with (A2A)
                service;
            ;
        }
        catch (error) {
            console.warn(Failed, to, register, agent, $, { config, : .name });
            with (A2A)
                service: , error;
            ;
        }
    }
    /**
     * Event handlers for A2A and MCP integration
     */
    handleA2AAgentRegistered(event) {
        `
    console.log(A2A agent registered: ${event.name}`;
        ;
        this.emit('a2aAgentRegistered', event);
    }
    handleA2AAgentUpdated(event) {
        console.log(A2A, agent, updated, $, { event, : .name });
        this.emit('a2aAgentUpdated', event);
    }
}
exports.AgentHub = AgentHub;
`
`;
handleA2AMessage(event, any);
void {
    console, : .log(A2A, message, sent, from, $, { event, : .fromAgentId } ` to ${event.toAgentId});
    this.emit('a2aMessage', event);
  }` `
  private handleRoutedMessage(message: any): void {
    console.log(Message routed: ${message.type}`),
    this: .emit('messageRouted', message)
};
/**
 * Get all available agents
 */
getAvailableAgents();
AgentConfiguration[];
{
    return Array.from(this.agents.values()).filter(agent => agent.enabled);
}
/**
 * Get agent by ID
 */
getAgent(agentId, string);
AgentConfiguration | undefined;
{
    return this.agents.get(agentId);
}
/**
 * Execute a task on a specific agent
 */
async;
executeTask(agentId, string, prompt, string, options, TaskExecutionOptions = {});
Promise < string > {
    const: agent = this.getAgent(agentId),
    if(, agent) {
        throw new Error(Agent, not, found, $, { agentId } `);
    }

    if (!agent.enabled) {
      throw new Error(Agent is disabled: ${agentId});
    }

    // Create structured task
    const task: AgentTask = {
      id: this.generateTaskId(),
      agentId,
      title: Execute task on ${agent.displayName || agent.name},
      description: prompt,
      status: 'pending',
      parameters: {
        prompt,
        context: options.context,
        timeout: options.timeout || 120000,
      },
      createdAt: new Date(),
    };

    this.taskQueue.set(task.id, task);
    this.emit('taskCreated', task);

    try {
      // Update task status
      task.status = 'in_progress';
      task.updatedAt = new Date();
      this.emit('taskUpdated', task);

      let result: string;

      // Use communication bridge if available for protocol routing
      if (this.communicationBridge) {
        const bridgeResult = await this.communicationBridge.sendTaskToAgent(agent, prompt, options);
        result = bridgeResult?.message || bridgeResult?.result || String(bridgeResult);
      } else {
        // Fallback to direct protocol methods
        if (this.a2aService && agent.configuration.a2aEnabled) {
          result = await this.executeViaA2A(agent, prompt, options);
        } else if (this.mcpClient && agent.configuration.mcpEnabled) {
          result = await this.executeViaMCP(agent, prompt, options);
        } else {
          result = await this.executeCommand(agent, prompt, options);
        }
      }

      // Mark task as completed
      task.status = 'completed';
      task.updatedAt = new Date();
      this.emit('taskCompleted', task);

      return result;
    } catch (error) {
      // Mark task as failed
      task.status = 'failed';
      task.updatedAt = new Date();
      this.emit('taskFailed', task, error);
      throw error;
    }
  }

  /**
   * Execute task via A2A service
   */
  private async executeViaA2A(
    agent: AgentConfiguration,
    prompt: string,
    options: TaskExecutionOptions
  ): Promise<string> {
    if (!this.a2aService) {
      throw new Error('A2A service not available');
    }

    const a2aAgent = this.a2aAgents.get(agent.id);`);
        if (!a2aAgent) {
            `
      throw new Error(Agent ${agent.id}`;
            not;
            registered;
            with (A2A)
                service;
            ;
        }
        // Send task via A2A service
        const message = await this.a2aService.sendMessage('agenthub', a2aAgent.id, {
            action: 'execute_task',
            prompt,
            context: options.context,
            timeout: options.timeout,
        }, {
            type: a2a_core_1.A2AMessageType.TASK_ASSIGNMENT,
            priority: a2a_core_1.A2APriority.MEDIUM,
        });
        // For now, return a success message - in a real implementation,
        // you would wait for a response or implement async handling
        return Task;
        sent;
        to;
        $;
        {
            agent.name;
        }
        via;
        A2A;
        service(Message, ID, $, { message, : .id });
    }
    /**
     * Execute task via MCP client
     */
    ,
    /**
     * Execute task via MCP client
     */
    async executeViaMCP(agent, prompt, options) {
        if (!this.mcpClient) {
            throw new Error('MCP client not available');
        }
        try {
            // Minimal MCP implementation using tools.execute API
            // TODO: This is a basic implementation. Add feature flag to disable in production if needed
            const result = await this.mcpClient.call('tools/execute', {
                tool: agent.configuration.command || agent.command,
                parameters: {
                    prompt,
                    context: options.context,
                    timeout: options.timeout || 120000,
                },
            });
            `
      return result?.content || Task executed via MCP for agent ${agent.name}`;
        }
        catch (error) {
            // Fallback to placeholder if MCP API is not stabilized
            console.warn(MCP, execution, failed);
            for (agent; $; { agent, : .name }, using)
                placeholder: , error;
            ;
            `
      return Task sent to ${agent.name} via MCP client (placeholder mode);
    }
  }

  /**
   * Execute a plan in an external agent (TRAYCER-style)
   */
  async executePlanInAgent(
    agentId: string,
    planIdentifier: string,
    promptTemplateFilePath?: string
  ): Promise<string> {
    const agent = this.getAgent(agentId);
    if (!agent) {`;
            throw new Error(Agent, not, found, $, { agentId } `);
    }

    // Construct the execution message
    let executionPrompt = Execute plan: ${planIdentifier};
    
    if (promptTemplateFilePath) {
      try {
        const template = await fs.readFile(promptTemplateFilePath, 'utf-8');
        executionPrompt = template.replace('{{PLAN_IDENTIFIER}}', planIdentifier);`);
        }
        try { }
        catch (error) {
            `
        console.warn(Failed to load prompt template: ${promptTemplateFilePath});
      }
    }

    return this.executeTask(agentId, executionPrompt);
  }

  /**
   * Execute verification comments in an agent
   */
  async executeVerificationCommentInAgent(
    agentId: string,
    planIdentifier: string,
    verificationCommentId: string,
    promptTemplateFilePath?: string
  ): Promise<string> {
    const agent = this.getAgent(agentId);
    if (!agent) {`;
            throw new Error(Agent, not, found, $, { agentId } `);
    }

    let executionPrompt = Execute verification comment ${verificationCommentId} for plan: ${planIdentifier};
    
    if (promptTemplateFilePath) {
      try {
        const template = await fs.readFile(promptTemplateFilePath, 'utf-8');
        executionPrompt = template`
                .replace('{{PLAN_IDENTIFIER}}', planIdentifier) `
          .replace('{{VERIFICATION_COMMENT_ID}}', verificationCommentId);
      } catch (error) {`, console.warn(Failed, to, load, prompt, template, $, { promptTemplateFilePath }));
        }
    },
    return: this.executeTask(agentId, executionPrompt)
};
/**
 * Execute all verification comments for a plan
 */
async;
executeAllVerificationCommentsInAgent(agentId, string, planIdentifier, string, filter ?  : string, promptTemplateFilePath ?  : string);
Promise < string > {
    const: agent = this.getAgent(agentId)
} `
    if (!agent) {`;
throw new Error(Agent, not, found, $, { agentId });
`
    let executionPrompt = Execute all verification comments for plan: ${planIdentifier}`;
if (filter) {
    executionPrompt += ;
    with (filter)
        : $;
    {
        filter;
    }
    ;
}
if (promptTemplateFilePath) {
    try {
        const template = await fs.readFile(promptTemplateFilePath, 'utf-8');
        executionPrompt = template
            .replace('{{PLAN_IDENTIFIER}}', planIdentifier)
            .replace('{{FILTER}}', filter || '');
        `
      } catch (error) {`;
        console.warn(Failed, to, load, prompt, template, $, { promptTemplateFilePath });
    }
    finally {
    }
}
return this.executeTask(agentId, executionPrompt);
/**
 * Send structured prompt to agent using VSCode terminal integration
 */
async;
sendStructuredPrompt(agentId, string, prompt, ProtobufAdapter_1.StructuredPrompt, options, TaskExecutionOptions = {});
Promise < string > {
    const: agent = this.getAgent(agentId),
    if(, agent) {
        `
      throw new Error(Agent not found: ${agentId}`;
        ;
    }
    // Use AppleScript for VSCode terminal integration (similar to TRAYCER)
    ,
    // Use AppleScript for VSCode terminal integration (similar to TRAYCER)
    const: terminalCommand = this.buildTerminalCommand(agent, prompt),
    try: {
        // Focus VSCode and create new terminal
        await, this: .focusVSCodeTerminal(),
        // Launch the agent
        await, this: .launchAgentInTerminal(agent),
        // Wait for agent to load
        await, this: .delay(5000),
        // Focus terminal properly
        await, this: .focusTerminalView(),
        // Send the structured prompt
        await, this: .sendCommandToTerminal(terminalCommand),
        return: Task, sent, to, $
    }
};
{
    agent.displayName;
}
;
`
    } catch (error) {`;
throw new Error(Failed, to, send, structured, prompt, to, $, { agentId }, $, { error, instanceof: Error ? error.message : String(error) });
async;
executeCommand(agent, AgentConfiguration, prompt, string, options, TaskExecutionOptions);
Promise < string > {
    return: new Promise((resolve, reject) => {
        const processId = this.generateProcessId();
        // Use new schema and avoid spreading undefined
        const baseArgs = Array.isArray(agent.args) ? agent.args : [];
        const args = [...baseArgs];
        `
      // Choose either stdin or argv depending on agent expectations; default to stdin`;
        const command = agent.configuration?.command || agent.command; // fallback for legacy`
        if (!command)
            throw new Error(No, executable, command, configured);
        for (agent; $; { agent, : .id })
            ;
        const childProcess = (0, child_process_1.spawn)(command, args, {
            cwd: agent.workingDirectory || options.context?.workspaceRoot || process.cwd(),
            env: { ...process.env, ...(agent.environment || {}) },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        this.runningProcesses.set(processId, childProcess);
        // Track process for this agent
        if (!this.agentProcesses.has(agent.id)) {
            this.agentProcesses.set(agent.id, new Set());
        }
        this.agentProcesses.get(agent.id).add(processId);
        let stdout = '';
        let stderr = '';
        childProcess.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        childProcess.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        childProcess.on('close', (code) => {
            this.runningProcesses.delete(processId);
            // Remove from agent processes index
            this.agentProcesses.get(agent.id)?.delete(processId);
            if (code === 0) {
                resolve(stdout.trim());
            }
            else {
                `
          reject(new Error(`;
                Agent;
                execution;
                failed;
                with (code)
                    $;
                {
                    code;
                }
                $;
                {
                    stderr;
                }
            }
        });
    })
};
;
childProcess.on('error', (error) => {
    this.runningProcesses.delete(processId);
    // Remove from agent processes index
    this.agentProcesses.get(agent.id)?.delete(processId);
    reject(error);
});
// Set timeout
const timeout = options.timeout || 120000;
setTimeout(() => {
    if (this.runningProcesses.has(processId)) {
        childProcess.kill();
        `
          this.runningProcesses.delete(processId);`;
        // Remove from agent processes index
        this.agentProcesses.get(agent.id)?.delete(processId);
        reject(new Error(Agent, execution, timed, out, after, $, { timeout } `ms));
        }
      }, timeout);

      // Only write to stdin (do not also push prompt to args)
      if (childProcess.stdin && prompt) {
        childProcess.stdin.write(prompt + '\n');
        childProcess.stdin.end();
      }
    });
  }

  /**
   * VSCode terminal integration methods (TRAYCER-style)
   */
  private async focusVSCodeTerminal(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = 
        tell application "Visual Studio Code" to activate
        delay 1
        tell application "System Events" to tell process "Code" to keystroke "p" using {command down, shift down}
      ;
      
      const { spawn } = require('child_process');
      const osascript = spawn('osascript', ['-e', script]);
      
      osascript.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`, Failed, to, focus, VSCode, terminal, $, { code }));
    }
});
;
async;
launchAgentInTerminal(agent, AgentConfiguration);
Promise < void  > {
    return: new Promise((resolve, reject) => {
        const script = delay;
        1;
        tell;
        application;
        "System Events";
        to;
        keystroke;
        "Terminal: Create New Terminal";
        delay;
        0.5;
        tell;
        application;
        "System Events";
        to;
        keystroke;
        return;
        delay;
        2;
        tell;
        application;
        "System Events";
        to;
        keystroke;
        "${agent.command}";
        delay;
        0.5 `
        tell application "System Events" to keystroke return` `;
      
      const { spawn } = require('child_process');
      const osascript = spawn('osascript', ['-e', script]);
      
      osascript.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(Failed to launch agent in terminal: ${code}));
        }
      });
    });
  }

  private async focusTerminalView(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = 
        tell application "Visual Studio Code" to activate
        delay 1
        tell application "System Events" to tell process "Code" to keystroke "p" using {command down, shift down}
        delay 1
        tell application "System Events" to keystroke "Terminal: Focus on Terminal View"
        delay 0.5
        tell application "System Events" to keystroke return
      ;
      
      const { spawn } = require('child_process');
      const osascript = spawn('osascript', ['-e', script]);
      
      osascript.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {`;
        reject(new Error(Failed, to, focus, terminal, view, $, { code } `));
        }
      });
    });
  }

  private async sendCommandToTerminal(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = `, delay, 1, tell, application, "System Events", to, keystroke, "${command}", delay, 0.5, tell, application, "System Events", to, keystroke));
        return;
        const { spawn } = require('child_process');
        const osascript = spawn('osascript', ['-e', script]);
        osascript.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                `
          reject(new Error(`;
                Failed;
                to;
                send;
                command;
                to;
                terminal: $;
                {
                    code;
                }
                `));
        }
      });
    });
  }

  private buildTerminalCommand(agent: AgentConfiguration, prompt: StructuredPrompt): string {
    let command = prompt.text;
    
    // Add context information
    if (prompt.workspace) {
      command = Working in: ${prompt.workspace}\n${command};
    }
    
    if (prompt.files && prompt.files.length > 0) {`;
                command = Files;
                $;
                {
                    prompt.files.join(', ');
                }
                `\n${command};
    }
    
    return command;
  }

  /**
   * Utility methods`
                    * /`;
            }
        }, private, generateTaskId(), string, {
            return: task_$
        }, { Date, : .now() } `_${Math.random().toString(36).substr(2, 9)};
  }` `
  private generateProcessId(): string {
    return proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }, private, delay(ms, number), Promise < void  > {
        return: new Promise(resolve => setTimeout(resolve, ms))
    }
    /**
     * Get current task queue status
     */
    , 
    /**
     * Get current task queue status
     */
    getTaskQueue(), ProtobufAdapter_1.AgentTask[], {
        return: Array.from(this.taskQueue.values())
    }
    /**
     * Get running processes
     */
    , 
    /**
     * Get running processes
     */
    getRunningProcesses(), string[], {
        return: Array.from(this.runningProcesses.keys())
    }
    /**
     * Stop a running process
     */
    , 
    /**
     * Stop a running process
     */
    stopProcess(processId, string), boolean, {
        const: process = this.runningProcesses.get(processId),
        if(process) {
            process.kill();
            this.runningProcesses.delete(processId);
            return true;
        },
        return: false
    }
    /**
     * Execute tasks across multiple agents with orchestration
     */
    , 
    /**
     * Execute tasks across multiple agents with orchestration
     */
    async, executeMultiAgentTask(agentIds, string[], prompts, string[], options, TaskExecutionOptions = {}), Promise < string[] > {
        if(agentIds) { }, : .length !== prompts.length
    })
};
{
    throw new Error('Number of agent IDs must match number of prompts');
}
const tasks = agentIds.map((agentId, index) => this.executeTask(agentId, prompts[index], options));
try {
    const results = await Promise.all(tasks);
    this.emit('multiAgentTaskCompleted', { agentIds, results });
    return results;
}
catch (error) {
    this.emit('multiAgentTaskFailed', { agentIds, error });
    throw error;
}
/**
 * Execute a task with automatic retry and fallback agents
 */
async;
executeTaskWithRetry(primaryAgentId, string, fallbackAgentIds, string[], prompt, string, options, TaskExecutionOptions = {});
Promise < string > {
    const: maxRetries = options.maxRetries || 3,
    const: allAgentIds = [primaryAgentId, ...fallbackAgentIds],
    for(let, attempt = 0, attempt, , maxRetries, attempt) { }
}++;
{
    for (const agentId of allAgentIds) {
        try {
            const result = await this.executeTask(agentId, prompt, options);
            return result;
        }
        catch (error) {
            console.warn(Task, execution, failed, on, agent, $, { agentId } `, attempt ${attempt + 1}:, error);
          `);
            if (attempt === maxRetries - 1 && agentId === allAgentIds[allAgentIds.length - 1]) {
                `
            throw new Error(Task execution failed on all agents after ${maxRetries}`;
                attempts;
                ;
            }
        }
    }
}
throw new Error('Unexpected error in task retry logic');
/**
 * Broadcast a message to all agents with specific capabilities
 */
async;
broadcastToCapableAgents(capability, string, prompt, string, options, TaskExecutionOptions = {});
Promise < Record < string, string >> {
    const: capableAgents = this.getAvailableAgents().filter(agent => agent.capabilities.some(cap => cap.name.toLowerCase() === capability.toLowerCase())),
    if(capableAgents) { }, : .length === 0
};
{
    throw new Error(No, agents, found);
    with (capability)
        : $;
    {
        capability;
    }
    ;
}
const results = {};
const tasks = capableAgents.map(async (agent) => {
    try {
        const result = await this.executeTask(agent.id, prompt, options);
        results[agent.id] = result;
    }
    catch (error) {
        `
        results[agent.id] = Error: ${error instanceof Error ? error.message : String(error)}`;
    }
});
await Promise.allSettled(tasks);
return results;
/**
 * Get agent health status
 */
async;
getAgentHealth(agentId, string);
Promise < any > {
    const: agent = this.getAgent(agentId),
    if(, agent) {
        throw new Error(Agent, not, found, $, { agentId } `);
    }

    const a2aAgent = this.a2aAgents.get(agentId);
    const health = {
      agentId,
      name: agent.name,
      status: agent.status,
      enabled: agent.enabled,
      lastSeen: a2aAgent?.lastSeen ? new Date(a2aAgent.lastSeen) : new Date(),
      runningProcesses: this.getRunningProcessesForAgent(agentId),
      queuedTasks: this.getQueuedTasksForAgent(agentId),
      a2aRegistered: !!a2aAgent,
      mcpEnabled: agent.configuration.mcpEnabled,
    };

    return health;
  }

  /**
   * Get running processes for a specific agent
   */
  private getRunningProcessesForAgent(agentId: string): string[] {
    const agentProcesses = this.agentProcesses.get(agentId);
    return agentProcesses ? Array.from(agentProcesses) : [];
  }

  /**
   * Get queued tasks for a specific agent
   */
  private getQueuedTasksForAgent(agentId: string): AgentTask[] {
    return Array.from(this.taskQueue.values()).filter(task =>
      task.agentId === agentId && task.status === 'pending'
    );
  }

  /**
   * Reload agent configurations
   */
  async reloadConfigurations(): Promise<void> {
    // Clear existing configurations
    this.agents.clear();
    this.a2aAgents.clear();
    
    // Reload from disk
    await this.loadAgentConfigurations();
    
    this.emit('configurationsReloaded');
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): any {
    const agents = Array.from(this.agents.values());
    const tasks = Array.from(this.taskQueue.values());

    return {
      totalAgents: agents.length,
      enabledAgents: agents.filter(a => a.enabled).length,
      a2aRegisteredAgents: this.a2aAgents.size,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      runningProcesses: this.runningProcesses.size,
      services: {
        a2aService: !!this.a2aService,
        mcpClient: !!this.mcpClient,
        messageRouter: !!this.messageRouter,
      },
    };
  }

  /**
   * Update agent status
   * Required by RelayIntegrationService
   */
  async updateAgentStatus(agentId: string, status: string, metadata?: any): Promise<void> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(Agent not found: ${agentId});
    }

    // Update agent status
    agent.status = status;
    if (metadata) {
      agent.metadata = { ...agent.metadata, ...metadata, lastUpdated: new Date().toISOString() };
    }

    // Update A2A agent if registered
    const a2aAgent = this.a2aAgents.get(agentId);
    if (a2aAgent) {
      a2aAgent.status = status as any;
      a2aAgent.lastSeen = Date.now();
    }

    this.emit('agentStatusUpdated', { agentId, status, metadata });
  }

  /**
   * Handle Chrome extension actions
   * Required by RelayIntegrationService
   */
  async handleChromeExtensionAction(input: { 
    action: string; 
    data: any; 
    sessionId?: string; 
    timestamp?: string; 
  }): Promise<any> {
    const { action, data, sessionId, timestamp } = input;
    
    this.emit('chromeExtensionAction', { action, data, sessionId, timestamp });

    // Handle different Chrome extension actions
    switch (action) {
      case 'page_analysis':
        return this.handlePageAnalysis(data, sessionId);
      
      case 'automation_request':
        return this.handleAutomationRequest(data, sessionId);
      
      case 'content_extraction':
        return this.handleContentExtraction(data, sessionId);
      
      case 'task_delegation':
        return this.handleTaskDelegation(data, sessionId);
      
      default:
        return {
          action,
          status: 'acknowledged',
          result: 'Chrome extension action received and logged',
          timestamp: new Date().toISOString()
        };
    }
  }

  /**
   * Initialize session for AI automation or monitoring
   * Required by RelayIntegrationService
   */
  async initializeSession(input: { 
    sessionId: string; 
    type: string; 
    config: any; 
    chromeExtensionId?: string; 
  }): Promise<any> {
    const { sessionId, type, config, chromeExtensionId } = input;
    
    const sessionData = {
      sessionId,
      type,
      config,
      chromeExtensionId,
      status: 'initialized',
      createdAt: new Date().toISOString(),
      agents: [],
      tasks: [],
      metadata: {}
    };

    this.emit('sessionInitialized', sessionData);

    // Based on session type, set up appropriate automation
    switch (type) {
      case 'ai_automation':
        return this.initializeAIAutomationSession(sessionData);
      
      case 'manual_control':
        return this.initializeManualControlSession(sessionData);
      
      case 'monitoring':
        return this.initializeMonitoringSession(sessionData);
      
      default:
        return sessionData;
    }
  }

  /**
   * Handle page analysis from Chrome extension
   */
  private async handlePageAnalysis(data: any, sessionId?: string): Promise<any> {
    // Find agents capable of web analysis
    const webAgents = Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.some(cap => cap.name.includes('web') || cap.name.includes('analysis'))
    );

    if (webAgents.length === 0) {
      return {
        status: 'error',
        message: 'No web analysis capable agents available'
      };
    }

    // Use the first available web agent
    const agent = webAgents[0];`);
        const analysisPrompt = Analyze, the, following, web, page, data, { JSON };
    }, : .stringify(data, null, 2)
} ``;
try {
    const result = await this.executeTask(agent.id, analysisPrompt);
    return {
        status: 'completed',
        analysis: result,
        agentUsed: agent.id,
        sessionId
    };
}
catch (error) {
    return {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        sessionId
    };
}
async;
handleAutomationRequest(data, any, sessionId ?  : string);
Promise < any > {
    // Find agents capable of browser automation
    const: automationAgents = Array.from(this.agents.values()).filter(agent => agent.capabilities.some(cap => cap.name.includes('automation') ||
        cap.name.includes('browser') ||
        cap.name.includes('selenium'))),
    if(automationAgents) { }, : .length === 0
};
{
    return {
        status: 'error',
        message: 'No automation capable agents available'
    };
}
return {
    status: 'queued',
    message: 'Automation request queued for processing',
    availableAgents: automationAgents.map(a => a.id),
    sessionId
};
async;
handleContentExtraction(data, any, sessionId ?  : string);
Promise < any > {
    return: {
        status: 'completed',
        extractedContent: data,
        timestamp: new Date().toISOString(),
        sessionId
    }
};
async;
handleTaskDelegation(data, any, sessionId ?  : string);
Promise < any > {
    const: { taskType, agentId, prompt } = data,
    if(agentId) { }
} && this.getAgent(agentId);
{
    try {
        const result = await this.executeTask(agentId, prompt);
        return {
            status: 'completed',
            result,
            agentId,
            sessionId
        };
    }
    catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
            agentId,
            sessionId
        };
    }
}
return {
    status: 'error',
    message: 'Invalid agent ID or task configuration',
    sessionId
};
async;
initializeAIAutomationSession(sessionData, any);
Promise < any > {
    return: {
        ...sessionData,
        automationMode: 'ai_driven',
        capabilities: ['page_analysis', 'task_execution', 'content_extraction'],
        status: 'ready'
    }
};
async;
initializeManualControlSession(sessionData, any);
Promise < any > {
    return: {
        ...sessionData,
        automationMode: 'manual',
        capabilities: ['monitoring', 'data_collection'],
        status: 'ready'
    }
};
async;
initializeMonitoringSession(sessionData, any);
Promise < any > {
    return: {
        ...sessionData,
        automationMode: 'monitoring',
        capabilities: ['passive_monitoring', 'data_logging'],
        status: 'ready'
    }
};
/**
 * Clean up resources
 */
async;
cleanup();
Promise < void  > {
    : .runningProcesses
};
{
    process.kill();
    this.runningProcesses.delete(processId);
}
// Clear task queue
this.taskQueue.clear();
// Clear A2A agents
this.a2aAgents.clear();
// Clear agent processes index
this.agentProcesses.clear();
this.emit('cleanup');
//# sourceMappingURL=AgentHub.js.map