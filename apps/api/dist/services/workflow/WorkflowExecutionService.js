"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowExecutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let WorkflowExecutionService = WorkflowExecutionService_1 = class WorkflowExecutionService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(WorkflowExecutionService_1.name);
    }
    /**
     * Run a workflow execution with best-effort node orchestration.
     */
    async run(executionId, definition, input = {}) {
        this.logger.log(`Running workflow execution ${executionId}`);
        const nodes = Array.isArray(definition?.nodes) ? definition.nodes : [];
        const edges = Array.isArray(definition?.edges) ? definition.edges : [];
        const nodeLogs = [];
        const runtimeContext = {
            executionId,
            input,
            nodeOutputs: {},
        };
        try {
            await this.db.workflows.updateExecution(executionId, {
                status: 'RUNNING',
                startedAt: new Date(),
            });
            if (nodes.length === 0) {
                throw new Error('Cannot execute workflow without nodes');
            }
            const targetIds = new Set(edges.map((e) => e.target));
            const startNodes = nodes.filter((n) => !targetIds.has(n.id));
            if (startNodes.length === 0 && nodes.length > 0) {
                startNodes.push(nodes[0]);
            }
            this.logger.log(`Found ${startNodes.length} start nodes for execution ${executionId}`);
            const visited = new Set();
            const queue = [...startNodes];
            while (queue.length > 0) {
                const node = queue.shift();
                if (!node || visited.has(node.id))
                    continue;
                visited.add(node.id);
                this.logger.log(`Executing node ${node.id} (${node.type})`);
                const stepStart = Date.now();
                const startedAt = new Date().toISOString();
                try {
                    const output = await this.executeNode(node, runtimeContext);
                    runtimeContext.nodeOutputs[node.id] = output;
                    nodeLogs.push({
                        nodeId: node.id,
                        nodeType: this.getNodeTypeLabel(node),
                        status: 'completed',
                        startedAt,
                        completedAt: new Date().toISOString(),
                        durationMs: Date.now() - stepStart,
                        output,
                    });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : 'Node execution failed';
                    nodeLogs.push({
                        nodeId: node.id,
                        nodeType: this.getNodeTypeLabel(node),
                        status: 'failed',
                        startedAt,
                        completedAt: new Date().toISOString(),
                        durationMs: Date.now() - stepStart,
                        error: message,
                    });
                    throw new Error(`Node ${node.id} failed: ${message}`);
                }
                const nextEdges = edges.filter((e) => e.source === node.id);
                for (const edge of nextEdges) {
                    const nextNode = nodes.find((n) => n.id === edge.target);
                    if (nextNode && !visited.has(nextNode.id)) {
                        queue.push(nextNode);
                    }
                }
            }
            await this.db.workflows.updateExecution(executionId, {
                status: 'COMPLETED',
                completedAt: new Date(),
                output: {
                    input: runtimeContext.input,
                    nodeOutputs: runtimeContext.nodeOutputs,
                    nodeCount: Object.keys(runtimeContext.nodeOutputs).length,
                },
                nodeExecutions: nodeLogs,
                logs: nodeLogs.map((log) => ({
                    timestamp: log.completedAt,
                    level: log.status === 'failed' ? 'error' : 'info',
                    message: log.status === 'failed'
                        ? `Node ${log.nodeId} failed: ${log.error}`
                        : `Node ${log.nodeId} completed`,
                    nodeId: log.nodeId,
                    durationMs: log.durationMs,
                })),
            });
            this.logger.log(`Workflow execution ${executionId} completed successfully`);
        }
        catch (error) {
            this.logger.error(`Workflow execution ${executionId} failed: ${error}`);
            await this.db.workflows.updateExecution(executionId, {
                status: 'FAILED',
                completedAt: new Date(),
                error: error.message,
                nodeExecutions: nodeLogs,
                logs: nodeLogs.map((log) => ({
                    timestamp: log.completedAt,
                    level: log.status === 'failed' ? 'error' : 'info',
                    message: log.status === 'failed'
                        ? `Node ${log.nodeId} failed: ${log.error}`
                        : `Node ${log.nodeId} completed`,
                    nodeId: log.nodeId,
                    durationMs: log.durationMs,
                })),
            });
        }
    }
    getNodeTypeLabel(node) {
        return String(node.type || node.data?.type || 'unknown').toLowerCase();
    }
    classifyNode(node) {
        const typeHints = [
            String(node.type || ''),
            String(node.data?.type || ''),
            String(node.data?.label || ''),
            String(node.id || ''),
        ]
            .join(' ')
            .toLowerCase();
        const cfg = this.resolveNodeConfig(node);
        const hasUrl = typeof cfg.url === 'string' && cfg.url.trim().length > 0;
        if (typeHints.includes('webhook') && typeHints.includes('trigger')) {
            return 'webhook-trigger';
        }
        if (typeHints.includes('webhook') && hasUrl) {
            return 'webhook-action';
        }
        if ((typeHints.includes('http') || typeHints.includes('api')) && hasUrl) {
            return 'http-request';
        }
        if (typeHints.includes('condition') ||
            typeHints.includes('branch') ||
            typeHints.includes('if')) {
            return 'condition';
        }
        return 'generic';
    }
    resolveNodeConfig(node) {
        const dataConfig = node.data && typeof node.data.config === 'object' && node.data.config !== null
            ? node.data.config
            : {};
        const nodeConfig = node.config && typeof node.config === 'object' ? node.config : {};
        return {
            ...dataConfig,
            ...nodeConfig,
        };
    }
    resolveNodeInput(node, context) {
        const config = this.resolveNodeConfig(node);
        const inputFrom = String(config.inputFrom || '').trim();
        if (inputFrom && context.nodeOutputs[inputFrom] !== undefined) {
            return context.nodeOutputs[inputFrom];
        }
        return context.input;
    }
    async executeNode(node, context) {
        const classifiedType = this.classifyNode(node);
        switch (classifiedType) {
            case 'webhook-trigger':
                return this.executeWebhookTriggerNode(node, context);
            case 'webhook-action':
            case 'http-request':
                return this.executeHttpNode(node, context);
            case 'condition':
                return this.executeConditionNode(node, context);
            default:
                return this.executeGenericNode(node, context);
        }
    }
    executeWebhookTriggerNode(node, context) {
        const incoming = context.input ?? {};
        return {
            trigger: 'webhook',
            nodeId: node.id,
            receivedAt: new Date().toISOString(),
            payload: incoming.payload ?? incoming,
            metadata: incoming.__trigger ?? null,
        };
    }
    async executeHttpNode(node, context) {
        const config = this.resolveNodeConfig(node);
        const url = String(config.url || config.endpoint || '').trim();
        if (!url) {
            throw new Error('HTTP/webhook node is missing url/endpoint in config');
        }
        const method = String(config.method || 'POST').toUpperCase();
        const timeoutMs = Number(config.timeoutMs || config.timeout || 10000);
        const sourceInput = this.resolveNodeInput(node, context);
        const bodyPayload = config.body !== undefined ? config.body : sourceInput;
        const headers = {};
        if (config.headers && typeof config.headers === 'object') {
            for (const [key, value] of Object.entries(config.headers)) {
                if (value !== undefined && value !== null) {
                    headers[String(key)] = String(value);
                }
            }
        }
        const shouldSendBody = !['GET', 'HEAD'].includes(method);
        if (shouldSendBody && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: shouldSendBody ? JSON.stringify(bodyPayload ?? {}) : undefined,
                signal: abortController.signal,
            });
            const rawText = await response.text();
            let responseBody = rawText;
            if (rawText) {
                try {
                    responseBody = JSON.parse(rawText);
                }
                catch {
                    responseBody = rawText;
                }
            }
            if (!response.ok && config.failOnStatus !== false) {
                throw new Error(`HTTP ${response.status} from ${url}`);
            }
            return {
                request: { url, method, timeoutMs },
                response: {
                    status: response.status,
                    ok: response.ok,
                    body: responseBody,
                },
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    executeConditionNode(node, context) {
        const cfg = this.resolveNodeConfig(node);
        const payload = this.resolveNodeInput(node, context) || {};
        const field = String(cfg.field || 'status');
        const operator = String(cfg.operator || 'eq').toLowerCase();
        const expected = cfg.value;
        const actual = this.readPath(payload, field);
        const passed = this.compareCondition(actual, operator, expected);
        return {
            field,
            operator,
            expected,
            actual,
            passed,
            branch: passed ? cfg.trueBranch || 'true' : cfg.falseBranch || 'false',
        };
    }
    async executeGenericNode(node, context) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        const payload = this.resolveNodeInput(node, context);
        return {
            nodeId: node.id,
            nodeType: this.getNodeTypeLabel(node),
            executedAt: new Date().toISOString(),
            inputPreview: payload && typeof payload === 'object'
                ? Object.keys(payload).slice(0, 8)
                : typeof payload,
        };
    }
    readPath(payload, fieldPath) {
        if (!fieldPath || typeof payload !== 'object' || payload === null) {
            return payload?.[fieldPath];
        }
        return fieldPath
            .split('.')
            .filter(Boolean)
            .reduce((acc, key) => (acc === undefined || acc === null ? acc : acc[key]), payload);
    }
    compareCondition(actual, operator, expected) {
        switch (operator) {
            case 'eq':
            case 'equals':
                return actual === expected;
            case 'neq':
            case 'not_equals':
                return actual !== expected;
            case 'contains':
                return String(actual ?? '').includes(String(expected ?? ''));
            case 'gt':
                return Number(actual) > Number(expected);
            case 'gte':
                return Number(actual) >= Number(expected);
            case 'lt':
                return Number(actual) < Number(expected);
            case 'lte':
                return Number(actual) <= Number(expected);
            case 'exists':
                return actual !== undefined && actual !== null;
            case 'truthy':
                return Boolean(actual);
            case 'falsy':
                return !actual;
            default:
                return actual === expected;
        }
    }
};
exports.WorkflowExecutionService = WorkflowExecutionService;
exports.WorkflowExecutionService = WorkflowExecutionService = WorkflowExecutionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], WorkflowExecutionService);
//# sourceMappingURL=WorkflowExecutionService.js.map