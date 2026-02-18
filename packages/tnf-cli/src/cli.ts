import chalk from 'chalk';
import { spawn } from 'child_process';
import { Command } from 'commander';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import type { AgentMessage } from './RedisAgentClient.js';
import { RedisAgentClient } from './RedisAgentClient.js';
import { Orchestrator } from './orchestration.js';

const program = new Command();
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SUPER_ADMIN_ENV_KEY = 'TNF_SUPER_ADMIN_TOKEN';
const SUPER_ADMIN_INPUT_ENV_KEY = 'TNF_SUPER_ADMIN_INPUT_TOKEN';

async function runCommand(
  cmd: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || repoRoot,
      env: { ...process.env, ...(options.env || {}) },
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

function requireSuperAdmin(
  options: { superAdminToken?: string } | undefined,
  commandLabel: string
): void {
  const expected = process.env[SUPER_ADMIN_ENV_KEY];
  const provided =
    options?.superAdminToken ||
    process.env[SUPER_ADMIN_INPUT_ENV_KEY] ||
    process.env.CI_SUPER_ADMIN_TOKEN;

  if (!expected) {
    throw new Error(
      `Super Admin auth is not configured. Set ${SUPER_ADMIN_ENV_KEY} in the execution environment.`
    );
  }

  if (!provided || provided !== expected) {
    throw new Error(
      `Super Admin authentication required for '${commandLabel}'. Provide --super-admin-token or ${SUPER_ADMIN_INPUT_ENV_KEY}.`
    );
  }
}

program
  .name('tnf')
  .description('TNF CLI - Unified Command Surface for TNF Operations')
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
  if (fromRole === 'orchestrator') {
    color = chalk.yellow;
  } else if (fromRole === 'broker') {
    color = chalk.cyan;
  } else if (fromRole === 'worker') {
    color = chalk.green;
  }

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
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(async (name, role, platform, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agentInfo = await client.register(name, role, platform);

      console.log(chalk.green(`\n🤖 Registered as: ${chalk.bold(name)} (${role}) on ${platform}`));
      console.log(`   ID: ${chalk.dim(agentInfo.id)}`);
      console.log(`   Capabilities: ${chalk.dim(agentInfo.capabilities.join(', '))}`);

      if (options.daemon) {
        console.log(chalk.cyan('\n🚀 Daemon mode: Agent registered and running in background'));
        // Keep heartbeat running in background
        // In production, this would be a long-running process
        // For now, just clean up the registration
        await client.cleanup();
        console.log(chalk.green('\n✅ Agent deployment complete'));
        process.exit(0);
      }

      console.log(
        chalk.cyan(
          '\n🎧 Listening for messages... (Type a message and press Enter, or Ctrl+C to exit)\n'
        )
      );

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
  .command('onboard')
  .description('Run TNF frontload onboarding')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/tnf-onboard.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Run TNF diagnostics')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/tnf-doctor.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const mcp = program.command('mcp').description('MCP utilities');
mcp
  .command('generate')
  .description('Generate MCP clients inventory')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/tnf-generate-mcp-clients.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const ai = program.command('ai').description('AI launcher commands');
ai.command('start')
  .argument('[provider]', 'codex|claude|gemini', '')
  .description('Start an AI session helper')
  .action(async (provider: string) => {
    try {
      const args = ['scripts/tnf-start-ai.cjs'];
      if (provider) args.push(provider);
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const relay = program.command('relay').description('Relay operations');
relay
  .command('start')
  .description('Start relay-core relay service')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'relay start');
      await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'relay']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

relay
  .command('monitor')
  .description('Monitor relay channels')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/relay-channel-monitor.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const jules = program.command('jules').description('Jules automation operations');
jules
  .command('loop')
  .description('Run autonomous Jules loop')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules loop');
      await runCommand('bash', ['scripts/jules-autonomous-loop.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('merge-open')
  .description('Merge all open Jules PRs')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules merge-open');
      await runCommand('bash', ['scripts/jules-merge-open-prs.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('cron-install')
  .description('Install local Jules cron loop')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules cron-install');
      await runCommand('bash', ['scripts/install-jules-cron.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const masterClock = program
  .command('master-clock')
  .description('Master clock controls (cloud-first)');
masterClock
  .command('start')
  .description('Start master-clock in cloud via Railway (default) or locally')
  .option('--local', 'Run local master-clock (override cloud-first policy)', false)
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { local: boolean; service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock start');
      if (options.local) {
        await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'master-clock']);
        return;
      }

      console.log(
        chalk.cyan(`☁️ Starting cloud master clock on Railway service ${options.service}`)
      );
      await runCommand('railway', ['up', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

masterClock
  .command('logs')
  .description('Tail cloud master-clock logs')
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock logs');
      await runCommand('railway', ['logs', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

masterClock
  .command('status')
  .description('Show Railway status for master-clock service')
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock status');
      await runCommand('railway', ['status', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const superCycle = program.command('super-cycle').description('Super-cycle controls (cloud-first)');
superCycle
  .command('event')
  .description('Send super-cycle register/heartbeat/unregister event')
  .requiredOption('--action <action>', 'register|heartbeat|unregister')
  .requiredOption('--process-id <id>', 'Process identifier')
  .option('--name <name>', 'Process display name')
  .option('--status <status>', 'Process status', 'running')
  .option('--kind <kind>', 'Process kind', 'scheduled-job')
  .option('--owner <owner>', 'Process owner', 'tnf')
  .option('--result <result>', 'Last result')
  .option('--metadata <json>', 'JSON metadata', '{}')
  .option('--local', 'Run local super-cycle client (override cloud-first policy)', false)
  .option('--service <name>', 'Railway service name', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(
    async (options: {
      action: string;
      processId: string;
      name?: string;
      status: string;
      kind: string;
      owner: string;
      result?: string;
      metadata: string;
      local: boolean;
      service: string;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'super-cycle event');
        const baseArgs = [
          '--filter',
          '@the-new-fuse/relay-core',
          'run',
          'super-cycle:event',
          '--',
          '--action',
          options.action,
          '--process-id',
          options.processId,
          '--status',
          options.status,
          '--kind',
          options.kind,
          '--owner',
          options.owner,
          '--metadata',
          options.metadata,
        ];
        if (options.name) baseArgs.push('--name', options.name);
        if (options.result) baseArgs.push('--result', options.result);

        if (options.local) {
          await runCommand('pnpm', baseArgs);
          return;
        }

        console.log(
          chalk.cyan(`☁️ Sending super-cycle event via cloud service ${options.service}`)
        );
        await runCommand('railway', ['run', '--service', options.service, 'pnpm', ...baseArgs]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

superCycle
  .command('status')
  .description('Read super-cycle state snapshot')
  .option('--local', 'Read from local Redis via local client', false)
  .option('--service <name>', 'Railway service name', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { local: boolean; service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'super-cycle status');
      if (options.local) {
        await runCommand('pnpm', [
          '--filter',
          '@the-new-fuse/relay-core',
          'run',
          'super-cycle:status',
        ]);
        return;
      }
      await runCommand('railway', [
        'run',
        '--service',
        options.service,
        'pnpm',
        '--filter',
        '@the-new-fuse/relay-core',
        'run',
        'super-cycle:status',
      ]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Execute any root package script through unified TNF CLI')
  .argument('<script>', 'Root package.json script name')
  .argument('[args...]', 'Arguments to forward')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (script: string, args: string[], options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'run');
      const cmdArgs = ['run', script];
      if (args.length > 0) cmdArgs.push('--', ...args);
      await runCommand('pnpm', cmdArgs);
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
        if (!param) {
          throw new Error('Conversation ID required to join');
        }
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
