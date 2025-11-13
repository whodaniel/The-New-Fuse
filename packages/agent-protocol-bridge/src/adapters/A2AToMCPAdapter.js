"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var A2AToMCPAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AToMCPAdapter = void 0;
const common_1 = require("@nestjs/common");
const prisma_enums_1 = require("../types/prisma-enums");
const src_1 = require("../../a2a-core/src");
let A2AToMCPAdapter = A2AToMCPAdapter_1 = class A2AToMCPAdapter {
    name = 'A2A-to-MCP-Adapter';
    version = '1.0.0';
    supportedProtocols = [prisma_enums_1.ProtocolType.A2A_V1, prisma_enums_1.ProtocolType.A2A_V2, prisma_enums_1.ProtocolType.MCP];
    logger = new common_1.Logger(A2AToMCPAdapter_1.name);
    canTranslate(source, target) {
        return ((source === prisma_enums_1.ProtocolType.A2A_V1 || source === prisma_enums_1.ProtocolType.A2A_V2) &&
            target === prisma_enums_1.ProtocolType.MCP) || (source === prisma_enums_1.ProtocolType.MCP &&
            (target === prisma_enums_1.ProtocolType.A2A_V1 || target === prisma_enums_1.ProtocolType.A2A_V2));
    }
    async translate(message, targetProtocol) {
        if (message.protocol === prisma_enums_1.ProtocolType.MCP &&
            (targetProtocol === prisma_enums_1.ProtocolType.A2A_V1 || targetProtocol === prisma_enums_1.ProtocolType.A2A_V2)) {
            return this.mcpToA2A(message, targetProtocol);
        }
        else if ((message.protocol === prisma_enums_1.ProtocolType.A2A_V1 || message.protocol === prisma_enums_1.ProtocolType.A2A_V2) &&
            targetProtocol === prisma_enums_1.ProtocolType.MCP) {
            return this.a2aToMCP(message);
        }
        throw new Error(`Unsupported translation: ${message.protocol} -> ${targetProtocol}`);
    }
    async a2aToMCP(message) {
        const a2aMessage = message.payload;
        let mcpMethod;
        let mcpParams;
        // Map A2A message types to MCP methods
        switch (a2aMessage.type) {
            case src_1.A2AMessageType.DATA_REQUEST:
                mcpMethod = 'resources/read';
                mcpParams = {
                    uri: a2aMessage.metadata?.resourceUri || `a2a://request/${a2aMessage.id}`,
                    ...a2aMessage.payload
                };
                break;
            case src_1.A2AMessageType.DATA_RESPONSE:
                mcpMethod = 'resources/update';
                mcpParams = {
                    uri: a2aMessage.metadata?.resourceUri || `a2a://response/${a2aMessage.id}`,
                    content: JSON.stringify(a2aMessage.payload),
                    mimeType: 'application/json'
                };
                break;
            case src_1.A2AMessageType.TASK_ASSIGNMENT:
                mcpMethod = 'tools/call';
                mcpParams = {
                    name: a2aMessage.payload?.toolName || 'execute-task',
                    arguments: {
                        task: a2aMessage.payload,
                        fromAgent: a2aMessage.fromAgent,
                        toAgent: a2aMessage.toAgent,
                        priority: this.mapA2APriorityToNumber(a2aMessage.priority)
                    }
                };
                break;
            case src_1.A2AMessageType.STATUS_UPDATE:
                mcpMethod = 'notifications/message';
                mcpParams = {
                    level: 'info',
                    message: `Agent ${a2aMessage.fromAgent} status: ${JSON.stringify(a2aMessage.payload)}`
                };
                break;
            case src_1.A2AMessageType.HEARTBEAT:
                mcpMethod = 'ping';
                mcpParams = {
                    agentId: a2aMessage.fromAgent,
                    timestamp: a2aMessage.timestamp,
                    data: a2aMessage.payload
                };
                break;
            default:
                mcpMethod = 'resources/read';
                mcpParams = {
                    uri: `a2a://message/${a2aMessage.id}`,
                    messageType: a2aMessage.type,
                    payload: a2aMessage.payload
                };
        }
        const mcpMessage = {
            jsonrpc: '2.0',
            id: a2aMessage.id,
            method: mcpMethod,
            params: mcpParams
        };
        return {
            id: `mcp-${message.id}`,
            type: mcpMethod,
            protocol: prisma_enums_1.ProtocolType.MCP,
            payload: mcpMessage,
            metadata: {
                ...message.metadata,
                originalProtocol: message.protocol,
                originalMessageType: a2aMessage.type,
                translatedAt: new Date().toISOString()
            },
            timestamp: new Date()
        };
    }
    async mcpToA2A(message, targetProtocol) {
        const mcpMessage = message.payload;
        let a2aType;
        let a2aPayload;
        let priority = src_1.A2APriority.MEDIUM;
        // Map MCP methods to A2A message types
        switch (mcpMessage.method) {
            case 'resources/read':
                a2aType = src_1.A2AMessageType.DATA_REQUEST;
                a2aPayload = mcpMessage.params;
                break;
            case 'resources/update':
            case 'resources/create':
                a2aType = src_1.A2AMessageType.DATA_RESPONSE;
                a2aPayload = mcpMessage.params;
                break;
            case 'tools/call':
                a2aType = src_1.A2AMessageType.TASK_ASSIGNMENT;
                a2aPayload = mcpMessage.params;
                priority = this.extractPriorityFromMCPParams(mcpMessage.params);
                break;
            case 'notifications/message':
                a2aType = src_1.A2AMessageType.STATUS_UPDATE;
                a2aPayload = {
                    level: mcpMessage.params?.level,
                    message: mcpMessage.params?.message
                };
                break;
            case 'ping':
                a2aType = src_1.A2AMessageType.HEARTBEAT;
                a2aPayload = mcpMessage.params;
                break;
            default:
                a2aType = src_1.A2AMessageType.DATA_REQUEST;
                a2aPayload = mcpMessage.params || {};
        }
        const a2aMessage = {
            id: mcpMessage.id?.toString() || Date.now().toString(),
            fromAgent: message.metadata?.fromAgent || 'mcp-system',
            toAgent: message.metadata?.toAgent || '*',
            type: a2aType,
            payload: a2aPayload,
            priority: priority,
            timestamp: message.timestamp.getTime(),
            metadata: {
                originalProtocol: prisma_enums_1.ProtocolType.MCP,
                originalMethod: mcpMessage.method,
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
    mapA2APriorityToNumber(priority) {
        switch (priority) {
            case src_1.A2APriority.CRITICAL: return 1;
            case src_1.A2APriority.HIGH: return 2;
            case src_1.A2APriority.MEDIUM: return 3;
            case src_1.A2APriority.LOW: return 4;
            case src_1.A2APriority.BATCH: return 5;
            default: return 3;
        }
    }
    extractPriorityFromMCPParams(params) {
        const priorityNum = params?.priority || params?.arguments?.priority || 3;
        switch (priorityNum) {
            case 1: return src_1.A2APriority.CRITICAL;
            case 2: return src_1.A2APriority.HIGH;
            case 3: return src_1.A2APriority.MEDIUM;
            case 4: return src_1.A2APriority.LOW;
            case 5: return src_1.A2APriority.BATCH;
            default: return src_1.A2APriority.MEDIUM;
        }
    }
};
exports.A2AToMCPAdapter = A2AToMCPAdapter;
exports.A2AToMCPAdapter = A2AToMCPAdapter = A2AToMCPAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], A2AToMCPAdapter);
//# sourceMappingURL=A2AToMCPAdapter.js.map