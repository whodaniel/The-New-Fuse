"use strict";
/**
 * Jules CLI Adapter
 *
 * Protocol adapter for integrating Google Jules CLI with The New Fuse agent protocol bridge.
 * Translates between A2A protocol messages and Jules CLI commands.
 *
 * @module JulesCLIAdapter
 * @since 2025-10-05
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JulesCLIAdapter = void 0;
const prisma_enums_1 = require("../types/prisma-enums");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
/**
 * Jules CLI Protocol Adapter
 * Bridges A2A protocol with Jules CLI commands
 */
class JulesCLIAdapter {
    config;
    name = 'JulesCLIAdapter';
    version = '1.0.0';
    supportedProtocols = [
        prisma_enums_1.ProtocolType.GOOGLE_JULES,
        prisma_enums_1.ProtocolType.A2A_V2,
    ];
    constructor(config = {}) {
        this.config = config;
        this.config = {
            theme: 'dark',
            defaultRepo: '.',
            autoLogin: true,
            ...config,
        };
    }
    /**
     * Translate A2A message to Jules CLI command
     */
    async translateToJules(message) {
        const messageType = message.type || a2a_core_1.A2AMessageType.TASK_ASSIGNMENT;
        switch (messageType) {
            case a2a_core_1.A2AMessageType.TASK_ASSIGNMENT:
                return this.translateTaskAssignment(message);
            case a2a_core_1.A2AMessageType.DATA_REQUEST:
                return this.translateDataRequest(message);
            case a2a_core_1.A2AMessageType.COLLABORATION_REQUEST:
                return this.translateCollaborationRequest(message);
            default:
                throw new Error(`Unsupported A2A message type for Jules: ${messageType});
    }
  }

  /**
   * Translate task assignment to Jules task
   */
  private translateTaskAssignment(message: A2AMessage): JulesTaskRequest {
    const payload = message.payload as any;

    return {
      repo: payload.repository || this.config.defaultRepo || '.',
      prompt: this.buildPromptFromTask(payload),
      sessionId: message.id,
      priority: this.mapPriority(message.priority),
      metadata: {
        taskId: payload.taskId,
        fromAgent: message.fromAgent,
        originalMessage: message,
      },
    };
  }

  /**
   * Translate data request to Jules task
   */
  private translateDataRequest(message: A2AMessage): JulesTaskRequest {
    const payload = message.payload as any;

    return {
      repo: payload.repository || this.config.defaultRepo || '.',`, prompt, `Analyze and extract: ${payload.query || payload.description}`, sessionId, message.id, metadata, {
                    type: 'data_request',
                    fromAgent: message.fromAgent,
                });
        }
        ;
    }
    /**
     * Translate collaboration request to Jules task
     */
    translateCollaborationRequest(message) {
        const payload = message.payload;
        return {
            repo: payload.repository || this.config.defaultRepo || '.',
            prompt: Collaborate, on: $
        };
        {
            payload.objective || payload.description;
        }
        sessionId: message.id,
            metadata;
        {
            type: 'collaboration',
                collaborators;
            payload.collaborators,
                fromAgent;
            message.fromAgent,
            ;
        }
    }
    ;
}
exports.JulesCLIAdapter = JulesCLIAdapter;
buildPromptFromTask(payload, any);
string;
{
    const parts = [];
    if (payload.title) {
        parts.push(payload.title);
    }
    if (payload.description) {
        parts.push(payload.description);
    }
    if (payload.requirements && Array.isArray(payload.requirements)) {
        parts.push('\nRequirements:');
        payload.requirements.forEach((req) => {
            `
        parts.push(- ${req}`;
        });
    }
    ;
}
if (payload.context) {
    parts.push(nContext, $, { JSON, : .stringify(payload.context, null, 2) });
}
return parts.join('\n');
mapPriority(a2aPriority ?  : a2a_core_1.A2APriority);
'low' | 'normal' | 'high';
{
    switch (a2aPriority) {
        case a2a_core_1.A2APriority.LOW:
            return 'low';
        case a2a_core_1.A2APriority.HIGH:
        case a2a_core_1.A2APriority.CRITICAL:
            return 'high';
        case a2a_core_1.A2APriority.MEDIUM:
        default:
            return 'normal';
    }
}
/**
 * Translate Jules response back to A2A message
 */
async;
translateFromJules(response, JulesTaskResponse);
Promise < a2a_core_1.A2AMessage > {
    const: status = this.mapStatusToA2AType(response.status),
    return: {
        id: response.sessionId,
        fromAgent: 'jules-cli',
        toAgent: response.metadata?.fromAgent || 'orchestrator',
        type: status,
        priority: a2a_core_1.A2APriority.MEDIUM,
        payload: {
            sessionId: response.sessionId,
            status: response.status,
            repo: response.repo,
            prompt: response.prompt,
            result: response.result,
            error: response.error,
            createdAt: response.createdAt,
            completedAt: response.completedAt,
            metadata: response.metadata,
        },
        timestamp: response.createdAt.getTime(),
        ttl: 3600000, // 1 hour
    }
};
mapStatusToA2AType(status, string);
a2a_core_1.A2AMessageType;
{
    switch (status) {
        case 'created':
        case 'running':
            return a2a_core_1.A2AMessageType.STATUS_UPDATE;
        case 'completed':
            return a2a_core_1.A2AMessageType.DATA_RESPONSE;
        case 'failed':
            return a2a_core_1.A2AMessageType.ERROR_NOTIFICATION;
        default:
            return a2a_core_1.A2AMessageType.STATUS_UPDATE;
    }
}
/**
 * Translate to Protocol Message format
 */
async;
translateToProtocolMessage(julesTask, JulesTaskRequest);
Promise < AgentProtocolBridge_1.ProtocolMessage > {
    return: {
        id: julesTask.sessionId || this.generateId(),
        type: 'jules_task',
        source: 'jules-cli',
        target: 'a2a-system',
        protocol: prisma_enums_1.ProtocolType.GOOGLE_JULES,
        payload: {
            repo: julesTask.repo,
            prompt: julesTask.prompt,
            priority: julesTask.priority,
            metadata: julesTask.metadata,
        },
        metadata: {
            protocol: prisma_enums_1.ProtocolType.GOOGLE_JULES,
            adapter: this.name,
            version: this.version,
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
    }
};
/**
 * Translate from Protocol Message to Jules task
 */
async;
translateFromProtocolMessage(message, AgentProtocolBridge_1.ProtocolMessage);
Promise < JulesTaskRequest > {
    const: payload = message.payload,
    return: {
        repo: payload.repo || this.config.defaultRepo || '.',
        prompt: payload.prompt || payload.description || 'Execute task',
        sessionId: message.id,
        priority: payload.priority || 'normal',
        metadata: {
            ...payload.metadata,
            originalMessageId: message.id,
        },
    }
} 
/**
 * Generate unique ID`
 */ `
  private generateId(): string {
    return jules_${Date.now()}`;
_$;
{
    Math.random().toString(36).substr(2, 9);
}
;
/**
 * Validate Jules task request
 */
validateTask(task, JulesTaskRequest);
{
    valid: boolean;
    errors: string[];
}
{
    const errors = [];
    if (!task.repo) {
        errors.push('Repository is required');
    }
    if (!task.prompt || task.prompt.trim().length === 0) {
        errors.push('Prompt is required');
    }
    if (task.prompt && task.prompt.length > 10000) {
        errors.push('Prompt exceeds maximum length of 10000 characters');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Build Jules CLI command string
 */
buildCLICommand(task, JulesTaskRequest);
string;
{
    const theme = this.config.theme || 'dark';
    `
    const escapedPrompt = task.prompt.replace(/"/g, '\\"');`;
    return jules;
    remote;
    new --;
    repo;
    "${task.repo}`"--;
    session;
    "${escapedPrompt}"--;
    theme;
    $;
    {
        theme;
    }
    `;
  }

  /**
   * Parse Jules CLI output to extract session info
   */
  parseSessionOutput(output: string): { sessionId?: string; status: string; message: string } {
    const sessionIdMatch = output.match(/Session\s+ID:\s*(\d+)/i) || output.match(/\d+/);
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
   * Check if adapter supports a given protocol
   */
  supportsProtocol(protocol: ProtocolType): boolean {
    return this.supportedProtocols.includes(protocol);
  }

  /**
   * Get adapter capabilities
   */
  getCapabilities(): string[] {
    return [
      'async_task_execution',
      'github_integration',
      'code_generation',
      'bug_fixing',
      'test_writing',
      'documentation_generation',
      'dependency_updates',
      'batch_operations',
    ];
  }
}
    ;
}
//# sourceMappingURL=JulesCLIAdapter.js.map