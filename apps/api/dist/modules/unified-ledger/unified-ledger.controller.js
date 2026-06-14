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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UnifiedLedgerController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedLedgerController = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const analyzer_service_1 = require("../../agents/analyzer.service");
const auth_policy_1 = require("../../auth/auth-policy");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../decorators/current-user.decorator");
const unified_ledger_service_1 = require("./unified-ledger.service");
let UnifiedLedgerController = UnifiedLedgerController_1 = class UnifiedLedgerController {
    constructor(ledger, db, analyzer) {
        this.ledger = ledger;
        this.db = db;
        this.analyzer = analyzer;
        this.logger = new common_1.Logger(UnifiedLedgerController_1.name);
    }
    requireUserId(user) {
        const userId = [user?.id, user?.sub, user?.user_id, user?.userId]
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .find((value) => value.length > 0);
        if (!userId) {
            throw new common_1.UnauthorizedException('Missing authenticated user');
        }
        return userId;
    }
    resolveTenantId(user) {
        const tenantId = user?.tenantId;
        if (typeof tenantId !== 'string') {
            return undefined;
        }
        const normalized = tenantId.trim();
        return normalized.length > 0 ? normalized : undefined;
    }
    resolveTenantIdHint(value) {
        if (typeof value !== 'string') {
            return undefined;
        }
        const normalized = value.trim();
        return normalized.length > 0 ? normalized : undefined;
    }
    resolveWorkspaceId(value) {
        if (typeof value !== 'string') {
            return undefined;
        }
        const normalized = value.trim();
        return normalized.length > 0 ? normalized : undefined;
    }
    resolveAuthenticatedWorkspaceId(user) {
        const directWorkspaceId = this.resolveWorkspaceId(user?.workspaceId);
        if (directWorkspaceId) {
            return directWorkspaceId;
        }
        const activeWorkspaceId = this.resolveWorkspaceId(user?.activeWorkspaceId);
        if (activeWorkspaceId) {
            return activeWorkspaceId;
        }
        const currentWorkspaceId = this.resolveWorkspaceId(user?.currentWorkspaceId);
        if (currentWorkspaceId) {
            return currentWorkspaceId;
        }
        const contextWorkspaceId = this.resolveWorkspaceId(user?.context?.workspaceId);
        if (contextWorkspaceId) {
            return contextWorkspaceId;
        }
        const scopeWorkspaceId = this.resolveWorkspaceId(user?.scope?.workspaceId);
        if (scopeWorkspaceId) {
            return scopeWorkspaceId;
        }
        return undefined;
    }
    buildScope(user, workspaceHint, tenantHint) {
        const privileged = (0, auth_policy_1.isPrivilegedUser)(user || {});
        const authenticatedTenantId = this.resolveTenantId(user);
        const hintedTenantId = this.resolveTenantIdHint(tenantHint);
        if (authenticatedTenantId &&
            hintedTenantId &&
            authenticatedTenantId !== hintedTenantId &&
            !privileged) {
            throw new common_1.ForbiddenException('tenantId mismatch with authenticated user tenant scope');
        }
        const authenticatedWorkspaceId = this.resolveAuthenticatedWorkspaceId(user);
        const hintedWorkspaceId = this.resolveWorkspaceId(workspaceHint);
        if (authenticatedWorkspaceId &&
            hintedWorkspaceId &&
            authenticatedWorkspaceId !== hintedWorkspaceId &&
            !privileged) {
            throw new common_1.ForbiddenException('workspaceId mismatch with authenticated workspace scope');
        }
        const resolvedWorkspaceId = authenticatedWorkspaceId &&
            (!hintedWorkspaceId || authenticatedWorkspaceId === hintedWorkspaceId)
            ? authenticatedWorkspaceId
            : hintedWorkspaceId;
        return {
            tenantId: privileged ? hintedTenantId || authenticatedTenantId : authenticatedTenantId,
            workspaceId: resolvedWorkspaceId,
        };
    }
    scopeArgs(scope) {
        if (!scope.tenantId && !scope.workspaceId) {
            return [];
        }
        return [scope];
    }
    withScope(payload, scope) {
        return {
            ...payload,
            ...(scope.tenantId ? { tenantId: scope.tenantId } : {}),
            ...(scope.workspaceId ? { workspaceId: scope.workspaceId } : {}),
        };
    }
    async assertWorkspaceWriteAccess(user, userId, workspaceId) {
        if (!workspaceId) {
            return;
        }
        const workspace = await this.db.workspaces.findByIdWithOwner(workspaceId);
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        if ((0, auth_policy_1.isPrivilegedUser)(user || {})) {
            return;
        }
        if (workspace.ownerId === userId) {
            return;
        }
        const membership = await this.db.workspaceMembers.findMembership(workspaceId, userId);
        if (!membership) {
            throw new common_1.ForbiddenException('Workspace access denied');
        }
    }
    tenantOnlyScope(scope) {
        if (!scope.tenantId) {
            return {};
        }
        return { tenantId: scope.tenantId };
    }
    async resolveWriteScope(user, userId, scope, workspaceResolver) {
        let resolvedScope = scope;
        if (!resolvedScope.workspaceId && workspaceResolver) {
            const entity = await workspaceResolver();
            const derivedWorkspaceId = this.resolveWorkspaceId(entity?.workspaceId);
            if (derivedWorkspaceId) {
                resolvedScope = { ...resolvedScope, workspaceId: derivedWorkspaceId };
            }
        }
        await this.assertWorkspaceWriteAccess(user, userId, resolvedScope.workspaceId);
        return resolvedScope;
    }
    mapIssueSeverityToPriority(severity) {
        if (severity === 'critical') {
            return 'critical';
        }
        if (severity === 'high') {
            return 'high';
        }
        if (severity === 'low') {
            return 'low';
        }
        return 'medium';
    }
    normalizeSuggestionKey(value) {
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }
    async ingestAnalyzerSuggestions(owner, scope, existing) {
        if (!this.analyzer) {
            return 0;
        }
        try {
            const issues = await this.analyzer.getSuggestions();
            if (!Array.isArray(issues) || issues.length === 0) {
                return 0;
            }
            const existingKeys = new Set(existing
                .map((record) => typeof record?.title === 'string' ? this.normalizeSuggestionKey(record.title) : '')
                .filter((value) => value.length > 0));
            let created = 0;
            for (const issue of issues) {
                const title = String(issue?.suggestion || issue?.description || '').trim();
                if (!title) {
                    continue;
                }
                const normalizedTitle = this.normalizeSuggestionKey(title);
                if (existingKeys.has(normalizedTitle)) {
                    continue;
                }
                const filePath = String(issue?.file || '').trim();
                const lineNumber = typeof issue?.line === 'number' ? issue.line : undefined;
                const issueType = String(issue?.type || 'quality').trim();
                const issueDescription = String(issue?.description || '').trim();
                const issueEffort = String(issue?.estimatedEffort || 'medium').trim();
                const severity = String(issue?.severity || 'medium')
                    .trim()
                    .toLowerCase();
                const priority = this.mapIssueSeverityToPriority(severity);
                const descriptionParts = [
                    issueDescription || title,
                    filePath ? `Location: ${filePath}${lineNumber ? `:${lineNumber}` : ''}.` : undefined,
                    issueType ? `Type: ${issueType}.` : undefined,
                    issueEffort ? `Estimated effort: ${issueEffort}.` : undefined,
                    'Origin: Analyzer agent feature recommendation.',
                ].filter((part) => typeof part === 'string' && part.trim().length > 0);
                await this.ledger.createRecord(this.withScope({
                    kind: 'suggestion',
                    owner,
                    title,
                    description: descriptionParts.join(' '),
                    status: 'submitted',
                    priority,
                    tags: ['ai-generated', 'analyzer-agent', issueType, severity].filter((tag) => tag && tag !== 'undefined'),
                    source: 'system',
                    metadata: {
                        origin: 'analyzer-agent',
                        issueId: issue?.id,
                        issueType,
                        severity,
                        file: filePath || undefined,
                        line: lineNumber,
                        impact: issue?.impact,
                        estimatedEffort: issueEffort,
                    },
                }, scope));
                existingKeys.add(normalizedTitle);
                created += 1;
            }
            return created;
        }
        catch (error) {
            this.logger.warn(`Analyzer suggestion ingestion failed: ${error instanceof Error ? error.message : String(error)}`);
            return 0;
        }
    }
    async list(user, kind, status, lane, horizon, q, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.listRecords(this.withScope({ owner: userId, kind, status, lane, horizon, q }, scope));
    }
    async get(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getRecord(id, userId, ...this.scopeArgs(scope));
    }
    async connections(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getRecordConnections(id, userId, ...this.scopeArgs(scope));
    }
    async create(user, body) {
        const userId = this.requireUserId(user);
        const scope = await this.resolveWriteScope(user, userId, this.buildScope(user, body?.workspaceId, body?.tenantId));
        return this.ledger.createRecord(this.withScope({ ...body, owner: userId, source: body.source || 'api' }, scope));
    }
    async patch(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.updateRecord(id, this.withScope({ ...body, owner: userId }, scope), userId, ...this.scopeArgs(scope));
    }
    async vote(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.voteRecord(id, body.direction, userId, ...this.scopeArgs(scope));
    }
    async feedback(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.addFeedbackIteration(id, body, userId, ...this.scopeArgs(scope));
    }
    async link(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.addFunctionalLink(id, body, userId, ...this.scopeArgs(scope));
    }
    async ingest(_user, body) {
        return this.ledger.ingestOrchestrationEvent(body);
    }
    async grid(user, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getGrid(userId, ...this.scopeArgs(scope));
    }
    async timeline(user, ownerId, recordId, goalId, planId, eventType, actor, dateFrom, dateTo, timelineTrack, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        const scopedOwnerId = typeof ownerId === 'string' && ownerId.trim().length > 0 ? ownerId.trim() : userId;
        return this.ledger.listTimelineEvents(this.withScope({
            userId: scopedOwnerId,
            viewerUserId: userId,
            recordId,
            goalId,
            planId,
            eventType,
            actor,
            dateFrom,
            dateTo,
            timelineTrack,
        }, scope));
    }
    async timelineEvent(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getTimelineEvent(id, userId, ...this.scopeArgs(scope));
    }
    async createTimelineEvent(user, body) {
        const userId = this.requireUserId(user);
        const scope = await this.resolveWriteScope(user, userId, this.buildScope(user, body?.workspaceId, body?.tenantId));
        return this.ledger.createTimelineEvent(this.withScope({ ...body, userId }, scope));
    }
    async patchTimelineEvent(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getTimelineEvent(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.updateTimelineEvent(id, this.withScope({ ...body, userId }, scope), ...this.scopeArgs(scope));
    }
    async deleteTimelineEvent(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, workspaceId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getTimelineEvent(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.deleteTimelineEvent(id, userId, ...this.scopeArgs(scope));
    }
    async bootstrapPersonalTimeline(user) {
        const userId = this.requireUserId(user);
        const roles = Array.isArray(user.roles)
            ? user.roles.filter((role) => typeof role === 'string')
            : undefined;
        return this.ledger.bootstrapPersonalTimeline(userId, {
            email: typeof user.email === 'string' ? user.email : undefined,
            name: typeof user.name === 'string' ? user.name : undefined,
            role: typeof user.role === 'string' ? user.role : undefined,
            roles,
        });
    }
    async importGithubNarrativeTimeline(user, body) {
        const userId = this.requireUserId(user);
        return this.ledger.importGithubNarrativeTimeline(userId, body || {});
    }
    async githubNarrativeGraph(user, ownerId, timelineTrack, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        const scopedOwnerId = typeof ownerId === 'string' && ownerId.trim().length > 0 ? ownerId.trim() : userId;
        return this.ledger.getGithubNarrativeGraph(this.withScope({
            userId: scopedOwnerId,
            viewerUserId: userId,
            timelineTrack,
        }, scope));
    }
    async createGoal(user, body) {
        const userId = this.requireUserId(user);
        const scope = await this.resolveWriteScope(user, userId, this.buildScope(user, body?.workspaceId, body?.tenantId));
        return this.ledger.createGoal(this.withScope({ ...body, owner: userId }, scope));
    }
    async listGoals(user, workspaceId) {
        const userId = this.requireUserId(user);
        return this.ledger.listGoals(this.withScope({ owner: userId }, this.buildScope(user, workspaceId)));
    }
    async getGoal(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getGoal(id, userId, ...this.scopeArgs(scope));
    }
    async linkGoalRecord(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.linkGoalToRecord(id, body.recordId, body.actor || userId, userId, ...this.scopeArgs(scope));
    }
    async addMilestone(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.addGoalMilestone(id, { ...body, owner: userId }, ...this.scopeArgs(scope));
    }
    async updateMilestone(user, id, milestoneId, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.updateGoalMilestone(id, milestoneId, { ...body, owner: userId }, ...this.scopeArgs(scope));
    }
    async deleteMilestone(user, id, milestoneId, workspaceId) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, workspaceId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.removeGoalMilestone(id, milestoneId, userId, ...this.scopeArgs(scope));
    }
    async createPlan(user, body) {
        const userId = this.requireUserId(user);
        const scope = await this.resolveWriteScope(user, userId, this.buildScope(user, body?.workspaceId, body?.tenantId));
        return this.ledger.createPlan(this.withScope({ ...body, owner: userId }, scope));
    }
    async listPlans(user, workspaceId) {
        const userId = this.requireUserId(user);
        return this.ledger.listPlans(this.withScope({ owner: userId }, this.buildScope(user, workspaceId)));
    }
    async getPlan(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getPlan(id, userId, ...this.scopeArgs(scope));
    }
    async linkPlan(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getPlan(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.linkPlan(id, { ...body, owner: userId, actor: body.actor || userId }, ...this.scopeArgs(scope));
    }
    // Compatibility routes for existing frontend pages under unified-ledger namespace.
    async listTasks(user, status, lane, horizon, q, workspaceId) {
        const userId = this.requireUserId(user);
        return this.ledger.listRecords(this.withScope({ owner: userId, kind: 'task', status, lane, horizon, q }, this.buildScope(user, workspaceId)));
    }
    async getTask(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getRecord(id, userId, ...this.scopeArgs(scope));
    }
    async createTask(user, body) {
        const userId = this.requireUserId(user);
        const scope = await this.resolveWriteScope(user, userId, this.buildScope(user, body?.workspaceId, body?.tenantId));
        return this.ledger.createRecord(this.withScope({
            ...body,
            kind: 'task',
            owner: userId,
            source: body.source || 'api',
        }, scope));
    }
    async patchTask(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.updateRecord(id, this.withScope({ ...body, owner: userId }, scope), userId, ...this.scopeArgs(scope));
    }
    async listSuggestions(user, status, lane, horizon, q, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        const baseFilters = this.withScope({
            owner: userId,
            kind: 'suggestion',
            status,
            lane,
            horizon,
            q,
        }, scope);
        let rows = await this.ledger.listRecords(baseFilters);
        const allowAiAutofill = !status && !lane && !horizon && !q;
        if (rows.length === 0 && allowAiAutofill) {
            const created = await this.ingestAnalyzerSuggestions(userId, scope, rows);
            if (created > 0) {
                rows = await this.ledger.listRecords(baseFilters);
            }
        }
        return rows;
    }
    async getSuggestion(user, id, workspaceId) {
        const userId = this.requireUserId(user);
        const scope = this.buildScope(user, workspaceId);
        return this.ledger.getRecord(id, userId, ...this.scopeArgs(scope));
    }
    async createSuggestion(user, body) {
        const userId = this.requireUserId(user);
        const scope = await this.resolveWriteScope(user, userId, this.buildScope(user, body?.workspaceId, body?.tenantId));
        return this.ledger.createRecord(this.withScope({
            ...body,
            kind: 'suggestion',
            owner: userId,
            source: body.source || 'api',
            status: body.status || 'submitted',
        }, scope));
    }
    async patchSuggestion(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.updateRecord(id, this.withScope({ ...body, owner: userId }, scope), userId, ...this.scopeArgs(scope));
    }
    async voteSuggestion(user, id, body) {
        const userId = this.requireUserId(user);
        const baseScope = this.buildScope(user, body?.workspaceId, body?.tenantId);
        const scope = await this.resolveWriteScope(user, userId, baseScope, async () => this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope))));
        return this.ledger.voteRecord(id, body.direction, userId, ...this.scopeArgs(scope));
    }
};
exports.UnifiedLedgerController = UnifiedLedgerController;
__decorate([
    (0, common_1.Get)('unified-ledger/records'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('kind')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('lane')),
    __param(4, (0, common_1.Query)('horizon')),
    __param(5, (0, common_1.Query)('q')),
    __param(6, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('unified-ledger/records/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('unified-ledger/records/:id/connections'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "connections", null);
__decorate([
    (0, common_1.Post)('unified-ledger/records'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('unified-ledger/records/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)('unified-ledger/records/:id/vote'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "vote", null);
__decorate([
    (0, common_1.Post)('unified-ledger/records/:id/feedback'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "feedback", null);
__decorate([
    (0, common_1.Post)('unified-ledger/records/:id/links'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "link", null);
__decorate([
    (0, common_1.Post)('unified-ledger/ingest/orchestration'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "ingest", null);
__decorate([
    (0, common_1.Get)('unified-ledger/grid'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "grid", null);
__decorate([
    (0, common_1.Get)('timeline/events'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('ownerId')),
    __param(2, (0, common_1.Query)('recordId')),
    __param(3, (0, common_1.Query)('goalId')),
    __param(4, (0, common_1.Query)('planId')),
    __param(5, (0, common_1.Query)('eventType')),
    __param(6, (0, common_1.Query)('actor')),
    __param(7, (0, common_1.Query)('dateFrom')),
    __param(8, (0, common_1.Query)('dateTo')),
    __param(9, (0, common_1.Query)('timelineTrack')),
    __param(10, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "timeline", null);
__decorate([
    (0, common_1.Get)('timeline/events/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "timelineEvent", null);
__decorate([
    (0, common_1.Post)('timeline/events'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createTimelineEvent", null);
__decorate([
    (0, common_1.Patch)('timeline/events/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patchTimelineEvent", null);
__decorate([
    (0, common_1.Delete)('timeline/events/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "deleteTimelineEvent", null);
__decorate([
    (0, common_1.Post)('timeline/personal/bootstrap'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "bootstrapPersonalTimeline", null);
__decorate([
    (0, common_1.Post)('timeline/github/import'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "importGithubNarrativeTimeline", null);
__decorate([
    (0, common_1.Get)('timeline/github/graph'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('ownerId')),
    __param(2, (0, common_1.Query)('timelineTrack')),
    __param(3, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "githubNarrativeGraph", null);
__decorate([
    (0, common_1.Post)('goals'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createGoal", null);
__decorate([
    (0, common_1.Get)('goals'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listGoals", null);
__decorate([
    (0, common_1.Get)('goals/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getGoal", null);
__decorate([
    (0, common_1.Post)('goals/:id/link-record'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "linkGoalRecord", null);
__decorate([
    (0, common_1.Post)('goals/:id/milestones'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "addMilestone", null);
__decorate([
    (0, common_1.Patch)('goals/:id/milestones/:milestoneId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('milestoneId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "updateMilestone", null);
__decorate([
    (0, common_1.Delete)('goals/:id/milestones/:milestoneId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('milestoneId')),
    __param(3, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "deleteMilestone", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listPlans", null);
__decorate([
    (0, common_1.Get)('plans/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Post)('plans/:id/link'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "linkPlan", null);
__decorate([
    (0, common_1.Get)('unified-ledger/tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('lane')),
    __param(3, (0, common_1.Query)('horizon')),
    __param(4, (0, common_1.Query)('q')),
    __param(5, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)('unified-ledger/tasks/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getTask", null);
__decorate([
    (0, common_1.Post)('unified-ledger/tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createTask", null);
__decorate([
    (0, common_1.Patch)('unified-ledger/tasks/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patchTask", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('lane')),
    __param(3, (0, common_1.Query)('horizon')),
    __param(4, (0, common_1.Query)('q')),
    __param(5, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listSuggestions", null);
__decorate([
    (0, common_1.Get)('suggestions/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getSuggestion", null);
__decorate([
    (0, common_1.Post)('suggestions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createSuggestion", null);
__decorate([
    (0, common_1.Patch)('suggestions/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patchSuggestion", null);
__decorate([
    (0, common_1.Post)('suggestions/:id/vote'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "voteSuggestion", null);
exports.UnifiedLedgerController = UnifiedLedgerController = UnifiedLedgerController_1 = __decorate([
    (0, common_1.Controller)('unified-ledger'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [unified_ledger_service_1.UnifiedLedgerService,
        database_1.DatabaseService,
        analyzer_service_1.AnalyzerAgentService])
], UnifiedLedgerController);
//# sourceMappingURL=unified-ledger.controller.js.map