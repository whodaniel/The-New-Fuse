"use strict";
/**
 * Auggie CLI Service
 *
 * Service for interacting with Augment Code's auggie CLI programmatically.
 * Provides AI-powered coding assistance, code generation, and development workflow automation.
 *
 * @module AuggieCLIService
 * @since 2025-10-06
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
var AuggieCLIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuggieCLIService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let AuggieCLIService = AuggieCLIService_1 = class AuggieCLIService {
    eventEmitter;
    logger = new common_1.Logger(AuggieCLIService_1.name);
    config;
    isAuthenticated = false;
    constructor(eventEmitter, config = {}) {
        this.eventEmitter = eventEmitter;
        this.config = {
            model: config.model || 'claude-sonnet-4',
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 8192,
            cliPath: config.cliPath || 'auggie',
            apiKey: config.apiKey || process.env.AUGMENT_API_KEY,
            ...config,
        };
    }
    /**
     * Check if Auggie CLI is installed
     */
    async isInstalled() {
        try {
            const { stdout } = await execAsync(`which ${this.config.cliPath});
      return stdout.trim().length > 0;
    } catch (error) {
      this.logger.warn('Auggie CLI is not installed');
      return false;
    }
  }

  /**
   * Get Auggie CLI version
   */
  async getVersion(): Promise<string> {
    try {`);
            const { stdout } = await execAsync(`${this.config.cliPath}`--, version);
            return stdout.trim();
        }
        catch (error) {
            throw new Error(Failed, to, get, Auggie, CLI, version, $, {}(error).message);
        }
        ;
    }
};
exports.AuggieCLIService = AuggieCLIService;
exports.AuggieCLIService = AuggieCLIService = AuggieCLIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2, Object])
], AuggieCLIService);
/**
 * Initialize and authenticate with Auggie CLI
 */
async;
initialize();
Promise < void  > {
    this: .logger.log('Initializing Auggie CLI service...'),
    // Check if CLI is installed
    const: installed = await this.isInstalled(),
    if(, installed) {
        throw new Error('Auggie CLI is not installed. Please install it first.');
    }
    // Check authentication
    ,
    // Check authentication
    try: {
        await, this: .checkAuthentication(),
        this: .isAuthenticated = true,
        this: .logger.log('Auggie CLI service initialized successfully')
    }, catch(error) {
        this.logger.error('Failed to authenticate with Auggie CLI:', error);
        throw error;
    }
};
/**
 * Check if authenticated with Auggie
 */
async;
checkAuthentication();
Promise < boolean > {
    try: {} `
      const { stdout } = await execAsync(${this.config.cliPath}`, auth, status,
    return: stdout.includes('authenticated') || stdout.includes('logged in')
};
try { }
catch (error) {
    this.logger.warn('Auggie CLI authentication check failed');
    return false;
}
/**
 * Execute a query with Auggie CLI
 */
async;
query(options, AuggieQueryOptions);
Promise < AuggieResponse > {
    : .isAuthenticated
};
{
    await this.initialize();
}
this.logger.debug('Executing Auggie query', { prompt: options.prompt.substring(0, 100) });
try {
    const args = this.buildQueryArgs(options);
    const command = $, { this: , config, cliPath }, $, { args, join };
    (' ');
}
finally { }
`;
      
      this.eventEmitter.emit('auggie.query.start', { options });

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr && !stderr.includes('Warning')) {
        this.logger.warn('Auggie CLI stderr:', stderr);
      }

      const response: AuggieResponse = {
        content: stdout.trim(),
        model: options.model || this.config.model || 'claude-sonnet-4',
        timestamp: new Date(),
      };

      this.eventEmitter.emit('auggie.query.complete', { options, response });
      return response;

    } catch (error) {
      this.logger.error('Auggie query failed:', error);
      this.eventEmitter.emit('auggie.query.error', { options, error });
      throw new Error(Auggie query failed: ${error.message});
    }
  }

  /**
   * Analyze code with Auggie
   */
  async analyzeCode(options: AuggieCodeAnalysisOptions): Promise<AuggieResponse> {
    const prompt = this.buildCodeAnalysisPrompt(options);
    
    return this.query({
      prompt,
      files: [options.filePath],
      codebaseContext: options.includeCodebase,
    });
  }

  /**
   * Execute a task with Auggie
   */
  async executeTask(options: AuggieTaskOptions): Promise<AuggieResponse> {
    if (!this.isAuthenticated) {
      await this.initialize();
    }

    this.logger.debug('Executing Auggie task', { task: options.task });

    try {`;
const args = this.buildTaskArgs(options);
`
      const command = `;
$;
{
    this.config.cliPath;
}
$;
{
    args.join(' ');
}
;
this.eventEmitter.emit('auggie.task.start', { options });
const { stdout, stderr } = await execAsync(command, {
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    cwd: options.workspace,
});
if (stderr && !stderr.includes('Warning')) {
    this.logger.warn('Auggie CLI stderr:', stderr);
}
const response = {
    content: stdout.trim(),
    model: this.config.model || 'claude-sonnet-4',
    timestamp: new Date(),
};
this.eventEmitter.emit('auggie.task.complete', { options, response });
return response;
try { }
catch (error) {
    this.logger.error('Auggie task failed:', error);
    `
      this.eventEmitter.emit('auggie.task.error', { options, error });`;
    throw new Error(`Auggie task failed: ${error.message});
    }
  }

  /**
   * Build query arguments for Auggie CLI
   */
  private buildQueryArgs(options: AuggieQueryOptions): string[] {
    const args = ['chat'];

    if (options.model) {
      args.push('--model', options.model);
    }

    if (options.temperature !== undefined) {
      args.push('--temperature', options.temperature.toString());
    }

    if (options.maxTokens) {
      args.push('--max-tokens', options.maxTokens.toString());
    }

    if (options.systemPrompt) {`, args.push('--system', "${options.systemPrompt}" `);
    }

    if (options.files && options.files.length > 0) {
      options.files.forEach(file => {
        args.push('--file', file);
      });
    }

    if (options.codebaseContext) {
      args.push('--codebase');
    }

    if (options.workspace) {
      args.push('--workspace', options.workspace);
    }

    // Add the prompt as the last argument
    args.push("${options.prompt}"`));
    return args;
}
buildTaskArgs(options, AuggieTaskOptions);
string[];
{
    const args = ['task'];
    if (options.workspace) {
        args.push('--workspace', options.workspace);
    }
    if (options.files && options.files.length > 0) {
        options.files.forEach(file => {
            args.push('--file', file);
        });
    }
    if (options.interactive) {
        args.push('--interactive');
    }
    if (options.dryRun) {
        args.push('--dry-run');
    }
    // Add the task as the last argument
    args.push("${options.task}");
    return args;
}
buildCodeAnalysisPrompt(options, AuggieCodeAnalysisOptions);
string;
{
    `
    const analysisPrompts = {`;
    review: `Please review the code in ${options.filePath} and provide feedback on code quality, best practices, and potential improvements.,`;
    optimize: Please;
    analyze;
    $;
    {
        options.filePath;
    }
    ` and suggest optimizations for performance, memory usage, and efficiency.`,
        explain;
    Please;
    explain;
    the;
    code in $;
    {
        options.filePath;
    }
    including;
    its;
    purpose, functionality, and;
    key;
    components., `
      security: Please perform a security analysis of ${options.filePath}`;
    and;
    identify;
    potential;
    vulnerabilities;
    or;
    security;
    concerns.,
        test;
    Please;
    analyze;
    $;
    {
        options.filePath;
    }
    ` and suggest comprehensive test cases and testing strategies.,
      refactor: Please analyze ${options.filePath} and suggest refactoring opportunities to improve code structure and maintainability.,
    };

    let prompt = analysisPrompts[options.analysisType];
    
    if (options.context) {`;
    prompt += ` Additional context: ${options.context}`;
}
return prompt;
/**
 * Get service configuration
 */
getConfig();
AuggieCLIConfig;
{
    return { ...this.config };
}
/**
 * Update service configuration
 */
updateConfig(config, (Partial));
void {
    this: .config = { ...this.config, ...config },
    this: .logger.log('Auggie CLI service configuration updated')
};
//# sourceMappingURL=AuggieCLIService.js.map