"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ClaudeToA2AAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeToA2AAdapter = void 0;
const common_1 = require("@nestjs/common");
const prisma_enums_1 = require("../types/prisma-enums");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
let ClaudeToA2AAdapter = ClaudeToA2AAdapter_1 = class ClaudeToA2AAdapter {
    name = 'Claude-to-A2A-Adapter';
    version = '1.0.0';
    supportedProtocols = [prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT, prisma_enums_1.ProtocolType.A2A_V1, prisma_enums_1.ProtocolType.A2A_V2];
    logger = new common_1.Logger(ClaudeToA2AAdapter_1.name);
    canTranslate(source, target) {
        return (source === prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT &&
            (target === prisma_enums_1.ProtocolType.A2A_V1 || target === prisma_enums_1.ProtocolType.A2A_V2)) || ((source === prisma_enums_1.ProtocolType.A2A_V1 || source === prisma_enums_1.ProtocolType.A2A_V2) &&
            target === prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT);
    }
    async translate(message, targetProtocol) {
        if (message.protocol === prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT &&
            (targetProtocol === prisma_enums_1.ProtocolType.A2A_V1 || targetProtocol === prisma_enums_1.ProtocolType.A2A_V2)) {
            return this.claudeToA2A(message, targetProtocol);
        }
        else if ((message.protocol === prisma_enums_1.ProtocolType.A2A_V1 || message.protocol === prisma_enums_1.ProtocolType.A2A_V2) &&
            targetProtocol === prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT) {
            return this.a2aToClaude(message);
        }
        throw new Error(`Unsupported translation: ${message.protocol} -> ${targetProtocol}`);
    }
    async claudeToA2A(message, targetProtocol) {
        const claudeMessage = message.payload;
        let a2aType;
        let a2aPayload;
        let priority = a2a_core_1.A2APriority.MEDIUM;
        // Map Claude message types to A2A
        switch (claudeMessage.type) {
            case 'task':
                a2aType = a2a_core_1.A2AMessageType.TASK_ASSIGNMENT;
                a2aPayload = {
                    taskId: claudeMessage.task?.id,
                    description: claudeMessage.task?.description,
                    parameters: claudeMessage.task?.parameters,
                    workflow: claudeMessage.task?.workflow,
                    templateId: claudeMessage.agent.template,
                    agentName: claudeMessage.agent.name
                };
                priority = this.determinePriorityFromTask(claudeMessage.task);
                break;
            case 'workflow':
                a2aType = a2a_core_1.A2AMessageType.WORKFLOW_COORDINATION;
                a2aPayload = {
                    workflow: claudeMessage.workflow,
                    agentId: claudeMessage.agent.id,
                    templateId: claudeMessage.agent.template,
                    steps: claudeMessage.workflow?.steps || []
                };
                priority = a2a_core_1.A2APriority.HIGH; // Workflows are typically high priority
                break;
            case 'template_assignment':
                a2aType = a2a_core_1.A2AMessageType.DATA_REQUEST;
                a2aPayload = {
                    action: 'assign_template',
                    template: claudeMessage.template,
                    agentId: claudeMessage.agent.id,
                    configuration: claudeMessage.template?.defaultConfiguration,
                    permissions: claudeMessage.template?.defaultPermissions
                };
                break;
            case 'status':
                a2aType = a2a_core_1.A2AMessageType.STATUS_UPDATE;
                a2aPayload = {
                    agentId: claudeMessage.agent.id,
                    agentName: claudeMessage.agent.name,
                    templateId: claudeMessage.agent.template,
                    status: claudeMessage.metadata?.status || 'active',
                    lastActivity: new Date().toISOString()
                };
                break;
            case 'result':
                a2aType = a2a_core_1.A2AMessageType.DATA_RESPONSE;
                a2aPayload = {
                    success: claudeMessage.result?.success,
                    data: claudeMessage.result?.data,
                    error: claudeMessage.result?.error,
                    agentId: claudeMessage.agent.id,
                    taskId: claudeMessage.metadata?.taskId
                };
                priority = claudeMessage.result?.success ? a2a_core_1.A2APriority.MEDIUM : a2a_core_1.A2APriority.HIGH;
                break;
            default:
                a2aType = a2a_core_1.A2AMessageType.DATA_REQUEST;
                a2aPayload = {
                    type: claudeMessage.type,
                    data: claudeMessage,
                    agentId: claudeMessage.agent.id
                };
        }
        const a2aMessage = {
            id: claudeMessage.id,
            fromAgent: claudeMessage.agent.id,
            toAgent: message.metadata?.toAgent || '*',
            type: a2aType,
            payload: a2aPayload,
            priority: priority,
            timestamp: message.timestamp.getTime(),
            metadata: {
                originalProtocol: prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT,
                originalType: claudeMessage.type,
                templateId: claudeMessage.agent.template,
                agentName: claudeMessage.agent.name,
                translatedAt: new Date().toISOString()
            }
        };
        return {
            id: `a2a-${message.id}`,
            type: a2aType,
            protocol: targetProtocol,
            payload: a2aMessage,
            metadata: {
                ...message.metadata,
                originalProtocol: message.protocol,
                translatedAt: new Date().toISOString()
            },
            timestamp: new Date()
        };
    }
    async a2aToClaude(message) {
        const a2aMessage = message.payload;
        let claudeType;
        let claudePayload;
        // Map A2A message types to Claude
        switch (a2aMessage.type) {
            case a2a_core_1.A2AMessageType.TASK_ASSIGNMENT:
                claudeType = 'task';
                claudePayload = {
                    task: {
                        id: a2aMessage.payload?.taskId || a2aMessage.id,
                        description: a2aMessage.payload?.description || 'Task from A2A',
                        parameters: a2aMessage.payload?.parameters || {},
                        workflow: a2aMessage.payload?.workflow
                    }
                };
                break;
            case a2a_core_1.A2AMessageType.WORKFLOW_COORDINATION:
                claudeType = 'workflow';
                claudePayload = {
                    workflow: a2aMessage.payload?.workflow || {
                        id: a2aMessage.id,
                        name: 'A2A Workflow',
                        description: 'Workflow from A2A system',
                        steps: a2aMessage.payload?.steps || [],
                        triggers: [],
                        outputs: []
                    }
                };
                break;
            case a2a_core_1.A2AMessageType.STATUS_UPDATE:
                claudeType = 'status';
                claudePayload = {
                    metadata: {
                        status: a2aMessage.payload?.status || 'active',
                        lastActivity: new Date().toISOString(),
                        ...a2aMessage.payload
                    }
                };
                break;
            case a2a_core_1.A2AMessageType.DATA_RESPONSE:
                claudeType = 'result';
                claudePayload = {
                    result: {
                        success: a2aMessage.payload?.success !== false,
                        data: a2aMessage.payload?.data,
                        error: a2aMessage.payload?.error
                    }
                };
                break;
            default:
                claudeType = 'task';
                claudePayload = {
                    task: {
                        id: a2aMessage.id,
                        description: `Handle A2A message: ${a2aMessage.type}`,
                        parameters: a2aMessage.payload || {}
                    }
                };
        }
        const claudeMessage = {
            id: a2aMessage.id,
            type: claudeType,
            agent: {
                id: a2aMessage.toAgent === '*' ? 'system' : a2aMessage.toAgent,
                name: a2aMessage.metadata?.agentName || 'A2A Agent',
                template: a2aMessage.metadata?.templateId || 'default-template'
            },
            metadata: {
                originalProtocol: message.protocol,
                originalType: a2aMessage.type,
                priority: a2aMessage.priority,
                translatedAt: new Date().toISOString(),
                ...a2aMessage.metadata
            },
            ...claudePayload
        };
        return {
            id: `claude-${message.id}`,
            type: claudeType,
            protocol: prisma_enums_1.ProtocolType.CLAUDE_SUB_AGENT,
            payload: claudeMessage,
            metadata: {
                ...message.metadata,
                originalProtocol: message.protocol,
                translatedAt: new Date().toISOString()
            },
            timestamp: new Date()
        };
    }
    determinePriorityFromTask(task) {
        if (!task)
            return a2a_core_1.A2APriority.MEDIUM;
        // Determine priority based on task characteristics
        if (task.description.toLowerCase().includes('urgent') ||
            task.description.toLowerCase().includes('critical')) {
            return a2a_core_1.A2APriority.CRITICAL;
        }
        if (task.description.toLowerCase().includes('high') ||
            task.workflow) {
            return a2a_core_1.A2APriority.HIGH;
        }
        if (task.description.toLowerCase().includes('background') ||
            task.description.toLowerCase().includes('batch')) {
            return a2a_core_1.A2APriority.BATCH;
        }
        return a2a_core_1.A2APriority.MEDIUM;
    }
};
exports.ClaudeToA2AAdapter = ClaudeToA2AAdapter;
exports.ClaudeToA2AAdapter = ClaudeToA2AAdapter = ClaudeToA2AAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], ClaudeToA2AAdapter);
//# sourceMappingURL=ClaudeToA2AAdapter.js.map