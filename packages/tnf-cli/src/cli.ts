/**
 * TNF Agent CLI - Enhanced Command Line Interface
 *
 * A2A Protocol compliant multi-agent orchestration CLI with:
 * - Task management
 * - Workflow orchestration
 * - Configuration management
 * - Health monitoring
 * - Circuit breaker metrics
 */

import chalk from 'chalk';
import { Command } from 'commander';
import readline from 'readline';
import { AgentMessage, RedisAgentClient } from './RedisAgentClient.js';
import { getConfigManager } from './config.js';
import { createLogger } from './logger.js';
import { Orchestrator, WORKFLOW_TEMPLATES } from './orchestration.js';
import {
  AgentCard,
  AgentPlatform,
  AgentRole,
  AgentSkill,
  TaskCreateRequest,
  TaskState,
} from './types.js';

const program = new Command();

program
  .name('tnf-agent')
  .description('TNF Agent CLI - A2A Protocol Multi-Agent Orchestration')
  .version('2.0.0')
  .option('-c, --config <path>', 'Config file path')
  .option('-p, --profile <name>', 'Profile to use', 'default')
  .option('-v, --verbose', 'Verbose output')
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.profile) {
      try {
        const configManager = getConfigManager();
        configManager.loadProfile(opts.profile);
      } catch (error) {
        // Profile not found, use defaults
      }
    }
  });

const logMessage = (message: AgentMessage, verbose: boolean = false) => {
  const fromName = message.from?.agentName || 'Unknown';
  const fromRole = message.from?.role || '';
  const type = message.type || 'message';
  const content = message.content || '';

  const roleEmoji: Record<string, string> = {
    orchestrator: '👑',
    broker: '🎯',
    worker: '⚙️',
    participant: '💬',
  };

  const emoji = roleEmoji[fromRole] || '📨';

  let color = chalk.white;
  if (fromRole === 'orchestrator') color = chalk.yellow;
  else if (fromRole === 'broker') color = chalk.cyan;
  else if (fromRole === 'worker') color = chalk.green;

  console.log(`\n${emoji} [${color.bold(fromName)}] (${chalk.dim(type)}):`);
  console.log(`   ${content}`);

  if (message.traceId && verbose) {
    console.log(`   ${chalk.gray(`Trace: ${message.traceId.slice(0, 8)}...`)}`);
  }

  if (message.metadata?.event) {
    console.log(`   ${chalk.blue('Event:')} ${message.metadata.event}`);
  }

  if (message.expectsResponse) {
    console.log(`   ${chalk.yellow('⏳ Expects response')}`);
  }
};

// ============================================================================
// Agent Commands
// ============================================================================

program
  .command('register')
  .description('Register and listen as an agent')
  .argument('[name]', 'Agent name', process.env.AGENT_NAME || 'unnamed-agent')
  .argument(
    '[role]',
    'Agent role (orchestrator, broker, worker, participant)',
    process.env.AGENT_ROLE || 'participant'
  )
  .argument(
    '[platform]',
    'Agent platform (antigravity, gemini, claude, jules, vscode, browser)',
    process.env.AGENT_PLATFORM || 'vscode'
  )
  .option('-c, --capabilities <list>', 'Comma-separated capabilities')
  .option('--card <path>', 'Path to AgentCard JSON file')
  .action(async (name, role, platform, options) => {
    const configManager = getConfigManager();
    const config = configManager.getConfig();
    const logger = createLogger(config.logging);
    const client = new RedisAgentClient(config);

    try {
      await client.initialize();

      let agentCard: AgentCard | undefined;
      if (options.card) {
        const { readFileSync } = await import('fs');
        agentCard = JSON.parse(readFileSync(options.card, 'utf-8'));
      }

      const capabilities = options.capabilities?.split(',') || config.agent.capabilities;

      const agentInfo = await client.register(
        name,
        role as AgentRole,
        platform as AgentPlatform,
        capabilities,
        agentCard
      );

      console.log(chalk.green(`\n🤖 Registered as: ${chalk.bold(name)} (${role}) on ${platform}`));
      console.log(`   ID: ${chalk.dim(agentInfo.id)}`);
      console.log(`   Capabilities: ${chalk.dim(agentInfo.capabilities.join(', '))}`);
      if (agentCard) {
        console.log(
          `   Skills: ${chalk.dim(agentCard.skills.map((s: AgentSkill) => s.id).join(', '))}`
        );
      }
      console.log(
        chalk.cyan(
          '\n🎧 Listening for messages... (Type a message and press Enter, or Ctrl+C to exit)\n'
        )
      );

      client.onMessage('*', (msg) => {
        logMessage(msg, options.verbose);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (line.trim()) {
          await client.send(line.trim());
        }
      });

      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n👋 Shutting down...'));
        await client.cleanup();
        process.exit(0);
      });
    } catch (err: any) {
      logger.error('Registration failed', {}, err);
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all registered agents')
  .option('-s, --skills <skill>', 'Filter by skill')
  .option('-o, --online', 'Show only online agents')
  .action(async (options) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      let agents = await client.listAgents();

      // Apply filters
      if (options.skills) {
        agents = agents.filter((a) =>
          a.agentCard?.skills.some(
            (s) => s.id === options.skills || s.tags.includes(options.skills)
          )
        );
      }
      if (options.online) {
        agents = agents.filter((a) => a.isOnline);
      }

      console.log(chalk.bold(`\n📋 Registered Agents (${agents.length}):\n`));

      if (agents.length === 0) {
        console.log('   No agents found');
      } else {
        agents.forEach((agent) => {
          const statusIcon = agent.isOnline ? chalk.green('🟢') : chalk.red('🔴');
          const roleIcon: Record<string, string> = {
            orchestrator: '👑',
            broker: '🎯',
            worker: '⚙️',
            participant: '💬',
          };
          const icon = roleIcon[agent.role] || '📦';

          console.log(`${statusIcon} ${icon} ${chalk.bold(agent.name)} (${agent.platform})`);
          console.log(`      Role: ${agent.role}`);
          console.log(`      ID: ${chalk.dim(agent.id)}`);
          console.log(`      Capabilities: ${chalk.dim(agent.capabilities.join(', '))}`);
          if (agent.agentCard?.skills.length) {
            console.log(
              `      Skills: ${chalk.dim(agent.agentCard.skills.map((s) => s.id).join(', '))}`
            );
          }
          console.log(`      Last seen: ${chalk.dim(agent.lastSeen)}`);
          console.log('');
        });
      }
      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('discover')
  .description('Discover agents by skill')
  .argument('<skill>', 'Skill to search for')
  .action(async (skill) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      const agents = await client.discoverAgentsBySkill(skill);

      console.log(chalk.bold(`\n🔍 Agents with skill "${skill}" (${agents.length}):\n`));

      agents.forEach((agent) => {
        const statusIcon = agent.isOnline ? chalk.green('🟢') : chalk.red('🔴');
        console.log(`${statusIcon} ${chalk.bold(agent.name)} (${agent.platform})`);
        console.log(`   ID: ${chalk.dim(agent.id)}`);
        if (agent.agentCard) {
          const skillInfo = agent.agentCard.skills.find(
            (s) => s.id === skill || s.tags.includes(skill)
          );
          if (skillInfo) {
            console.log(`   Skill: ${chalk.dim(skillInfo.name)} - ${skillInfo.description}`);
          }
        }
        console.log('');
      });

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ============================================================================
// Message Commands
// ============================================================================

program
  .command('send')
  .description('Send a message')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name', process.env.AGENT_NAME || 'cli-sender')
  .option('--ack', 'Wait for acknowledgment')
  .option('--priority <level>', 'Message priority (low, normal, high, critical)', 'normal')
  .action(async (message, options) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      await client.register(options.name, 'participant', 'vscode');

      const sent = await client.send(message, {
        to: options.to ? { agentId: options.to } : undefined,
        expectsResponse: options.ack,
        priority: options.priority,
      });

      console.log(chalk.green('📤 Message sent'));
      console.log(chalk.dim(`   ID: ${sent.id}`));
      console.log(chalk.dim(`   Trace: ${sent.traceId}`));

      if (options.ack) {
        console.log(chalk.yellow('   Waiting for acknowledgment...'));
        // Wait a bit longer for ACK
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ============================================================================
// Task Commands
// ============================================================================

const taskCommand = program.command('task').description('Task management commands');

taskCommand
  .command('create')
  .description('Create a new task')
  .argument('<title>', 'Task title')
  .option('-d, --description <desc>', 'Task description')
  .option('-a, --assign <agentId>', 'Assign to agent')
  .option('-p, --priority <level>', 'Priority (low, normal, high, critical)', 'normal')
  .option('-t, --tags <list>', 'Comma-separated tags')
  .option('--deadline <date>', 'Deadline (ISO format)')
  .action(async (title, options) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      await client.register('task-cli', 'participant', 'vscode');

      const request: TaskCreateRequest = {
        title,
        description: options.description,
        assignedTo: options.assign,
        priority: options.priority,
        tags: options.tags?.split(','),
        deadline: options.deadline,
      };

      const task = await client.createTask(request);

      console.log(chalk.green('\n✅ Task created'));
      console.log(`   ID: ${chalk.dim(task.id)}`);
      console.log(`   Title: ${chalk.bold(task.title)}`);
      console.log(`   Status: ${chalk.yellow(task.status.state)}`);
      if (task.assignedTo) {
        console.log(`   Assigned to: ${chalk.dim(task.assignedTo)}`);
      }

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

taskCommand
  .command('list')
  .description('List tasks')
  .option('-s, --state <state>', 'Filter by state')
  .option('-a, --assignee <agentId>', 'Filter by assignee')
  .option('--all', 'Include completed tasks')
  .action(async (options) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      await client.register('task-cli', 'participant', 'vscode');

      let tasks = client.taskManager.getAllTasks();

      if (options.state) {
        tasks = tasks.filter((t) => t.status.state === options.state);
      }
      if (options.assignee) {
        tasks = tasks.filter((t) => t.assignedTo === options.assignee);
      }
      if (!options.all) {
        tasks = tasks.filter(
          (t) => t.status.state !== TaskState.Completed && t.status.state !== TaskState.Canceled
        );
      }

      console.log(chalk.bold(`\n📋 Tasks (${tasks.length}):\n`));

      tasks.forEach((task) => {
        const stateColor: Record<string, (s: string) => string> = {
          [TaskState.Submitted]: chalk.gray,
          [TaskState.Working]: chalk.blue,
          [TaskState.Completed]: chalk.green,
          [TaskState.Failed]: chalk.red,
          [TaskState.Canceled]: chalk.gray,
        };

        const color = stateColor[task.status.state] || chalk.white;

        console.log(`${color('●')} ${chalk.bold(task.title)}`);
        console.log(`   ID: ${chalk.dim(task.id)}`);
        console.log(`   Status: ${color(task.status.state)}`);
        if (task.assignedTo) {
          console.log(`   Assigned: ${chalk.dim(task.assignedTo)}`);
        }
        if (task.metadata?.priority) {
          console.log(`   Priority: ${chalk.dim(task.metadata.priority)}`);
        }
        console.log('');
      });

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

taskCommand
  .command('status')
  .description('Get task status')
  .argument('<taskId>', 'Task ID')
  .action(async (taskId) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();

      const task = client.taskManager.getTask(taskId);
      if (!task) {
        console.error(chalk.red(`Task ${taskId} not found`));
        process.exit(1);
      }

      console.log(chalk.bold(`\n📋 Task: ${task.title}\n`));
      console.log(`ID: ${chalk.dim(task.id)}`);
      console.log(`Status: ${chalk.yellow(task.status.state)}`);
      if (task.status.message) {
        console.log(`Message: ${task.status.message}`);
      }
      if (task.status.progress !== undefined) {
        console.log(`Progress: ${task.status.progress}%`);
      }
      console.log(`Created: ${chalk.dim(task.createdAt)}`);
      console.log(`Updated: ${chalk.dim(task.updatedAt)}`);

      if (task.artifacts.length > 0) {
        console.log(chalk.bold('\nArtifacts:'));
        task.artifacts.forEach((art) => {
          console.log(`  📄 ${art.name || art.artifactId}`);
        });
      }

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

taskCommand
  .command('assign')
  .description('Assign a task to an agent')
  .argument('<taskId>', 'Task ID')
  .argument('<agentId>', 'Agent ID')
  .action(async (taskId, agentId) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      await client.register('task-cli', 'participant', 'vscode');

      const task = await client.assignTask(taskId, agentId);

      console.log(chalk.green(`\n✅ Task assigned`));
      console.log(`   Task: ${chalk.bold(task.title)}`);
      console.log(`   Assigned to: ${chalk.dim(agentId)}`);

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

taskCommand
  .command('cancel')
  .description('Cancel a task')
  .argument('<taskId>', 'Task ID')
  .option('-r, --reason <reason>', 'Cancellation reason')
  .action(async (taskId, options) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();

      const task = client.taskManager.cancelTask(taskId, options.reason);

      console.log(chalk.yellow(`\n⚠️ Task canceled`));
      console.log(`   Task: ${chalk.bold(task.title)}`);
      if (options.reason) {
        console.log(`   Reason: ${chalk.dim(options.reason)}`);
      }

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ============================================================================
// Workflow Commands
// ============================================================================

program
  .command('orchestrate')
  .description('Execute a workflow')
  .argument('<workflow>', 'Workflow name or ID')
  .option('-p, --path <path>', 'Target path for code-review')
  .option('--template', 'Use built-in template')
  .option('--vars <json>', 'Workflow variables as JSON')
  .action(async (workflow, options) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      await client.register('orchestrator-cli', 'orchestrator', 'vscode');

      const orchestrator = new Orchestrator(client);

      // Check if using template
      if (options.template) {
        const template = WORKFLOW_TEMPLATES[workflow as keyof typeof WORKFLOW_TEMPLATES];
        if (!template) {
          console.error(chalk.red(`Template "${workflow}" not found`));
          console.log('Available templates:', Object.keys(WORKFLOW_TEMPLATES).join(', '));
          process.exit(1);
        }
        const workflowId = orchestrator.registerWorkflow(template);
        const execution = await orchestrator.executeWorkflow(workflowId, options);

        console.log(chalk.green(`\n✅ Workflow completed`));
        console.log(`   Execution ID: ${chalk.dim(execution.executionId)}`);
        console.log(`   Status: ${chalk.green(execution.status)}`);
      } else {
        await orchestrator.executeWorkflow(workflow, options);
      }

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('workflows')
  .description('List available workflow templates')
  .action(() => {
    console.log(chalk.bold('\n📋 Available Workflow Templates:\n'));

    Object.entries(WORKFLOW_TEMPLATES).forEach(([key, template]) => {
      console.log(`${chalk.cyan(key)}: ${chalk.bold(template.name)}`);
      console.log(`   ${template.description}`);
      console.log(`   Steps: ${template.steps.length}`);
      console.log('');
    });
  });

// ============================================================================
// Configuration Commands
// ============================================================================

const configCommand = program.command('config').description('Configuration management');

configCommand
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const configManager = getConfigManager();
    const config = configManager.getConfig();

    console.log(chalk.bold('\n⚙️  Current Configuration:\n'));
    console.log(JSON.stringify(config, null, 2));
  });

configCommand
  .command('set')
  .description('Set configuration value')
  .argument('<key>', 'Config key (dot notation)')
  .argument('<value>', 'Config value')
  .action((key, value) => {
    const configManager = getConfigManager();

    try {
      // Parse value as JSON if possible
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      // Navigate to nested property
      const keys = key.split('.');
      const config: any = configManager.getConfig();
      let current = config;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = parsedValue;
      configManager.update(config);

      console.log(chalk.green(`✅ Set ${key} = ${value}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

configCommand
  .command('profiles')
  .description('List available profiles')
  .action(() => {
    const configManager = getConfigManager();
    const profiles = configManager.listProfiles();
    const current = configManager.getCurrentProfile();

    console.log(chalk.bold('\n👤 Profiles:\n'));
    profiles.forEach((profile) => {
      const marker = profile === current ? chalk.green('→ ') : '  ';
      console.log(`${marker}${profile}`);
    });
  });

configCommand
  .command('use-profile')
  .description('Switch to a profile')
  .argument('<name>', 'Profile name')
  .action((name) => {
    const configManager = getConfigManager();

    try {
      configManager.loadProfile(name);
      console.log(chalk.green(`✅ Switched to profile: ${name}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ============================================================================
// Monitoring Commands
// ============================================================================

program
  .command('health')
  .description('Check system health')
  .action(async () => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      await client.register('health-cli', 'participant', 'vscode');

      const agents = await client.listAgents();
      const onlineAgents = agents.filter((a) => a.isOnline);

      console.log(chalk.bold('\n🏥 System Health:\n'));
      console.log(`Total Agents: ${agents.length}`);
      console.log(`Online: ${chalk.green(onlineAgents.length)}`);
      console.log(`Offline: ${chalk.red(agents.length - onlineAgents.length)}`);

      // Circuit breaker metrics
      const cbMetrics = client.getCircuitBreakerMetrics();
      console.log(chalk.bold('\nCircuit Breaker:'));
      console.log(`  State: ${chalk.yellow(cbMetrics.state)}`);
      console.log(`  Failures: ${cbMetrics.failureCount}`);
      console.log(`  Successes: ${cbMetrics.successCount}`);

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show task statistics')
  .action(async () => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();

      const stats = client.taskManager.getStats();

      console.log(chalk.bold('\n📊 Task Statistics:\n'));
      console.log(`Total Tasks: ${stats.total}`);
      console.log(`Completion Rate: ${(stats.completionRate * 100).toFixed(1)}%`);
      console.log(`Avg Completion Time: ${(stats.averageCompletionTime / 1000).toFixed(1)}s`);

      console.log(chalk.bold('\nBy State:'));
      Object.entries(stats.byState).forEach(([state, count]) => {
        if (count > 0) {
          console.log(`  ${state}: ${count}`);
        }
      });

      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ============================================================================
// Conversation Commands
// ============================================================================

program
  .command('convo')
  .description('Manage conversations')
  .argument('<action>', 'Action (start, join)')
  .argument('[param]', 'Topic for start, ID for join')
  .action(async (action, param) => {
    const configManager = getConfigManager();
    const client = new RedisAgentClient(configManager.getConfig());

    try {
      await client.initialize();
      await client.register('convo-cli', 'participant', 'vscode');

      if (action === 'start') {
        const id = await client.startConversation(param || 'general');
        console.log(chalk.green(`💬 Started conversation: ${chalk.bold(param || 'general')}`));
        console.log(`   ID: ${chalk.dim(id)}`);
      } else if (action === 'join') {
        if (!param) throw new Error('Conversation ID required to join');
        client.joinConversation(param);
        console.log(chalk.green(`🔗 Joined conversation: ${chalk.dim(param)}`));
      }

      console.log(chalk.cyan('\nType messages and press Enter (Ctrl+C to exit)\n'));

      client.onMessage('*', (msg) => {
        logMessage(msg);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (line.trim()) {
          await client.send(line.trim());
        }
      });

      process.on('SIGINT', async () => {
        await client.cleanup();
        process.exit(0);
      });
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
