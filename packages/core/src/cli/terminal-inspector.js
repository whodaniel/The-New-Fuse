#!/usr/bin/env node
"use strict";
/**
 * Terminal Inspector CLI - Command-line tool for agents to monitor terminals
 */
Object.defineProperty(exports, "__esModule", { value: true });
const terminal_monitor_service_1 = require("../services/terminal-monitor.service");
class TerminalInspectorCLI {
    monitorService = new terminal_monitor_service_1.TerminalMonitorService();
    async run(args) {
        const command = args[0];
        const pid = args[1] ? parseInt(args[1]) : null;
        switch (command) {
            case 'inspect':
                if (!pid) {
                    console.error('Usage: terminal-inspector inspect <PID>');
                    process.exit(1);
                }
                await this.inspectTerminal(pid);
                break;
            case 'monitor':
                if (!pid) {
                    console.error('Usage: terminal-inspector monitor <PID> [interval_seconds]');
                    process.exit(1);
                }
                const intervalSeconds = args[2] ? parseInt(args[2]) : 2;
                await this.monitorTerminal(pid, intervalSeconds * 1000);
                break;
            case 'find-gemini':
                await this.findGeminiTerminals();
                break;
            case 'send':
                if (!pid || !args[2]) {
                    console.error('Usage: terminal-inspector send <PID> <message>');
                    process.exit(1);
                }
                await this.sendToTerminal(pid, args.slice(2).join(' '));
                break;
            default:
                this.showHelp();
                break;
        }
    }
    async inspectTerminal(pid) {
        console.log(`🔍 Inspecting Terminal PID: ${pid});
    console.log('━'.repeat(50));

    const session = await this.monitorService.getTerminalSession(pid);

    if (!session) {`, console.log(`❌ Terminal ${pid}`, not, found, or, not, accessible));
        return;
    }
    console;
    console;
}
`
    console.log(   TTY: ${session.tty}`;
;
console.log(State, $, { session, : .state } `);
    console.log(   Command: ${session.command});`, console.log(`   Working Directory: ${session.workingDirectory});` `
    console.log(\n🏃 Child Processes: ${session.childProcesses.length});
    for (const childPid of session.childProcesses) {
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);`));
const { stdout } = await execAsync(ps - p, $, { childPid } ` -o pid,state,command);
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          console.log(   └── ${lines[1]});
        }`);
try { }
catch (error) {
    `
        console.log(   └── ${childPid}`(process, info, unavailable);
    ;
}
// Check if it's a Gemini session
const isGemini = await this.monitorService.isGeminiSession(pid);
console.log(n, Gemini, CLI, Session, $, { isGemini, '✅ Yes': '❌ No' });
`
    if (isGemini) {`;
console.log(n, This, terminal, is, running, Gemini, CLI - suitable);
for (task; delegation;)
    ;
async;
monitorTerminal(pid, number, intervalMs, number);
Promise < void  > {
    console, : .log(Monitoring, Terminal, PID, $, { pid } ` (interval: ${intervalMs / 1000}s));`, console.log(Press, Ctrl + C, to, stop, monitoring)),
    console, : .log('━'.repeat(50)),
    this: .monitorService.startMonitoring(pid, (content) => {
        const timestamp = content.timestamp.toLocaleTimeString();
        const status = this.getStatusEmoji(content.status);
        console.log([$, { timestamp } `] ${status} ${content.content});
`]);
        if (content.command && content.command !== content.content) {
            `
        console.log(           Command: ${content.command});
      }
    }, intervalMs);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping monitoring...');
      this.monitorService.stopAllMonitoring();
      process.exit(0);
    });

    // Keep the process alive
    process.stdin.resume();
  }

  private async findGeminiTerminals(): Promise<void> {
    console.log('🔍 Finding Gemini CLI Terminals...');
    console.log('━'.repeat(50));

    const geminiTerminals = await this.monitorService.findGeminiTerminals();

    if (geminiTerminals.length === 0) {
      console.log('❌ No Gemini CLI terminals found');`;
            return;
            `
    }`;
            console.log(Found, $, { geminiTerminals, : .length }, Gemini, terminal(s), n);
            for (let i = 0; i < geminiTerminals.length; i++) {
                const session = geminiTerminals[i];
                `
      console.log(📺 Terminal ${i + 1}`;
            }
        }
    }),
    console, : .log(PID, $, { session, : .pid })
} `
      console.log(   TTY: ${session.tty});`;
console.log(Working, Directory, $, { session, : .workingDirectory } `);
      console.log(   Child Processes: ${session.childProcesses.length});`, console.log(Command, $, { session, : .command }));
console.log('');
console.log('💡 Use "terminal-inspector monitor <PID>" to monitor any of these terminals');
async;
sendToTerminal(pid, number, message, string);
Promise < void  > {} `
    console.log(📤 Sending to Terminal PID: ${pid}`;
;
console.log(Message, $, { message });
console.log('━'.repeat(50));
const success = await this.monitorService.sendToTerminal(pid, message);
if (success) {
    console.log('✅ Message sent successfully');
}
else {
    console.log('❌ Failed to send message');
    process.exit(1);
}
getStatusEmoji(status, string);
string;
{
    switch (status) {
        case 'active': return '🟢';
        case 'idle': return '🟡';
        case 'error': return '🔴';
        default: return '⚪';
    }
}
showHelp();
void {
    console, : .log(Terminal, Inspector, CLI - Multi - Agent, Terminal, Monitoring, Usage, terminal - inspector < command > [options], Commands, inspect < PID > -Inspect, a, terminal, process, monitor < PID > [interval] - Monitor, terminal, activity()), default: 2, s, interval,
    find
} - gemini - Find;
all;
Gemini;
CLI;
terminals;
send < PID > -Send;
input;
to;
terminal(requires, permissions);
Examples: terminal - inspector;
inspect;
70278;
terminal - inspector;
monitor;
70278;
5;
terminal - inspector;
find - gemini;
terminal - inspector;
send;
70278;
"What is your current status?" `
🤖 Built for The New Fuse Multi-Agent Framework` `);
  }
}

// Execute CLI if run directly
if (require.main === module) {
  const cli = new TerminalInspectorCLI();
  cli.run(process.argv.slice(2)).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { TerminalInspectorCLI };;
//# sourceMappingURL=terminal-inspector.js.map