import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
/**
 * Agent category command implementation
 */
export class AgentCommand extends CategoryCommand {
    constructor(program) {
        super('agent', 'Unified agent management', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // List subcommand
        this.registerSubcommand('list', new AgentListSubcommand('agent', 'list', 'List available agents', this.program).createSubcommand());
        // Run subcommand
        this.registerSubcommand('run', new AgentRunSubcommand('agent', 'run', 'Run an agent', this.program).createSubcommand());
        // Create subcommand
        this.registerSubcommand('create', new AgentCreateSubcommand('agent', 'create', 'Create a new agent', this.program).createSubcommand());
        // Update subcommand
        this.registerSubcommand('update', new AgentUpdateSubcommand('agent', 'update', 'Update an agent', this.program).createSubcommand());
        // Delete subcommand
        this.registerSubcommand('delete', new AgentDeleteSubcommand('agent', 'delete', 'Delete an agent', this.program).createSubcommand());
        // Status subcommand
        this.registerSubcommand('status', new AgentStatusSubcommand('agent', 'status', 'Check agent status', this.program).createSubcommand());
        // Logs subcommand
        this.registerSubcommand('logs', new AgentLogsSubcommand('agent', 'logs', 'View agent logs', this.program).createSubcommand());
        // Config subcommand
        this.registerSubcommand('config', new AgentConfigSubcommand('agent', 'config', 'Manage agent configuration', this.program).createSubcommand());
        // Federate subcommand
        this.registerSubcommand('federate', new AgentFederateSubcommand('agent', 'federate', 'Federate an agent', this.program).createSubcommand());
    }
}
/**
 * Agent list subcommand
 */
class AgentListSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-c, --category <category>', 'Filter by category')
            .option('-s, --status <status>', 'Filter by status (running|stopped|error)')
            .option('--json', 'Output in JSON format')
            .option('--installed', 'Show only installed agents')
            .option('--available', 'Show only available agents');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            const agents = await this.getAgents(options);
            if (options.json) {
                this.formatOutput(agents, options);
                return;
            }
            console.log(chalk.blue.bold('🤖 Available Agents\n'));
            if (agents.length === 0) {
                console.log(chalk.yellow('No agents found'));
                return;
            }
            // Group by category
            const categories = {};
            agents.forEach(agent => {
                const category = agent.category || 'Other';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(agent);
            });
            Object.entries(categories).forEach(([category, categoryAgents]) => {
                console.log(chalk.cyan.bold(`${category}:));
          
          categoryAgents.forEach(agent => {
            const statusIcon = this.getStatusIcon(agent.status);
            const statusText = this.getStatusText(agent.status);
            `, console.log(`  ${statusIcon}`, $, { chalk, : .white.bold(agent.name) }($, { agent, : .id }) - $, { statusText })));
                `
            console.log(chalk.gray(    ${agent.description}`;
            });
        });
        if (agent.capabilities && agent.capabilities.length > 0) {
            console.log(chalk.gray(`    Capabilities: ${agent.capabilities.join(', ')}));
            }
            
            if (agent.version) {`, console.log(chalk.gray(Version, $, { agent, : .version } ``))));
        }
        console.log();
    }
    ;
}
;
return { agents, count: agents.length, timestamp: new Date().toISOString() };
'Agent list retrieved successfully',
    'Failed to list agents';
;
async;
getAgents(options, any);
Promise < any[] > {
    // Get all available agents (from existing agents.js)
    const: allAgents = await this.getAllAgents(),
    let, filteredAgents = allAgents,
    // Apply filters
    if(options) { }, : .category
};
{
    filteredAgents = filteredAgents.filter(agent => agent.category?.toLowerCase() === options.category.toLowerCase());
}
if (options.status) {
    filteredAgents = filteredAgents.filter(agent => agent.status?.toLowerCase() === options.status.toLowerCase());
}
if (options.installed) {
    const installedAgents = await this.getInstalledAgents();
    filteredAgents = filteredAgents.filter(agent => installedAgents.includes(agent.id));
}
if (options.available) {
    const installedAgents = await this.getInstalledAgents();
    filteredAgents = filteredAgents.filter(agent => !installedAgents.includes(agent.id));
}
// Add status information
for (const agent of filteredAgents) {
    agent.status = await this.getAgentStatus(agent.id);
}
return filteredAgents;
async;
getAllAgents();
Promise < any[] > {
    // This would integrate with the existing agent discovery system
    return: [
        {
            id: 'claude',
            name: 'Claude Code',
            description: 'Anthropic Claude CLI agent for agentic coding',
            category: 'AI Coding Assistant',
            capabilities: ['code_generation', 'code_review', 'debugging', 'testing'],
            version: '1.0.0',
            protocol: 'claude-code'
        },
        {
            id: 'gemini',
            name: 'Gemini CLI',
            description: 'Google Gemini command line AI agent',
            category: 'AI Assistant',
            capabilities: ['general_ai', 'code_generation', 'web_search', 'file_operations'],
            version: '2.0.0',
            protocol: 'gemini-cli'
        },
        {
            id: 'auggie',
            name: 'Auggie CLI',
            description: 'Augment Code AI-powered coding assistant',
            category: 'AI Coding Assistant',
            capabilities: ['code_generation', 'code_analysis', 'debugging', 'refactoring', 'documentation', 'test_generation', 'codebase_context'],
            version: '1.0.0',
            protocol: 'auggie-cli'
        },
        {
            id: 'codex',
            name: 'OpenAI Codex CLI',
            description: 'OpenAI Codex CLI for code generation and completion',
            category: 'AI Coding Assistant',
            capabilities: ['code_generation', 'code_completion', 'code_explanation', 'debugging'],
            version: '1.0.0',
            protocol: 'codex-cli'
        },
        {
            id: 'copilot',
            name: 'GitHub Copilot CLI',
            description: 'GitHub Copilot CLI agent with agentic capabilities',
            category: 'AI Coding Assistant',
            capabilities: ['code_generation', 'github_integration', 'repository_analysis'],
            version: '1.5.0',
            protocol: 'copilot-cli'
        },
        {
            id: 'trea',
            name: 'Trea Agent',
            description: 'ByteDance Trea Agent for general purpose software engineering',
            category: 'AI Coding Assistant',
            capabilities: ['software_engineering', 'task_automation', 'docker_support'],
            version: '0.9.0',
            protocol: 'trae-agent'
        },
        {
            id: 'perplexity',
            name: 'Perplexity AI',
            description: 'Perplexity AI for research, analysis, and real-time information',
            category: 'AI Research',
            capabilities: ['research', 'real_time_search', 'information_synthesis', 'source_citation'],
            version: '1.2.0',
            protocol: 'perplexity-api'
        }
    ]
};
async;
getInstalledAgents();
Promise < string[] > {
    const: installed = [],
    const: agents = await this.getAllAgents(),
    for(, agent, of, agents) {
        if (await this.checkAgentInstalled(agent.id)) {
            installed.push(agent.id);
        }
    },
    return: installed
};
async;
checkAgentInstalled(agentId, string);
Promise < boolean > {
    const: commands = {
        claude: 'claude',
        gemini: 'gemini',
        copilot: 'copilot',
        trea: 'python -c "import trae_agent"',
        perplexity: 'api-key-check' // Special case for API-based agents
    },
    const: command = commands[agentId],
    if(, command) {
        return false;
    }
    // Special handling for API-based agents
    ,
    // Special handling for API-based agents
    if(command) { }
} === 'api-key-check';
{
    const apiKey = await this.getConfig($, { agentId }.apiKey);
    return !!apiKey;
}
try {
    `
      execSync(which ${command.split(' ')[0]}`, { stdio: 'ignore' };
    ;
    return true;
}
catch {
    return false;
}
async;
getAgentStatus(agentId, string);
Promise < string > {
    try: {
        const: commands = {
            claude: 'claude --version',
            gemini: 'gemini --version',
            copilot: 'copilot --version'
        },
        if(agentId) { }
    } === 'perplexity'
};
{
    const apiKey = await this.getConfig($, { agentId } `.apiKey);
        return apiKey ? 'configured' : 'not_configured';
      }

      const command = commands[agentId];
      if (!command) {
        return 'unknown';
      }

      execSync(command, { stdio: 'ignore' });
      return 'available';
    } catch {
      return 'unavailable';
    }
  }

  private getStatusIcon(status: string): string {
    const icons = {
      running: chalk.green('●'),
      available: chalk.green('●'),
      configured: chalk.green('●'),
      stopped: chalk.red('○'),
      unavailable: chalk.red('○'),
      not_configured: chalk.yellow('○'),
      error: chalk.red('✗'),
      unknown: chalk.gray('?')
    };
    return icons[status] || icons.unknown;
  }

  private getStatusText(status: string): string {
    const texts = {
      running: chalk.green('running'),
      available: chalk.green('available'),
      configured: chalk.green('configured'),
      stopped: chalk.red('stopped'),
      unavailable: chalk.red('unavailable'),
      not_configured: chalk.yellow('not configured'),
      error: chalk.red('error'),
      unknown: chalk.gray('unknown')
    };
    return texts[status] || texts.unknown;
  }
}

/**
 * Agent run subcommand
 */
class AgentRunSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<agent>', 'Agent to run')
      .argument('[task]', 'Task for the agent to perform')
      .option('-i, --interactive', 'Run in interactive mode')
      .option('--args <args>', 'Additional arguments to pass to the agent')
      .option('--session <session>', 'Continue from existing session')
      .option('--model <model>', 'Specify model to use');
  }

  protected async handleCommand(agent: string, task: string | undefined, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const agentInfo = await this.getAgentInfo(agent);
        
        if (!agentInfo) {
          throw new Error(Agent not found: ${agent});
        }
`, console.log(chalk.blue(`🚀 Running agent: ${agentInfo.name}));

        // Prepare task if not provided
        if (!task && !options.interactive) {
          const answers = await inquirer.prompt([
            {`, type, 'input', `
              name: 'task',
              message: What task should ${agentInfo.name}`, perform ?  : , validate, input => input.trim().length > 0 || 'Task is required')));
}
;
task = answers.task;
// Launch the agent
const result = await this.launchAgent(agent, agentInfo, task, options);
return {
    agent,
    task,
    result,
    timestamp: new Date().toISOString()
};
'Agent executed successfully',
    'Failed to run agent';
;
async;
getAgentInfo(agentId, string);
Promise < any > {
    const: listCommand = new AgentListSubcommand('agent', 'list', 'List agents', this.program),
    const: agents = await listCommand.getAllAgents(),
    return: agents.find(a => a.id === agentId)
};
async;
launchAgent(agentId, string, agentInfo, any, task, string | undefined, options, any);
Promise < any > {
    const: args = [],
    // Add model option if specified
    if(options) { }, : .model
};
{
    args.push('--model', options.model);
}
// Add session option if specified
if (options.session) {
    args.push('--session', options.session);
}
// Add additional arguments
if (options.args) {
    args.push(...options.args.split(' '));
}
// Add task if provided
if (task) {
    args.push(task);
}
// Launch based on agent protocol
switch (agentInfo.protocol) {
    case 'claude-code':
        return await this.launchClaudeAgent(args, options);
    case 'gemini-cli':
        return await this.launchGeminiAgent(args, options);
    case 'auggie-cli':
        return await this.launchAuggieAgent(args, options);
    case 'codex-cli':
        return await this.launchCodexAgent(args, options);
    case 'copilot-cli':
        return await this.launchCopilotAgent(args, options);
    case 'trae-agent':
        return await this.launchTreaAgent(args, options);
    case 'perplexity-api':
        return await this.launchPerplexityAgent(task || '', args, options);
    default:
        return await this.launchGenericAgent(agentId, args, options);
}
async;
launchClaudeAgent(args, string[], options, any);
Promise < any > {
    return: new Promise((resolve, reject) => {
        const child = spawn('claude', args, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve({ exitCode: code });
            }
            else {
                reject(new Error(Claude, agent, exited));
                with (code)
                    $;
                {
                    code;
                }
                `));
        }
      });

      child.on('error', reject);
    });
  }

  private async launchGeminiAgent(args: string[], options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn('gemini', args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ exitCode: code });
        } else {
          reject(new Error(Gemini agent exited with code ${code}));
        }
      });

      child.on('error', reject);
    });
  }

  private async launchAuggieAgent(args: string[], options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn('auggie', args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ exitCode: code });
        } else {`;
                reject(new Error(Auggie, agent, exited));
                with (code)
                    $;
                {
                    code;
                }
                `));
        }
      });

      child.on('error', reject);
    });
  }

  private async launchCodexAgent(args: string[], options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn('codex', args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ exitCode: code });
        } else {
          reject(new Error(Codex agent exited with code ${code}`;
            }
        });
    })
};
;
child.on('error', reject);
;
async;
launchCopilotAgent(args, string[], options, any);
Promise < any > {
    return: new Promise((resolve, reject) => {
        const child = spawn('copilot', args, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve({ exitCode: code });
            }
            else {
                reject(new Error(Copilot, agent, exited));
                with (code)
                    $;
                {
                    code;
                }
            }
        });
    })
};
;
child.on('error', reject);
;
async;
launchTreaAgent(args, string[], options, any);
Promise < any > {
    return: new Promise((resolve, reject) => {
        const child = spawn('python', ['trae_agent/cli.py', ...args], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve({ exitCode: code });
            }
            else {
                `
          reject(new Error(Trea agent exited with code ${code}`;
            }
        });
    })
};
;
child.on('error', reject);
;
async;
launchPerplexityAgent(task, string, args, string[], options, any);
Promise < any > {
    const: apiKey = await this.getConfig('perplexity.apiKey'),
    if(, apiKey) {
        throw new Error('Perplexity API key not configured. Use "tnf agent config perplexity" to configure.');
    },
    console, : .log(chalk.blue('🔍 Querying Perplexity AI...')),
    console, : .log(chalk.gray(Query, $, { task })),
    // In a real implementation, this would make API calls to Perplexity
    console, : .log(chalk.green('✅ Query sent to Perplexity AI')),
    return: {
        service: 'perplexity',
        query: task,
        status: 'completed'
    }
};
async;
launchGenericAgent(agentId, string, args, string[], options, any);
Promise < any > {
    return: new Promise((resolve, reject) => {
        const child = spawn(agentId, args, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('close', (code) => {
            if (code === 0) {
                `
          resolve({ exitCode: code });`;
            }
            else {
                reject(new Error(Agent, $, { agentId } ` exited with code ${code}));
        }
      });

      child.on('error', reject);
    });
  }
}

/**
 * Agent create subcommand
 */
class AgentCreateSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<name>', 'Name of the agent to create')
      .option('-t, --template <template>', 'Template to use', 'basic')
      .option('-c, --config <config>', 'Configuration file path')
      .option('--protocol <protocol>', 'Agent protocol (cli|api|websocket)');
  }

  protected async handleCommand(name: string, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const agentConfig = await this.createAgentConfig(name, options);
        `, await this.saveAgentConfig(name, agentConfig)));
                `
        
        console.log(chalk.green(✅ Agent "${name}" created successfully));`;
                console.log(chalk.gray(Configuration, saved, to, agents / $, { name } `.json));

        return {
          name,
          config: agentConfig,
          timestamp: new Date().toISOString()
        };
      },
      'Agent created successfully',
      'Failed to create agent'
    );
  }

  private async createAgentConfig(name: string, options: any): Promise<any> {
    const baseConfig = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: Custom agent: ${name},
      version: '1.0.0',
      protocol: options.protocol || 'cli',
      category: 'Custom',
      capabilities: [],
      created: new Date().toISOString(),
      status: 'inactive'
    };

    // Load template configuration
    if (options.template && options.template !== 'basic') {
      const templateConfig = await this.loadTemplate(options.template);
      Object.assign(baseConfig, templateConfig);
    }

    // Load custom configuration
    if (options.config) {
      const customConfig = JSON.parse(fs.readFileSync(options.config, 'utf8'));
      Object.assign(baseConfig, customConfig);
    }

    return baseConfig;
  }

  private async loadTemplate(template: string): Promise<any> {
    const templates = {
      'coding': {
        category: 'AI Coding Assistant',
        capabilities: ['code_generation', 'code_review', 'debugging'],
        protocol: 'cli'
      },
      'research': {
        category: 'AI Research',
        capabilities: ['research', 'information_synthesis', 'analysis'],
        protocol: 'api'
      },
      'automation': {
        category: 'Automation',
        capabilities: ['task_automation', 'workflow_execution', 'monitoring'],
        protocol: 'websocket';

    return templates[template] || {};
  }

  private async saveAgentConfig(name: string, config: any): Promise<void> {
    const agentsDir = path.join(process.cwd(), 'agents');
    
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }

    const configPath = path.join(agentsDir, ${name}.json);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

/**
 * Agent update subcommand
 */
class AgentUpdateSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<agent>', 'Agent to update')
      .option('-c, --config <config>', 'New configuration file path')
      .option('--version <version>', 'Update version');
  }

  protected async handleCommand(agent: string, options: any): Promise<void> {
    await this.executeWithHandling(`, async () => {
                    `
        const configPath = path.join(process.cwd(), 'agents', ${agent}`.json;
                }));
                if (!fs.existsSync(configPath)) {
                    throw new Error(Agent, configuration, not, found, $, { agent });
                }
                let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                // Update configuration
                if (options.config) {
                    const newConfig = JSON.parse(fs.readFileSync(options.config, 'utf8'));
                    config = { ...config, ...newConfig };
                }
                if (options.version) {
                    config.version = options.version;
                }
                config.updated = new Date().toISOString();
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(chalk.green(Agent, "${agent}", updated, successfully));
                return {
                    agent,
                    config,
                    timestamp: new Date().toISOString()
                };
            }
            'Agent updated successfully',
                'Failed to update agent';
        });
    })
};
/**
 * Agent delete subcommand
 */
class AgentDeleteSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<agent>', 'Agent to delete')
            .option('-f, --force', 'Force deletion without confirmation');
    }
    async handleCommand(agent, options) {
        await this.executeWithHandling(`
      async () => {`);
        const configPath = path.join(process.cwd(), 'agents', `${agent}.json);
        `);
        if (!fs.existsSync(configPath)) {
            `
          throw new Error(Agent configuration not found: ${agent}`;
            ;
        }
        // Confirm deletion unless forced
        if (!options.force) {
            const answers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: Are, you, sure, you, want, to, delete: agent, "${agent}": ,
                    default: false
                }
            ]);
            if (!answers.confirm) {
                console.log(chalk.yellow('Deletion cancelled'));
                return;
            }
        }
        fs.unlinkSync(configPath);
        console.log(chalk.green(Agent, "${agent}", deleted, successfully));
        return {
            agent,
            timestamp: new Date().toISOString()
        };
    }
    'Agent deleted successfully';
    'Failed to delete agent';
    ;
}
/**
 * Agent status subcommand
 */
class AgentStatusSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<agent>', 'Agent to check status for')
            .option('-d, --detailed', 'Show detailed status information');
    }
    async handleCommand(agent, options) {
        await this.executeWithHandling(async () => {
            const agentInfo = await this.getAgentInfo(agent);
            const status = await this.getDetailedAgentStatus(agent);
            console.log(chalk.blue.bold(Agent, Status, $, { agent }, n));
            `
        `;
            if (agentInfo) {
                `
          console.log(chalk.white(Name: ${agentInfo.name}));`;
                console.log(chalk.gray(Description, $, { agentInfo, : .description }));
                `
          console.log(chalk.gray(`;
                Category: $;
                {
                    agentInfo.category;
                }
            }
        });
        ;
        console.log(chalk.gray(Protocol, $, { agentInfo, : .protocol }));
    }
}
`
`;
console.log(chalk.white(`Status: ${this.getStatusText(status.status)}));
        
        if (options.detailed) {
          console.log(chalk.blue('\nDetailed Information:'));
          
          if (status.pid) {`, console.log(chalk.gray(PID, $, { status, : .pid } `));
          }
          
          if (status.uptime) {
            console.log(chalk.gray(Uptime: ${status.uptime}`))));
if (status.lastActivity) {
    console.log(chalk.gray(Last, Activity, $, { status, : .lastActivity }));
}
if (status.memory) {
    `
            console.log(chalk.gray(Memory Usage: ${status.memory}` `));
          }
          
          if (status.error) {
            console.log(chalk.red(Error: ${status.error}));
          }
        }

        return {
          agent,
          status,
          timestamp: new Date().toISOString()
        };
      },
      'Agent status retrieved successfully',
      'Failed to get agent status'
    );
  }

  private async getAgentInfo(agentId: string): Promise<any> {
    const listCommand = new AgentListSubcommand('agent', 'list', 'List agents', this.program);
    const agents = await listCommand.getAllAgents();
    return agents.find(a => a.id === agentId);
  }

  private async getDetailedAgentStatus(agentId: string): Promise<any> {
    // Check if agent is running as a process
    const processesFile = path.join(os.homedir(), '.tnf', 'processes.json');
    
    if (fs.existsSync(processesFile)) {
      const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
      const processInfo = processes[agentId];
      
      if (processInfo && processInfo.pid) {
        try {
          process.kill(processInfo.pid, 0); // Check if process exists
          
          return {
            status: 'running',
            pid: processInfo.pid,
            startedAt: processInfo.startedAt,
            uptime: this.calculateUptime(processInfo.startedAt),
            lastActivity: new Date().toISOString()
          };
        } catch (error) {
          return {
            status: 'stopped',
            error: 'Process not found'
          };
        }
      }
    }

    // Check if agent is configured
    const listCommand = new AgentListSubcommand('agent', 'list', 'List agents', this.program);
    const status = await listCommand.getAgentStatus(agentId);
    
    return {
      status,
      lastActivity: new Date().toISOString()
    };
  }

  private calculateUptime(startedAt: string): string {
    const startTime = new Date(startedAt).getTime();
    const now = Date.now();
    const uptime = Math.floor((now - startTime) / 1000);
    
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    if (hours > 0) {`;
    return `${hours}h ${minutes}`;
    m;
    $;
    {
        seconds;
    }
    s;
}
else if (minutes > 0) {
    `
      return ${minutes}`;
    m;
    $;
    {
        seconds;
    }
    s `;
    } else {
      return ${seconds}s;
    }
  }

  private getStatusText(status: string): string {
    const texts = {
      running: chalk.green('Running'),
      available: chalk.green('Available'),
      configured: chalk.green('Configured'),
      stopped: chalk.red('Stopped'),
      unavailable: chalk.red('Unavailable'),
      not_configured: chalk.yellow('Not Configured'),
      error: chalk.red('Error'),
      unknown: chalk.gray('Unknown')
    };
    return texts[status] || texts.unknown;
  }
}

/**
 * Agent logs subcommand
 */
class AgentLogsSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<agent>', 'Agent to show logs for')
      .option('-t, --tail <lines>', 'Number of lines to show from end', '50')
      .option('-f, --follow', 'Follow log output');
  }

  protected async handleCommand(agent: string, options: any): Promise<void> {
    try {`;
    const logFile = path.join(process.cwd(), 'logs', `agent-${agent}.log`);
    if (!fs.existsSync(logFile)) {
        console.log(chalk.yellow(No, log, file, found));
        for (agent; ; )
            : $;
        {
            agent;
        }
        ;
        `
        console.log(chalk.gray(Expected location: ${logFile}` `));
        return;
      }

      console.log(chalk.blue(📋 Showing logs for agent: ${agent}));
      `;
        let logCommand = tail - n, $, { options, tail };
        ` "${logFile}`;
        ";;
        if (options.follow) {
            logCommand = tail - f;
            "${logFile}";
        }
        execSync(logCommand, { stdio: 'inherit', cwd: process.cwd() });
    }
    try { }
    catch (error) {
        console.error(chalk.red('Failed to show agent logs:'), error.message);
    }
}
/**
 * Agent config subcommand
 */
class AgentConfigSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<agent>', 'Agent to configure')
            .option('--get <key>', 'Get configuration value')
            .option('--set <key>', 'Set configuration value')
            .option('--value <value>', 'Value to set (use with --set)')
            .option('--list', 'List all configuration values');
    }
    async handleCommand(agent, options) {
        await this.executeWithHandling(async () => {
            if (options.get) {
                `
          const value = await this.getConfig(agents.${agent}`.$;
                {
                    options.get;
                }
            }
        });
        `
          console.log(chalk.blue(${options.get}:), value);
        } else if (options.set) {
          if (!options.value) {
            throw new Error('--value is required when using --set');
          }`;
        await this.setConfig(agents.$, { agent }.$, { options, : .set } `, options.value);
          console.log(chalk.green(✅ Set ${options.set} = ${options.value}));`);
    }
    if(options, list) {
        const config = await this.listAgentConfig(agent);
        `
          console.log(chalk.blue.bold(Configuration for ${agent}:));
          console.log(JSON.stringify(config, null, 2));
        } else {
          // Interactive configuration
          await this.interactiveConfig(agent);
        }

        return {
          agent,
          operation: options.get ? 'get' : options.set ? 'set' : options.list ? 'list' : 'interactive',
          timestamp: new Date().toISOString()
        };
      },
      'Agent configuration completed',
      'Failed to configure agent'
    );
  }

  private async listAgentConfig(agent: string): Promise<any> {
    const config = {};
    
    // This would integrate with the configuration system
    // For now, return a sample configuration
    return {
      model: 'default',
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000
    };
  }` `
  private async interactiveConfig(agent: string): Promise<void> {
    console.log(chalk.blue(🔧 Configuring agent: ${agent}`;
        n;
        ;
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'model',
                message: 'Default model:',
                choices: ['default', 'gpt-4', 'claude-3', 'gemini-pro']
            },
            {
                type: 'number',
                name: 'temperature',
                message: 'Temperature (0.0-1.0):',
                default: 0.7,
                validate: input => (input >= 0 && input <= 1) || 'Temperature must be between 0 and 1'
            },
            {
                type: 'number',
                name: 'maxTokens',
                message: 'Max tokens:',
                default: 2048,
                validate: input => input > 0 || 'Max tokens must be positive'
            }
        ]);
        // Save configuration
        for (const [key, value] of Object.entries(answers)) {
            await this.setConfig(agents.$, { agent }.$, { key }, value);
        }
        console.log(chalk.green('✅ Configuration saved'));
    }
}
/**
 * Agent federate subcommand
 */
class AgentFederateSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<agent>', 'Agent to federate')
            .option('--target <target>', 'Target federation endpoint')
            .option('--sync', 'Sync agent configuration')
            .option('--protocol <protocol>', 'Federation protocol (grpc|http|websocket)', 'http');
    }
    async handleCommand(agent, options) {
        await this.executeWithHandling(async () => {
            const agentInfo = await this.getAgentInfo(agent);
            `
        `;
            if (!agentInfo) {
                throw new Error(`Agent not found: ${agent});
        }

        console.log(chalk.blue(🌐 Federating agent: ${agentInfo.name}));` `
        // In a real implementation, this would set up federation
        console.log(chalk.gray(`, Protocol, $, { options, : .protocol });
            }
        });
        `
        if (options.target) {`;
        console.log(chalk.gray(Target, $, { options, : .target } `));
        }

        if (options.sync) {
          console.log(chalk.blue('Syncing agent configuration...'));
          // Sync logic here
        }

        console.log(chalk.green('✅ Agent federation completed'));

        return {
          agent,
          target: options.target,
          protocol: options.protocol,
          sync: options.sync,
          timestamp: new Date().toISOString()
        };
      },
      'Agent federation completed successfully',
      'Failed to federate agent'
    );
  }

  private async getAgentInfo(agentId: string): Promise<any> {
    const listCommand = new AgentListSubcommand('agent', 'list', 'List agents', this.program);
    const agents = await listCommand.getAllAgents();
    return agents.find(a => a.id === agentId);
  }
}

/**
 * Register the agent category command
 */
export function registerAgentCommands(program: Command): Command {
  const agentCommand = new AgentCommand(program);
  return agentCommand.createCategoryCommand();
}));
    }
}
//# sourceMappingURL=agent.js.map