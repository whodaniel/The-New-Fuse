"use strict";
/**
 * Terminal Discovery Service - Comprehensive terminal search and interaction for AI agents
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TerminalDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let TerminalDiscoveryService = TerminalDiscoveryService_1 = class TerminalDiscoveryService {
    logger = new common_1.Logger(TerminalDiscoveryService_1.name);
    /**
     * Discover all terminals on the system
     */
    async discoverAllTerminals() {
        try {
            // Get all terminal-related processes
            const terminalPatterns = [
                'zsh', 'bash', 'fish', 'sh', 'tcsh', 'csh',
                'Terminal', 'iTerm', 'Code'
            ];
            const terminals = [];
            for (const pattern of terminalPatterns) {
                try {
                    const { stdout } = await execAsync(`pgrep -f "${pattern}" || echo "");
          const pids = stdout.trim().split('\n').filter(p => p && p !== '').map(p => parseInt(p));

          for (const pid of pids) {
            const terminalInfo = await this.getDetailedTerminalInfo(pid);
            if (terminalInfo && this.isValidTerminal(terminalInfo)) {
              terminals.push(terminalInfo);
            }
          }
        } catch (error) {
          // Continue with other patterns
        }
      }

      // Remove duplicates and sort by PID
      const uniqueTerminals = this.removeDuplicateTerminals(terminals);
      return uniqueTerminals.sort((a, b) => a.pid - b.pid);

    } catch (error) {`, this.logger.error(`Failed to discover terminals: ${error.message}`));
                    return [];
                }
                finally {
                }
            }
            /**
             * Search terminals based on criteria
             */
            async;
            searchTerminals(criteria, TerminalSearchCriteria);
            Promise < TerminalInfo[] > {
                const: allTerminals = await this.discoverAllTerminals(),
                return: allTerminals.filter(terminal => {
                    // Filter by terminal type
                    if (criteria.terminalType && !criteria.terminalType.includes(terminal.terminalType)) {
                        return false;
                    }
                    // Filter by AI CLI type
                    if (criteria.aiCliTypes && terminal.aiCliType) {
                        if (!criteria.aiCliTypes.includes(terminal.aiCliType)) {
                            return false;
                        }
                    }
                    // Filter by working directory
                    if (criteria.workingDirectory) {
                        if (!terminal.workingDirectory.includes(criteria.workingDirectory)) {
                            return false;
                        }
                    }
                    // Filter by child processes
                    if (criteria.hasChildProcesses !== undefined) {
                        const hasChildren = terminal.childProcesses.length > 0;
                        if (criteria.hasChildProcesses !== hasChildren) {
                            return false;
                        }
                    }
                    // Filter by interactive status
                    if (criteria.isInteractive !== undefined) {
                        if (criteria.isInteractive !== terminal.isInteractive) {
                            return false;
                        }
                    }
                    // Filter by command pattern
                    if (criteria.commandPattern) {
                        const regex = new RegExp(criteria.commandPattern, 'i');
                        const matchesCommand = regex.test(terminal.command);
                        const matchesChild = terminal.childProcesses.some(child => regex.test(child.command));
                        if (!matchesCommand && !matchesChild) {
                            return false;
                        }
                    }
                    return true;
                })
            };
            /**
             * Find all AI CLI terminals
             */
            async;
            findAiCliTerminals();
            Promise < TerminalInfo[] > {
                return: this.searchTerminals({
                    aiCliTypes: ['gemini', 'claude', 'openai', 'other']
                })
            };
            /**
             * Find terminals in specific working directory
             */
            async;
            findTerminalsInDirectory(directory, string);
            Promise < TerminalInfo[] > {
                return: this.searchTerminals({
                    workingDirectory: directory
                })
            };
            /**
             * Find VSCode terminals
             */
            async;
            findVSCodeTerminals();
            Promise < TerminalInfo[] > {
                return: this.searchTerminals({
                    terminalType: ['vscode']
                })
            };
            /**
             * Get detailed information about a specific terminal
             */
            async;
            getDetailedTerminalInfo(pid, number);
            Promise < TerminalInfo | null > {
                try: {
                    // Get basic process info
                    const: { stdout: psOutput } = await execAsync(ps - p, $, { pid } - o, pid, ppid, state, tty, command),
                    const: lines = psOutput.trim().split('\n'),
                    if(lines) { }, : .length < 2
                }
            };
            {
                return null;
            }
            const processLine = lines[1].trim();
            const processMatch = processLine.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.*)$/);
            if (!processMatch) {
                return null;
            }
            const [, pidStr, ppidStr, state, tty, command] = processMatch;
            // Get working directory
            const workingDirectory = await this.getProcessWorkingDirectory(pid);
            // Get child processes
            const childProcesses = await this.getChildProcesses(pid);
            // Determine terminal type
            const terminalType = this.determineTerminalType(command, ppidStr);
            // Determine AI CLI type
            const aiCliType = this.determineAiCliType(childProcesses, command);
            // Check if interactive
            const isInteractive = await this.isTerminalInteractive(pid, tty);
            // Get window/tab titles if possible
            const { windowTitle, tabTitle } = await this.getTerminalTitles(pid, terminalType);
            return {
                pid: parseInt(pidStr),
                ppid: parseInt(ppidStr),
                tty,
                command,
                state,
                workingDirectory,
                childProcesses,
                terminalType,
                aiCliType,
                isInteractive,
                windowTitle,
                tabTitle
            };
        }
        catch (error) {
            `
      this.logger.debug(Failed to get terminal info for PID ${pid}`;
            $;
            {
                error.message;
            }
            ;
            return null;
        }
    }
    /**
     * Focus a terminal window and prepare for input
     */
    async focusTerminal(pid) {
        try {
            const terminalInfo = await this.getDetailedTerminalInfo(pid);
            if (!terminalInfo) {
                return {} `
          success: false,`;
                pid,
                    message;
                Terminal;
                $;
                {
                    pid;
                }
                not;
                found,
                    inputFieldReady;
                false;
            }
            ;
        }
        finally {
        }
        let focusCommand;
        switch (terminalInfo.terminalType) {
            case 'vscode':
                `
          // Focus VSCode terminal using CLAUDE.md patterns`;
                focusCommand = `osascript -e 'tell application "Visual Studio Code" to activate' -e 'delay 1' -e 'tell application "System Events" to tell process "Code" to keystroke "p" using {command down, shift down}' -e 'delay 1' -e 'tell application "System Events" to keystroke "Terminal: Focus on Terminal View"' -e 'delay 0.5' -e 'tell application "System Events" to keystroke return';
          break;

        case 'iterm':
          focusCommand = osascript -e 'tell application "iTerm" to activate';
          break;

        case 'terminal':
          focusCommand = osascript -e 'tell application "Terminal" to activate';
          break;

        default:
          return {
            success: false,
            pid,
            message: Unsupported terminal type: ${terminalInfo.terminalType},
            inputFieldReady: false
          };
      }

      // Execute focus command
      await execAsync(focusCommand);

      // Wait for focus to settle
      await this.sleep(1000);

      // Verify input field is ready
      const inputFieldReady = await this.verifyInputFieldReady(terminalInfo);

      return {
        success: true,
        pid,
        message: Successfully focused terminal ${pid},
        inputFieldReady
      };

    } catch (error) {
      return {
        success: false,`;
                pid, `
        message: Failed to focus terminal: ${error.message}`,
                    inputFieldReady;
                false;
        }
        ;
    }
};
exports.TerminalDiscoveryService = TerminalDiscoveryService;
exports.TerminalDiscoveryService = TerminalDiscoveryService = TerminalDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)()
], TerminalDiscoveryService);
/**
 * Send input to a focused terminal
 */
async;
sendInputToTerminal(pid, number, input, string);
Promise < boolean > {
    try: {
        // Focus the terminal first
        const: focusResult = await this.focusTerminal(pid),
        if(, focusResult) { }, : .success || !focusResult.inputFieldReady
    }
};
{
    this.logger.warn(Terminal, $, { pid }, focus, failed, or, input, field, not, ready);
    return false;
}
`
      // Send the input using osascript`;
const sendCommand = `osascript -e 'delay 1' -e 'tell application "System Events" to keystroke "${input.replace(/"/g, '\\"')}"';

      await execAsync(sendCommand);

      this.logger.debug(Sent input to terminal ${pid}: ${input});
      return true;
`;
try { }
catch (error) {
    `
      this.logger.error(Failed to send input to terminal ${pid}`;
    $;
    {
        error.message;
    }
    ;
    return false;
}
/**
 * Private helper methods
 */ `
  private async getProcessWorkingDirectory(pid: number): Promise<string> {`;
try {
    const { stdout } = await execAsync(`lsof -p ${pid} | grep cwd | head -1 | awk '{print $9}');
      return stdout.trim() || '/';
    } catch (error) {
      return '/';
    }
  }

  private async getChildProcesses(pid: number): Promise<ProcessInfo[]> {`);
    try {
        `
      const { stdout } = await execAsync(pgrep -P ${pid} || echo ""`;
        ;
        const childPids = stdout.trim().split('\n').filter(p => p && p !== '').map(p => parseInt(p));
        const children = [];
        for (const childPid of childPids) {
            try {
                const { stdout: psOutput } = await execAsync(ps - p, $, { childPid } - o, pid, state, command);
                const lines = psOutput.trim().split('\n');
                if (lines.length >= 2) {
                    const processLine = lines[1].trim();
                    const processMatch = processLine.match(/^\s*(\d+)\s+(\S+)\s+(.*)$/);
                    if (processMatch) {
                        const [, pidStr, state, command] = processMatch;
                        children.push({
                            pid: parseInt(pidStr),
                            command,
                            state,
                            isAiCli: this.isAiCliCommand(command),
                            cliType: this.getAiCliType(command)
                        });
                    }
                }
            }
            catch (error) {
                // Continue with other child processes
            }
        }
        return children;
    }
    catch (error) {
        return [];
    }
}
finally {
}
determineTerminalType(command, string, ppid, string);
'vscode' | 'iterm' | 'terminal' | 'other';
{
    if (command.includes('Code') || command.includes('code')) {
        return 'vscode';
    }
    if (command.includes('iTerm')) {
        return 'iterm';
    }
    if (command.includes('Terminal')) {
        return 'terminal';
    }
    return 'other';
}
determineAiCliType(childProcesses, ProcessInfo[], command, string);
'gemini' | 'claude' | 'openai' | 'other' | undefined;
{
    // Check child processes for AI CLI
    for (const child of childProcesses) {
        const cliType = this.getAiCliType(child.command);
        if (cliType) {
            return cliType;
        }
    }
    // Check main command
    const cliType = this.getAiCliType(command);
    return cliType;
}
isAiCliCommand(command, string);
boolean;
{
    const aiCliPatterns = [
        'gemini',
        'claude',
        'openai',
        'chatgpt',
        'gpt',
        'ai',
        'anthropic'
    ];
    return aiCliPatterns.some(pattern => command.toLowerCase().includes(pattern));
}
getAiCliType(command, string);
string | undefined;
{
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('gemini'))
        return 'gemini';
    if (lowerCommand.includes('claude'))
        return 'claude';
    if (lowerCommand.includes('openai') || lowerCommand.includes('chatgpt') || lowerCommand.includes('gpt'))
        return 'openai';
    if (this.isAiCliCommand(command))
        return 'other';
    return undefined;
}
async;
isTerminalInteractive(pid, number, tty, string);
Promise < boolean > {
    try: {
        // Check if the terminal has a valid TTY
        if(tty) { }
    } === '??' || tty === '-'
};
{
    return false;
}
`
      // Check if the process is in foreground`;
const { stdout } = await execAsync(ps - p, $, { pid } - o, stat | tail - 1 `);
      const stat = stdout.trim();

      // Interactive processes typically have 'S' (sleeping) or 'R' (running) status
      // and are not in background (no '+' suffix)
      return stat.includes('S') || stat.includes('R');
    } catch (error) {
      return false;
    }
  }

  private async getTerminalTitles(pid: number, terminalType: string): Promise<{ windowTitle?: string; tabTitle?: string }> {
    try {
      if (terminalType === 'vscode') {
        // VSCode terminal titles are harder to get, return basic info
        return {
          windowTitle: 'Visual Studio Code',
          tabTitle: 'Terminal'
        };
      } else if (terminalType === 'iterm') {
        // For iTerm, we could potentially get more info via AppleScript
        return {
          windowTitle: 'iTerm',
          tabTitle: 'Shell'
        };
      } else if (terminalType === 'terminal') {
        return {
          windowTitle: 'Terminal',
          tabTitle: 'Shell'
        };
      }

      return {};
    } catch (error) {
      return {};
    }
  }

  private isValidTerminal(terminal: TerminalInfo): boolean {
    // Basic validation to ensure we have a valid terminal
    return terminal.pid > 0 &&
           terminal.command.length > 0 &&
           terminal.terminalType !== 'other';
  }

  private removeDuplicateTerminals(terminals: TerminalInfo[]): TerminalInfo[] {
    const seen = new Set<number>();
    return terminals.filter(terminal => {
      if (seen.has(terminal.pid)) {
        return false;
      }
      seen.add(terminal.pid);
      return true;
    });
  }

  private async verifyInputFieldReady(terminalInfo: TerminalInfo): Promise<boolean> {
    try {
      // For now, assume input field is ready after successful focus
      // In a production environment, this could involve more sophisticated checks
      await this.sleep(500); // Small delay to ensure input field is ready
      return true;
    } catch (error) {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});
//# sourceMappingURL=terminal-discovery.service.js.map