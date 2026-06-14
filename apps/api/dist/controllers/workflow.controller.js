"use strict";
// @ts-nocheck
/**
 * Workflow Controller - Production ready REST API for workflow management
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkflowController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const database_1 = require("@the-new-fuse/database");
// @ts-ignore
// @ts-ignore
const schema_1 = require("@the-new-fuse/database/drizzle/schema");
const WorkflowExecutionService_1 = require("../services/workflow/WorkflowExecutionService");
let WorkflowController = WorkflowController_1 = class WorkflowController {
    constructor(db, executionService) {
        this.db = db;
        this.executionService = executionService;
        this.logger = new common_1.Logger(WorkflowController_1.name);
    }
    // GET /api/workflows
    async getWorkflows(query, res) {
        try {
            const { page = 1, limit = 20, status, search } = query;
            const skip = (Number(page) - 1) * Number(limit);
            const conditions = [(0, database_1.sql) `${schema_1.workflows.deletedAt} IS NULL`];
            if (status) {
                conditions.push((0, database_1.eq)(schema_1.workflows.status, status));
            }
            if (search) {
                conditions.push((0, database_1.or)((0, database_1.ilike)(schema_1.workflows.name, `%${search}%`), (0, database_1.ilike)(schema_1.workflows.description, `%${search}%`)));
            }
            const whereClause = (0, database_1.and)(...conditions);
            // Fetch workflows with query builder for relational data
            // Using Relational Query API if possible, or query builder
            const result = await this.db.client.query.workflows.findMany({
                where: whereClause,
                orderBy: [(0, database_1.desc)(schema_1.workflows.updatedAt)],
                limit: Number(limit),
                offset: skip,
                with: {
                    executions: {
                        limit: 1,
                        orderBy: (executions, { desc }) => [desc(executions.startedAt)],
                    },
                },
            });
            // Get total count
            // Drizzle count is a bit manual
            const [countResult] = await this.db.client
                .select({ count: (0, database_1.sql) `cast(count(*) as int)` })
                .from(schema_1.workflows)
                .where(whereClause);
            const total = countResult?.count ?? 0;
            res.json({
                workflows: result,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to get workflows: ${error}`);
            res.status(500).json({ error: 'Failed to get workflows' });
        }
    }
    // GET /api/workflows/:id
    async getWorkflow(id, res) {
        try {
            const workflow = await this.db.client.query.workflows.findFirst({
                where: (0, database_1.eq)(schema_1.workflows.id, id),
                with: {
                    executions: {
                        orderBy: (executions, { desc }) => [desc(executions.startedAt)],
                        limit: 10,
                    },
                    steps: {
                        orderBy: (steps, { asc }) => [asc(steps.order)],
                    },
                },
            });
            if (!workflow) {
                res.status(404).json({ error: 'Workflow not found' });
                return;
            }
            res.json(workflow);
        }
        catch (error) {
            this.logger.error(`Failed to get workflow: ${error}`);
            res.status(500).json({ error: 'Failed to get workflow' });
        }
    }
    // POST /api/workflows
    async createWorkflow(workflowData, res, req) {
        // Using @Query for req hack or inject Request properly
        // Assuming Request is injected via context if properly typed, but cleaner to use @Req() or standard Express request
        try {
            // Basic validation - ensure required fields are present
            if (!workflowData.name) {
                res.status(400).json({
                    error: 'Invalid workflow',
                    details: ['Name is required'],
                });
                return;
            }
            const userId = workflowData.userId; // Or extract from request if auth setup matches
            const workflow = await this.db.workflows.createWorkflow({
                name: workflowData.name,
                description: workflowData.description || '',
                definition: {
                    nodes: workflowData.nodes || [],
                    edges: workflowData.edges || [],
                    version: workflowData.version || 1,
                    tags: workflowData.tags || [],
                },
                triggers: Array.isArray(workflowData.triggers) ? workflowData.triggers : [],
                variables: workflowData.variables && typeof workflowData.variables === 'object'
                    ? workflowData.variables
                    : {},
                status: workflowData.status || 'DRAFT',
                creatorId: userId,
                usageCount: 0,
            }); // Cast as needed for optional fields
            this.logger.log(`Created workflow: ${workflow.name} (${workflow.id})`);
            res.status(201).json(workflow);
        }
        catch (error) {
            this.logger.error(`Failed to create workflow: ${error}`);
            res.status(500).json({ error: 'Failed to create workflow' });
        }
    }
    // PATCH /api/workflows/:id
    async updateWorkflow(id, updates, res) {
        try {
            // Basic validation - ensure name is provided if being updated
            if (updates.name === '') {
                res.status(400).json({
                    error: 'Invalid workflow',
                    details: ['Name cannot be empty'],
                });
                return;
            }
            const updateData = {};
            if (updates.name)
                updateData.name = updates.name;
            if (updates.description !== undefined)
                updateData.description = updates.description;
            if (updates.status)
                updateData.status = updates.status;
            if (updates.triggers !== undefined) {
                updateData.triggers = Array.isArray(updates.triggers) ? updates.triggers : [];
            }
            if (updates.variables !== undefined && typeof updates.variables === 'object') {
                updateData.variables = updates.variables;
            }
            if (updates.nodes || updates.edges) {
                updateData.definition = {
                    nodes: updates.nodes || [],
                    edges: updates.edges || [],
                    version: updates.version || 1,
                    tags: updates.tags || [],
                };
            }
            const workflow = await this.db.workflows.updateWorkflow(id, updateData);
            if (!workflow) {
                res.status(404).json({ error: 'Workflow not found' });
                return;
            }
            this.logger.log(`Updated workflow: ${workflow.name} (${workflow.id})`);
            res.json(workflow);
        }
        catch (error) {
            this.logger.error(`Failed to update workflow: ${error}`);
            res.status(500).json({ error: 'Failed to update workflow' });
        }
    }
    // POST /api/workflows/:id/publish
    async publishWorkflow(id, res) {
        try {
            const workflow = await this.db.workflows.updateWorkflow(id, {
                status: 'ACTIVE',
            });
            if (!workflow) {
                res.status(404).json({ error: 'Workflow not found' });
                return;
            }
            this.logger.log(`Published workflow: ${workflow.name} (${workflow.id})`);
            res.json({
                ...workflow,
                publication: {
                    status: 'published',
                    publishedAt: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to publish workflow: ${error}`);
            res.status(500).json({ error: 'Failed to publish workflow' });
        }
    }
    // DELETE /api/workflows/:id
    async deleteWorkflow(id, res) {
        try {
            const deleted = await this.db.workflows.softDeleteWorkflow(id);
            if (!deleted) {
                // Check if it exists at all
                const exists = await this.db.workflows.findWorkflowById(id);
                if (!exists) {
                    res.status(404).json({ error: 'Workflow not found' });
                    return;
                }
                res.status(500).json({ error: 'Failed to delete workflow' });
                return;
            }
            this.logger.log(`Deleted workflow: ${id}`);
            res.status(204).send();
        }
        catch (error) {
            this.logger.error(`Failed to delete workflow: ${error}`);
            res.status(500).json({ error: 'Failed to delete workflow' });
        }
    }
    // POST /api/workflows/execute
    async executeWorkflow(body, res) {
        try {
            const { workflowId, definition, input = {}, triggerType = 'manual', triggerId = null, triggerSource = null, } = body;
            if (!workflowId && !definition) {
                res.status(400).json({ error: 'Either workflowId or definition is required' });
                return;
            }
            let workflow;
            let targetDefinition = definition;
            if (workflowId) {
                workflow = await this.db.workflows.findWorkflowById(workflowId);
                if (!workflow) {
                    res.status(404).json({ error: 'Workflow not found' });
                    return;
                }
                targetDefinition = definition || workflow.definition;
            }
            // Basic validation - ensure workflow has definition
            const nodes = targetDefinition?.nodes || [];
            if (!nodes || nodes.length === 0) {
                res.status(400).json({
                    error: 'Cannot execute workflow without nodes',
                });
                return;
            }
            // Create execution record
            const execution = await this.db.workflows.createExecution({
                workflowId: workflowId || null,
                status: 'RUNNING',
                input: input,
                definition: targetDefinition, // Store definition used for this execution
                startedAt: new Date(),
                metadata: {
                    triggerType,
                    triggerId,
                    triggerSource,
                },
            });
            this.logger.log(`Started execution: ${execution.id} for ${workflowId ? `workflow: ${workflowId}` : 'dynamic definition'}`);
            // Trigger real execution engine here (background)
            void this.executionService.run(execution.id, targetDefinition, input);
            res.status(201).json(execution);
        }
        catch (error) {
            this.logger.error(`Failed to execute workflow: ${error}`);
            res.status(500).json({ error: 'Failed to execute workflow' });
        }
    }
    // POST /api/workflows/:id/webhook
    async executeWorkflowViaWebhook(workflowId, payload, headers, res) {
        await this.handleWorkflowWebhookExecution(workflowId, undefined, payload, headers, res);
    }
    // POST /api/workflows/:id/webhook/:triggerId
    async executeWorkflowViaWebhookTrigger(workflowId, triggerId, payload, headers, res) {
        await this.handleWorkflowWebhookExecution(workflowId, triggerId, payload, headers, res);
    }
    // GET /api/workflows/executions/:executionId
    async getExecution(executionId, res) {
        try {
            // findExecutionById in repo doesn't include workflow relation.
            // Use query builder
            const execution = await this.db.client.query.workflowExecutions.findFirst({
                where: (0, database_1.eq)(schema_1.workflowExecutions.id, executionId),
                with: {
                    workflow: true,
                },
            });
            if (!execution) {
                res.status(404).json({ error: 'Execution not found' });
                return;
            }
            res.json(execution);
        }
        catch (error) {
            this.logger.error(`Failed to get execution: ${error}`);
            res.status(500).json({ error: 'Failed to get execution' });
        }
    }
    // GET /api/workflows/executions or /api/workflows/:workflowId/executions
    // NestJS routing order matters. Using different method names or paths.
    // Original was vague. Let's assume standard query params.
    async getExecutions(query, res) {
        try {
            const { workflowId, page = 1, limit = 20, status } = query;
            const skip = (Number(page) - 1) * Number(limit);
            const conditions = [];
            if (workflowId) {
                conditions.push((0, database_1.eq)(schema_1.workflowExecutions.workflowId, workflowId));
            }
            if (status) {
                conditions.push((0, database_1.eq)(schema_1.workflowExecutions.status, status));
            }
            const whereClause = conditions.length > 0 ? (0, database_1.and)(...conditions) : undefined;
            const result = await this.db.client.query.workflowExecutions.findMany({
                where: whereClause,
                offset: skip,
                limit: Number(limit),
                orderBy: [(0, database_1.desc)(schema_1.workflowExecutions.startedAt)],
                with: {
                    workflow: {
                        columns: { id: true, name: true },
                    },
                },
            });
            const [countResult] = await this.db.client
                .select({ count: (0, database_1.sql) `cast(count(*) as int)` })
                .from(schema_1.workflowExecutions)
                .where(whereClause);
            const total = countResult?.count ?? 0;
            res.json({
                executions: result,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to get executions: ${error}`);
            res.status(500).json({ error: 'Failed to get executions' });
        }
    }
    // POST /api/workflows/executions/:executionId/cancel
    async cancelExecution(executionId, res) {
        try {
            // Drizzle update
            const [execution] = await this.db.client
                .update(schema_1.workflowExecutions)
                .set({ status: 'CANCELLED', completedAt: new Date() })
                .where((0, database_1.eq)(schema_1.workflowExecutions.id, executionId))
                .returning();
            if (!execution) {
                res.status(404).json({ error: 'Execution not found' });
                return;
            }
            this.logger.log(`Cancelled execution: ${executionId}`);
            res.json(execution);
        }
        catch (error) {
            this.logger.error(`Failed to cancel execution: ${error}`);
            res.status(500).json({ error: 'Failed to cancel execution' });
        }
    }
    // POST /api/workflows/executions/:executionId/pause
    async pauseExecution(executionId, res) {
        try {
            const [execution] = await this.db.client
                .update(schema_1.workflowExecutions)
                .set({ status: 'PAUSED' })
                .where((0, database_1.eq)(schema_1.workflowExecutions.id, executionId))
                .returning();
            if (!execution) {
                res.status(404).json({ error: 'Execution not found' });
                return;
            }
            this.logger.log(`Paused execution: ${executionId}`);
            res.json(execution);
        }
        catch (error) {
            this.logger.error(`Failed to pause execution: ${error}`);
            res.status(500).json({ error: 'Failed to pause execution' });
        }
    }
    // POST /api/workflows/executions/:executionId/resume
    async resumeExecution(executionId, res) {
        try {
            const [execution] = await this.db.client
                .update(schema_1.workflowExecutions)
                .set({ status: 'RUNNING' })
                .where((0, database_1.eq)(schema_1.workflowExecutions.id, executionId))
                .returning();
            if (!execution) {
                res.status(404).json({ error: 'Execution not found' });
                return;
            }
            this.logger.log(`Resumed execution: ${executionId}`);
            res.json(execution);
        }
        catch (error) {
            this.logger.error(`Failed to resume execution: ${error}`);
            res.status(500).json({ error: 'Failed to resume execution' });
        }
    }
    // POST /api/workflows/validate
    async validateWorkflow(workflow, res) {
        try {
            // Basic validation
            const errors = [];
            if (!workflow.name || workflow.name.trim() === '') {
                errors.push('Name is required');
            }
            if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
                errors.push('Nodes must be an array');
            }
            if (!workflow.edges || !Array.isArray(workflow.edges)) {
                errors.push('Edges must be an array');
            }
            res.json({
                valid: errors.length === 0,
                errors,
            });
        }
        catch (error) {
            this.logger.error(`Failed to validate workflow: ${error}`);
            res.status(500).json({ error: 'Failed to validate workflow' });
        }
    }
    // GET /api/workflows/templates
    async getTemplates(_req, res) {
        try {
            const templates = await this.db.workflows.findPublicTemplates();
            res.json(templates);
        }
        catch (error) {
            this.logger.error(`Failed to get workflow templates: ${error}`);
            res.status(500).json({ error: 'Failed to get templates' });
        }
    }
    // GET /api/workflows/templates/:id
    async getTemplate(id, res) {
        try {
            const template = await this.db.workflows.findTemplateById(id);
            if (!template) {
                res.status(404).json({ error: 'Template not found' });
                return;
            }
            res.json(template);
        }
        catch (error) {
            this.logger.error(`Failed to get template: ${error}`);
            res.status(500).json({ error: 'Failed to get template' });
        }
    }
    // POST /api/workflows/from-template
    async createFromTemplate(body, res) {
        try {
            const { templateId, name, userId } = body;
            if (!templateId) {
                res.status(400).json({ error: 'templateId required' });
                return;
            }
            const template = await this.db.workflows.findTemplateById(templateId);
            if (!template) {
                res.status(404).json({ error: 'Template not found' });
                return;
            }
            const workflow = await this.db.workflows.createWorkflow({
                name: name || template.name,
                description: template.description || '',
                definition: template.definition,
                status: 'DRAFT',
                creatorId: userId,
                usageCount: 0,
            });
            // Increment usage
            await this.db.workflows.incrementTemplateUsage(templateId);
            res.status(201).json(workflow);
        }
        catch (error) {
            this.logger.error(`Failed to create workflow from template: ${error}`);
            res.status(500).json({ error: 'Failed to create workflow from template' });
        }
    }
    async handleWorkflowWebhookExecution(workflowId, requestedTriggerId, payload, headers, res) {
        try {
            const workflow = await this.db.workflows.findWorkflowById(workflowId);
            if (!workflow) {
                res.status(404).json({ error: 'Workflow not found' });
                return;
            }
            const providedSecret = this.readHeader(headers, 'x-workflow-secret') ||
                this.readHeader(headers, 'x-webhook-secret') ||
                this.readHeader(headers, 'x-tnf-webhook-secret');
            const triggerValidation = this.resolveWebhookTrigger(workflow.triggers, requestedTriggerId, payload, providedSecret);
            if (!triggerValidation.allowed) {
                res.status(triggerValidation.status).json({
                    error: triggerValidation.reason,
                    workflowId,
                    triggerId: requestedTriggerId || null,
                });
                return;
            }
            const targetDefinition = workflow.definition;
            const nodes = targetDefinition?.nodes || [];
            if (!Array.isArray(nodes) || nodes.length === 0) {
                res.status(400).json({ error: 'Cannot execute workflow without nodes' });
                return;
            }
            const triggerEnvelope = {
                type: 'webhook',
                triggerId: triggerValidation.triggerId || null,
                triggerName: triggerValidation.triggerName || null,
                source: this.readHeader(headers, 'x-workflow-source') || 'external',
                receivedAt: new Date().toISOString(),
            };
            const execution = await this.db.workflows.createExecution({
                workflowId,
                status: 'RUNNING',
                input: {
                    payload,
                    headers: this.pickHeaderSubset(headers),
                    __trigger: triggerEnvelope,
                },
                definition: targetDefinition,
                startedAt: new Date(),
                metadata: {
                    triggerType: 'webhook',
                    triggerId: triggerEnvelope.triggerId,
                    triggerName: triggerEnvelope.triggerName,
                    triggerSource: triggerEnvelope.source,
                },
            });
            void this.executionService.run(execution.id, targetDefinition, {
                payload,
                headers: this.pickHeaderSubset(headers),
                __trigger: triggerEnvelope,
            });
            res.status(202).json({
                executionId: execution.id,
                status: 'RUNNING',
                workflowId,
                trigger: triggerEnvelope,
            });
        }
        catch (error) {
            this.logger.error(`Failed to execute workflow ${workflowId} via webhook: ${error}`);
            res.status(500).json({ error: 'Failed to execute workflow via webhook' });
        }
    }
    resolveWebhookTrigger(rawTriggers, requestedTriggerId, payload, providedSecret) {
        const triggers = Array.isArray(rawTriggers) ? rawTriggers : [];
        const webhookTriggers = triggers.filter((trigger) => String(trigger?.type || '').toLowerCase() === 'webhook');
        if (webhookTriggers.length === 0) {
            return { allowed: true, status: 200 };
        }
        let selectedTrigger;
        if (requestedTriggerId) {
            selectedTrigger = webhookTriggers.find((trigger) => [trigger?.id, trigger?.name, trigger?.slug, trigger?.key]
                .filter(Boolean)
                .map((value) => String(value))
                .includes(requestedTriggerId));
            if (!selectedTrigger) {
                return {
                    allowed: false,
                    status: 404,
                    reason: `Webhook trigger "${requestedTriggerId}" not found`,
                };
            }
        }
        else {
            selectedTrigger = webhookTriggers[0];
        }
        if (selectedTrigger?.enabled === false) {
            return {
                allowed: false,
                status: 423,
                reason: 'Webhook trigger is disabled',
            };
        }
        const expectedSecret = this.getTriggerSecret(selectedTrigger);
        if (expectedSecret && expectedSecret !== providedSecret) {
            return {
                allowed: false,
                status: 401,
                reason: 'Invalid webhook secret',
            };
        }
        const conditions = Array.isArray(selectedTrigger?.conditions)
            ? selectedTrigger.conditions
            : [];
        const conditionsMatched = conditions.every((condition) => this.evaluateTriggerCondition(condition, payload));
        if (!conditionsMatched) {
            return {
                allowed: false,
                status: 412,
                reason: 'Webhook payload did not satisfy trigger conditions',
            };
        }
        return {
            allowed: true,
            status: 200,
            triggerId: selectedTrigger?.id ? String(selectedTrigger.id) : requestedTriggerId || 'webhook',
            triggerName: selectedTrigger?.name ? String(selectedTrigger.name) : 'webhook',
        };
    }
    evaluateTriggerCondition(condition, payload) {
        const field = String(condition?.field || condition?.path || '').trim();
        if (!field)
            return true;
        const operator = String(condition?.operator || 'equals').toLowerCase();
        const expectedValue = condition?.value;
        const actualValue = this.readPath(payload, field);
        switch (operator) {
            case 'equals':
            case 'eq':
                return actualValue === expectedValue;
            case 'not_equals':
            case 'neq':
                return actualValue !== expectedValue;
            case 'contains':
                return String(actualValue ?? '').includes(String(expectedValue ?? ''));
            case 'exists':
                return actualValue !== undefined && actualValue !== null;
            case 'gt':
                return Number(actualValue) > Number(expectedValue);
            case 'gte':
                return Number(actualValue) >= Number(expectedValue);
            case 'lt':
                return Number(actualValue) < Number(expectedValue);
            case 'lte':
                return Number(actualValue) <= Number(expectedValue);
            default:
                return actualValue === expectedValue;
        }
    }
    readPath(payload, fieldPath) {
        if (!fieldPath)
            return payload;
        if (payload === undefined || payload === null)
            return undefined;
        return fieldPath
            .split('.')
            .filter(Boolean)
            .reduce((acc, key) => (acc === undefined || acc === null ? acc : acc[key]), payload);
    }
    getTriggerSecret(trigger) {
        const secretCandidate = trigger?.secret ||
            trigger?.config?.secret ||
            trigger?.configuration?.secret ||
            trigger?.metadata?.secret;
        if (!secretCandidate)
            return undefined;
        return String(secretCandidate);
    }
    readHeader(headers, name) {
        const raw = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
        if (Array.isArray(raw))
            return raw[0];
        if (typeof raw === 'string')
            return raw;
        return undefined;
    }
    pickHeaderSubset(headers) {
        const keys = [
            'content-type',
            'user-agent',
            'x-forwarded-for',
            'x-workflow-source',
            'x-workflow-event',
            'x-request-id',
        ];
        const out = {};
        for (const key of keys) {
            const value = this.readHeader(headers, key);
            if (value)
                out[key] = value;
        }
        return out;
    }
};
exports.WorkflowController = WorkflowController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflows", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflow", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "createWorkflow", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "updateWorkflow", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "publishWorkflow", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "deleteWorkflow", null);
__decorate([
    (0, common_1.Post)('execute'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "executeWorkflow", null);
__decorate([
    (0, common_1.Post)(':id/webhook'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "executeWorkflowViaWebhook", null);
__decorate([
    (0, common_1.Post)(':id/webhook/:triggerId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('triggerId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "executeWorkflowViaWebhookTrigger", null);
__decorate([
    (0, common_1.Get)('executions/:executionId'),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getExecution", null);
__decorate([
    (0, common_1.Get)('executions'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getExecutions", null);
__decorate([
    (0, common_1.Post)('executions/:executionId/cancel'),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "cancelExecution", null);
__decorate([
    (0, common_1.Post)('executions/:executionId/pause'),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "pauseExecution", null);
__decorate([
    (0, common_1.Post)('executions/:executionId/resume'),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "resumeExecution", null);
__decorate([
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "validateWorkflow", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('from-template'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "createFromTemplate", null);
exports.WorkflowController = WorkflowController = WorkflowController_1 = __decorate([
    (0, common_1.Controller)('workflows'),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        WorkflowExecutionService_1.WorkflowExecutionService])
], WorkflowController);
//# sourceMappingURL=workflow.controller.js.map