import { Command } from 'commander';
import { RedisAgentClient, AgentMessage } from './RedisAgentClient.js';
import { Orchestrator } from './orchestration.js';
import chalk from 'chalk';
import readline from 'readline';

const program = new Command();

program
  .name('tnf-agent')
  .description('TNF Agent CLI - Redis-Based Agent Communication')
  .version('1.0.0');

const logMessage = (message: AgentMessage) => {
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

  if (message.metadata?.event) {
    console.log(`   ${chalk.blue('Event:')} ${message.metadata.event}`);
  }

  if (message.expectsResponse) {
    console.log(`   ${chalk.yellow('⏳ Expects response')}`);
  }
};

program
  .command('register')
  .description('Register and listen as an agent')
  .argument('[name]', 'Agent name', process.env.AGENT_NAME || 'unnamed-agent')
  .argument('[role]', 'Agent role (orchestrator, broker, worker, participant)', process.env.AGENT_ROLE || 'participant')
  .argument('[platform]', 'Agent platform (antigravity, gemini, claude, jules, vscode, browser)', process.env.AGENT_PLATFORM || 'vscode')
  .action(async (name, role, platform) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agentInfo = await client.register(name, role, platform);
      
      console.log(chalk.green(`\n🤖 Registered as: ${chalk.bold(name)} (${role}) on ${platform}`));
      console.log(`   ID: ${chalk.dim(agentInfo.id)}`);
      console.log(`   Capabilities: ${chalk.dim(agentInfo.capabilities.join(', '))}`);
      console.log(chalk.cyan('\n🎧 Listening for messages... (Type a message and press Enter, or Ctrl+C to exit)\n'));

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
        console.log(chalk.yellow('\n👋 Shutting down...'));
        await client.cleanup();
        process.exit(0);
      });
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all registered agents')
  .action(async () => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agents = await client.listAgents();

      console.log(chalk.bold('\n📋 Registered Agents:\n'));

      if (agents.length === 0) {
        console.log('   No agents registered');
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
  .command('send')
  .description('Send a single message')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name', process.env.AGENT_NAME || 'cli-sender')
  .action(async (message, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register(options.name, 'participant', 'vscode');
      await client.send(message, { to: options.to ? { agentId: options.to } : undefined });
      
      console.log(chalk.green('📤 Message sent'));
      
      // Wait a bit for responses
      await new Promise(resolve => setTimeout(resolve, 1000));
      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('orchestrate')
  .description('Execute an orchestrated multi-agent workflow')
  .argument('<workflow>', 'Workflow name (health-check, code-review, self-improvement)')
  .option('-p, --path <path>', 'Target path for code-review')
  .action(async (workflow, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register('orchestrator-cli', 'orchestrator', 'vscode');
      const orchestrator = new Orchestrator(client);
      await orchestrator.executeWorkflow(workflow, options);
      
      // Wait for any immediate feedback
      await new Promise(resolve => setTimeout(resolve, 2000));
      await client.cleanup();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('convo')
  .description('Manage conversations')
  .argument('<action>', 'Action (start, join)')
  .argument('[param]', 'Topic for start, ID for join')
  .action(async (action, param) => {
    const client = new RedisAgentClient();
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
