"use strict";
/**
 * Gemini CLI Adapter
 *
 * Protocol adapter for translating between A2A messages and Gemini CLI commands.
 * Enables seamless integration of Gemini AI capabilities into the agent ecosystem.
 *
 * @module GeminiCLIAdapter
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
var GeminiCLIAdapter_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiCLIAdapter = exports.A2AMessageType = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const GeminiCLIService_1 = require("@the-new-fuse/core/services/GeminiCLIService");
const prisma_enums_1 = require("../types/prisma-enums");
// A2A Protocol Types
var A2AMessageType;
(function (A2AMessageType) {
    A2AMessageType["TASK_ASSIGNMENT"] = "TASK_ASSIGNMENT";
    A2AMessageType["CODE_ANALYSIS"] = "CODE_ANALYSIS";
    A2AMessageType["CODE_GENERATION"] = "CODE_GENERATION";
    A2AMessageType["DEBUG_REQUEST"] = "DEBUG_REQUEST";
    A2AMessageType["REFACTOR_REQUEST"] = "REFACTOR_REQUEST";
    A2AMessageType["MULTIMODAL_ANALYSIS"] = "MULTIMODAL_ANALYSIS";
    A2AMessageType["WEB_RESEARCH"] = "WEB_RESEARCH";
    A2AMessageType["STATUS_UPDATE"] = "STATUS_UPDATE";
    A2AMessageType["TASK_COMPLETION"] = "TASK_COMPLETION";
    A2AMessageType["ERROR_REPORT"] = "ERROR_REPORT";
})(A2AMessageType || (exports.A2AMessageType = A2AMessageType = {}));
let GeminiCLIAdapter = GeminiCLIAdapter_1 = class GeminiCLIAdapter {
    geminiService;
    eventEmitter;
    logger = new common_1.Logger(GeminiCLIAdapter_1.name);
    config;
    constructor(geminiService, eventEmitter, config = {}) {
        this.geminiService = geminiService;
        this.eventEmitter = eventEmitter;
        this.config = {
            defaultModel: config.defaultModel || 'gemini-2.5-flash',
            defaultTemperature: config.defaultTemperature || 0.7,
            enableWebSearch: config.enableWebSearch ?? true,
            enableCodeExecution: config.enableCodeExecution ?? true,
            ...config,
        };
    }
    /**
     * Get supported protocol
     */
    getSupportedProtocol() {
        return prisma_enums_1.ProtocolType.GOOGLE_A2A;
    }
    /**
     * Translate A2A message to Gemini task
     */
    async translateToGemini(message) {
        this.logger.debug(`Translating A2A message to Gemini: ${message.type});

    const messageType = message.type || A2AMessageType.TASK_ASSIGNMENT;

    switch (messageType) {
      case A2AMessageType.TASK_ASSIGNMENT:
        return this.translateTaskAssignment(message);

      case A2AMessageType.CODE_ANALYSIS:
        return this.translateCodeAnalysis(message);

      case A2AMessageType.CODE_GENERATION:
        return this.translateCodeGeneration(message);

      case A2AMessageType.DEBUG_REQUEST:
        return this.translateDebugRequest(message);

      case A2AMessageType.REFACTOR_REQUEST:
        return this.translateRefactorRequest(message);

      case A2AMessageType.MULTIMODAL_ANALYSIS:
        return this.translateMultimodalAnalysis(message);

      case A2AMessageType.WEB_RESEARCH:
        return this.translateWebResearch(message);

      default:`);
        throw new Error(`Unsupported A2A message type: ${messageType}`);
    }
};
exports.GeminiCLIAdapter = GeminiCLIAdapter;
exports.GeminiCLIAdapter = GeminiCLIAdapter = GeminiCLIAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof GeminiCLIService_1.GeminiCLIService !== "undefined" && GeminiCLIService_1.GeminiCLIService) === "function" ? _a : Object, typeof (_b = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _b : Object, Object])
], GeminiCLIAdapter);
/**
 * Translate Gemini response to A2A message
 */
async;
translateFromGemini(response, GeminiCLIService_1.GeminiResponse, originalMessage, A2AMessage);
Promise < A2AMessage > {
    const: responseMessage, A2AMessage = {
        id: gemini - response - $
    }
};
{
    Date.now();
}
type: A2AMessageType.TASK_COMPLETION,
    payload;
{
    result: response.content,
        model;
    response.model,
        usage;
    response.usage,
        originalTaskId;
    originalMessage.id,
    ;
}
metadata: {
    sender: 'gemini-cli',
        timestamp;
    response.timestamp,
        correlationId;
    originalMessage.id,
    ;
}
;
return responseMessage;
/**
 * Execute A2A message with Gemini
 */
async;
executeMessage(message, A2AMessage);
Promise < A2AMessage > {
    try: {
        this: .eventEmitter.emit('gemini.adapter.message.received', {
            messageId: message.id,
            type: message.type,
            timestamp: new Date(),
        }),
        // Translate to Gemini task
        const: geminiTask = await this.translateToGemini(message),
        // Execute based on task type
        let, response: GeminiCLIService_1.GeminiResponse,
        switch(geminiTask) { }, : .taskType
    }
};
{
    'query';
    response = await this.geminiService.query({
        prompt: geminiTask.prompt,
        model: geminiTask.model,
        temperature: geminiTask.temperature,
    });
    break;
    'code_analysis';
    response = await this.geminiService.analyzeCode(geminiTask.context);
    break;
    'code_generation';
    response = await this.geminiService.generateCode(geminiTask.prompt, geminiTask.context.language);
    break;
    'debug';
    response = await this.geminiService.debugCode(geminiTask.context.filePath, geminiTask.context.errorDescription, geminiTask.context.stackTrace);
    break;
    'refactor';
    response = await this.geminiService.refactorCode(geminiTask.context.filePath, geminiTask.context.refactoringGoals);
    break;
    'multimodal';
    response = await this.geminiService.processMultimodal(geminiTask.context);
    break;
    'web_search';
    response = await this.geminiService.searchAndAnalyze(geminiTask.context.query, geminiTask.context.analysisPrompt);
    break;
    `
          throw new Error(Unsupported task type: ${geminiTask.taskType}`;
    ;
}
// Translate response back to A2A
const a2aResponse = await this.translateFromGemini(response, message);
this.eventEmitter.emit('gemini.adapter.message.completed', {
    messageId: message.id,
    responseId: a2aResponse.id,
    timestamp: new Date(),
});
return a2aResponse;
try { }
catch (error) {
    this.logger.error(Failed, to, execute, Gemini, message, $, { error, instanceof: Error ? error.message : String(error) });
    `
`;
    const errorResponse = {
        id: gemini - error - $
    }, { Date, now };
    ();
}
`,
        type: A2AMessageType.ERROR_REPORT,
        payload: {
          error: error instanceof Error ? error.message : String(error),
          originalTaskId: message.id,
        },
        metadata: {
          sender: 'gemini-cli',
          timestamp: new Date(),
          correlationId: message.id,
        },
      };

      this.eventEmitter.emit('gemini.adapter.message.failed', {
        messageId: message.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });

      return errorResponse;
    }
  }

  /**
   * Translate task assignment message
   */
  private translateTaskAssignment(message: A2AMessage): GeminiTaskRequest {
    const { description, requirements, context } = message.payload;

    let prompt = description || 'Process the following task:\n\n';

    if (requirements && Array.isArray(requirements)) {
      prompt += '\nRequirements:\n' + requirements.map((r: string, i: number) => ${i + 1}. ${r}`;
join('\n');
if (context) {
    prompt += ;
    n;
    nContext: $;
    {
        JSON.stringify(context, null, 2);
    }
    `;
    }

    return {
      prompt,
      model: this.config.defaultModel,
      temperature: this.config.defaultTemperature,
      taskType: 'query',
    };
  }

  /**
   * Translate code analysis message
   */
  private translateCodeAnalysis(message: A2AMessage): GeminiTaskRequest {
    const { filePath, analysisType, context } = message.payload;

    const analysisOptions: GeminiCodeAnalysisOptions = {
      filePath,
      analysisType: analysisType || 'review',
      context,
    };

    return {
      prompt: '', // Prompt is built by analyzeCode
      model: this.config.defaultModel,
      temperature: this.config.defaultTemperature,
      taskType: 'code_analysis',
      context: analysisOptions,
    };
  }

  /**
   * Translate code generation message
   */
  private translateCodeGeneration(message: A2AMessage): GeminiTaskRequest {
    const { requirements, language, context } = message.payload;

    return {
      prompt: requirements,
      model: this.config.defaultModel,
      temperature: this.config.defaultTemperature,
      taskType: 'code_generation',
      context: { language, additionalContext: context },
    };
  }

  /**
   * Translate debug request message
   */
  private translateDebugRequest(message: A2AMessage): GeminiTaskRequest {
    const { filePath, errorDescription, stackTrace } = message.payload;

    return {
      prompt: '', // Prompt is built by debugCode
      model: this.config.defaultModel,
      temperature: this.config.defaultTemperature,
      taskType: 'debug',
      context: { filePath, errorDescription, stackTrace },
    };
  }

  /**
   * Translate refactor request message
   */
  private translateRefactorRequest(message: A2AMessage): GeminiTaskRequest {
    const { filePath, refactoringGoals } = message.payload;

    return {
      prompt: '', // Prompt is built by refactorCode
      model: this.config.defaultModel,
      temperature: this.config.defaultTemperature,
      taskType: 'refactor',
      context: { filePath, refactoringGoals },
    };
  }

  /**
   * Translate multimodal analysis message
   */
  private translateMultimodalAnalysis(message: A2AMessage): GeminiTaskRequest {
    const { prompt, images, documents, codeFiles } = message.payload;

    const multimodalOptions: GeminiMultimodalOptions = {
      prompt,
      images,
      documents,
      codeFiles,
    };

    return {
      prompt,
      model: this.config.defaultModel,
      temperature: this.config.defaultTemperature,
      taskType: 'multimodal',
      context: multimodalOptions,
    };
  }

  /**
   * Translate web research message
   */
  private translateWebResearch(message: A2AMessage): GeminiTaskRequest {
    const { query, analysisPrompt } = message.payload;

    return {
      prompt: query,
      model: this.config.defaultModel,
      temperature: this.config.defaultTemperature,
      taskType: 'web_search',
      context: { query, analysisPrompt },
    };
  }

  /**
   * Validate A2A message
   */
  validateMessage(message: A2AMessage): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message.id) {
      errors.push('Message ID is required');
    }

    if (!message.type) {
      errors.push('Message type is required');
    }

    if (!message.payload) {
      errors.push('Message payload is required');
    }

    // Type-specific validation
    switch (message.type) {
      case A2AMessageType.CODE_ANALYSIS:
        if (!message.payload.filePath) {
          errors.push('filePath is required for code analysis');
        }
        break;

      case A2AMessageType.CODE_GENERATION:
        if (!message.payload.requirements) {
          errors.push('requirements are required for code generation');
        }
        if (!message.payload.language) {
          errors.push('language is required for code generation');
        }
        break;

      case A2AMessageType.DEBUG_REQUEST:
        if (!message.payload.filePath) {
          errors.push('filePath is required for debug requests');
        }
        if (!message.payload.errorDescription) {
          errors.push('errorDescription is required for debug requests');
        }
        break;

      case A2AMessageType.REFACTOR_REQUEST:
        if (!message.payload.filePath) {
          errors.push('filePath is required for refactor requests');
        }
        if (!message.payload.refactoringGoals) {
          errors.push('refactoringGoals are required for refactor requests');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get adapter configuration
   */
  getConfig(): GeminiAdapterConfig {
    return { ...this.config };
  }

  /**
   * Update adapter configuration
   */
  updateConfig(config: Partial<GeminiAdapterConfig>): void {
    this.config = { ...this.config, ...config };
    this.eventEmitter.emit('gemini.adapter.config.updated', {
      config: this.config,
      timestamp: new Date(),
    });
  }
}
    ;
}
//# sourceMappingURL=GeminiCLIAdapter.js.map