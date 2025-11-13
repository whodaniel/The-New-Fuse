"use strict";
/**
 * Jules CLI Service
 *
 * Service for integrating Google's Jules AI coding agent CLI into The New Fuse Framework.
 * Provides programmatic access to Jules CLI commands for task delegation, session management,
 * and asynchronous coding operations.
 *
 * @module JulesCLIService
 * @since 2025-10-05
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JulesCLIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JulesCLIService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const event_emitter_1 = require("@nestjs/event-emitter");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let JulesCLIService = JulesCLIService_1 = class JulesCLIService {
    eventEmitter;
    logger = new common_1.Logger(JulesCLIService_1.name);
    isAuthenticated = false;
    config;
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.config = {
            theme: process.env.JULES_CLI_THEME || 'dark',
            autoLogin: process.env.JULES_CLI_AUTO_LOGIN === 'true' || true,
            defaultRepo: process.env.JULES_CLI_DEFAULT_REPO || '.',
        };
    }
    /**
     * Initialize Jules CLI service
     */
    async initialize() {
        this.logger.log('Initializing Jules CLI service...');
        try {
            // Check if Jules CLI is installed
            await this.checkInstallation();
            // Auto-login if configured
            if (this.config.autoLogin) {
                await this.ensureAuthenticated();
            }
            this.logger.log('Jules CLI service initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize Jules CLI service: ${error instanceof Error ? error.message : String(error)});
      throw error;
    }
  }

  /**
   * Check if Jules CLI is installed
   */
  async checkInstallation(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('jules version');`, this.logger.log(`Jules CLI installed: ${stdout.trim()}`));
            return true;
        }
        try { }
        catch (error) {
            throw new Error('Jules CLI is not installed. Install with: pnpm install -g @google/jules');
        }
    }
    /**
     * Get Jules CLI version
     */
    async getVersion() {
        try {
            const { stdout } = await execAsync('jules version');
            const match = stdout.match(/Version:\s*v?([\d.]+)/);
            return match ? match[1] : stdout.trim();
        }
        catch (error) {
            throw new Error(Failed, to, get, Jules, version, $, { error, instanceof: Error ? error.message : String(error) });
        }
    }
    /**
     * Login to Jules with Google account
     */
    async login() {
        this.logger.log('Logging into Jules...');
        return new Promise((resolve, reject) => {
            const loginProcess = (0, child_process_1.spawn)('jules', ['login'], {
                stdio: 'inherit', // Allow interactive login in terminal
            });
            loginProcess.on('close', (code) => {
                if (code === 0) {
                    this.isAuthenticated = true;
                    this.logger.log('Successfully logged into Jules');
                    this.eventEmitter.emit('jules.authenticated', { timestamp: new Date() });
                    resolve();
                }
                else {
                    `
          reject(new Error(Jules login failed with exit code ${code}`;
                }
            });
        });
    }
};
exports.JulesCLIService = JulesCLIService;
exports.JulesCLIService = JulesCLIService = JulesCLIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], JulesCLIService);
;
loginProcess.on('error', (error) => {
    reject(new Error(Jules, login, error, $, { error, : .message }));
});
;
/**
 * Logout from Jules
 */
async;
logout();
Promise < void  > {
    this: .logger.log('Logging out from Jules...'),
    try: {
        await,
        this: .isAuthenticated = false,
        this: .logger.log('Successfully logged out from Jules')
    } `
      this.eventEmitter.emit('jules.deauthenticated', { timestamp: new Date() });`
};
try { }
catch (error) {
    throw new Error(Jules, logout, failed, $, { error, instanceof: Error ? error.message : String(error) } `);
    }
  }

  /**
   * Ensure user is authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated) {
      // Check if already authenticated by trying to list repos
      try {
        await this.listRepositories();
        this.isAuthenticated = true;
      } catch {
        // Not authenticated, need to login
        this.logger.warn('Jules CLI not authenticated. Please run: jules login');
        throw new Error('Jules CLI authentication required. Run: jules login');
      }
    }
  }

  /**
   * List connected repositories
   */
  async listRepositories(): Promise<JulesRepository[]> {
    try {
      const { stdout } = await execAsync('jules remote list --repo');

      // Parse the output to extract repository information
      const lines = stdout.trim().split('\n').filter(line => line.trim());

      return lines.map(line => ({
        name: line.split('/').pop() || line,
        fullName: line,
        connected: true,
        lastUsed: new Date(), // Would need to parse from actual output
      }));
    } catch (error) {
      throw new Error(Failed to list repositories: ${error instanceof Error ? error.message : String(error)});
    }
  }

  /**
   * List remote sessions
   */
  async listSessions(): Promise<JulesSession[]> {
    try {
      const { stdout } = await execAsync('jules remote list --session');

      // Parse the output to extract session information
      const lines = stdout.trim().split('\n').filter(line => line.trim());

      return lines.map(line => {
        // Parse session details from output
        // Format will depend on actual CLI output
        return {
          id: line.match(/\d+/)?.[0] || 'unknown',
          repo: 'unknown',
          prompt: line,
          status: 'running' as const,
          createdAt: new Date(),
        };`);
}
;
`
    } catch (error) {
      throw new Error(Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`;
;
/**
 * Create a new remote session
 */
async;
createRemoteSession(options, JulesRemoteNewOptions);
Promise < string > {
    await, this: .ensureAuthenticated(),
    this: .logger.log(Creating, remote, session, $, { options, : .session })
} `
    try {`;
const theme = options.theme || this.config.theme;
const command = jules, remote;
new --;
repo;
"${options.repo}`"--;
session;
"${options.session}"--;
theme;
$;
{
    theme;
}
;
const { stdout } = await execAsync(command);
// Extract session ID from output`
const sessionIdMatch = stdout.match(/Session\s+ID:\s*(\d+)/i) || stdout.match(/\d+/);
`
      const sessionId = sessionIdMatch ? sessionIdMatch[1] : 'unknown';

      this.logger.log(`;
Created;
remote;
session: $;
{
    sessionId;
}
;
this.eventEmitter.emit('jules.session.created', {
    sessionId,
    repo: options.repo,
    prompt: options.session,
    timestamp: new Date(),
});
`
      return sessionId;`;
try { }
catch (error) {
    throw new Error(Failed, to, create, remote, session, $, { error, instanceof: Error ? error.message : String(error) });
}
/**
 * Pull results from a completed session
 */
async;
pullSession(options, JulesRemotePullOptions);
Promise < string > {
    await, this: .ensureAuthenticated()
} `
`;
this.logger.log(`Pulling session: ${options.sessionId});
`);
try {
    `
      const command = jules remote pull --session ${options.sessionId}`;
    const { stdout } = await execAsync(command, {
        cwd: options.outputDir,
    });
    this.logger.log(Successfully, pulled, session, $, { options, : .sessionId });
    this.eventEmitter.emit('jules.session.pulled', {
        sessionId: options.sessionId,
        timestamp: new Date(),
    });
    return stdout;
    `
    } catch (error) {`;
    throw new Error(Failed, to, pull, session, $, { error, instanceof: Error ? error.message : String(error) });
}
finally {
}
/**
 * Create multiple sessions from a list of tasks
 */
async;
createBatchSessions(repo, string, tasks, string[]);
Promise < string[] > {
    await, this: .ensureAuthenticated()
} `
`;
this.logger.log(Creating, $, { tasks, : .length }, batch, sessions);
for ($; { repo };)
    ;
const sessionIds = [];
for (const task of tasks) {
    try {
        const sessionId = await this.createRemoteSession({
            repo,
            session: task,
        } `
        });`, sessionIds.push(sessionId));
        `
      } catch (error) {
        this.logger.error(Failed to create session for task "${task}": ${error instanceof Error ? error.message : String(error)});`;
    }
    finally { }
    `
    }`;
    this.logger.log(Created, $, { sessionIds, : .length }, batch, sessions);
    return sessionIds;
}
/**
 * Create session from GitHub issue
 */
async;
createSessionFromIssue(repo, string, issueNumber, number);
Promise < string > {
    await, this: .ensureAuthenticated()
} `
    this.logger.log(Creating session from GitHub issue #${issueNumber}`;
;
try {
    // Get issue details using GitHub CLI
    const { stdout } = await execAsync(gh, issue, view, $, { issueNumber }--, json, title, body);
    `
      const issue = JSON.parse(stdout);`;
    const prompt = Fix, GitHub, issue, #$, { issueNumber };
    `: ${issue.title}\n\n${issue.body};

      return await this.createRemoteSession({
        repo,`;
    session: prompt, `
      });
    } catch (error) {`;
    throw new Error(Failed, to, create, session, from, issue, $, { error, instanceof: Error ? error.message : String(error) });
}
finally {
}
/**
 * Launch Jules TUI (Terminal User Interface)
 */
async;
launchTUI();
Promise < void  > {
    await, this: .ensureAuthenticated(),
    this: .logger.log('Launching Jules TUI...'),
    return: new Promise((resolve, reject) => {
        const theme = this.config.theme || 'dark';
        const tuiProcess = (0, child_process_1.spawn)('jules', [--theme, theme], {
            stdio: 'inherit',
        });
        tuiProcess.on('close', (code) => {
            if (code === 0) {
                this.logger.log('Jules TUI closed');
                resolve();
                `
        } else {`;
                reject(new Error(Jules, TUI, exited));
                with (code)
                    $;
                {
                    code;
                }
                `));
        }
      });

      tuiProcess.on('error', (error) => {
        reject(new Error(Jules TUI error: ${error.message}));
      });
    });
  }

  /**
   * Execute custom Jules CLI command
   */
  async executeCommand(command: string): Promise<string> {
    await this.ensureAuthenticated();` `
    this.logger.log(Executing Jules command: ${command});

    try {`;
                const { stdout } = await execAsync(jules, $, { command } `);
      return stdout;
    } catch (error) {
      throw new Error(Jules command failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    })
};
//# sourceMappingURL=JulesCLIService.js.map