"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedLedgerTimelineService = void 0;
/**
 * Timeline adapter backed by the unified ledger API.
 * This provides a bridge so existing feature-suggestions timeline hooks can
 * operate on the centralized chronology source.
 */
class UnifiedLedgerTimelineService {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    async postTimelineEvent(input) {
        await fetch(`${this.baseUrl}/timeline/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType: 'historical_event',
                actor: input.actor || 'timeline-service',
                recordId: input.recordId,
                payload: input.payload || {},
            }),
        });
    }
    async getEventTimeline(branchId) {
        // Branch is represented as a record scope for now.
        const res = await fetch(`${this.baseUrl}/timeline/events?recordId=${encodeURIComponent(branchId)}`);
        if (!res.ok)
            return [];
        const events = (await res.json());
        return events.map((e) => ({
            id: e.id,
            type: 'NOTE',
            timestamp: e.timestamp,
            data: {
                title: e.eventType,
                description: JSON.stringify(e.payload || {}),
                status: 'ACTIVE',
                branchId,
                actor: e.actor,
                eventType: e.eventType,
            },
        }));
    }
    async getBranchHierarchy(branchId) {
        return [
            {
                id: branchId,
                name: `Record ${branchId}`,
                parentBranchId: undefined,
                startEventId: branchId,
                events: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'ACTIVE',
            },
        ];
    }
    async getWorkflowsByEvent(eventId) {
        return [
            {
                id: `wf-${eventId}`,
                name: `Workflow for ${eventId}`,
                description: 'Derived unified-ledger workflow placeholder',
                eventId,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                steps: [],
            },
        ];
    }
    async createBranch(branchData) {
        await this.postTimelineEvent({
            recordId: branchData.parentBranchId || branchData.startEventId,
            payload: {
                kind: 'branch_created',
                name: branchData.name,
                startEventId: branchData.startEventId,
                parentBranchId: branchData.parentBranchId,
            },
        });
        return {
            id: `branch-${Date.now().toString(36)}`,
            name: branchData.name,
            parentBranchId: branchData.parentBranchId,
            startEventId: branchData.startEventId,
            events: [branchData.startEventId],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'ACTIVE',
        };
    }
    async mergeBranch(_mergeData) {
        await this.postTimelineEvent({
            recordId: _mergeData.branchId,
            payload: {
                kind: 'branch_merged',
                targetEventId: _mergeData.targetEventId,
                mergedFromEvents: _mergeData.mergedFromEvents,
            },
        });
        return;
    }
    async createWorkflow(workflowData) {
        const workflowId = `wf-${Date.now().toString(36)}`;
        await this.postTimelineEvent({
            recordId: workflowData.eventId,
            payload: {
                kind: 'workflow_created',
                workflowId,
                name: workflowData.name,
                stepCount: workflowData.steps.length,
            },
        });
        return {
            id: workflowId,
            name: workflowData.name,
            description: workflowData.description,
            eventId: workflowData.eventId,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            steps: workflowData.steps.map((s, idx) => ({
                ...s,
                id: `step-${idx + 1}`,
                workflowId,
            })),
        };
    }
    async executeWorkflowStep(_workflowId, _stepId, _result) {
        await this.postTimelineEvent({
            recordId: _workflowId,
            payload: {
                kind: 'workflow_step_executed',
                stepId: _stepId,
                result: _result,
            },
        });
        return;
    }
}
exports.UnifiedLedgerTimelineService = UnifiedLedgerTimelineService;
//# sourceMappingURL=unifiedLedgerTimeline.service.js.map