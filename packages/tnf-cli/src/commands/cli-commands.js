import { BaseCommand } from '@the-new-fuse/commands-core';
import { ConversationManager } from '../lib/ConversationManager.js';
import { TaskExecutor } from '../lib/TaskExecutor.js';
import { AgentOrchestrator } from '../lib/AgentOrchestrator.js';
import { CLIConfigManager } from '../lib/CLIConfigManager.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
/**
 * Chat Start Command
 */
export class ChatStartCommand extends BaseCommand {
    constructor(data) {
        super('chat.start', data, {
            name: 'Chat Start',
            description: 'Start an interactive chat session',
            category: 'chat',
            version: '1.0.0',
            arguments: [],
            options: [
                {
                    name: 'provider',
                    short: 'p',
                    description: 'LLM provider to use',
                    value: 'provider'
                },
                {
                    name: 'model',
                    short: 'm',
                    description: 'Specific model to use',
                    value: 'model'
                },
                {
                    name: 'verbose',
                    short: 'v',
                    description: 'Enable verbose output'
                }
            ]
        });
    }
    async executeInternal(context) {
        console.log(chalk.blue.bold('🤖 TNF CLI Agent - Interactive Mode'));
        console.log(chalk.gray('Type "exit" to quit, "help" for commands\n'));
        const conversationManager = new ConversationManager();
        await conversationManager.startSession({
            provider: this.data.provider,
            model: this.data.model,
            interactive: true,
            verbose: this.data.verbose || false
        });
        return {
            success: true,
            message: 'Chat session started',
            provider: this.data.provider,
            model: this.data.model
        };
    }
}
/**
 * Task Execute Command
 */
export class TaskExecuteCommand extends BaseCommand {
    constructor(data) {
        super('task.execute', data, {
            name: 'Task Execute',
            description: 'Execute a quick task with TNF Agent',
            category: 'task',
            version: '1.0.0',
            arguments: [
                {
                    name: 'task',
                    description: 'Task to execute',
                    required: true
                }
            ],
            options: [
                {
                    name: 'provider',
                    short: 'p',
                    description: 'LLM provider to use',
                    value: 'provider'
                },
                {
                    name: 'model',
                    short: 'm',
                    description: 'Specific model to use',
                    value: 'model'
                },
                {
                    name: 'json',
                    description: 'Output in JSON format'
                }
            ]
        });
    }
    async executeInternal(context) {
        const taskExecutor = new TaskExecutor();
        const result = await taskExecutor.execute(this.data.task, {
            provider: this.data.provider,
            model: this.data.model,
            outputFormat: this.data.json ? 'json' : 'text'
        });
        return result;
    }
}
/**
 * Agent List Command
 */
export class AgentListCommand extends BaseCommand {
    constructor(data) {
        super('agent.list', data, {
            name: 'Agent List',
            description: 'List available AI-powered agents',
            category: 'agent',
            version: '1.0.0'
        });
    }
    async executeInternal(context) {
        const orchestrator = new AgentOrchestrator();
        const agents = await orchestrator.listAgents();
        console.log(chalk.blue.bold('\n📋 Available TNF AI Agents:\n'));
        agents.forEach(agent => {
            console.log(chalk.green(`  ${agent.name}));`, console.log(chalk.gray(`    ${agent.description}`))));
            console.log(chalk.cyan(Capabilities, $, { agent, : .capabilities.join(', ') }));
            `
      console.log(chalk.magenta(    Type: ${agent.type}`;
        });
        ;
        console.log();
    }
    ;
}
return {
    agents,
    count: agents.length
};
/**
 * Agent Run Command
 */
export class AgentRunCommand extends BaseCommand {
    constructor(data) {
        super('agent.run', data, {
            name: 'Agent Run',
            description: 'Run a specific AI agent',
            category: 'agent',
            version: '1.0.0',
            arguments: [
                {
                    name: 'agentName',
                    description: 'Name of the agent to run',
                    required: true
                },
                {
                    name: 'task',
                    description: 'Task description for the agent',
                    required: false
                }
            ],
            options: [
                {
                    name: 'interactive',
                    short: 'i',
                    description: 'Run in interactive mode'
                },
                {
                    name: 'provider',
                    short: 'p',
                    description: 'LLM provider to use',
                    value: 'provider'
                },
                {
                    name: 'model',
                    short: 'm',
                    description: 'Specific model to use',
                    value: 'model'
                },
                {
                    name: 'json',
                    description: 'Output in JSON format'
                }
            ]
        });
    }
    async executeInternal(context) {
        let { agentName, task } = this.data;
        if (!task && !this.data.interactive) {
            throw new Error('Task description required when not in interactive mode');
        }
        if (this.data.interactive || !task) {
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'task',
                    message: What, task, would, you, like, $
                }, { agentName }, to, perform ?  : ,
            ]);
        }
    }
    default;
}
;
task = answers.task;
const orchestrator = new AgentOrchestrator();
const result = await orchestrator.runAgent(agentName, task, this.data);
console.log(chalk.green('\n✅ Agent completed successfully:'));
return result;
/**
 * Config Set Command
 */
export class ConfigSetCommand extends BaseCommand {
    constructor(data) {
        super('config.set', data, {
            name: 'Config Set',
            description: 'Set configuration values',
            category: 'config',
            version: '1.0.0',
            arguments: [
                {
                    name: 'key',
                    description: 'Configuration key',
                    required: true
                },
                {
                    name: 'value',
                    description: 'Configuration value',
                    required: true
                }
            ]
        });
    }
    async executeInternal(context) {
        const configManager = new CLIConfigManager();
        `
    await configManager.set(this.data.key, this.data.value);`;
        console.log(chalk.green(Set, $, { this: .data.key } ` = ${this.data.value}));

    return {
      key: this.data.key,
      value: this.data.value,
      success: true
    };
  }
}

/**
 * Config Get Command
 */
export class ConfigGetCommand extends BaseCommand {
  constructor(data: any) {
    super('config.get', data, {
      name: 'Config Get',
      description: 'Get configuration values',
      category: 'config',
      version: '1.0.0',
      arguments: [
        {
          name: 'key',
          description: 'Configuration key (optional)',
          required: false
        }
      ]
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    const configManager = new CLIConfigManager();
    `));
        if (this.data.key) {
            `
      const value = await configManager.get(this.data.key);
      console.log(chalk.blue(${this.data.key}`;
            $;
            {
                value || 'not set';
            }
            ;
            return {
                key: this.data.key,
                value
            };
        }
        else {
            const config = await configManager.getAll();
            console.log(chalk.blue.bold('\n📋 TNF CLI Configuration:\n'));
            `
      `;
            Object.entries(config).forEach(([k, v]) => {
                console.log(chalk.cyan($, { k } `: ${v}));
      });
      
      return config;
    }
  }
}

/**
 * Workspace Init Command
 */
export class WorkspaceInitCommand extends BaseCommand {
  constructor(data: any) {
    super('workspace.init', data, {
      name: 'Workspace Init',
      description: 'Initialize a new TNF workspace',
      category: 'workspace',
      version: '1.0.0',
      arguments: [
        {
          name: 'path',
          description: 'Workspace path',
          required: false
        }
      ]
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    const workspacePath = this.data.path || process.cwd();`));
                const configManager = new CLIConfigManager();
                `

    console.log(chalk.blue(🏗️  Initializing TNF workspace at: ${workspacePath}));

    await configManager.initWorkspace(workspacePath);

    console.log(chalk.green('✅ Workspace initialized successfully'));`;
                console.log(chalk.gray(-Created.tnf / directory));
                `
    console.log(chalk.gray(` - Added;
                workspace;
                configuration;
            });
            ;
            console.log(chalk.gray(-Ready));
            for (agent; operations;)
                ;
            ;
            return {
                path: workspacePath,
                initialized: true
            };
        }
    }
}
/**
 * Workspace Status Command
 */
export class WorkspaceStatusCommand extends BaseCommand {
    constructor(data) {
        super('workspace.status', data, {
            name: 'Workspace Status',
            description: 'Show workspace status',
            category: 'workspace',
            version: '1.0.0'
        });
    }
    async executeInternal(context) {
        const configManager = new CLIConfigManager();
        const status = await configManager.getWorkspaceStatus();
        console.log(chalk.blue.bold('\n📊 Workspace Status:\n'));
        console.log(chalk.cyan(Path, $, { status, : .path }));
        console.log(chalk.cyan(Initialized, $, { status, : .initialized ? 'Yes' : 'No' }));
        `
`;
        if (status.activeAgents && status.activeAgents.length > 0) {
            `
      console.log(chalk.cyan(  Active Agents: ${status.activeAgents.join(', ')}));
    }

    if (status.recentTasks && status.recentTasks.length > 0) {`;
            console.log(chalk.cyan(Recent, Tasks, $, { status, : .recentTasks.length } `));
    }

    return status;
  }
}

/**
 * Command Handlers
 */

export class ChatStartHandler implements ICommandHandler<any, any> {
  async handle(command: ChatStartCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'chat.start';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Chat Start Handler',
      description: 'Handles chat start commands',
      commandTypes: ['chat.start'],
      version: '1.0.0'
    };
  }
}

export class TaskExecuteHandler implements ICommandHandler<any, any> {
  async handle(command: TaskExecuteCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'task.execute';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Task Execute Handler',
      description: 'Handles task execution commands',
      commandTypes: ['task.execute'],
      version: '1.0.0'
    };
  }
}

export class AgentListHandler implements ICommandHandler<any, any> {
  async handle(command: AgentListCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'agent.list';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Agent List Handler',
      description: 'Handles agent list commands',
      commandTypes: ['agent.list'],
      version: '1.0.0'
    };
  }
}

export class AgentRunHandler implements ICommandHandler<any, any> {
  async handle(command: AgentRunCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'agent.run';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Agent Run Handler',
      description: 'Handles agent run commands',
      commandTypes: ['agent.run'],
      version: '1.0.0'
    };
  }
}

export class ConfigSetHandler implements ICommandHandler<any, any> {
  async handle(command: ConfigSetCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'config.set';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Config Set Handler',
      description: 'Handles config set commands',
      commandTypes: ['config.set'],
      version: '1.0.0'
    };
  }
}

export class ConfigGetHandler implements ICommandHandler<any, any> {
  async handle(command: ConfigGetCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'config.get';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Config Get Handler',
      description: 'Handles config get commands',
      commandTypes: ['config.get'],
      version: '1.0.0'
    };
  }
}

export class WorkspaceInitHandler implements ICommandHandler<any, any> {
  async handle(command: WorkspaceInitCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'workspace.init';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Workspace Init Handler',
      description: 'Handles workspace init commands',
      commandTypes: ['workspace.init'],
      version: '1.0.0'
    };
  }
}

export class WorkspaceStatusHandler implements ICommandHandler<any, any> {
  async handle(command: WorkspaceStatusCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    try {
      const result = await command.execute(context);
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'workspace.status';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Workspace Status Handler',
      description: 'Handles workspace status commands',
      commandTypes: ['workspace.status'],
      version: '1.0.0'
    };
  }
}));
        }
    }
}
//# sourceMappingURL=cli-commands.js.map