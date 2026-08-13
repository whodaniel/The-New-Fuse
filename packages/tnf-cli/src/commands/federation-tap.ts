import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { FederationNodeClient } from '@the-new-fuse/shared/federation';

export function registerFederationTapCommand(program: Command, repoRoot: string) {
  const tapCmd = program.command('federation').description('Federation related commands');

  tapCmd
    .command('tap <channel> [command...]')
    .description('Run a command and mirror its output to a federation channel as intent frames')
    .option('--name <name>', 'Agent name for the tap', 'tap-agent')
    .option('--platform <platform>', 'Agent platform', 'tnf-cli')
    .option('--relay <url>', 'Relay URL')
    .allowUnknownOption(true)
    .action(async (channel, commandArgs, options) => {
      // commander stores variadic args in commandArgs
      if (!commandArgs || commandArgs.length === 0) {
        console.error(chalk.red('Error: Please specify a command to run after the channel.'));
        console.error(chalk.yellow('Example: tnf federation tap general -- npm run dev'));
        process.exit(1);
      }

      // Handle the case where args includes '--' which might be swallowed or kept
      let commandToRun = commandArgs;
      if (commandToRun[0] === '--') {
        commandToRun = commandToRun.slice(1);
      }

      if (commandToRun.length === 0) {
        console.error(chalk.red('Error: Command cannot be empty.'));
        process.exit(1);
      }

      const client = new FederationNodeClient({
        relayUrl: options.relay || process.env.RELAY_URL,
        agentName: options.name,
        platform: options.platform as any,
        capabilities: ['federation-channels', 'terminal-tap'],
      });

      client.on('error', (err: any) => console.error(chalk.red('Relay error:'), err));
      
      console.log(chalk.blue(`Connecting to federation relay...`));
      client.connect();

      // Wait a bit for connection, then join
      setTimeout(() => {
        if (client.getState().registered) {
           client.joinChannel(channel);
           console.log(chalk.green(`Joined channel: ${channel}`));
        } else {
           console.log(chalk.yellow(`Warning: Not fully registered yet, continuing anyway...`));
        }
      }, 2000);

      console.log(chalk.blue(`Spawning command: ${commandToRun.join(' ')}`));

      const child = spawn(commandToRun[0], commandToRun.slice(1), {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd(),
        env: process.env,
        shell: true
      });

      let outputBuffer = '';

      const processOutput = (data: Buffer, isError: boolean) => {
        const text = data.toString();
        // Pipe to original stdout/stderr so user still sees it
        if (isError) {
          process.stderr.write(text);
        } else {
          process.stdout.write(text);
        }

        outputBuffer += text;
        const lines = outputBuffer.split('\n');
        outputBuffer = lines.pop() || '';

        for (const line of lines) {
          const stripped = line.replace(/\x1B\[\d+m/g, '').trim(); // very basic ansi strip
          if (!stripped) continue;

          let intent: string | null = null;
          let content = stripped;

          if (stripped.toLowerCase().includes('error:') || stripped.toLowerCase().includes('exception:')) {
            intent = 'error_report';
          } else if (stripped.toLowerCase().includes('task complete') || stripped.toLowerCase().includes('milestone:')) {
            intent = 'status_update';
          } else if (stripped.toLowerCase().includes('handoff:')) {
            intent = 'handoff';
          }

          if (intent) {
            try {
              // @ts-ignore - Some type mismatch with sendChannelMessage signature
              client.sendChannelMessage(channel, JSON.stringify({
                intent,
                payload: {
                  content,
                  channel
                }
              }), { messageType: 'intent_frame' });
            } catch (err) {
              // ignore
            }
          }
        }
      };

      child.stdout?.on('data', (d) => processOutput(d, false));
      child.stderr?.on('data', (d) => processOutput(d, true));

      child.on('close', (code) => {
        console.log(chalk.blue(`Child process exited with code ${code}`));
        setTimeout(() => process.exit(code || 0), 1000);
      });
    });
}
