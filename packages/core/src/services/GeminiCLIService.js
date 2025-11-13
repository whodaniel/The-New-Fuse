"use strict";
/**
 * Gemini CLI Service
 *
 * Service for interacting with Google Gemini CLI programmatically.
 * Provides advanced AI capabilities including code analysis, reasoning, and multimodal processing.
 *
 * @module GeminiCLIService
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
var GeminiCLIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiCLIService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let GeminiCLIService = GeminiCLIService_1 = class GeminiCLIService {
    eventEmitter;
    logger = new common_1.Logger(GeminiCLIService_1.name);
    config;
    isAuthenticated = false;
    constructor(eventEmitter, config = {}) {
        this.eventEmitter = eventEmitter;
        this.config = {
            model: config.model || 'gemini-2.5-flash',
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 8192,
            cliPath: config.cliPath || 'gemini',
            ...config,
        };
    }
    /**
     * Check if Gemini CLI is installed
     */
    async isInstalled() {
        try {
            const { stdout } = await execAsync(`which ${this.config.cliPath});
      return stdout.trim().length > 0;
    } catch (error) {
      this.logger.warn('Gemini CLI is not installed');
      return false;
    }
  }

  /**
   * Get Gemini CLI version
   */
  async getVersion(): Promise<string> {
    try {`);
            const { stdout } = await execAsync(`${this.config.cliPath}`--, version);
            return stdout.trim();
        }
        catch (error) {
            throw new Error(Failed, to, get, Gemini, CLI, version, $, {}(error).message);
        }
        ;
    }
};
exports.GeminiCLIService = GeminiCLIService;
exports.GeminiCLIService = GeminiCLIService = GeminiCLIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2, Object])
], GeminiCLIService);
/**
 * Check authentication status
 */
async;
checkAuth();
Promise < boolean > {
    try: {
        // Try a simple query to check auth
        await, this: .query({ prompt: 'test', maxTokens: 1 }),
        this: .isAuthenticated = true,
        return: true
    }, catch(error) {
        this.isAuthenticated = false;
        return false;
    }
};
/**
 * Authenticate with Gemini CLI
 */
async;
login();
Promise < void  > {
    this: .logger.log('Authenticating with Gemini CLI...'),
    try: {} `
      const { stdout, stderr } = await execAsync(${this.config.cliPath}`, login,
    if(stderr) { }
} && stderr.includes('error');
{
    throw new Error(Authentication, failed, $, { stderr });
}
this.isAuthenticated = true;
this.eventEmitter.emit('gemini.authenticated', {
    timestamp: new Date(),
});
`
      this.logger.log('Successfully authenticated with Gemini CLI');`;
try { }
catch (error) {
    this.logger.error(Authentication, failed, $, {}(error).message);
}
`);
      throw error;
    }
  }

  /**
   * Logout from Gemini CLI
   */
  async logout(): Promise<void> {
    try {
      await execAsync(${this.config.cliPath} logout);
      this.isAuthenticated = false;
      this.eventEmitter.emit('gemini.logged_out', {
        timestamp: new Date(),
      });`;
this.logger.log('Logged out from Gemini CLI');
`
    } catch (error) {
      this.logger.error(Logout failed: ${error.message}`;
;
throw error;
/**
 * Execute a query with Gemini
 */
async;
query(options, GeminiQueryOptions);
Promise < GeminiResponse > {
    await, this: .ensureAuthenticated(),
    const: model = options.model || this.config.model,
    const: temperature = options.temperature ?? this.config.temperature,
    const: maxTokens = options.maxTokens || this.config.maxTokens,
    let, command = $
};
{
    this.config.cliPath;
}
query;
`
    if (model) {
      command +=  --model ${model}`;
command += --temperature;
$;
{
    temperature;
}
`;
    command +=  --max-tokens ${maxTokens};

    if (options.systemInstruction || this.config.systemInstruction) {
      const instruction = options.systemInstruction || this.config.systemInstruction;
      if (instruction) {
        command +=  --system "${this.escapeShellArg(instruction)}";
      }
    }
`;
if (options.webSearch) {
    `
      command +=  --web-search`;
}
if (options.codeExecution) {
    command += --code - execution;
}
if (options.files && options.files.length > 0) {
    command += --files;
    $;
    {
        options.files.map(f => "${f}").join(' ');
    }
    ;
}
`
    command +=  "${this.escapeShellArg(options.prompt)}"`;
try {
    this.eventEmitter.emit('gemini.query.started', {
        model,
        prompt: options.prompt,
        timestamp: new Date(),
    });
    const { stdout, stderr } = await execAsync(command);
    if (stderr && stderr.includes('error')) {
        throw new Error(stderr);
    }
    const response = {
        content: stdout.trim(),
        model: model || 'unknown',
        timestamp: new Date(),
    };
    this.eventEmitter.emit('gemini.query.completed', {
        ...response,
        promptLength: options.prompt.length,
        responseLength: response.content.length,
    });
    return response;
}
catch (error) {
    this.eventEmitter.emit('gemini.query.failed', {
        error: error.message,
        prompt: options.prompt,
        timestamp: new Date(),
    });
    throw error;
}
/**
 * Analyze code with Gemini
 */
async;
analyzeCode(options, GeminiCodeAnalysisOptions);
Promise < GeminiResponse > {
    const: prompts = {
        review: Please, review, this: code, file, and, provide: 1., Code, quality, assessment,
        2.: Best, practices, violations,
        3.: Potential, bugs, or, issues,
        4.: Suggestions, for: improvement,
        $
    }
};
{
    options.context ? Context : $;
    {
        options.context;
    }
    n;
    n: '';
}
optimize: Please;
analyze;
this;
code;
for (optimization; opportunities; )
    : 1.;
Performance;
bottlenecks;
2.;
Memory;
usage;
improvements;
3.;
Algorithmic;
optimizations;
4.;
Code;
structure;
improvements;
$;
{
    options.context ? `Context: ${options.context}\n\n : ''},` `
      explain: Please provide a comprehensive explanation of this code:
1. Overall purpose and functionality
2. Key components and their roles
3. Algorithm/logic explanation
4. Dependencies and integrations

${options.context ? Context : $ : ;
    {
        options.context;
    }
    `\n\n : ''},

      security: Please perform a security analysis of this code:
1. Security vulnerabilities
2. Input validation issues
3. Authentication/authorization concerns
4. Data protection issues

${options.context ? Context : $;
    {
        options.context;
    }
    n;
    n: '';
}
test: Please;
analyze;
this;
code;
and;
suggest;
comprehensive;
tests: 1.;
Unit;
test;
cases;
2.;
Edge;
cases;
to;
cover;
3.;
Integration;
test;
scenarios;
4.;
Test;
implementation;
examples;
$;
{
    options.context ? Context : $;
    {
        options.context;
    }
    n;
    n: '';
}
;
return this.query({
    prompt: prompts[options.analysisType],
    files: [options.filePath],
    codeExecution: options.analysisType === 'optimize',
});
/**
 * Process multimodal input (text + images/documents)
 */
async;
processMultimodal(options, GeminiMultimodalOptions);
Promise < GeminiResponse > {
    const: files, string, []:  = [
        ...(options.images || []),
        ...(options.documents || []),
        ...(options.codeFiles || []),
    ],
    return: this.query({
        prompt: options.prompt,
        files,
    })
} 
/**
 * Perform web search and analysis`
 */ `
  async searchAndAnalyze(query: string, analysisPrompt: string): Promise<GeminiResponse> {`;
const combinedPrompt = $, { query }, n, nAnalysis, requested, n$, { analysisPrompt };
return this.query({
    prompt: combinedPrompt,
    webSearch: true,
});
/**
 * Generate code with explanation
 */ `
  async generateCode(requirements: string, language: string): Promise<GeminiResponse> {`;
const prompt = Generate, $, { language };
` code for the following requirements:

${requirements}

Please provide:`;
1.;
Complete, working;
code;
implementation `
2. Explanation of the approach
3. Usage examples
4. Any important considerations;

    return this.query({
      prompt,
      codeExecution: true,
    });
  }

  /**
   * Debug code with Gemini
   */
  async debugCode(
    filePath: string,
    errorDescription: string,
    stackTrace?: string
  ): Promise<GeminiResponse> {
    let prompt = Debug the following code issue:

Error: ${errorDescription}`;
if (stackTrace) {
    prompt += ;
    n;
    nStack;
    trace: ;
    n$;
    {
        stackTrace;
    }
    ;
}
`
`;
prompt += `\n\nPlease provide:
1. Root cause analysis
2. Step-by-step fix
3. Prevention strategies
4. Code corrections;

    return this.query({
      prompt,
      files: [filePath],
    });
  }

  /**
   * Refactor code
   */
  async refactorCode(
    filePath: string,
    refactoringGoals: string[]
  ): Promise<GeminiResponse> {
    const prompt = Refactor this code with the following goals:

${refactoringGoals.map((goal, i) => $, { i } + 1, $, { goal }).join('\n')}

Please provide:
1. Refactored code
2. Explanation of changes
3. Benefits of the refactoring
4. Migration notes if needed;

    return this.query({
      prompt,
      files: [filePath],
    });
  }

  /**
   * Compare code approaches
   */
  async compareApproaches(
    approach1: string,
    approach2: string,
    criteria: string[]
  ): Promise<GeminiResponse> {
    const prompt = Compare these two code approaches:
`;
Approach;
1;
`
${approach1}`;
Approach;
2;
$;
{
    approach2;
}
`
Evaluation criteria:`;
$;
{
    criteria.map((c, i) => $, { i } + 1);
}
`. ${c}).join('\n')}

Please provide:
1. Detailed comparison
2. Pros and cons of each
3. Recommendation with justification
4. Use case suitability;

    return this.query({ prompt });
  }

  /**
   * Batch process multiple queries
   */
  async batchQuery(queries: GeminiQueryOptions[]): Promise<GeminiResponse[]> {
    const results: GeminiResponse[] = [];

    for (const queryOptions of queries) {
      try {
        const result = await this.query(queryOptions);
        results.push(result);

        // Rate limiting - small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(Batch query failed: ${error.message});`;
results.push({} `
          content: Error: ${error.message}`, model, queryOptions.model || this.config.model, timestamp, new Date());
return results;
/**
 * Stream response (for long-running queries)
 */
async;
streamQuery(options, GeminiQueryOptions, onChunk, (chunk) => void );
Promise < GeminiResponse > {
    // Note: Actual streaming would require the Gemini CLI to support it
    // This is a simulated streaming approach
    const: response = await this.query(options),
    const: chunks = response.content.split('\n'),
    for(, chunk, of, chunks) {
        onChunk(chunk + '\n');
        await new Promise(resolve => setTimeout(resolve, 50));
    },
    return: response
};
async;
ensureAuthenticated();
Promise < void  > {
    : .isAuthenticated
};
{
    const isAuth = await this.checkAuth();
    if (!isAuth) {
        throw new Error('Not authenticated with Gemini CLI. Please run login() first.');
    }
}
escapeShellArg(arg, string);
string;
{
    return arg.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(); //g, '\\`');
}
/**
 * Get service configuration
 */
getConfig();
GeminiCLIConfig;
{
    return { ...this.config };
}
/**
 * Update service configuration
 */
updateConfig(config, (Partial));
void {
    this: .config = { ...this.config, ...config },
    this: .eventEmitter.emit('gemini.config.updated', {
        config: this.config,
        timestamp: new Date(),
    })
};
//# sourceMappingURL=GeminiCLIService.js.map