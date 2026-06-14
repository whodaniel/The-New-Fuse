var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UnifiedLedgerService_1;
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import WebSocket from 'ws';
let UnifiedLedgerService = UnifiedLedgerService_1 = class UnifiedLedgerService {
    constructor() {
        this.logger = new Logger(UnifiedLedgerService_1.name);
        this.storePath = path.join(process.cwd(), 'data', 'unified-task-ledger.json');
        this.store = { records: [], timelineEvents: [], goals: [], plans: [] };
        this.initialized = false;
        this.ws = null;
    }
    async onModuleInit() {
        await this.ensureLoaded();
        this.initRelayConnection();
    }
    initRelayConnection() {
        const relayUrl = process.env.RELAY_WS_URL || 'ws://localhost:3000';
        try {
            this.ws = new WebSocket(relayUrl);
            this.ws.on('open', () => {
                this.logger.log('Connected to TNF Relay for event broadcasting');
                this.ws?.send(JSON.stringify({
                    type: 'REGISTER',
                    payload: { type: 'api_service', name: 'unified-ledger' },
                }));
            });
            this.ws.on('error', (err) => {
                this.logger.warn(`Relay connection error: ${err.message}`);
            });
            this.ws.on('close', () => {
                this.logger.warn('Relay connection closed. Retrying in 10s...');
                setTimeout(() => this.initRelayConnection(), 10000);
            });
        }
        catch (e) {
            this.logger.error('Failed to init relay connection', e);
        }
    }
    broadcast(type, payload) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'BROADCAST',
                payload: { event: type, data: payload },
            }));
        }
    }
    async listRecords(filters) {
        await this.ensureLoaded();
        let rows = [...this.store.records];
        if (filters?.kind) {
            rows = rows.filter((r) => r.kind === filters.kind);
        }
        if (filters?.status) {
            rows = rows.filter((r) => r.status === filters.status);
        }
        if (filters?.q) {
            const q = filters.q.toLowerCase();
            rows = rows.filter((r) => r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.tags.some((t) => t.toLowerCase().includes(q)));
        }
        return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async getRecord(id) {
        await this.ensureLoaded();
        return this.store.records.find((r) => r.id === id) || null;
    }
    async createRecord(input) {
        await this.ensureLoaded();
        const now = new Date().toISOString();
        const record = {
            id: input.id || this.makeId(input.kind || 'task'),
            kind: input.kind || 'task',
            title: input.title,
            description: input.description,
            status: input.status || 'submitted',
            priority: input.priority || 'medium',
            owner: input.owner || 'system',
            assignee: input.assignee,
            startTime: input.startTime,
            endTime: input.endTime,
            color: input.color,
            parentTaskId: input.parentTaskId,
            boardId: input.boardId,
            columnId: input.columnId,
            tags: input.tags || [],
            votes: input.votes || { up: 0, down: 0 },
            traits: {
                cognitiveDepth: 0.5,
                orchestrationComplexity: 0.5,
                semanticNovelty: 0.5,
                relationalImpact: 0.5,
                temporalRhythm: 0.5,
                confidence: 0.5,
                alignmentScore: 0.5,
                custom: {},
                ...(input.traits || {}),
            },
            fractal: {
                scale: 1,
                rhythmBpm: 120,
                phase: 0,
                progressPercent: 0,
                beatSignature: '4/4',
                ...(input.fractal || {}),
            },
            links: input.links || [],
            rag: {
                relationalSources: [],
                semanticSources: [],
                previousAnswers: [],
                feedbackIterations: [],
                ...(input.rag || {}),
            },
            metadata: input.metadata || {},
            source: input.source || 'manual',
            createdAt: now,
            updatedAt: now,
        };
        this.store.records.push(record);
        this.broadcast('record_created', record);
        this.pushEvent({
            recordId: record.id,
            eventType: 'record_created',
            actor: record.owner,
            payload: { kind: record.kind, status: record.status, priority: record.priority },
        });
        await this.persist();
        return record;
    }
    async updateRecord(id, patch) {
        await this.ensureLoaded();
        const index = this.store.records.findIndex((r) => r.id === id);
        if (index < 0)
            return null;
        const current = this.store.records[index];
        const updated = {
            ...current,
            ...patch,
            traits: { ...current.traits, ...(patch.traits || {}) },
            fractal: { ...current.fractal, ...(patch.fractal || {}) },
            rag: {
                ...current.rag,
                ...(patch.rag || {}),
                feedbackIterations: patch.rag?.feedbackIterations || current.rag.feedbackIterations,
            },
            metadata: { ...current.metadata, ...(patch.metadata || {}) },
            updatedAt: new Date().toISOString(),
        };
        this.store.records[index] = updated;
        this.broadcast('record_updated', updated);
        this.pushEvent({
            recordId: updated.id,
            eventType: 'record_updated',
            actor: String(patch.metadata?.actor || 'system'),
            payload: { patchKeys: Object.keys(patch || {}) },
        });
        await this.persist();
        return updated;
    }
    async voteRecord(id, direction) {
        const row = await this.getRecord(id);
        if (!row)
            return null;
        const votes = { ...row.votes, [direction]: row.votes[direction] + 1 };
        const updated = await this.updateRecord(id, { votes });
        if (updated) {
            this.pushEvent({
                recordId: id,
                eventType: 'record_voted',
                actor: 'ui-user',
                payload: { direction, votes: updated.votes },
            });
            await this.persist();
        }
        return updated;
    }
    async addFunctionalLink(id, link) {
        const row = await this.getRecord(id);
        if (!row)
            return null;
        const next = { ...link, createdAt: new Date().toISOString() };
        const updated = await this.updateRecord(id, { links: [...row.links, next] });
        if (updated) {
            this.pushEvent({
                recordId: id,
                eventType: 'functional_link_added',
                actor: 'system',
                payload: { targetId: next.targetId, linkType: next.linkType, weight: next.weight },
            });
            await this.persist();
        }
        return updated;
    }
    async addFeedbackIteration(id, input) {
        const row = await this.getRecord(id);
        if (!row)
            return null;
        const nextIteration = input.iteration || row.rag.feedbackIterations.length + 1;
        const feedback = {
            id: `fi_${Date.now().toString(36)}`,
            iteration: nextIteration,
            createdAt: new Date().toISOString(),
            ...input,
        };
        const rag = {
            ...row.rag,
            feedbackIterations: [...row.rag.feedbackIterations, feedback],
        };
        const updated = await this.updateRecord(id, { rag });
        if (updated) {
            this.pushEvent({
                recordId: id,
                eventType: 'feedback_iteration_added',
                actor: 'system',
                payload: {
                    iteration: feedback.iteration,
                    confidence: feedback.confidence,
                    accepted: feedback.accepted,
                },
            });
            await this.persist();
        }
        return updated;
    }
    async ingestOrchestrationEvent(payload) {
        const task = (payload.task || {});
        const action = String(payload.action || payload.type || 'dispatch');
        const normalizedStatus = this.normalizeStatus(String(task.status || 'submitted'));
        const normalizedPriority = this.normalizePriority(String(task.priority || 'medium'));
        const record = await this.createRecord({
            kind: 'task',
            title: String(task.title || `Orchestrated task ${task.id || ''}`.trim()),
            description: String(task.description || `Ingested from orchestration action ${action}`),
            status: normalizedStatus,
            priority: normalizedPriority,
            owner: String(task.owner || 'orchestrator'),
            assignee: Array.isArray(task.targetAgents) ? String(task.targetAgents[0] || '') : undefined,
            tags: ['orchestrated', action],
            metadata: { rawEvent: payload, dispatchAction: action },
            source: 'orchestrator',
        });
        return record;
    }
    async getGrid() {
        await this.ensureLoaded();
        const byKind = {};
        const byStatus = {};
        let sumProgress = 0;
        let sumBpm = 0;
        for (const row of this.store.records) {
            byKind[row.kind] = (byKind[row.kind] || 0) + 1;
            byStatus[row.status] = (byStatus[row.status] || 0) + 1;
            sumProgress += row.fractal.progressPercent;
            sumBpm += row.fractal.rhythmBpm;
        }
        const total = this.store.records.length;
        return {
            total,
            byKind,
            byStatus,
            averageProgressPercent: total ? sumProgress / total : 0,
            averageRhythmBpm: total ? sumBpm / total : 0,
        };
    }
    async listTimelineEvents(params) {
        await this.ensureLoaded();
        const from = params?.dateFrom ? this.normalizeTimestamp(params.dateFrom) : undefined;
        const to = params?.dateTo ? this.normalizeTimestamp(params.dateTo) : undefined;
        return this.store.timelineEvents
            .filter((e) => (params?.recordId ? e.recordId === params.recordId : true))
            .filter((e) => (params?.goalId ? e.goalId === params.goalId : true))
            .filter((e) => (params?.planId ? e.planId === params.planId : true))
            .filter((e) => (params?.eventType ? e.eventType === params.eventType : true))
            .filter((e) => (params?.actor ? e.actor === params.actor : true))
            .filter((e) => (from ? e.timestamp >= from : true))
            .filter((e) => (to ? e.timestamp <= to : true))
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    async getTimelineEvent(id) {
        await this.ensureLoaded();
        return this.store.timelineEvents.find((e) => e.id === id) || null;
    }
    async createTimelineEvent(input) {
        await this.ensureLoaded();
        this.validateTimelineRefs(input);
        const timestamp = input.timestamp
            ? this.normalizeTimestamp(input.timestamp)
            : new Date().toISOString();
        const eventType = this.validateEventType(input.eventType);
        const deduped = this.findDuplicateTimelineEvent({
            recordId: input.recordId,
            goalId: input.goalId,
            planId: input.planId,
            eventType,
            actor: input.actor || 'system',
            timestamp,
            payload: input.payload || {},
        });
        if (deduped) {
            return deduped;
        }
        const event = {
            id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            recordId: input.recordId,
            goalId: input.goalId,
            planId: input.planId,
            eventType,
            actor: input.actor || 'system',
            timestamp,
            payload: input.payload || {},
        };
        this.store.timelineEvents.push(event);
        await this.persist();
        return event;
    }
    async updateTimelineEvent(id, patch) {
        await this.ensureLoaded();
        const idx = this.store.timelineEvents.findIndex((e) => e.id === id);
        if (idx < 0)
            return null;
        const current = this.store.timelineEvents[idx];
        const updated = {
            ...current,
            actor: patch.actor || current.actor,
            timestamp: patch.timestamp ? this.normalizeTimestamp(patch.timestamp) : current.timestamp,
            payload: patch.payload ? { ...current.payload, ...patch.payload } : current.payload,
        };
        this.store.timelineEvents[idx] = updated;
        await this.persist();
        return updated;
    }
    async createGoal(input) {
        await this.ensureLoaded();
        const now = new Date().toISOString();
        const goal = {
            id: `goal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            title: input.title,
            description: input.description,
            status: 'active',
            owner: input.owner || 'system',
            linkedRecordIds: input.linkedRecordIds || [],
            milestones: [],
            createdAt: now,
            updatedAt: now,
        };
        this.store.goals.push(goal);
        this.pushEvent({
            goalId: goal.id,
            eventType: 'goal_created',
            actor: goal.owner,
            payload: { linkedRecordIds: goal.linkedRecordIds },
        });
        await this.persist();
        return goal;
    }
    async listGoals() {
        await this.ensureLoaded();
        return [...this.store.goals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async getGoal(goalId) {
        await this.ensureLoaded();
        return this.store.goals.find((g) => g.id === goalId) || null;
    }
    async linkGoalToRecord(goalId, recordId, actor = 'system') {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        const linkedRecordIds = current.linkedRecordIds.includes(recordId)
            ? current.linkedRecordIds
            : [...current.linkedRecordIds, recordId];
        const updated = {
            ...current,
            linkedRecordIds,
            updatedAt: new Date().toISOString(),
        };
        this.store.goals[idx] = updated;
        this.pushEvent({
            goalId,
            recordId,
            eventType: 'goal_linked',
            actor,
            payload: {},
        });
        await this.persist();
        return updated;
    }
    async addGoalMilestone(goalId, input) {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        const milestone = {
            id: `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            title: input.title,
            dueAt: input.dueAt,
            status: input.status || 'pending',
        };
        const updated = {
            ...current,
            milestones: [...current.milestones, milestone],
            updatedAt: new Date().toISOString(),
        };
        this.store.goals[idx] = updated;
        this.pushEvent({
            goalId,
            eventType: 'milestone_updated',
            actor: 'system',
            payload: { milestone },
        });
        await this.persist();
        return updated;
    }
    async updateGoalMilestone(goalId, milestoneId, patch) {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        const milestones = current.milestones.map((m) => m.id === milestoneId
            ? {
                ...m,
                title: patch.title || m.title,
                dueAt: patch.dueAt ?? m.dueAt,
                status: patch.status || m.status,
            }
            : m);
        if (!milestones.some((m) => m.id === milestoneId))
            return null;
        const updated = {
            ...current,
            milestones,
            updatedAt: new Date().toISOString(),
        };
        this.store.goals[idx] = updated;
        this.pushEvent({
            goalId,
            eventType: 'milestone_updated',
            actor: 'system',
            payload: { milestoneId, patch },
        });
        await this.persist();
        return updated;
    }
    async removeGoalMilestone(goalId, milestoneId) {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        const milestones = current.milestones.filter((m) => m.id !== milestoneId);
        if (milestones.length === current.milestones.length)
            return null;
        const updated = {
            ...current,
            milestones,
            updatedAt: new Date().toISOString(),
        };
        this.store.goals[idx] = updated;
        this.pushEvent({
            goalId,
            eventType: 'milestone_updated',
            actor: 'system',
            payload: { milestoneId, removed: true },
        });
        await this.persist();
        return updated;
    }
    async createPlan(input) {
        await this.ensureLoaded();
        const now = new Date().toISOString();
        const plan = {
            id: `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            name: input.name,
            objective: input.objective,
            owner: input.owner || 'system',
            status: 'active',
            linkedGoalIds: input.linkedGoalIds || [],
            linkedRecordIds: input.linkedRecordIds || [],
            cadence: {
                cycleDays: input.cadence?.cycleDays || 7,
                reviewBpm: input.cadence?.reviewBpm || 120,
                progressPercent: input.cadence?.progressPercent || 0,
            },
            createdAt: now,
            updatedAt: now,
        };
        this.store.plans.push(plan);
        this.pushEvent({
            planId: plan.id,
            eventType: 'plan_created',
            actor: plan.owner,
            payload: { linkedGoalIds: plan.linkedGoalIds, linkedRecordIds: plan.linkedRecordIds },
        });
        await this.persist();
        return plan;
    }
    async listPlans() {
        await this.ensureLoaded();
        return [...this.store.plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async getPlan(planId) {
        await this.ensureLoaded();
        return this.store.plans.find((p) => p.id === planId) || null;
    }
    async getRecordConnections(recordId) {
        await this.ensureLoaded();
        const goals = this.store.goals.filter((g) => g.linkedRecordIds.includes(recordId));
        const plans = this.store.plans.filter((p) => p.linkedRecordIds.includes(recordId));
        return { goals, plans };
    }
    async linkPlan(planId, input) {
        await this.ensureLoaded();
        const idx = this.store.plans.findIndex((p) => p.id === planId);
        if (idx < 0)
            return null;
        const current = this.store.plans[idx];
        const linkedGoalIds = input.goalId
            ? current.linkedGoalIds.includes(input.goalId)
                ? current.linkedGoalIds
                : [...current.linkedGoalIds, input.goalId]
            : current.linkedGoalIds;
        const linkedRecordIds = input.recordId
            ? current.linkedRecordIds.includes(input.recordId)
                ? current.linkedRecordIds
                : [...current.linkedRecordIds, input.recordId]
            : current.linkedRecordIds;
        const updated = {
            ...current,
            linkedGoalIds,
            linkedRecordIds,
            updatedAt: new Date().toISOString(),
        };
        this.store.plans[idx] = updated;
        this.pushEvent({
            planId,
            goalId: input.goalId,
            recordId: input.recordId,
            eventType: 'plan_linked',
            actor: input.actor || 'system',
            payload: {},
        });
        await this.persist();
        return updated;
    }
    async getMacroView() {
        await this.ensureLoaded();
        const plansWithRecords = await Promise.all(this.store.plans.map(async (plan) => {
            const records = await Promise.all(plan.linkedRecordIds.map((id) => this.getRecord(id)));
            return {
                ...plan,
                records: records.filter(Boolean),
            };
        }));
        return {
            plans: plansWithRecords,
            totalRecords: this.store.records.length,
            globalEvents: this.store.timelineEvents.slice(0, 100),
        };
    }
    async ensureLoaded() {
        if (this.initialized)
            return;
        try {
            await fs.mkdir(path.dirname(this.storePath), { recursive: true });
            const content = await fs.readFile(this.storePath, 'utf8');
            const parsed = JSON.parse(content);
            this.store = {
                records: parsed.records || [],
                timelineEvents: parsed.timelineEvents || [],
                goals: parsed.goals || [],
                plans: parsed.plans || [],
            };
            this.initialized = true;
        }
        catch {
            this.store = { records: [], timelineEvents: [], goals: [], plans: [] };
            await this.persist();
            this.initialized = true;
            this.logger.log(`Initialized unified ledger at ${this.storePath}`);
        }
    }
    async persist() {
        await fs.writeFile(this.storePath, JSON.stringify(this.store, null, 2), 'utf8');
    }
    makeId(kind) {
        return `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }
    pushEvent(input) {
        const event = {
            id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            ...input,
        };
        this.store.timelineEvents.push(event);
    }
    normalizeStatus(value) {
        const v = value.toLowerCase();
        if (['in_progress', 'in-progress', 'running'].includes(v))
            return 'in_progress';
        if (['queued', 'pending'].includes(v))
            return 'queued';
        if (['complete', 'completed', 'done'].includes(v))
            return 'completed';
        if (['failed', 'error'].includes(v))
            return 'failed';
        if (['under_review', 'review'].includes(v))
            return 'under_review';
        if (['rejected'].includes(v))
            return 'rejected';
        return 'submitted';
    }
    normalizePriority(value) {
        const v = value.toLowerCase();
        if (v === 'urgent')
            return 'urgent';
        if (v === 'critical')
            return 'critical';
        if (v === 'high')
            return 'high';
        if (v === 'low')
            return 'low';
        return 'medium';
    }
    normalizeTimestamp(value) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error(`Invalid timestamp: ${value}`);
        }
        return parsed.toISOString();
    }
    validateEventType(value) {
        const allowed = [
            'record_created',
            'record_updated',
            'record_voted',
            'feedback_iteration_added',
            'functional_link_added',
            'goal_created',
            'goal_linked',
            'plan_created',
            'plan_linked',
            'milestone_updated',
            'historical_event',
        ];
        if (!value)
            return 'historical_event';
        if (!allowed.includes(value)) {
            throw new Error(`Invalid eventType: ${value}`);
        }
        return value;
    }
    validateTimelineRefs(input) {
        if (!input.recordId && !input.goalId && !input.planId) {
            throw new Error('Timeline event must reference at least one entity');
        }
        if (input.payload && typeof input.payload !== 'object') {
            throw new Error('Timeline payload must be an object');
        }
        if (input.recordId && !this.store.records.some((r) => r.id === input.recordId)) {
            throw new Error(`Unknown recordId: ${input.recordId}`);
        }
        if (input.goalId && !this.store.goals.some((g) => g.id === input.goalId)) {
            throw new Error(`Unknown goalId: ${input.goalId}`);
        }
        if (input.planId && !this.store.plans.some((p) => p.id === input.planId)) {
            throw new Error(`Unknown planId: ${input.planId}`);
        }
    }
    findDuplicateTimelineEvent(candidate) {
        const candidateTs = new Date(candidate.timestamp).getTime();
        const payloadKey = JSON.stringify(candidate.payload || {});
        const existing = this.store.timelineEvents.find((e) => {
            if (e.recordId !== candidate.recordId)
                return false;
            if (e.goalId !== candidate.goalId)
                return false;
            if (e.planId !== candidate.planId)
                return false;
            if (e.eventType !== candidate.eventType)
                return false;
            if (e.actor !== candidate.actor)
                return false;
            if (JSON.stringify(e.payload || {}) !== payloadKey)
                return false;
            const existingTs = new Date(e.timestamp).getTime();
            return Math.abs(existingTs - candidateTs) <= 60_000;
        });
        return existing || null;
    }
};
UnifiedLedgerService = UnifiedLedgerService_1 = __decorate([
    Injectable()
], UnifiedLedgerService);
export { UnifiedLedgerService };
//# sourceMappingURL=unified-ledger.service.js.map