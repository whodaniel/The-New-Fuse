"use strict";
/**
 * Terminal Monitor Service - Real-time terminal content inspection for agentic framework
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TerminalMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalMonitorService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let TerminalMonitorService = TerminalMonitorService_1 = class TerminalMonitorService {
    logger = new common_1.Logger(TerminalMonitorService_1.name);
    monitoredTerminals = new Map();
    /**
     * Get detailed information about a terminal process
     */
    async getTerminalSession(pid) {
        try {
            // Get basic process info
            const { stdout: psOutput } = await execAsync(`ps -p ${pid} -o pid,ppid,state,tty,command);
      const lines = psOutput.trim().split('\n');

      if (lines.length < 2) {
        return null;
      }

      const processInfo = lines[1].trim().split(/\s+/);
      const [pidStr, ppid, state, tty, ...commandParts] = processInfo;
      const command = commandParts.join(' ');

      // Get child processes
      const childProcesses = await this.getChildProcesses(pid);

      // Get working directory
      const workingDirectory = await this.getProcessWorkingDirectory(pid);

      return {
        pid,
        tty,
        command,
        state,
        childProcesses,
        workingDirectory
      };
    } catch (error) {`, this.logger.error(`Failed to get terminal session for PID ${pid}`, $, {}(error).message));
        }
        finally { }
        ;
        return null;
    }
};
exports.TerminalMonitorService = TerminalMonitorService;
exports.TerminalMonitorService = TerminalMonitorService = TerminalMonitorService_1 = __decorate([
    (0, common_1.Injectable)()
], TerminalMonitorService);
async;
getChildProcesses(pid, number);
Promise < number[] > {
    try: {} `
      const { stdout } = await execAsync(`, pgrep
} - P;
$;
{
    pid;
}
`);
      return stdout.trim().split('\n').map(p => parseInt(p)).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get working directory of a process
   */
  private async getProcessWorkingDirectory(pid: number): Promise<string> {
    try {
      const { stdout } = await execAsync(lsof -p ${pid} | grep cwd | awk '{print $9}');
      return stdout.trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if a process is running Gemini CLI
   */
  async isGeminiSession(pid: number): Promise<boolean> {
    try {
      const session = await this.getTerminalSession(pid);
      if (!session) return false;

      // Check main process
      if (session.command.includes('gemini')) return true;

      // Check child processes
      for (const childPid of session.childProcesses) {`;
const { stdout } = await execAsync(ps - p, $, { childPid } - o, command = `);
        if (stdout.includes('gemini')) return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Monitor terminal activity with callback
   */
  startMonitoring(pid: number, callback: (content: TerminalContent) => void, intervalMs = 2000): void {
    if (this.monitoredTerminals.has(pid)) {
      this.logger.warn(Terminal ${pid} is already being monitored);
      return;
    }

    const interval = setInterval(async () => {`);
try {
    `
        const session = await this.getTerminalSession(pid);
        if (!session) {
          this.logger.warn(`;
    Terminal;
    $;
    {
        pid;
    }
    no;
    longer;
    exists, stopping;
    monitoring;
    ;
    this.stopMonitoring(pid);
    return;
}
// Check if terminal is active (has running child processes)
finally {
}
// Check if terminal is active (has running child processes)
const isActive = session.childProcesses.length > 0;
const status = isActive ? 'active' : 'idle';
// Get current command being executed`
let currentCommand = session.command;
`
        if (session.childProcesses.length > 0) {
          const { stdout } = await execAsync(ps -p ${session.childProcesses[0]} -o command=`;
;
currentCommand = stdout.trim();
const content = {
    pid,
    timestamp: new Date(),
    content: Terminal, $
}, { pid };
($);
{
    session.tty;
}
$;
{
    currentCommand;
}
`,
          command: currentCommand,
          status
        };

        callback(content);
      } catch (error) {
        this.logger.error(Error monitoring terminal ${pid}: ${error.message});
        const errorContent: TerminalContent = {
          pid,`;
timestamp: new Date(), `
          content: Error monitoring terminal: ${error.message}`,
    status;
'error';
;
callback(errorContent);
intervalMs;
;
this.monitoredTerminals.set(pid, interval);
this.logger.log(Started, monitoring, terminal, $, { pid });
/**
 * Stop monitoring a terminal
 */
stopMonitoring(pid, number);
void {
    const: interval = this.monitoredTerminals.get(pid),
    if(interval) {
        clearInterval(interval);
        `
      this.monitoredTerminals.delete(pid);`;
        this.logger.log(Stopped, monitoring, terminal, $, { pid } `);
    }
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    for (const [pid, interval] of this.monitoredTerminals) {
      clearInterval(interval);
    }
    this.monitoredTerminals.clear();
    this.logger.log('Stopped all terminal monitoring');
  }

  /**
   * Get list of active Gemini terminals
   */
  async findGeminiTerminals(): Promise<TerminalSession[]> {
    try {
      // Find all processes running gemini
      const { stdout } = await execAsync(pgrep -f gemini);
      const geminiPids = stdout.trim().split('\n').map(p => parseInt(p)).filter(Boolean);

      const geminiTerminals: TerminalSession[] = [];

      for (const pid of geminiPids) {
        // Get parent terminal
        const { stdout: parentOutput } = await execAsync(ps -p ${pid} -o ppid=);
        const parentPid = parseInt(parentOutput.trim());

        if (parentPid) {
          const session = await this.getTerminalSession(parentPid);
          if (session && !geminiTerminals.find(t => t.pid === session.pid)) {
            geminiTerminals.push(session);
          }
        }
      }

      return geminiTerminals;`);
    }, catch(error) {
        `
      this.logger.error(Failed to find Gemini terminals: ${error.message}`;
        ;
        return [];
    }
};
/**
 * Send input to a terminal session (requires appropriate permissions)
 */
async;
sendToTerminal(pid, number, input, string);
Promise < boolean > {
    try: {
        const: session = await this.getTerminalSession(pid),
        if(, session) {
            this.logger.error(Terminal, $, { pid }, not, found);
            return false;
        }
        // Use expect or similar tool to send input`
        // This is a simplified version - in production, you'd use a more robust method`
        ,
        // Use expect or similar tool to send input`
        // This is a simplified version - in production, you'd use a more robust method`
        await
    }, " > /dev/${session.tty});`: this.logger.log(Sent, input, to, terminal, $, { pid } `: ${input}`),
    return: true
};
try { }
catch (error) {
    this.logger.error(Failed, to, send, input, to, terminal, $, { pid }, $, {}(error).message);
}
`);
      return false;
    }
  }
}
;
//# sourceMappingURL=terminal-monitor.service.js.map