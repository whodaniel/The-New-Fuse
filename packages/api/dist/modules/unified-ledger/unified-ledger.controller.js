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
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UnifiedLedgerService } from './unified-ledger.service.js';
let UnifiedLedgerController = class UnifiedLedgerController {
    constructor(ledger) {
        this.ledger = ledger;
    }
    async list(kind, status, q) {
        return this.ledger.listRecords({ kind, status, q });
    }
    async get(id) {
        return this.ledger.getRecord(id);
    }
    async connections(id) {
        return this.ledger.getRecordConnections(id);
    }
    async create(body) {
        return this.ledger.createRecord(body);
    }
    async patch(id, body) {
        return this.ledger.updateRecord(id, body);
    }
    async vote(id, body) {
        return this.ledger.voteRecord(id, body.direction);
    }
    async feedback(id, body) {
        return this.ledger.addFeedbackIteration(id, body);
    }
    async link(id, body) {
        return this.ledger.addFunctionalLink(id, body);
    }
    async ingest(body) {
        return this.ledger.ingestOrchestrationEvent(body);
    }
    async grid() {
        return this.ledger.getGrid();
    }
    async macro() {
        return this.ledger.getMacroView();
    }
    async timeline(recordId, goalId, planId, eventType, actor, dateFrom, dateTo) {
        return this.ledger.listTimelineEvents({
            recordId,
            goalId,
            planId,
            eventType,
            actor,
            dateFrom,
            dateTo,
        });
    }
    async timelineEvent(id) {
        return this.ledger.getTimelineEvent(id);
    }
    async createTimelineEvent(body) {
        return this.ledger.createTimelineEvent(body);
    }
    async patchTimelineEvent(id, body) {
        return this.ledger.updateTimelineEvent(id, body);
    }
    async createGoal(body) {
        return this.ledger.createGoal(body);
    }
    async listGoals() {
        return this.ledger.listGoals();
    }
    async getGoal(id) {
        return this.ledger.getGoal(id);
    }
    async linkGoalRecord(id, body) {
        return this.ledger.linkGoalToRecord(id, body.recordId, body.actor);
    }
    async addMilestone(id, body) {
        return this.ledger.addGoalMilestone(id, body);
    }
    async updateMilestone(id, milestoneId, body) {
        return this.ledger.updateGoalMilestone(id, milestoneId, body);
    }
    async deleteMilestone(id, milestoneId) {
        return this.ledger.removeGoalMilestone(id, milestoneId);
    }
    async createPlan(body) {
        return this.ledger.createPlan(body);
    }
    async listPlans() {
        return this.ledger.listPlans();
    }
    async getPlan(id) {
        return this.ledger.getPlan(id);
    }
    async linkPlan(id, body) {
        return this.ledger.linkPlan(id, body);
    }
    // Compatibility routes for existing frontend pages.
    async listTasks(status, q) {
        return this.ledger.listRecords({ kind: 'task', status, q });
    }
    async getTask(id) {
        return this.ledger.getRecord(id);
    }
    async createTask(body) {
        return this.ledger.createRecord({
            ...body,
            kind: 'task',
            source: body.source || 'api',
        });
    }
    async patchTask(id, body) {
        return this.ledger.updateRecord(id, body);
    }
    async listSuggestions(status, q) {
        return this.ledger.listRecords({ kind: 'suggestion', status, q });
    }
    async getSuggestion(id) {
        return this.ledger.getRecord(id);
    }
    async createSuggestion(body) {
        return this.ledger.createRecord({
            ...body,
            kind: 'suggestion',
            source: body.source || 'api',
            status: body.status || 'submitted',
        });
    }
    async patchSuggestion(id, body) {
        return this.ledger.updateRecord(id, body);
    }
    async voteSuggestion(id, body) {
        return this.ledger.voteRecord(id, body.direction);
    }
};
__decorate([
    Get('unified-ledger/records'),
    __param(0, Query('kind')),
    __param(1, Query('status')),
    __param(2, Query('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "list", null);
__decorate([
    Get('unified-ledger/records/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "get", null);
__decorate([
    Get('unified-ledger/records/:id/connections'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "connections", null);
__decorate([
    Post('unified-ledger/records'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "create", null);
__decorate([
    Patch('unified-ledger/records/:id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patch", null);
__decorate([
    Post('unified-ledger/records/:id/vote'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "vote", null);
__decorate([
    Post('unified-ledger/records/:id/feedback'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "feedback", null);
__decorate([
    Post('unified-ledger/records/:id/links'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "link", null);
__decorate([
    Post('unified-ledger/ingest/orchestration'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "ingest", null);
__decorate([
    Get('unified-ledger/grid'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "grid", null);
__decorate([
    Get('timeline/macro'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "macro", null);
__decorate([
    Get('timeline/events'),
    __param(0, Query('recordId')),
    __param(1, Query('goalId')),
    __param(2, Query('planId')),
    __param(3, Query('eventType')),
    __param(4, Query('actor')),
    __param(5, Query('dateFrom')),
    __param(6, Query('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "timeline", null);
__decorate([
    Get('timeline/events/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "timelineEvent", null);
__decorate([
    Post('timeline/events'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createTimelineEvent", null);
__decorate([
    Patch('timeline/events/:id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patchTimelineEvent", null);
__decorate([
    Post('goals'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createGoal", null);
__decorate([
    Get('goals'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listGoals", null);
__decorate([
    Get('goals/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getGoal", null);
__decorate([
    Post('goals/:id/link-record'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "linkGoalRecord", null);
__decorate([
    Post('goals/:id/milestones'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "addMilestone", null);
__decorate([
    Patch('goals/:id/milestones/:milestoneId'),
    __param(0, Param('id')),
    __param(1, Param('milestoneId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "updateMilestone", null);
__decorate([
    Delete('goals/:id/milestones/:milestoneId'),
    __param(0, Param('id')),
    __param(1, Param('milestoneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "deleteMilestone", null);
__decorate([
    Post('plans'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createPlan", null);
__decorate([
    Get('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listPlans", null);
__decorate([
    Get('plans/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getPlan", null);
__decorate([
    Post('plans/:id/link'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "linkPlan", null);
__decorate([
    Get('tasks'),
    __param(0, Query('status')),
    __param(1, Query('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listTasks", null);
__decorate([
    Get('tasks/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getTask", null);
__decorate([
    Post('tasks'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createTask", null);
__decorate([
    Patch('tasks/:id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patchTask", null);
__decorate([
    Get('suggestions'),
    __param(0, Query('status')),
    __param(1, Query('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "listSuggestions", null);
__decorate([
    Get('suggestions/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "getSuggestion", null);
__decorate([
    Post('suggestions'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "createSuggestion", null);
__decorate([
    Patch('suggestions/:id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "patchSuggestion", null);
__decorate([
    Post('suggestions/:id/vote'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnifiedLedgerController.prototype, "voteSuggestion", null);
UnifiedLedgerController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [UnifiedLedgerService])
], UnifiedLedgerController);
export { UnifiedLedgerController };
//# sourceMappingURL=unified-ledger.controller.js.map