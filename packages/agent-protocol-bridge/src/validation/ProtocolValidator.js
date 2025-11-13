"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProtocolValidator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolValidator = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Schema definitions for different protocols
const A2AMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fromAgent: zod_1.z.string(),
    toAgent: zod_1.z.string(),
    type: zod_1.z.enum([
        'task_assignment',
        'status_update',
        'data_request',
        'data_response',
        'collaboration_request',
        'workflow_coordination',
        'resource_sharing',
        'error_notification',
        'heartbeat',
        'capability_announcement'
    ]),
    payload: zod_1.z.any(),
    priority: zod_1.z.enum(['1', '2', '3', '4', '5']).or(zod_1.z.number().min(1).max(5)),
    timestamp: zod_1.z.number(),
    ttl: zod_1.z.number().optional(),
    retryCount: zod_1.z.number().optional(),
    requiresResponse: zod_1.z.boolean().optional(),
    conversationId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
const MCPMessageSchema = zod_1.z.object({
    jsonrpc: zod_1.z.literal('2.0'),
    id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    method: zod_1.z.string(),
    params: zod_1.z.any().optional()
}).or(zod_1.z.object({
    jsonrpc: zod_1.z.literal('2.0'),
    id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    result: zod_1.z.any().optional(),
    error: zod_1.z.object({
        code: zod_1.z.number(),
        message: zod_1.z.string(),
        data: zod_1.z.any().optional()
    }).optional()
}));
const ClaudeSubAgentMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['task', 'workflow', 'template_assignment', 'status', 'result']),
    template: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        version: zod_1.z.string(),
        category: zod_1.z.enum(['development', 'analysis', 'operations', 'security', 'ui_ux'])
    }).optional(),
    workflow: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        steps: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            type: zod_1.z.enum(['analysis', 'action', 'review', 'approval', 'notification']),
            description: zod_1.z.string()
        }))
    }).optional(),
    task: zod_1.z.object({
        id: zod_1.z.string(),
        description: zod_1.z.string(),
        parameters: zod_1.z.record(zod_1.z.any()),
        workflow: zod_1.z.string().optional()
    }).optional(),
    result: zod_1.z.object({
        success: zod_1.z.boolean(),
        data: zod_1.z.any().optional(),
        error: zod_1.z.string().optional()
    }).optional(),
    agent: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        template: zod_1.z.string()
    }),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
const PydanticAgentMessageSchema = zod_1.z.object({
    project_id: zod_1.z.string().uuid(),
    goal: zod_1.z.string(),
    tasks: zod_1.z.array(zod_1.z.object({
        task_id: zod_1.z.string().uuid(),
        agent_name: zod_1.z.string(),
        input_data: zod_1.z.record(zod_1.z.any()),
        status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'failed']),
        dependencies: zod_1.z.array(zod_1.z.string().uuid()),
        output: zod_1.z.any().nullable()
    })),
    status: zod_1.z.enum(['in_progress', 'completed', 'failed']),
    message: zod_1.z.string(),
    final_deliverable_url: zod_1.z.string().url().nullable().optional()
});
const ProtocolMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    protocol: zod_1.z.nativeEnum(client_1.ProtocolType),
    payload: zod_1.z.any(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    timestamp: zod_1.z.date()
});
let ProtocolValidator = ProtocolValidator_1 = class ProtocolValidator {
    logger = new common_1.Logger(ProtocolValidator_1.name);
    validationCache = new Map();
    /**
     * Validate a protocol message
     */
    async validateMessage(message) {
        const cacheKey = `${message.protocol}-${message.id}-${JSON.stringify(message).slice(0, 100)};
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    try {
      // Validate the base message structure
      const baseValidation = ProtocolMessageSchema.safeParse(message);
      if (!baseValidation.success) {
        const result: ValidationResult = {`;
        isValid: false, `
          errors: baseValidation.error.issues.map(issue => `;
        $;
        {
            issue.path.join('.');
        }
        $;
        {
            issue.message;
        }
    }
    ;
};
exports.ProtocolValidator = ProtocolValidator;
exports.ProtocolValidator = ProtocolValidator = ProtocolValidator_1 = __decorate([
    (0, common_1.Injectable)()
], ProtocolValidator);
this.validationCache.set(cacheKey, result);
return result;
// Validate protocol-specific payload
const payloadValidation = await this.validateProtocolPayload(message);
const result = {
    isValid: payloadValidation.isValid,
    errors: payloadValidation.errors,
    warnings: payloadValidation.warnings,
    normalizedMessage: payloadValidation.normalizedMessage || message
};
// Cache the result
this.validationCache.set(cacheKey, result);
if (result.isValid) {
    `
        this.logger.debug(✅ Message ${message.id}`;
    validated;
    successfully;
    for ($; { message, : .protocol };)
        ;
    `
      } else {
        this.logger.warn(❌ Message ${message.id} validation failed for ${message.protocol}: ${result.errors?.join(', ')});`;
}
`
`;
return result;
try { }
catch (error) {
    this.logger.error(Validation, error);
    for (message; $; { message, : .id })
        : $;
    {
        error.message;
    }
    `);
      return {
        isValid: false,
        errors: [Validation exception: ${error.message}]
      };
    }
  }

  /**
   * Validate multiple messages in batch
   */
  async validateMessages(messages: ProtocolMessage[]): Promise<ValidationResult[]> {
    return Promise.all(messages.map(msg => this.validateMessage(msg)));
  }

  /**
   * Validate protocol-specific configuration
   */
  async validateProtocolConfig(
    protocol: ProtocolType,
    config: Record<string, any>
  ): Promise<ValidationResult> {
    try {
      switch (protocol) {
        case ProtocolType.A2A_V1:
        case ProtocolType.A2A_V2:
          return this.validateA2AConfig(config);
        
        case ProtocolType.MCP:
          return this.validateMCPConfig(config);
        
        case ProtocolType.CLAUDE_SUB_AGENT:
          return this.validateClaudeConfig(config);
        
        case ProtocolType.PYDANTIC:
          return this.validatePydanticConfig(config);
        
        default:`;
    return {} `
            isValid: true,
            warnings: [No specific validation available for ${protocol}`;
}
;
try { }
catch (error) {
    return {
        isValid: false,
        errors: [Config, validation, error, $, { error, : .message }]
    };
}
/**
 * Get validation schema for a protocol
 */
getSchemaForProtocol(protocol, client_1.ProtocolType);
zod_1.z.ZodSchema | null;
{
    switch (protocol) {
        case client_1.ProtocolType.A2A_V1:
        case client_1.ProtocolType.A2A_V2:
            return A2AMessageSchema;
        case client_1.ProtocolType.MCP:
            return MCPMessageSchema;
        case client_1.ProtocolType.CLAUDE_SUB_AGENT:
            return ClaudeSubAgentMessageSchema;
        case client_1.ProtocolType.PYDANTIC:
            return PydanticAgentMessageSchema;
        default:
            return null;
    }
}
/**
 * Normalize a message to ensure consistency
 */
async;
normalizeMessage(message, AgentProtocolBridge_1.ProtocolMessage);
Promise < AgentProtocolBridge_1.ProtocolMessage > {
    const: normalized = { ...message },
    // Ensure timestamp is a Date object
    if() { }
}(normalized.timestamp instanceof Date);
{
    normalized.timestamp = new Date(normalized.timestamp);
}
// Ensure metadata exists
if (!normalized.metadata) {
    normalized.metadata = {};
}
// Add validation metadata
normalized.metadata.validatedAt = new Date().toISOString();
normalized.metadata.validator = 'ProtocolValidator';
// Protocol-specific normalizations
switch (message.protocol) {
    case client_1.ProtocolType.A2A_V1:
    case client_1.ProtocolType.A2A_V2:
        normalized.payload = this.normalizeA2AMessage(normalized.payload);
        break;
    case client_1.ProtocolType.MCP:
        normalized.payload = this.normalizeMCPMessage(normalized.payload);
        break;
    case client_1.ProtocolType.CLAUDE_SUB_AGENT:
        normalized.payload = this.normalizeClaudeMessage(normalized.payload);
        break;
}
return normalized;
async;
validateProtocolPayload(message, AgentProtocolBridge_1.ProtocolMessage);
Promise < ValidationResult > {
    const: schema = this.getSchemaForProtocol(message.protocol),
    if(, schema) {
        return {} `
        isValid: true,`;
        warnings: [No, schema, validation, available];
        for ($; { message, : .protocol }; )
            ;
        normalizedMessage: await this.normalizeMessage(message);
    }
};
const validation = schema.safeParse(message.payload);
if (validation.success) {
    return {
        isValid: true,
        normalizedMessage: await this.normalizeMessage(message)
    };
}
else {
    return {
        isValid: false,
        errors: validation.error.issues.map(issue => `
          `, payload.$, { issue, : .path.join('.') }, $, { issue, : .message })
    };
}
validateA2AConfig(config, (Record));
ValidationResult;
{
    const schema = zod_1.z.object({
        redis: zod_1.z.object({
            url: zod_1.z.string().url(),
            keyPrefix: zod_1.z.string().optional(),
            ttl: zod_1.z.number().positive().optional()
        }),
        websocket: zod_1.z.object({
            port: zod_1.z.number().positive().optional(),
            cors: zod_1.z.any().optional()
        }).optional(),
        security: zod_1.z.object({
            enableSignatures: zod_1.z.boolean().optional(),
            secretKey: zod_1.z.string().optional(),
            enableEncryption: zod_1.z.boolean().optional()
        }).optional(),
        monitoring: zod_1.z.object({
            enableMetrics: zod_1.z.boolean().optional(),
            heartbeatInterval: zod_1.z.number().positive().optional(),
            connectionTimeout: zod_1.z.number().positive().optional()
        }).optional()
    });
    const validation = schema.safeParse(config);
    return {
        isValid: validation.success,
    } `
      errors: validation.success ? undefined : `;
    validation.error.issues.map(issue => $, { issue, : .path.join('.') }, $, { issue, : .message });
}
;
validateMCPConfig(config, (Record));
ValidationResult;
{
    const schema = zod_1.z.object({
        server: zod_1.z.object({
            name: zod_1.z.string(),
            version: zod_1.z.string(),
            port: zod_1.z.number().positive().optional(),
            host: zod_1.z.string().optional(),
            enableAuth: zod_1.z.boolean().optional(),
            logLevel: zod_1.z.enum(['error', 'warn', 'info', 'debug', 'trace']).optional()
        }),
        capabilities: zod_1.z.object({
            resources: zod_1.z.boolean().optional(),
            tools: zod_1.z.boolean().optional(),
            prompts: zod_1.z.boolean().optional(),
            logging: zod_1.z.boolean().optional()
        }).optional(),
        transport: zod_1.z.object({
            type: zod_1.z.enum(['stdio', 'websocket', 'http']),
            options: zod_1.z.record(zod_1.z.any()).optional()
        }).optional()
    });
    const validation = schema.safeParse(config);
    return {
        isValid: validation.success,
        errors: validation.success ? undefined : `
        validation.error.issues.map(issue => ${issue.path.join('.')}: ${issue.message}`
    };
}
validateClaudeConfig(config, (Record));
ValidationResult;
{
    const schema = zod_1.z.object({
        templateId: zod_1.z.string(),
        configuration: zod_1.z.object({
            maxConcurrentTasks: zod_1.z.number().positive(),
            timeout: zod_1.z.number().positive(),
            retryAttempts: zod_1.z.number().nonnegative(),
            logLevel: zod_1.z.enum(['debug', 'info', 'warn', 'error']),
            enableMetrics: zod_1.z.boolean(),
            enableCache: zod_1.z.boolean()
        }),
        permissions: zod_1.z.object({
            canCreateAgents: zod_1.z.boolean(),
            canDeleteAgents: zod_1.z.boolean(),
            canModifyAgents: zod_1.z.boolean(),
            canExecuteTasks: zod_1.z.boolean(),
            maxAgentsPerUser: zod_1.z.number().positive(),
            maxTasksPerDay: zod_1.z.number().positive()
        })
    });
    const validation = schema.safeParse(config);
    return {
        isValid: validation.success,
        errors: validation.success ? undefined :
            validation.error.issues.map(issue => $, { issue, : .path.join('.') }, $, { issue, : .message } `)
    };
  }

  private validatePydanticConfig(config: Record<string, any>): ValidationResult {
    const schema = z.object({
      model: z.string(),
      baseUrl: z.string().url().optional(),
      timeout: z.number().positive().optional(),
      retries: z.number().nonnegative().optional(),
      validation: z.object({
        strict: z.boolean().optional(),
        allowExtraFields: z.boolean().optional()
      }).optional()
    });

    const validation = schema.safeParse(config);
    
    return {
      isValid: validation.success,
      errors: validation.success ? undefined : 
        validation.error.issues.map(issue => ${issue.path.join('.')}: ${issue.message}`)
    };
}
normalizeA2AMessage(payload, any);
any;
{
    // Ensure required fields exist with defaults
    return {
        id: payload.id || Date.now().toString(),
        fromAgent: payload.fromAgent || 'unknown',
        toAgent: payload.toAgent || '*',
        type: payload.type || 'data_request',
        payload: payload.payload || {},
        priority: typeof payload.priority === 'string' ?
            parseInt(payload.priority) : (payload.priority || 3),
        timestamp: payload.timestamp || Date.now(),
        metadata: payload.metadata || {}
    };
}
normalizeMCPMessage(payload, any);
any;
{
    return {
        jsonrpc: '2.0',
        id: payload.id || Date.now().toString(),
        method: payload.method || 'unknown',
        params: payload.params || {}
    };
}
normalizeClaudeMessage(payload, any);
any;
{
    return {
        id: payload.id || Date.now().toString(),
        type: payload.type || 'task',
        agent: {
            id: payload.agent?.id || 'unknown',
            name: payload.agent?.name || 'Claude Agent',
            template: payload.agent?.template || 'default'
        },
        metadata: payload.metadata || {}
    };
}
/**
 * Clear validation cache
 */
clearCache();
void {
    this: .validationCache.clear(),
    this: .logger.log('Validation cache cleared')
};
/**
 * Get cache statistics
 */
getCacheStats();
{
    size: number;
    hitRate ?  : number;
}
{
    return {
        size: this.validationCache.size
    };
}
//# sourceMappingURL=ProtocolValidator.js.map