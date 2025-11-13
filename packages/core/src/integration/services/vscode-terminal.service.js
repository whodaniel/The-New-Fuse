"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VSCodeTerminalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeTerminalService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
let VSCodeTerminalService = VSCodeTerminalService_1 = class VSCodeTerminalService {
    logger = new common_1.Logger(VSCodeTerminalService_1.name);
    activeSessions = new Map();
    terminalPids = new Map();
    constructor() {
        this.logger.log('VSCodeTerminalService initialized');
        this.setupCleanupInterval();
    }
    /**
     * Create a new VSCode terminal with focus
     */
    async createTerminalWithFocus() {
        const sessionId = `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)};

    try {
      // Step 1: Activate VSCode and open terminal
      const createTerminalScript = 
        tell application "Visual Studio Code" to activate
        delay 1
        tell application "System Events" to tell process "Code"
          keystroke "p" using {command down, shift down}
        end tell
        delay 1
        tell application "System Events"
          keystroke "Terminal: Create New Terminal"
          delay 0.5
          keystroke return
        end tell` `;

      await this.executeAppleScript(createTerminalScript);

      // Wait for terminal to be created
      await this.delay(2000);

      // Focus on the terminal
      const focusScript = 
        tell application "Visual Studio Code" to activate
        delay 1
        tell application "System Events" to tell process "Code"
          keystroke "p" using {command down, shift down}
        end tell
        delay 1
        tell application "System Events"
          keystroke "Terminal: Focus on Terminal View"
          delay 0.5
          keystroke return
        end tell
      ;

      await this.executeAppleScript(focusScript);

      // Track session
      const session: TerminalSession = {
        id: sessionId,
        command: 'create_terminal',
        status: 'active',
        startTime: new Date(),
        output: 'Terminal created and focused',
        errorOutput: ''
      };

      this.activeSessions.set(sessionId, session);

      this.logger.log(Created VSCode terminal session: ${sessionId}`;
        return sessionId;
    }
    catch(error) {
        this.logger.error(Failed, to, create, VSCode, terminal, $, { error });
        throw error;
    }
};
exports.VSCodeTerminalService = VSCodeTerminalService;
exports.VSCodeTerminalService = VSCodeTerminalService = VSCodeTerminalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], VSCodeTerminalService);
/**
 * Launch Gemini CLI in the focused terminal
 */
async;
launchGeminiCLI(sessionId, string);
Promise < void  > {
    try: {
        const: session = this.activeSessions.get(sessionId),
        if(, session) {
            `
        throw new Error(`;
            Terminal;
            session;
            not;
            found: $;
            {
                sessionId;
            }
            ;
        }
        // Ensure terminal is focused first
        ,
        // Ensure terminal is focused first
        await, this: .focusTerminal()
    } `
`
    // Launch Gemini CLI
    ,
    // Launch Gemini CLI
    const: geminiScript =
        delay, 2: tell, application, "System Events": keystroke, "gemini": delay, 0.5: keystroke, return: end, tell
} `;

      await this.executeAppleScript(geminiScript);

      // Wait for Gemini to initialize
      await this.delay(5000);

      session.output += '\nGemini CLI launched';
      session.command += ' -> gemini_launched';

      this.logger.log(Launched Gemini CLI in session: ${sessionId});` `
    } catch (error) {
      this.logger.error(Failed to launch Gemini CLI: ${error});
      throw error;
    }
  }

  /**
   * Send task to Gemini CLI with proper focus handling
   */
  async sendTaskToGemini(sessionId: string, taskMessage: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);`;
if (!session) {
    `
        throw new Error(Terminal session not found: ${sessionId}`;
    ;
}
// Ensure terminal is properly focused
await this.focusTerminal();
// Send the task message
const taskScript = delay;
1;
tell;
application;
"System Events";
keystroke;
"${this.escapeForAppleScript(taskMessage)}";
delay;
0.5;
keystroke;
return;
end;
tell;
await this.executeAppleScript(taskScript);
session.output += ;
nTask;
sent: $;
{
    taskMessage;
}
;
`
      session.command += ' -> task_sent';` `
      this.logger.log(Sent task to Gemini in session: ${sessionId});
`;
try { }
catch (error) {
    `
      this.logger.error(Failed to send task to Gemini: ${error}`;
    ;
    throw error;
}
/**
 * Monitor Gemini response for errors and handle recovery
 */
async;
monitorGeminiResponse(sessionId, string, timeout, number = 10000);
Promise < string > {
    try: {
        const: session = this.activeSessions.get(sessionId),
        if(, session) {
            throw new Error(Terminal, session, not, found, $, { sessionId });
        }
        // Wait for Gemini to process
        ,
        // Wait for Gemini to process
        await, this: .delay(3000),
        // Check for common error patterns
        const: errorPatterns = [
            'quota exceeded',
            'switching from gemini-2.5-pro to gemini-2.5-flash',
            'Please submit a new query to continue with the Flash model',
            'Connection error',
            'Model unavailable',
            'API limit reached'
        ],
        // For now, simulate monitoring (in production, would read terminal output)
        const: simulatedResponse = 'Task processed successfully',
        session, : .output += , nResponse, monitored: $
    }
};
{
    simulatedResponse;
}
;
`
`;
this.logger.log(Monitored, Gemini, response in session, $, { sessionId } `);
      return simulatedResponse;

    } catch (error) {
      this.logger.error(Failed to monitor Gemini response: ${error});
      throw error;
    }
  }

  /**
   * Handle Gemini error recovery and resubmission
   */
  async handleGeminiErrorRecovery(sessionId: string, originalTask: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(Terminal session not found: ${sessionId});
      }

      const recoveryMessage = RESUBMITTING TASK for Flash model:

${originalTask}

Please proceed with this analysis using Gemini Flash 2.5.;

      // Wait for error state to settle
      await this.delay(1000);

      // Resubmit with Flash model awareness`, await this.sendTaskToGemini(sessionId, recoveryMessage));
`
`;
session.output += ;
nError;
recovery;
performed;
for (; ; )
    : $;
{
    originalTask;
}
;
session.command += ' -> error_recovery';
`
`;
this.logger.log(Performed, error, recovery in session, $, { sessionId } `);

    } catch (error) {
      this.logger.error(Failed to handle error recovery: ${error});
      throw error;
    }
  }

  /**
   * Track terminal PID for coordination
   */
  async trackTerminalPID(sessionId: string): Promise<number | null> {
    try {
      // Get the PID of the most recent terminal process
      const getPidScript = 
        tell application "System Events"
          get unix id of first process whose name is "Kiro"
        end tell
      ;

      const pidResult = await this.executeAppleScript(getPidScript);
      const pid = parseInt(pidResult.trim());

      if (pid && !isNaN(pid)) {
        this.terminalPids.set(sessionId, pid);

        const session = this.activeSessions.get(sessionId);
        if (session) {
          session.pid = pid;
        }
`, this.logger.log(Tracked, terminal, PID, $, { pid }));
for (session; ; )
    : $;
{
    sessionId;
}
`);
        return pid;
      }

      return null;

    } catch (error) {
      this.logger.error(Failed to track terminal PID: ${error});
      return null;
    }
  }

  /**
   * Focus terminal using PID verification
   */
  async focusTerminalByPID(sessionId: string): Promise<boolean> {
    try {`;
const pid = this.terminalPids.get(sessionId);
`
      if (!pid) {
        this.logger.warn(No PID found for session: ${sessionId}`;
;
return false;
const focusByPidScript = tell, application;
"System Events";
set;
frontmost;
of;
first;
process;
whose;
unix;
id;
is;
$;
{
    pid;
}
to;
true;
end;
tell;
`
      await this.executeAppleScript(focusByPidScript);`;
this.logger.log(Focused, terminal, by, PID, $, { pid } ` for session: ${sessionId});
      return true;` `
    } catch (error) {
      this.logger.error(Failed to focus terminal by PID: ${error}`);
return false;
/**
 * Execute coordinated multi-terminal workflow
 */
async;
executeMultiTerminalWorkflow(tasks, string[]);
Promise < string[] > {
    const: sessionIds, string, []:  = [],
    const: results, string, []:  = [],
    try: {
        // Create terminals for each task
        for(let, i = 0, i, , tasks) { }, : .length, i
    }++
};
{
    const sessionId = await this.createTerminalWithFocus();
    sessionIds.push(sessionId);
    // Launch Gemini in each terminal
    await this.launchGeminiCLI(sessionId);
    // Track PID for coordination
    await this.trackTerminalPID(sessionId);
    // Small delay between terminal creation
    await this.delay(1000);
}
// Send tasks to each terminal
for (let i = 0; i < tasks.length; i++) {
    const sessionId = sessionIds[i];
    const task = tasks[i];
    // Focus specific terminal
    await this.focusTerminalByPID(sessionId);
    // Send task
    await this.sendTaskToGemini(sessionId, task);
    // Monitor response
    const response = await this.monitorGeminiResponse(sessionId);
    results.push(response);
    // Brief delay between task sending
    await this.delay(500);
}
this.logger.log(Executed, multi - terminal, workflow);
with ($) {
    tasks.length;
}
tasks;
;
return results;
`
`;
try { }
catch (error) {
    this.logger.error(Multi - terminal, workflow, failed, $, { error } `);
      throw error;
    }
  }

  /**
   * Get session status
   */
  getSession(sessionId: string): TerminalSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TerminalSession[] {
    return Array.from(this.activeSessions.values()).filter(session => session.status === 'active');
  }

  /**
   * Close terminal session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return false;
      }

      // Update session status
      session.status = 'completed';
      session.endTime = new Date();

      // Remove from active tracking
      this.terminalPids.delete(sessionId);

      this.logger.log(Closed terminal session: ${sessionId});
      return true;` `
    } catch (error) {
      this.logger.error(Failed to close session: ${error}`);
    return false;
}
async;
executeAppleScript(script, string);
Promise < string > {
    return: new Promise((resolve, reject) => {
        const process = (0, child_process_1.spawn)('osascript', ['-e', script]);
        let output = '';
        let errorOutput = '';
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            }
            else {
                reject(new Error(AppleScript, failed));
                with (code)
                    $;
                {
                    code;
                }
                $;
                {
                    errorOutput;
                }
                `));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private escapeForAppleScript(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  private async focusTerminal(): Promise<void> {
    const focusScript = 
      tell application "Visual Studio Code" to activate
      delay 1
      tell application "System Events" to tell process "Code"
        keystroke "p" using {command down, shift down}
      end tell
      delay 1
      tell application "System Events"
        keystroke "Terminal: Focus on Terminal View"
        delay 0.5
        keystroke return
      end tell
    `;
                await this.executeAppleScript(focusScript);
            }
        }, private, delay(ms, number), Promise < void  > {
            return: new Promise(resolve => setTimeout(resolve, ms))
        }, private, setupCleanupInterval(), void {
            // Clean up completed sessions every 5 minutes
            setInterval() { }
        }(), {
            const: cutoffTime = Date.now() - (5 * 60 * 1000), // 5 minutes ago
            for(, [sessionId, session], of, Array) { }, : .from(this.activeSessions.entries())
        });
        {
            if (session.status !== 'active' && session.startTime.getTime() < cutoffTime) {
                this.activeSessions.delete(sessionId);
                this.terminalPids.delete(sessionId);
            }
        }
    }, 300000)
};
//# sourceMappingURL=vscode-terminal.service.js.map