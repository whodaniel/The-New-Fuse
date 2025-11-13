"use strict";
/**
 * Codex CLI Adapter
 *
 * Protocol adapter for translating between A2A messages and OpenAI Codex CLI commands.
 * Enables seamless integration of OpenAI's code generation capabilities into the agent ecosystem.
 *
 * @module CodexCLIAdapter
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
var CodexCLIAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodexCLIAdapter = void 0;
const common_1 = require("@nestjs/common");
const prisma_enums_1 = require("../types/prisma-enums");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
/**
 * Codex CLI Adapter for A2A Protocol Translation
 */
let CodexCLIAdapter = CodexCLIAdapter_1 = class CodexCLIAdapter {
    name = 'CodexCLIAdapter';
    version = '1.0.0';
    supportedProtocols = [
        prisma_enums_1.ProtocolType.CUSTOM,
        prisma_enums_1.ProtocolType.A2A_V2,
    ];
    logger = new common_1.Logger(CodexCLIAdapter_1.name);
    config;
    constructor(config = {}) {
        this.config = {
            defaultModel: config.defaultModel || 'gpt-4o',
            defaultTemperature: config.defaultTemperature || 0.7,
            enableCodeExecution: config.enableCodeExecution ?? true,
            enableWebSearch: config.enableWebSearch ?? true,
            maxTokens: config.maxTokens || 4096,
            timeout: config.timeout || 30000,
            ...config,
        };
    }
    /**
     * Get supported protocol
     */
    getSupportedProtocol() {
        return prisma_enums_1.ProtocolType.CUSTOM;
    }
    /**
     * Translate A2A message to Codex task
     */
    async translateToCodex(message) {
        this.logger.debug(`Translating A2A message to Codex: ${message.type}`);
        const messageType = message.type || a2a_core_1.A2AMessageType.REQUEST;
        switch (messageType) {
            case a2a_core_1.A2AMessageType.REQUEST:
                return this.translateTaskAssignment(message);
            case a2a_core_1.A2AMessageType.AI_CODER_TASK_ASSIGNMENT:
                return this.translateCodeAnalysis(message);
            case a2a_core_1.A2AMessageType.TASK_ASSIGNMENT:
                return this.translateCodeGeneration(message);
            case a2a_core_1.A2AMessageType.AI_CODER_CODE_REVIEW:
                return this.translateDebugRequest(message);
            case a2a_core_1.A2AMessageType.AI_CODER_COLLABORATION_REQUEST:
                return this.translateRefactorRequest(message);
            case a2a_core_1.A2AMessageType.DATA_REQUEST:
                return this.translateDataRequest(message);
            default:
                throw new Error(`Unsupported A2A message type for Codex: ${messageType}`);
        }
    }
    /**
     * Translate Codex response back to A2A message
     */
    async translateFromCodex(response, originalMessage) {
        const status = this.mapStatusToA2AType(response.status);
        return {
            id: response.sessionId,
            fromAgent: 'codex-cli',
            toAgent: originalMessage.fromAgent || 'orchestrator',
            type: status,
            priority: a2a_core_1.A2APriority.MEDIUM,
            payload: {
                sessionId: response.sessionId,
                status: response.status,
                prompt: response.prompt,
                result: response.result,
                error: response.error,
                model: response.model,
                usage: response.usage,
                createdAt: response.createdAt,
                completedAt: response.completedAt,
                metadata: response.metadata,
            },
            timestamp: response.createdAt.getTime(),
            ttl: 3600000, // 1 hour
        };
    }
    /**
     * Execute A2A message with Codex
     */
    async executeMessage(message) {
        try {
            this.logger.log(`Executing Codex message: ${message.type}`);
            // Translate to Codex task
            const codexTask = await this.translateToCodex(message);
            // Execute based on task type
            let response;
            switch (codexTask.taskType) {
                case 'query':
                    response = await this.executeQuery(codexTask);
                    break;
                case 'code_analysis':
                    response = await this.executeCodeAnalysis(codexTask);
                    break;
                case 'code_generation':
                    response = await this.executeCodeGeneration(codexTask);
                    break;
                case 'debug':
                    response = await this.executeDebug(codexTask);
                    break;
                case 'refactor':
                    response = await this.executeRefactor(codexTask);
                    break;
                case 'explanation':
                    response = await this.executeExplanation(codexTask);
                    break;
                case 'web_search':
                    response = await this.executeWebSearch(codexTask);
                    break;
                default:
                    response = await this.executeQuery(codexTask);
            }
            return this.translateFromCodex(response, message);
        }
        catch (error) {
            this.logger.error('Failed to execute Codex message:', error);
            return this.createErrorResponse(message, error);
        }
    }
    /**
     * Execute query task
     */
    async executeQuery(task) {
        const sessionId = task.sessionId || this.generateId();
        // Simulate Codex execution
        const result = await this.simulateCodexExecution(task);
        return {
            sessionId,
            status: 'completed',
            prompt: task.prompt,
            result,
            model: task.model || this.config.defaultModel,
            usage: {
                promptTokens: Math.floor(task.prompt.length / 4),
                completionTokens: Math.floor(result.length / 4),
                totalTokens: Math.floor((task.prompt.length + result.length) / 4),
            },
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {
                taskType: 'query',
                originalPrompt: task.prompt,
            },
        };
    }
    /**
     * Execute code analysis task
     */
    async executeCodeAnalysis(task) {
        const sessionId = task.sessionId || this.generateId();
        const context = task.context;
        const analysisPrompt = `Analyze the following code:

${context.code || context.fileContent || 'No code provided'}

Provide:
1. Code quality assessment
2. Performance analysis
3. Security considerations
4. Maintainability review
5. Specific recommendations`;
        const result = await this.simulateCodexExecution({ ...task, prompt: analysisPrompt });
        return {
            sessionId,
            status: 'completed',
            prompt: analysisPrompt,
            result,
            model: task.model || this.config.defaultModel,
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {
                taskType: 'code_analysis',
                filePath: context.filePath,
                language: context.language,
            },
        };
    }
    /**
     * Execute code generation task
     */
    async executeCodeGeneration(task) {
        const sessionId = task.sessionId || this.generateId();
        const context = task.context;
        const generationPrompt = `Generate code based on the following requirements:

${task.prompt}

Language: ${context.language || 'TypeScript'}
Framework: ${context.framework || 'Node.js'}
Patterns: ${context.patterns || 'Standard patterns'}

Provide:
1. Complete, working code
2. Proper error handling
3. Documentation/comments
4. Usage examples`;
        const result = await this.simulateCodexExecution({ ...task, prompt: generationPrompt });
        return {
            sessionId,
            status: 'completed',
            prompt: generationPrompt,
            result,
            model: task.model || this.config.defaultModel,
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {
                taskType: 'code_generation',
                language: context.language,
                framework: context.framework,
            },
        };
    }
    /**
     * Execute debug task
     */
    async executeDebug(task) {
        const sessionId = task.sessionId || this.generateId();
        const context = task.context;
        const debugPrompt = `Debug the following code issue:

Error: ${context.errorDescription || 'Unknown error'}
Stack Trace: ${context.stackTrace || 'No stack trace provided'}

Code:
${context.code || context.fileContent || 'No code provided'}

Provide:
1. Root cause analysis
2. Specific fix recommendations
3. Prevention strategies
4. Testing suggestions`;
        const result = await this.simulateCodexExecution({ ...task, prompt: debugPrompt });
        return {
            sessionId,
            status: 'completed',
            prompt: debugPrompt,
            result,
            model: task.model || this.config.defaultModel,
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {
                taskType: 'debug',
                errorType: context.errorType,
                filePath: context.filePath,
            },
        };
    }
    /**
     * Execute refactor task
     */
    async executeRefactor(task) {
        const sessionId = task.sessionId || this.generateId();
        const context = task.context;
        const refactorPrompt = `Refactor the following code:

Code:
${context.code || context.fileContent || 'No code provided'}

Refactoring Goals:
${context.refactoringGoals || 'Improve code quality, performance, and maintainability'}

Provide:
1. Refactored code
2. Explanation of changes
3. Benefits of refactoring
4. Migration guide if needed`;
        const result = await this.simulateCodexExecution({ ...task, prompt: refactorPrompt });
        return {
            sessionId,
            status: 'completed',
            prompt: refactorPrompt,
            result,
            model: task.model || this.config.defaultModel,
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {
                taskType: 'refactor',
                refactoringGoals: context.refactoringGoals,
                filePath: context.filePath,
            },
        };
    }
    /**
     * Execute explanation task
     */
    async executeExplanation(task) {
        const sessionId = task.sessionId || this.generateId();
        const context = task.context;
        const explanationPrompt = `Explain the following code in detail:

Code:
${context.code || context.fileContent || 'No code provided'}

Include:
1. High-level overview
2. Detailed explanation of each component
3. Purpose and functionality
4. Dependencies and integrations
5. Usage examples`;
        const result = await this.simulateCodexExecution({ ...task, prompt: explanationPrompt });
        return {
            sessionId,
            status: 'completed',
            prompt: explanationPrompt,
            result,
            model: task.model || this.config.defaultModel,
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {
                taskType: 'explanation',
                filePath: context.filePath,
                complexity: context.complexity,
            },
        };
    }
    /**
     * Execute web search task
     */
    async executeWebSearch(task) {
        const sessionId = task.sessionId || this.generateId();
        const searchPrompt = `Research and provide comprehensive information about:

${task.prompt}

Include:
1. Current best practices
2. Latest developments
3. Code examples if applicable
4. References and sources
5. Practical recommendations`;
        const result = await this.simulateCodexExecution({ ...task, prompt: searchPrompt });
        return {
            sessionId,
            status: 'completed',
            prompt: searchPrompt,
            result,
            model: task.model || this.config.defaultModel,
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {
                taskType: 'web_search',
                searchQuery: task.prompt,
            },
        };
    }
    /**
     * Simulate Codex execution (replace with actual API calls)
     */
    async simulateCodexExecution(task) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        const responses = {
            query: `This is a simulated Codex response for: "${task.prompt.substring(0, 50)}..."

I've analyzed your request and provided a comprehensive response based on current best practices and available information.`,
            code_analysis: `## Code Analysis Results

**Overall Quality**: Good
**Complexity**: Moderate
**Maintainability**: High

### Issues Found:
- Minor performance optimization opportunities
- Some code duplication detected
- Good error handling practices

### Recommendations:
1. Consider implementing memoization for expensive operations
2. Extract common logic into reusable utilities
3. Add comprehensive unit tests`,
            code_generation: `Here's the generated code based on your requirements:

\`\`\`typescript
interface GeneratedService {
  process(data: any): Promise<any>;
  validate(input: any): boolean;
}

class Implementation implements GeneratedService {
  async process(data: any): Promise<any> {
    // Implementation logic here
    return data;
  }

  validate(input: any): boolean {
    return input !== null && input !== undefined;
  }
}
\`\`\`

This implementation follows best practices and includes proper error handling.`,
            debug: `## Debug Analysis

**Root Cause**: The error appears to be related to async/await handling in the promise chain.

**Specific Issue**: Missing await keyword on line 42 in the processAsync function.

**Fix**: Add 'await' before the processData() call on line 42.

**Prevention**: Consider using ESLint rules for async/await consistency.`,
            refactor: `## Refactored Code

Here's the improved version with better structure and performance:

\`\`\`typescript
// Refactored version
function processAll(data) {
  // Improved implementation
}

class DataProcessor {
  async process(data: Data): Promise<Result> {
    const validated = await this.validate(data);
    const transformed = await this.transform(validated);
    return this.format(transformed);
  }
}
\`\`\`

**Benefits**: Better testability, reusability, and maintainability.`,
            explanation: `## Code Explanation

This code implements a service layer pattern with the following components:

**Main Classes**:
- ServiceManager: Orchestrates multiple services
- DataProcessor: Handles data transformation logic
- ValidationService: Ensures data integrity

**Key Patterns**:
- Dependency injection for testability
- Async/await for non-blocking operations
- Error boundaries for graceful failure handling`,
            web_search: `## Research Results

Based on current information and best practices:

**Latest Developments**:
- Recent improvements in TypeScript 5.0+
- New patterns in React Server Components
- Enhanced error handling strategies

**Recommendations**:
1. Use TypeScript strict mode for better type safety
2. Implement proper error boundaries
3. Consider using React Query for server state management`
        };
        return responses[task.taskType] || responses.query;
    }
    /**
     * Translate task assignment
     */
    translateTaskAssignment(message) {
        const payload = message.payload;
        return {
            prompt: this.buildPromptFromTask(payload),
            model: this.config.defaultModel,
            temperature: this.config.defaultTemperature,
            maxTokens: this.config.maxTokens,
            taskType: 'query',
            sessionId: message.id,
            context: {
                taskId: payload.taskId,
                fromAgent: message.fromAgent,
                originalMessage: message,
            },
        };
    }
    /**
     * Translate code analysis
     */
    translateCodeAnalysis(message) {
        const payload = message.payload;
        return {
            prompt: '', // Built by executeCodeAnalysis
            model: this.config.defaultModel,
            temperature: this.config.defaultTemperature,
            taskType: 'code_analysis',
            context: {
                filePath: payload.filePath,
                code: payload.code,
                fileContent: payload.fileContent,
                language: payload.language,
                analysisType: payload.analysisType,
            },
            sessionId: message.id,
        };
    }
    /**
     * Translate code generation
     */
    translateCodeGeneration(message) {
        const payload = message.payload;
        return {
            prompt: payload.requirements || payload.description,
            model: this.config.defaultModel,
            temperature: this.config.defaultTemperature,
            taskType: 'code_generation',
            context: {
                language: payload.language,
                framework: payload.framework,
                patterns: payload.patterns,
                requirements: payload.requirements,
            },
            sessionId: message.id,
        };
    }
    /**
     * Translate debug request
     */
    translateDebugRequest(message) {
        const payload = message.payload;
        return {
            prompt: '', // Built by executeDebug
            model: this.config.defaultModel,
            temperature: this.config.defaultTemperature,
            taskType: 'debug',
            context: {
                filePath: payload.filePath,
                errorDescription: payload.errorDescription,
                stackTrace: payload.stackTrace,
                code: payload.code,
                errorType: payload.errorType,
            },
            sessionId: message.id,
        };
    }
    /**
     * Translate refactor request
     */
    translateRefactorRequest(message) {
        const payload = message.payload;
        return {
            prompt: '', // Built by executeRefactor
            model: this.config.defaultModel,
            temperature: this.config.defaultTemperature,
            taskType: 'refactor',
            context: {
                filePath: payload.filePath,
                code: payload.code,
                refactoringGoals: payload.refactoringGoals,
            },
            sessionId: message.id,
        };
    }
    /**
     * Translate data request
     */
    translateDataRequest(message) {
        const payload = message.payload;
        return {
            prompt: payload.query || payload.description || 'Provide information',
            model: this.config.defaultModel,
            temperature: this.config.defaultTemperature,
            taskType: payload.explanation ? 'explanation' : 'query',
            context: {
                type: 'data_request',
                format: payload.format,
                explanation: payload.explanation,
            },
            sessionId: message.id,
        };
    }
    /**
     * Build prompt from task payload
     */
    buildPromptFromTask(payload) {
        const parts = [];
        if (payload.title) {
            parts.push(`Task: ${payload.title}`);
        }
        if (payload.description) {
            parts.push(payload.description);
        }
        if (payload.requirements && Array.isArray(payload.requirements)) {
            parts.push('\nRequirements:');
            payload.requirements.forEach((req, index) => {
                parts.push(`${index + 1}. ${req}`);
            });
        }
        if (payload.context) {
            parts.push(`\nContext: ${JSON.stringify(payload.context, null, 2)}`);
        }
        return parts.join('\n');
    }
    /**
     * Map Codex status to A2A message type
     */
    mapStatusToA2AType(status) {
        switch (status) {
            case 'completed':
                return a2a_core_1.A2AMessageType.RESPONSE;
            case 'error':
                return a2a_core_1.A2AMessageType.ERROR_NOTIFICATION;
            case 'running':
                return a2a_core_1.A2AMessageType.STATUS_UPDATE;
            default:
                return a2a_core_1.A2AMessageType.STATUS_UPDATE;
        }
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `codex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Validate task request
     */
    validateTask(task) {
        const errors = [];
        if (!task.prompt || task.prompt.trim().length === 0) {
            errors.push('Prompt is required');
        }
        if (task.prompt && task.prompt.length > 32000) {
            errors.push('Prompt exceeds maximum length of 32000 characters');
        }
        if (task.temperature !== undefined && (task.temperature < 0 || task.temperature > 2)) {
            errors.push('Temperature must be between 0 and 2');
        }
        if (task.maxTokens !== undefined && (task.maxTokens < 1 || task.maxTokens > 16384)) {
            errors.push('Max tokens must be between 1 and 16384');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Build CLI command for Codex
     */
    buildCLICommand(task) {
        const model = task.model || this.config.defaultModel || 'gpt-4o';
        const temperature = task.temperature || this.config.defaultTemperature || 0.7;
        const maxTokens = task.maxTokens || this.config.maxTokens || 4096;
        // Escape special characters in prompt
        const escapedPrompt = task.prompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');
        return `codex query "${escapedPrompt}" --model ${model} --temperature ${temperature} --max-tokens ${maxTokens}`;
    }
    /**
     * Parse session output
     */
    parseSessionOutput(output) {
        const sessionIdMatch = output.match(/Session\s+ID:\s*(\w+)/i) || output.match(/(\w{8,})/);
        const sessionId = sessionIdMatch ? sessionIdMatch[1] : undefined;
        const status = output.toLowerCase().includes('error') || output.toLowerCase().includes('failed')
            ? 'failed'
            : output.toLowerCase().includes('completed')
                ? 'completed'
                : 'created';
        return {
            sessionId,
            status,
            message: output,
        };
    }
    /**
     * Check if protocol is supported
     */
    supportsProtocol(protocol) {
        return protocol === prisma_enums_1.ProtocolType.CUSTOM; // Using CUSTOM since OPENAI_CODEX doesn't exist
    }
    /**
     * Get adapter capabilities
     */
    getCapabilities() {
        return [
            'code_generation',
            'code_analysis',
            'debugging',
            'refactoring',
            'explanation',
            'web_search',
            'task_execution',
            'async_processing',
            'error_analysis',
            'performance_optimization',
        ];
    }
    /**
     * Get adapter configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update adapter configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.logger.log(`Codex adapter configuration updated: ${JSON.stringify(this.config)}`);
    }
    /**
     * Create error response
     */
    createErrorResponse(originalMessage, error) {
        return {
            id: `codex-error-${Date.now()}`,
            fromAgent: 'codex-cli',
            toAgent: originalMessage.fromAgent || 'orchestrator',
            type: a2a_core_1.A2AMessageType.ERROR_NOTIFICATION,
            priority: a2a_core_1.A2APriority.HIGH,
            payload: {
                error: error.message,
                originalMessageId: originalMessage.id,
                timestamp: new Date(),
            },
            timestamp: Date.now(),
            ttl: 3600000,
        };
    }
};
exports.CodexCLIAdapter = CodexCLIAdapter;
exports.CodexCLIAdapter = CodexCLIAdapter = CodexCLIAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], CodexCLIAdapter);
//# sourceMappingURL=CodexCLIAdapter.js.map