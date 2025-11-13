"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SecureSubprocessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureSubprocessService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let SecureSubprocessService = SecureSubprocessService_1 = class SecureSubprocessService {
    logger = new common_1.Logger(SecureSubprocessService_1.name);
    activeProcesses = new Map();
    executionHistory = [];
    MAX_HISTORY_SIZE = 1000;
    // Security configurations
    DANGEROUS_COMMANDS = [
        'rm', 'del', 'format', 'mkfs', 'dd', 'fdisk',
        'sudo', 'su', 'passwd', 'useradd', 'userdel',
        'chmod', 'chown', 'chgrp', 'setuid', 'setgid',
        'kill', 'killall', 'pkill', 'reboot', 'shutdown',
        'eval', 'exec', 'source', '.', 'bash', 'sh',
        'python', 'node', 'ruby', 'perl', 'php',
        'wget', 'curl', 'ftp', 'sftp', 'scp', 'rsync',
        'mount', 'umount', 'fdisk', 'parted'
    ];
    ALLOWED_SAFE_COMMANDS = [
        'ls', 'dir', 'pwd', 'whoami', 'id', 'date',
        'echo', 'cat', 'head', 'tail', 'grep', 'find',
        'wc', 'sort', 'uniq', 'cut', 'awk', 'sed',
        'git', 'npm', 'pnpm', 'bun', 'pnpm',
        'tsc', 'eslint', 'prettier', 'jest', 'test',
        'docker', 'kubectl', 'helm'
    ];
    constructor() {
        this.logger.log('SecureSubprocessService initialized');
        this.setupCleanupInterval();
    }
    /**
     * Execute command with comprehensive security checks
     */
    async executeSecure(command, args = [], options = {}) {
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)};

    try {
      // Security validation
      await this.validateCommand(command, args, options);

      // Sanitize environment
      const sanitizedEnv = this.sanitizeEnvironment(options.env);

      // Prepare secure execution options
      const spawnOptions: SpawnOptions = {
        cwd: this.sanitizePath(options.cwd),
        env: { ...process.env, ...sanitizedEnv },
        timeout: Math.min(options.timeout || 30000, 300000), // Max 5 minutes
        shell: false, // NEVER use shell for security
        stdio: ['ignore', 'pipe', 'pipe'],
        killSignal: options.killSignal || 'SIGTERM',
        windowsVerbatimArguments: false
      };

      const maxBufferSize = Math.min(options.maxBuffer || 1024 * 1024, 10 * 1024 * 1024); // Max 10MB

      // Add user/group restrictions if provided
      if (options.uid !== undefined) {
        spawnOptions.uid = options.uid;
      }
      if (options.gid !== undefined) {
        spawnOptions.gid = options.gid;
      }

      const result: ExecutionResult = {
        id: executionId,
        command,
        args: [...args],
        exitCode: null,
        signal: null,
        stdout: '',
        stderr: '',
        startTime: new Date(),
        timedOut: false
      };
`;
        this.logger.log(Starting, secure, execution, $, { command } ` ${args.join(' ')}`);
        // Execute with proper argument passing (no shell concatenation)
        const childProcess = (0, child_process_1.spawn)(command, args, spawnOptions);
        // Track active process
        const processInfo = {
            id: executionId,
            pid: childProcess.pid,
            command,
            args: [...args],
            status: 'running',
            startTime: new Date(),
            process: childProcess
        };
        this.activeProcesses.set(executionId, processInfo);
        // Handle process completion
        const executionPromise = new Promise((resolve, reject) => {
            let stdoutData = '';
            let stderrData = '';
            let timeoutHandle = null;
            // Set up timeout
            if (spawnOptions.timeout) {
                timeoutHandle = setTimeout(() => {
                    result.timedOut = true;
                    processInfo.status = 'timeout';
                    childProcess.kill(options.killSignal || 'SIGTERM');
                }, spawnOptions.timeout);
            }
            // Collect output
            if (childProcess.stdout) {
                childProcess.stdout.on('data', (data) => {
                    stdoutData += data.toString();
                    if (stdoutData.length > maxBufferSize) {
                        childProcess.kill('SIGTERM');
                        reject(new Error('Output buffer exceeded'));
                    }
                });
            }
            if (childProcess.stderr) {
                childProcess.stderr.on('data', (data) => {
                    stderrData += data.toString();
                    if (stderrData.length > maxBufferSize) {
                        childProcess.kill('SIGTERM');
                        reject(new Error('Error buffer exceeded'));
                    }
                });
            }
            childProcess.on('exit', (code, signal) => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                result.exitCode = code;
                result.signal = signal;
                result.endTime = new Date();
                result.duration = result.endTime.getTime() - result.startTime.getTime();
                // Sanitize output if requested
                result.stdout = options.sanitizeOutput ? this.sanitizeOutput(stdoutData) : stdoutData;
                result.stderr = options.sanitizeOutput ? this.sanitizeOutput(stderrData) : stderrData;
                // Update process status
                processInfo.status = code === 0 ? 'completed' : 'failed';
                if (result.timedOut) {
                    processInfo.status = 'timeout';
                }
                // Clean up active process tracking
                this.activeProcesses.delete(executionId);
                // Store in execution history
                this.addToHistory(result);
                this.logger.log(Execution, completed, $, { executionId }(exit, code, $, { code }));
                resolve(result);
            });
            childProcess.on('error', (error) => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                processInfo.status = 'failed';
                this.activeProcesses.delete(executionId);
                result.exitCode = -1;
                result.endTime = new Date();
                result.duration = result.endTime.getTime() - result.startTime.getTime();
                result.stderr = error.message;
                this.addToHistory(result);
                `
          this.logger.error(`;
                Execution;
                error: $;
                {
                    executionId;
                }
                error;
            });
            reject(error);
        });
    }
    ;
};
exports.SecureSubprocessService = SecureSubprocessService;
exports.SecureSubprocessService = SecureSubprocessService = SecureSubprocessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SecureSubprocessService);
return await executionPromise;
`
`;
try { }
catch (error) {
    this.logger.error(Secure, execution, failed, $, { executionId } `, error);

      const errorResult: ExecutionResult = {
        id: executionId,
        command,
        args: [...args],
        exitCode: -1,
        signal: null,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        timedOut: false,
        securityViolation: error instanceof Error ? error.message : String(error)
      };

      this.addToHistory(errorResult);
      throw error;
    }
  }

  /**
   * Execute Git command with transaction logging
   */
  async executeGitCommand(
    gitArgs: string[],
    options: SecureExecutionOptions = {}
  ): Promise<ExecutionResult> {
    // Validate Git arguments for safety
    const safeGitCommands = ['status', 'log', 'diff', 'add', 'commit', 'push', 'pull', 'checkout', 'branch', 'tag'];

    if (gitArgs.length === 0 || !safeGitCommands.includes(gitArgs[0])) {
      throw new Error(Unsafe or missing Git command: ${gitArgs[0] || 'none'}`);
}
// Add Git-specific security options
const gitOptions = {
    ...options,
    allowedCommands: ['git'],
    sanitizeOutput: false, // Git output should be preserved
    timeout: options.timeout || 60000 // 1 minute default for Git
};
return this.executeSecure('git', gitArgs, gitOptions);
/**
 * Execute Node.js/npm commands safely
 */
async;
executeNodeCommand(nodeCommand, 'node' | 'npm' | 'pnpm' | 'bun' | 'pnpm', args, string[], options, SecureExecutionOptions = {});
Promise < ExecutionResult > {
    // Validate Node command arguments
    const: safeNodeCommands = {
        npm: ['install', 'run', 'test', 'build', 'start', 'version', 'list'],
        pnpm: ['install', 'run', 'test', 'build', 'start', 'version', 'list'],
        bun: ['install', 'run', 'test', 'build', 'start', 'x'],
        pnpm: ['install', 'run', 'test', 'build', 'start'],
        node: ['--version', '-v', '--help']
    },
    const: allowedSubCommands = safeNodeCommands[nodeCommand],
    if(args) { }, : .length === 0 || (allowedSubCommands && !allowedSubCommands.includes(args[0]))
};
{
    throw new Error(Unsafe, Node, command, $, { nodeCommand }, $, { args, [0]:  || 'none' });
}
const nodeOptions = {
    ...options,
    timeout: options.timeout || 120000, // 2 minutes for Node commands
    allowedCommands: [nodeCommand]
};
return this.executeSecure(nodeCommand, args, nodeOptions);
/**
 * Kill active process by ID
 */
async;
killProcess(executionId, string, signal, NodeJS.Signals = 'SIGTERM');
Promise < boolean > {
    const: processInfo = this.activeProcesses.get(executionId),
    if(, processInfo) { }
} || !processInfo.process;
{
    return false;
}
try {
    processInfo.status = 'killed';
    const killed = processInfo.process.kill(signal);
    `
      if (killed) {`;
    this.logger.log(Process, killed, $, { executionId } ` with signal ${signal});
      }

      return killed;
    } catch (error) {`, this.logger.error(Failed, to, kill, process, $, { executionId } `, error);
      return false;
    }
  }

  /**
   * Get active processes
   */
  getActiveProcesses(): ProcessInfo[] {
    return Array.from(this.activeProcesses.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 50): ExecutionResult[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get process by ID
   */
  getProcess(executionId: string): ProcessInfo | null {
    return this.activeProcesses.get(executionId) || null;
  }

  /**
   * Validate command and arguments for security
   */
  private async validateCommand(
    command: string,
    args: string[],
    options: SecureExecutionOptions
  ): Promise<void> {
    // Check if command is in explicit allow list
    if (options.allowedCommands && !options.allowedCommands.includes(command)) {
      throw new Error(Command not in allowed list: ${command}`));
}
// Check if command is explicitly blocked
finally {
}
// Check if command is explicitly blocked
if (options.blockedCommands && options.blockedCommands.includes(command)) {
    throw new Error(Command, explicitly, blocked, $, { command });
}
// Check against dangerous commands (unless explicitly allowed)
if (!options.allowedCommands && this.DANGEROUS_COMMANDS.includes(command)) {
    `
      throw new Error(Dangerous command blocked: ${command}` `);
    }

    // Validate command path (no relative paths to dangerous locations)
    if (command.includes('..') || command.includes('/')) {
      const resolvedPath = path.resolve(command);
      const dangerousPaths = ['/bin', '/sbin', '/usr/bin', '/usr/sbin'];

      if (dangerousPaths.some(dp => resolvedPath.startsWith(dp)) &&
          !this.ALLOWED_SAFE_COMMANDS.includes(path.basename(command))) {
        throw new Error(Dangerous command path: ${resolvedPath});
      }
    }

    // Validate arguments for injection attempts
    for (const arg of args) {
      if (this.containsInjectionAttempt(arg)) {`;
    throw new Error(`Potential injection attempt detected in argument: ${arg});
      }
    }

    // Validate working directory`);
    if (options.cwd) {
        `
      const resolvedCwd = path.resolve(options.cwd);
      if (!this.isValidWorkingDirectory(resolvedCwd)) {
        throw new Error(Invalid working directory: ${resolvedCwd}`;
        ;
    }
}
containsInjectionAttempt(arg, string);
boolean;
{
    const injectionPatterns = [
        /[;&|$(){}[\]]/, // Shell metacharacters
        /\$\(/, // Command substitution
        /`[^]*/, // Backtick execution
        /\|\s*\w/, // Piping to commands
        />\s*\/etc/, // Redirecting to system files
        /rm\s+-rf/, // Dangerous rm commands
        /chmod\s+777/, // Dangerous permissions
        /wget|curl.*http/ // Network downloads
    ];
    return injectionPatterns.some(pattern => pattern.test(arg));
}
sanitizePath(cwd ?  : string);
string | undefined;
{
    if (!cwd)
        return undefined;
    const resolved = path.resolve(cwd);
    // Block access to sensitive system directories
    const blockedPaths = ['/etc', '/var', '/usr', '/bin', '/sbin', '/root'];
    if (blockedPaths.some(blocked => resolved.startsWith(blocked))) {
        throw new Error(Access, to, system, directory, blocked, $, { resolved });
    }
    return resolved;
}
isValidWorkingDirectory(dir, string);
boolean;
{
    try {
        const stats = fs.statSync(dir);
        return stats.isDirectory();
    }
    catch {
        return false;
    }
}
sanitizeEnvironment(env ?  : Record);
Record < string, string > {
    if(, env) { }, return: {},
    const: sanitized
};
{ }
;
const dangerousEnvVars = ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'PATH'];
for (const [key, value] of Object.entries(env)) {
    // Skip dangerous environment variables
    if (dangerousEnvVars.includes(key)) {
        `
        this.logger.warn(Dangerous environment variable blocked: ${key}`;
        ;
        continue;
    }
    // Sanitize value
    if (typeof value === 'string' && value.length < 1000) {
        sanitized[key] = value.replace(/[;&|$()]/g, '');
    }
}
return sanitized;
sanitizeOutput(output, string);
string;
{
    // Remove potential secrets, API keys, passwords
    const secretPatterns = [
        /api[_-]?key[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
        /password[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
        /token[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
        /secret[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
        /sk-[a-zA-Z0-9]{32,}/g, // OpenAI API keys
        /ghp_[a-zA-Z0-9]{36}/g, // GitHub tokens
    ];
    let sanitized = output;
    for (const pattern of secretPatterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
}
addToHistory(result, ExecutionResult);
void {
    this: .executionHistory.push(result),
    : .executionHistory.length > this.MAX_HISTORY_SIZE
};
{
    this.executionHistory = this.executionHistory.slice(-this.MAX_HISTORY_SIZE);
}
setupCleanupInterval();
void {
    setInterval() { }
}();
{
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    for (const [id, processInfo] of Array.from(this.activeProcesses.entries())) {
        if (now - processInfo.startTime.getTime() > maxAge) {
            this.logger.warn(Cleaning, up, abandoned, process, $, { id } ``);
            if (processInfo.process && !processInfo.process.killed) {
                processInfo.process.kill('SIGTERM');
            }
            this.activeProcesses.delete(id);
        }
    }
}
60000;
; // Run every minute
//# sourceMappingURL=secure-subprocess.service.js.map