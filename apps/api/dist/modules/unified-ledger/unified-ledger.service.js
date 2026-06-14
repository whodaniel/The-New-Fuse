"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UnifiedLedgerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedLedgerService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let UnifiedLedgerService = UnifiedLedgerService_1 = class UnifiedLedgerService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(UnifiedLedgerService_1.name);
        this.defaultStorePath = path.join(process.cwd(), 'data', 'unified-task-ledger.json');
        this.storePath = this.resolveStorePath();
        this.store = { records: [], timelineEvents: [], goals: [], plans: [] };
        this.initialized = false;
        this.cachedPrivateTimelineOwnerUserId = null;
        this.cachedPrivateTimelineOwnerResolvedAt = 0;
    }
    async onModuleInit() {
        await this.ensureLoaded();
    }
    normalizeScope(scope) {
        const tenantId = typeof scope?.tenantId === 'string' && scope.tenantId.trim().length > 0
            ? scope.tenantId.trim()
            : undefined;
        const workspaceId = typeof scope?.workspaceId === 'string' && scope.workspaceId.trim().length > 0
            ? scope.workspaceId.trim()
            : undefined;
        return { tenantId, workspaceId };
    }
    isScopeMatch(entity, scope) {
        const normalized = this.normalizeScope(scope);
        if (!normalized.tenantId && !normalized.workspaceId) {
            return true;
        }
        const entityTenantId = typeof entity?.tenantId === 'string' && entity.tenantId.trim().length > 0
            ? entity.tenantId.trim()
            : undefined;
        const entityWorkspaceId = typeof entity?.workspaceId === 'string' && entity.workspaceId.trim().length > 0
            ? entity.workspaceId.trim()
            : undefined;
        if (normalized.tenantId && entityTenantId && entityTenantId !== normalized.tenantId) {
            return false;
        }
        if (normalized.workspaceId &&
            entityWorkspaceId &&
            entityWorkspaceId !== normalized.workspaceId) {
            return false;
        }
        return true;
    }
    async listRecords(filters) {
        await this.ensureLoaded();
        let rows = [...this.store.records];
        if (filters?.owner) {
            rows = rows.filter((r) => r.owner === filters.owner);
        }
        rows = rows.filter((r) => this.isScopeMatch(r, filters));
        if (filters?.kind) {
            rows = rows.filter((r) => r.kind === filters.kind);
        }
        if (filters?.status) {
            rows = rows.filter((r) => r.status === filters.status);
        }
        if (filters?.lane) {
            rows = rows.filter((r) => r.itinerary?.lane === filters.lane);
        }
        if (filters?.horizon) {
            rows = rows.filter((r) => r.itinerary?.horizon === filters.horizon);
        }
        if (filters?.q) {
            const q = filters.q.toLowerCase();
            rows = rows.filter((r) => r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.tags.some((t) => t.toLowerCase().includes(q)));
        }
        return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async getRecord(id, owner, scope) {
        await this.ensureLoaded();
        const record = this.store.records.find((r) => r.id === id) || null;
        if (!record)
            return null;
        if (owner && record.owner !== owner)
            return null;
        if (!this.isScopeMatch(record, scope))
            return null;
        return record;
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
            tenantId: input.tenantId,
            workspaceId: input.workspaceId,
            assignee: input.assignee,
            color: input.color,
            startTime: input.startTime,
            endTime: input.endTime,
            todos: input.todos || [],
            comments: input.comments || [],
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
            itinerary: this.normalizeItinerary(input),
            metadata: input.metadata || {},
            source: input.source || 'manual',
            createdAt: now,
            updatedAt: now,
        };
        this.store.records.push(record);
        this.pushEvent({
            userId: record.owner,
            tenantId: record.tenantId,
            workspaceId: record.workspaceId,
            recordId: record.id,
            eventType: 'record_created',
            actor: record.owner,
            payload: { kind: record.kind, status: record.status, priority: record.priority },
        });
        await this.persist();
        return record;
    }
    async updateRecord(id, patch, owner, scope) {
        await this.ensureLoaded();
        const index = this.store.records.findIndex((r) => r.id === id);
        if (index < 0)
            return null;
        const current = this.store.records[index];
        if (owner && current.owner !== owner) {
            return null;
        }
        if (!this.isScopeMatch(current, scope)) {
            return null;
        }
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
            itinerary: patch.itinerary
                ? this.mergeItinerary(current.itinerary, patch.itinerary)
                : current.itinerary,
            metadata: { ...current.metadata, ...(patch.metadata || {}) },
            updatedAt: new Date().toISOString(),
        };
        this.store.records[index] = updated;
        this.pushEvent({
            recordId: updated.id,
            userId: updated.owner,
            tenantId: updated.tenantId,
            workspaceId: updated.workspaceId,
            eventType: 'record_updated',
            actor: String(patch.metadata?.actor || 'system'),
            payload: { patchKeys: Object.keys(patch || {}) },
        });
        await this.persist();
        return updated;
    }
    async voteRecord(id, direction, owner, scope) {
        const row = await this.getRecord(id, owner, scope);
        if (!row)
            return null;
        const votes = { ...row.votes, [direction]: row.votes[direction] + 1 };
        const updated = await this.updateRecord(id, { votes }, owner, scope);
        if (updated) {
            this.pushEvent({
                recordId: id,
                userId: updated.owner,
                tenantId: updated.tenantId,
                workspaceId: updated.workspaceId,
                eventType: 'record_voted',
                actor: 'ui-user',
                payload: { direction, votes: updated.votes },
            });
            await this.persist();
        }
        return updated;
    }
    async addFunctionalLink(id, link, owner, scope) {
        const row = await this.getRecord(id, owner, scope);
        if (!row)
            return null;
        const next = { ...link, createdAt: new Date().toISOString() };
        const updated = await this.updateRecord(id, { links: [...row.links, next] }, owner, scope);
        if (updated) {
            this.pushEvent({
                recordId: id,
                userId: updated.owner,
                tenantId: updated.tenantId,
                workspaceId: updated.workspaceId,
                eventType: 'functional_link_added',
                actor: 'system',
                payload: { targetId: next.targetId, linkType: next.linkType, weight: next.weight },
            });
            await this.persist();
        }
        return updated;
    }
    async addFeedbackIteration(id, input, owner, scope) {
        const row = await this.getRecord(id, owner, scope);
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
        const updated = await this.updateRecord(id, { rag }, owner, scope);
        if (updated) {
            this.pushEvent({
                recordId: id,
                userId: updated.owner,
                tenantId: updated.tenantId,
                workspaceId: updated.workspaceId,
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
            itinerary: {
                lane: 'realtime_broker_routing',
                horizon: 'realtime',
                coordinationMode: 'brokered',
                signalSources: ['ws_relay', 'redis', 'api'],
                sequencingKey: String(task.correlationId || task.id || action || 'orchestrated'),
                clockSource: 'master-clock',
            },
            metadata: { rawEvent: payload, dispatchAction: action },
            source: 'orchestrator',
        });
        return record;
    }
    async getGrid(owner, scope) {
        await this.ensureLoaded();
        const rows = owner
            ? this.store.records.filter((record) => record.owner === owner)
            : this.store.records;
        const scopedRows = rows.filter((record) => this.isScopeMatch(record, scope));
        const byKind = {};
        const byStatus = {};
        let sumProgress = 0;
        let sumBpm = 0;
        for (const row of scopedRows) {
            byKind[row.kind] = (byKind[row.kind] || 0) + 1;
            byStatus[row.status] = (byStatus[row.status] || 0) + 1;
            sumProgress += row.fractal.progressPercent;
            sumBpm += row.fractal.rhythmBpm;
        }
        const total = scopedRows.length;
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
        const viewerUserId = params?.viewerUserId || params?.userId || null;
        const ownerUserId = params?.userId || viewerUserId;
        const access = await this.resolveTimelineAccess(viewerUserId, ownerUserId);
        if (!access.allowed || !access.ownerUserId) {
            return [];
        }
        const from = params?.dateFrom ? this.normalizeTimestamp(params.dateFrom) : undefined;
        const to = params?.dateTo ? this.normalizeTimestamp(params.dateTo) : undefined;
        const storeEvents = this.store.timelineEvents
            .filter((e) => (access.ownerUserId ? e.userId === access.ownerUserId : true))
            .filter((e) => this.isScopeMatch(e, params))
            .filter((e) => (params?.recordId ? e.recordId === params.recordId : true))
            .filter((e) => (params?.goalId ? e.goalId === params.goalId : true))
            .filter((e) => (params?.planId ? e.planId === params.planId : true))
            .filter((e) => (params?.eventType ? e.eventType === params.eventType : true))
            .filter((e) => (params?.actor ? e.actor === params.actor : true))
            .filter((e) => (from ? e.timestamp >= from : true))
            .filter((e) => (to ? e.timestamp <= to : true))
            .filter((e) => params?.timelineTrack
            ? String((e.payload || {}).segment || (e.payload || {}).timelineTrack || '').toLowerCase() === params.timelineTrack.toLowerCase()
            : true);
        const librarianEvents = await this.listLibrarianTimelineEvents({
            ownerUserId: access.ownerUserId,
            dateFrom: from,
            dateTo: to,
            actor: params?.actor,
            timelineTrack: params?.timelineTrack,
            eventType: params?.eventType,
        });
        const publicEvents = await this.listPublicTimelineEvents({
            ownerUserId: access.ownerUserId,
            dateFrom: from,
            dateTo: to,
            actor: params?.actor,
            timelineTrack: params?.timelineTrack,
            eventType: params?.eventType,
        });
        return [...storeEvents, ...librarianEvents, ...publicEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    async getTimelineEvent(id, userId, scope) {
        await this.ensureLoaded();
        const event = this.store.timelineEvents.find((e) => e.id === id) || null;
        if (event) {
            const access = await this.resolveTimelineAccess(userId || null, event.userId || userId || null);
            if (!access.allowed)
                return null;
            if (!this.isScopeMatch(event, scope))
                return null;
            return event;
        }
        return this.getLibrarianTimelineEventById(id, userId || null);
    }
    async createTimelineEvent(input) {
        await this.ensureLoaded();
        this.validateTimelineRefs(input);
        const timestamp = input.timestamp
            ? this.normalizeTimestamp(input.timestamp)
            : new Date().toISOString();
        const eventType = this.validateEventType(input.eventType);
        const deduped = this.findDuplicateTimelineEvent({
            userId: input.userId,
            tenantId: input.tenantId,
            workspaceId: input.workspaceId,
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
            userId: input.userId,
            tenantId: input.tenantId,
            workspaceId: input.workspaceId,
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
    async bootstrapPersonalTimeline(userId, context) {
        await this.ensureLoaded();
        const existingEvents = await this.listTimelineEvents({ userId });
        const existingKeys = new Set(existingEvents
            .map((event) => event.payload?.storyKey)
            .filter((value) => typeof value === 'string' && value.length > 0));
        const blueprint = await this.buildPersonalTimelineBlueprint(userId, context);
        let createdCount = 0;
        for (const segment of blueprint) {
            if (existingKeys.has(segment.key)) {
                continue;
            }
            await this.createTimelineEvent({
                userId,
                actor: userId,
                eventType: 'historical_event',
                timestamp: segment.timestamp,
                payload: {
                    title: segment.title,
                    description: segment.description,
                    point: segment.point,
                    category: segment.segment,
                    segment: segment.segment,
                    confidence: segment.confidence || 'moderate',
                    evidenceRefs: segment.evidenceRefs || [],
                    storyKey: segment.key,
                    source: 'personal-timeline-bootstrap',
                    isPrivate: true,
                },
            });
            createdCount += 1;
        }
        const events = await this.listTimelineEvents({ userId });
        return {
            message: createdCount > 0
                ? `Generated ${createdCount} private personal timeline segments`
                : 'Personal timeline segments already exist',
            createdCount,
            totalCount: events.length,
            events,
        };
    }
    async importGithubNarrativeTimeline(userId, input = {}) {
        await this.ensureLoaded();
        const report = await this.loadGithubNarrativeReport(input);
        const timelines = Array.isArray(report.parallel_timelines) ? report.parallel_timelines : [];
        const normalizedConnections = this.normalizeGithubNarrativeConnections(report);
        const connectionIndex = this.buildGithubConnectionIndex(normalizedConnections);
        const source = 'github-history-import';
        const actor = (input.actor || '').trim() || userId;
        if (timelines.length === 0) {
            const currentEvents = await this.listTimelineEvents({ userId });
            return {
                message: 'GitHub narrative report has no parallel timelines to import',
                importedCount: 0,
                skippedCount: 0,
                removedCount: 0,
                trackSummaries: [],
                connectionCount: normalizedConnections.length,
                matchedConnectionCount: 0,
                totalCount: currentEvents.length,
                generatedAt: this.normalizeOptionalTimestamp(report.generated_at_utc),
            };
        }
        let removedCount = 0;
        if (input.replaceExisting) {
            const before = this.store.timelineEvents.length;
            this.store.timelineEvents = this.store.timelineEvents.filter((event) => {
                if (event.userId !== userId)
                    return true;
                const payload = this.safeJsonObject(event.payload);
                return payload.source !== source;
            });
            removedCount = before - this.store.timelineEvents.length;
        }
        const existingStoryKeys = new Set(this.store.timelineEvents
            .filter((event) => event.userId === userId)
            .map((event) => this.safeJsonObject(event.payload))
            .filter((payload) => payload.source === source)
            .map((payload) => String(payload.storyKey || '').trim())
            .filter((storyKey) => storyKey.length > 0));
        let importedCount = 0;
        let skippedCount = 0;
        let matchedConnectionCount = 0;
        const trackSummaries = [];
        const normalizedGeneratedAt = this.normalizeOptionalTimestamp(report.generated_at_utc);
        for (const timeline of timelines) {
            const timelineId = this.normalizeTimelineId(timeline?.timeline_id);
            const timelineDescription = typeof timeline?.description === 'string' ? timeline.description.trim() : '';
            const events = Array.isArray(timeline?.events) ? timeline.events : [];
            const total = events.length;
            let importedForTrack = 0;
            let skippedForTrack = 0;
            const denominator = Math.max(1, total - 1);
            for (let index = 0; index < events.length; index += 1) {
                const event = events[index];
                const title = (event?.title || '').trim();
                if (!title) {
                    skippedCount += 1;
                    skippedForTrack += 1;
                    continue;
                }
                const storyKey = this.buildGithubStoryKey(timelineId, event, index);
                if (existingStoryKeys.has(storyKey)) {
                    skippedCount += 1;
                    skippedForTrack += 1;
                    continue;
                }
                const timestamp = this.normalizeGithubEventTimestamp(event?.date, normalizedGeneratedAt);
                const evidenceRefs = this.extractGithubEvidenceRefs(event?.evidence);
                const narrativeNodeRefs = this.extractGithubNodeRefs(event, evidenceRefs);
                const narrativeConnections = this.matchGithubConnections(narrativeNodeRefs, connectionIndex);
                matchedConnectionCount += narrativeConnections.length;
                const payload = {
                    title,
                    description: timelineDescription,
                    point: Math.round((index / denominator) * 100),
                    category: this.githubTimelineCategory(timelineId),
                    segment: timelineId,
                    timelineTrack: timelineId,
                    timelineCategory: 'github-history',
                    project: this.githubTimelineProject(timelineId),
                    evidenceRefs,
                    sources: evidenceRefs,
                    storyKey,
                    source,
                    confidence: 'hard',
                    isPrivate: true,
                    narrativeNodeRefs,
                    narrativeConnections,
                    narrativeConnectionRefs: narrativeConnections.map((connection) => `${connection.from}->${connection.to}#${connection.connectionType}`),
                    githubTrack: typeof event?.track === 'string' ? event.track : undefined,
                    githubGeneratedAt: normalizedGeneratedAt,
                    accessScope: 'owner_and_agents',
                };
                await this.createTimelineEvent({
                    userId,
                    actor,
                    eventType: 'historical_event',
                    timestamp,
                    payload,
                });
                existingStoryKeys.add(storyKey);
                importedCount += 1;
                importedForTrack += 1;
            }
            trackSummaries.push({
                timelineId,
                total,
                imported: importedForTrack,
                skipped: skippedForTrack,
            });
        }
        const totalCount = (await this.listTimelineEvents({ userId })).length;
        await this.persist();
        return {
            message: importedCount > 0
                ? `Imported ${importedCount} GitHub timeline events across ${trackSummaries.length} tracks`
                : 'No new GitHub timeline events were imported',
            importedCount,
            skippedCount,
            removedCount,
            trackSummaries,
            connectionCount: normalizedConnections.length,
            matchedConnectionCount,
            totalCount,
            generatedAt: normalizedGeneratedAt,
        };
    }
    async getGithubNarrativeGraph(params) {
        await this.ensureLoaded();
        const viewerUserId = params?.viewerUserId || params?.userId || null;
        const ownerUserId = params?.userId || viewerUserId;
        const access = await this.resolveTimelineAccess(viewerUserId, ownerUserId);
        if (!access.allowed || !access.ownerUserId) {
            return {
                ownerUserId: null,
                eventCount: 0,
                nodeCount: 0,
                edgeCount: 0,
                generatedAt: null,
                nodes: [],
                edges: [],
            };
        }
        const events = this.store.timelineEvents
            .filter((event) => event.userId === access.ownerUserId)
            .filter((event) => {
            const payload = this.safeJsonObject(event.payload);
            return payload.source === 'github-history-import';
        })
            .filter((event) => {
            if (!params?.timelineTrack)
                return true;
            const payload = this.safeJsonObject(event.payload);
            const track = String(payload.timelineTrack || payload.segment || '').toLowerCase();
            return track === params.timelineTrack.toLowerCase();
        });
        const nodeMap = new Map();
        const edgeMap = new Map();
        let generatedAt = null;
        const ensureNode = (nodeId, track, project, eventId) => {
            const existing = nodeMap.get(nodeId);
            const kind = /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(nodeId) ? 'repo' : 'reference';
            if (existing) {
                if (track)
                    existing.tracks.add(track);
                if (project)
                    existing.projects.add(project);
                if (eventId)
                    existing.eventIds.add(eventId);
                return;
            }
            nodeMap.set(nodeId, {
                id: nodeId,
                label: nodeId,
                kind,
                tracks: new Set(track ? [track] : []),
                projects: new Set(project ? [project] : []),
                eventIds: new Set(eventId ? [eventId] : []),
            });
        };
        for (const event of events) {
            const payload = this.safeJsonObject(event.payload);
            const track = typeof payload.timelineTrack === 'string' ? payload.timelineTrack : undefined;
            const project = typeof payload.project === 'string' ? payload.project : undefined;
            const eventGeneratedAt = typeof payload.githubGeneratedAt === 'string'
                ? this.normalizeOptionalTimestamp(payload.githubGeneratedAt)
                : null;
            if (eventGeneratedAt && (!generatedAt || eventGeneratedAt > generatedAt)) {
                generatedAt = eventGeneratedAt;
            }
            const evidenceRefs = this.safeJsonStringArray(payload.evidenceRefs);
            const nodeRefs = Array.from(new Set([
                ...this.safeJsonStringArray(payload.narrativeNodeRefs).map((value) => this.normalizeGithubNodeId(value)),
                ...evidenceRefs.map((value) => this.normalizeGithubNodeId(value)),
            ])).filter((value) => typeof value === 'string' && value.length > 0);
            for (const nodeRef of nodeRefs) {
                ensureNode(nodeRef, track, project, event.id);
            }
            const rawConnections = Array.isArray(payload.narrativeConnections)
                ? payload.narrativeConnections
                : [];
            const parsedConnections = rawConnections
                .map((value) => this.normalizeGithubNarrativeConnection(value))
                .filter((value) => value !== null);
            for (const connection of parsedConnections) {
                ensureNode(connection.from, track, project, event.id);
                ensureNode(connection.to, track, project, event.id);
                const edgeKey = `${connection.from}|${connection.to}|${connection.connectionType}`;
                const existing = edgeMap.get(edgeKey);
                if (existing) {
                    existing.weight += 1;
                    if (!existing.rationale && connection.rationale) {
                        existing.rationale = connection.rationale;
                    }
                }
                else {
                    edgeMap.set(edgeKey, {
                        from: connection.from,
                        to: connection.to,
                        connectionType: connection.connectionType,
                        weight: 1,
                        rationale: connection.rationale,
                        strength: connection.strength,
                    });
                }
            }
        }
        return {
            ownerUserId: access.ownerUserId,
            eventCount: events.length,
            nodeCount: nodeMap.size,
            edgeCount: edgeMap.size,
            generatedAt,
            nodes: Array.from(nodeMap.values())
                .map((node) => ({
                id: node.id,
                label: node.label,
                kind: node.kind,
                tracks: Array.from(node.tracks).sort(),
                projects: Array.from(node.projects).sort(),
                eventCount: node.eventIds.size,
            }))
                .sort((a, b) => a.id.localeCompare(b.id)),
            edges: Array.from(edgeMap.values()).sort((a, b) => {
                if (a.from !== b.from)
                    return a.from.localeCompare(b.from);
                if (a.to !== b.to)
                    return a.to.localeCompare(b.to);
                return a.connectionType.localeCompare(b.connectionType);
            }),
        };
    }
    async updateTimelineEvent(id, patch, scope) {
        await this.ensureLoaded();
        const idx = this.store.timelineEvents.findIndex((e) => e.id === id);
        if (idx < 0)
            return null;
        const current = this.store.timelineEvents[idx];
        if (patch.userId && current.userId !== patch.userId) {
            return null;
        }
        if (!this.isScopeMatch(current, scope)) {
            return null;
        }
        if (patch.tenantId && current.tenantId && current.tenantId !== patch.tenantId) {
            return null;
        }
        if (patch.workspaceId && current.workspaceId && current.workspaceId !== patch.workspaceId) {
            return null;
        }
        const updated = {
            ...current,
            tenantId: patch.tenantId ?? current.tenantId,
            workspaceId: patch.workspaceId ?? current.workspaceId,
            actor: patch.actor || current.actor,
            timestamp: patch.timestamp ? this.normalizeTimestamp(patch.timestamp) : current.timestamp,
            payload: patch.payload ? { ...current.payload, ...patch.payload } : current.payload,
        };
        this.store.timelineEvents[idx] = updated;
        await this.persist();
        return updated;
    }
    async deleteTimelineEvent(id, userId, scope) {
        await this.ensureLoaded();
        const idx = this.store.timelineEvents.findIndex((e) => e.id === id);
        if (idx < 0)
            return false;
        const current = this.store.timelineEvents[idx];
        if (userId && current.userId !== userId) {
            return false;
        }
        if (!this.isScopeMatch(current, scope)) {
            return false;
        }
        this.store.timelineEvents.splice(idx, 1);
        await this.persist();
        return true;
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
            tenantId: input.tenantId,
            workspaceId: input.workspaceId,
            linkedRecordIds: input.linkedRecordIds || [],
            milestones: [],
            createdAt: now,
            updatedAt: now,
        };
        this.store.goals.push(goal);
        this.pushEvent({
            userId: goal.owner,
            tenantId: goal.tenantId,
            workspaceId: goal.workspaceId,
            goalId: goal.id,
            eventType: 'goal_created',
            actor: goal.owner,
            payload: { linkedRecordIds: goal.linkedRecordIds },
        });
        await this.persist();
        return goal;
    }
    async listGoals(filters) {
        await this.ensureLoaded();
        return [...this.store.goals]
            .filter((g) => (filters?.owner ? g.owner === filters.owner : true))
            .filter((g) => this.isScopeMatch(g, filters))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async getGoal(goalId, owner, scope) {
        await this.ensureLoaded();
        const goal = this.store.goals.find((g) => g.id === goalId) || null;
        if (!goal)
            return null;
        if (owner && goal.owner !== owner)
            return null;
        if (!this.isScopeMatch(goal, scope))
            return null;
        return goal;
    }
    async linkGoalToRecord(goalId, recordId, actor = 'system', owner, scope) {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        if (owner && current.owner !== owner)
            return null;
        if (!this.isScopeMatch(current, scope))
            return null;
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
            userId: updated.owner,
            tenantId: updated.tenantId,
            workspaceId: updated.workspaceId,
            goalId,
            recordId,
            eventType: 'goal_linked',
            actor,
            payload: {},
        });
        await this.persist();
        return updated;
    }
    async addGoalMilestone(goalId, input, scope) {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        if (input.owner && current.owner !== input.owner)
            return null;
        if (!this.isScopeMatch(current, scope))
            return null;
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
            userId: updated.owner,
            tenantId: updated.tenantId,
            workspaceId: updated.workspaceId,
            goalId,
            eventType: 'milestone_updated',
            actor: input.owner || 'system',
            payload: { milestone },
        });
        await this.persist();
        return updated;
    }
    async updateGoalMilestone(goalId, milestoneId, patch, scope) {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        if (patch.owner && current.owner !== patch.owner)
            return null;
        if (!this.isScopeMatch(current, scope))
            return null;
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
            userId: updated.owner,
            tenantId: updated.tenantId,
            workspaceId: updated.workspaceId,
            goalId,
            eventType: 'milestone_updated',
            actor: patch.owner || 'system',
            payload: { milestoneId, patch },
        });
        await this.persist();
        return updated;
    }
    async removeGoalMilestone(goalId, milestoneId, owner, scope) {
        await this.ensureLoaded();
        const idx = this.store.goals.findIndex((g) => g.id === goalId);
        if (idx < 0)
            return null;
        const current = this.store.goals[idx];
        if (owner && current.owner !== owner)
            return null;
        if (!this.isScopeMatch(current, scope))
            return null;
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
            userId: updated.owner,
            tenantId: updated.tenantId,
            workspaceId: updated.workspaceId,
            goalId,
            eventType: 'milestone_updated',
            actor: owner || 'system',
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
            tenantId: input.tenantId,
            workspaceId: input.workspaceId,
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
            userId: plan.owner,
            tenantId: plan.tenantId,
            workspaceId: plan.workspaceId,
            planId: plan.id,
            eventType: 'plan_created',
            actor: plan.owner,
            payload: { linkedGoalIds: plan.linkedGoalIds, linkedRecordIds: plan.linkedRecordIds },
        });
        await this.persist();
        return plan;
    }
    async listPlans(filters) {
        await this.ensureLoaded();
        return [...this.store.plans]
            .filter((p) => (filters?.owner ? p.owner === filters.owner : true))
            .filter((p) => this.isScopeMatch(p, filters))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async getPlan(planId, owner, scope) {
        await this.ensureLoaded();
        const plan = this.store.plans.find((p) => p.id === planId) || null;
        if (!plan)
            return null;
        if (owner && plan.owner !== owner)
            return null;
        if (!this.isScopeMatch(plan, scope))
            return null;
        return plan;
    }
    async getRecordConnections(recordId, owner, scope) {
        await this.ensureLoaded();
        const goals = this.store.goals.filter((g) => g.linkedRecordIds.includes(recordId) &&
            (!owner || g.owner === owner) &&
            this.isScopeMatch(g, scope));
        const plans = this.store.plans.filter((p) => p.linkedRecordIds.includes(recordId) &&
            (!owner || p.owner === owner) &&
            this.isScopeMatch(p, scope));
        return { goals, plans };
    }
    async linkPlan(planId, input, scope) {
        await this.ensureLoaded();
        const idx = this.store.plans.findIndex((p) => p.id === planId);
        if (idx < 0)
            return null;
        const current = this.store.plans[idx];
        if (input.owner && current.owner !== input.owner)
            return null;
        if (!this.isScopeMatch(current, scope))
            return null;
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
            userId: updated.owner,
            tenantId: updated.tenantId,
            workspaceId: updated.workspaceId,
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
    async resolveTimelineAccess(viewerUserId, ownerUserId) {
        if (!viewerUserId || !ownerUserId) {
            return { allowed: false, ownerUserId: null };
        }
        if (viewerUserId === ownerUserId) {
            return { allowed: true, ownerUserId };
        }
        const privateOwnerUserId = await this.resolvePrivateTimelineOwnerUserId();
        if (privateOwnerUserId && ownerUserId === privateOwnerUserId) {
            const allowedAgents = this.getPrivateTimelineAgentUserIds();
            if (allowedAgents.has(viewerUserId)) {
                return { allowed: true, ownerUserId };
            }
        }
        const delegatedWorkspaceAccess = await this.hasWorkspaceDelegatedTimelineAccess(viewerUserId, ownerUserId);
        if (!delegatedWorkspaceAccess) {
            return { allowed: false, ownerUserId: null };
        }
        return { allowed: true, ownerUserId };
    }
    async hasWorkspaceDelegatedTimelineAccess(viewerUserId, ownerUserId) {
        if (!this.db)
            return false;
        try {
            const memberRows = await this.db.workspaceMembers?.listByUser?.(viewerUserId);
            if (!Array.isArray(memberRows) || memberRows.length === 0) {
                return false;
            }
            const delegatedWorkspaceIds = new Set(memberRows
                .map((row) => (typeof row?.workspaceId === 'string' ? row.workspaceId.trim() : ''))
                .filter((workspaceId) => workspaceId.length > 0));
            if (delegatedWorkspaceIds.size === 0) {
                return false;
            }
            const ownerWorkspaces = await this.db.workspaces?.findByOwnerWithOwner?.(ownerUserId);
            if (!Array.isArray(ownerWorkspaces) || ownerWorkspaces.length === 0) {
                return false;
            }
            return ownerWorkspaces.some((workspace) => {
                const workspaceId = typeof workspace?.id === 'string' ? workspace.id.trim() : '';
                return workspaceId.length > 0 && delegatedWorkspaceIds.has(workspaceId);
            });
        }
        catch (error) {
            this.logger.warn(`Failed delegated workspace timeline access check for viewer ${viewerUserId}: ${error.message}`);
            return false;
        }
    }
    getPrivateTimelineAgentUserIds() {
        return new Set((process.env.TIMELINE_PRIVATE_AGENT_USER_IDS || '')
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0));
    }
    shouldReadLibrarianTimeline() {
        const raw = String(process.env.TIMELINE_USE_LIBRARIAN_SOURCE || 'true')
            .trim()
            .toLowerCase();
        return raw !== '0' && raw !== 'false' && raw !== 'off' && raw !== 'no';
    }
    async resolvePrivateTimelineOwnerUserId() {
        const now = Date.now();
        if (this.cachedPrivateTimelineOwnerResolvedAt > 0 &&
            now - this.cachedPrivateTimelineOwnerResolvedAt < 5 * 60_000) {
            return this.cachedPrivateTimelineOwnerUserId;
        }
        const explicitOwnerId = String(process.env.TIMELINE_PRIVATE_OWNER_USER_ID || '').trim();
        if (explicitOwnerId) {
            this.cachedPrivateTimelineOwnerUserId = explicitOwnerId;
            this.cachedPrivateTimelineOwnerResolvedAt = now;
            return explicitOwnerId;
        }
        if (!this.db) {
            this.cachedPrivateTimelineOwnerUserId = null;
            this.cachedPrivateTimelineOwnerResolvedAt = now;
            return null;
        }
        const ownerEmails = (process.env.TIMELINE_PRIVATE_OWNER_EMAILS || 'owner@example.com')
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email.length > 0);
        for (const email of ownerEmails) {
            const user = await this.db.users.findByEmail(email);
            if (user?.id) {
                this.cachedPrivateTimelineOwnerUserId = user.id;
                this.cachedPrivateTimelineOwnerResolvedAt = now;
                return user.id;
            }
        }
        this.cachedPrivateTimelineOwnerUserId = null;
        this.cachedPrivateTimelineOwnerResolvedAt = now;
        return null;
    }
    timelineTrackToProject(track) {
        if (track === 'tnf_platform_development')
            return 'The New Fuse Platform';
        if (track === 'media_empire_strategy')
            return "Daniel Who's Media Empire";
        if (track === 'new_fuse_novel_development')
            return 'The New Fuse (Novel)';
        return 'Identity & Aliases';
    }
    timelineTrackToUiCategory(track) {
        if (track === 'tnf_platform_development')
            return 'Business & Projects';
        if (track === 'media_empire_strategy')
            return 'Business & Projects';
        if (track === 'new_fuse_novel_development')
            return 'Creativity';
        return 'Identity';
    }
    async loadGithubNarrativeReport(input) {
        if (input.report && typeof input.report === 'object') {
            return input.report;
        }
        const reportPath = await this.resolveGithubNarrativePath(input.reportPath);
        const raw = await fs.readFile(reportPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            throw new Error(`Invalid GitHub narrative payload from ${reportPath}`);
        }
        return parsed;
    }
    async resolveGithubNarrativePath(explicitPath) {
        const candidateSet = new Set();
        const push = (value) => {
            if (!value)
                return;
            const trimmed = value.trim();
            if (!trimmed)
                return;
            candidateSet.add(path.resolve(trimmed));
        };
        push(explicitPath);
        push(process.env.GITHUB_HISTORY_NARRATIVE_PATH);
        push(path.join(process.cwd(), 'github-history', 'whodaniel-github-history-narrative.json'));
        push(path.join(process.cwd(), '..', 'github-history', 'whodaniel-github-history-narrative.json'));
        push(path.join(process.cwd(), '..', '..', 'github-history', 'whodaniel-github-history-narrative.json'));
        if (process.env.HOME) {
            push(path.join(process.env.HOME, 'github-history', 'whodaniel-github-history-narrative.json'));
        }
        for (const candidate of candidateSet) {
            try {
                await fs.access(candidate);
                return candidate;
            }
            catch {
                continue;
            }
        }
        throw new Error('GitHub narrative report not found. Provide report in body or set GITHUB_HISTORY_NARRATIVE_PATH.');
    }
    normalizeTimelineId(input) {
        const raw = (input || '').trim();
        if (!raw)
            return 'github_history';
        return (raw
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'github_history');
    }
    normalizeOptionalTimestamp(input) {
        if (!input)
            return null;
        try {
            return this.normalizeTimestamp(input);
        }
        catch {
            return null;
        }
    }
    normalizeGithubEventTimestamp(dateValue, fallback) {
        if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) {
            return `${dateValue.trim()}T00:00:00.000Z`;
        }
        if (dateValue) {
            return this.normalizeTimestamp(dateValue);
        }
        if (fallback) {
            return fallback;
        }
        return new Date().toISOString();
    }
    buildGithubStoryKey(timelineId, event, index) {
        const rawDate = (event?.date || '').trim() || 'unknown-date';
        const rawTitle = (event?.title || '').trim() || `event-${index + 1}`;
        const slug = rawTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);
        return `github-history:${timelineId}:${rawDate}:${slug || `event-${index + 1}`}`;
    }
    extractGithubEvidenceRefs(evidence) {
        if (!evidence)
            return [];
        const refs = new Set();
        const add = (value) => {
            if (typeof value !== 'string')
                return;
            const trimmed = value.trim();
            if (!trimmed)
                return;
            refs.add(trimmed);
        };
        if (typeof evidence === 'string') {
            add(evidence);
            return Array.from(refs);
        }
        if (Array.isArray(evidence)) {
            for (const item of evidence) {
                add(item);
            }
            return Array.from(refs);
        }
        if (typeof evidence === 'object') {
            const payload = evidence;
            add(payload.url);
            add(payload.type ? `github:${String(payload.type)}` : undefined);
            if (typeof payload.repo === 'string') {
                const repo = payload.repo.trim();
                if (repo) {
                    if (/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repo)) {
                        refs.add(`https://github.com/${repo}`);
                    }
                    else {
                        refs.add(repo);
                    }
                }
            }
            if (typeof payload.title === 'string' && payload.title.trim()) {
                refs.add(`github:title:${payload.title.trim()}`);
            }
        }
        return Array.from(refs);
    }
    normalizeGithubNarrativeConnections(report) {
        const fromNarrative = Array.isArray(report.narrative_connections)
            ? report.narrative_connections
            : [];
        const fromConnectionEdges = Array.isArray(report.connection_edges)
            ? report.connection_edges
            : [];
        const combined = [...fromNarrative, ...fromConnectionEdges];
        const deduped = new Map();
        for (const candidate of combined) {
            const normalized = this.normalizeGithubNarrativeConnection(candidate);
            if (!normalized)
                continue;
            const key = `${normalized.from}|${normalized.to}|${normalized.connectionType}`;
            if (!deduped.has(key)) {
                deduped.set(key, normalized);
            }
        }
        return Array.from(deduped.values());
    }
    normalizeGithubNarrativeConnection(candidate) {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
            return null;
        }
        const payload = candidate;
        const from = this.normalizeGithubNodeId(payload.from);
        const to = this.normalizeGithubNodeId(payload.to);
        if (!from || !to)
            return null;
        const connectionType = String(payload.connection_type || payload.connectionType || payload.type || 'related')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
        const rationale = typeof payload.rationale === 'string' && payload.rationale.trim().length > 0
            ? payload.rationale.trim()
            : undefined;
        const strength = typeof payload.strength === 'string' && payload.strength.trim().length > 0
            ? payload.strength.trim().toLowerCase()
            : 'medium';
        const evidenceRefs = [
            ...this.extractGithubEvidenceRefs(payload.evidence_refs),
            ...this.extractGithubEvidenceRefs(payload.evidence),
        ];
        return {
            from,
            to,
            connectionType: connectionType || 'related',
            rationale,
            evidenceRefs,
            strength,
        };
    }
    buildGithubConnectionIndex(connections) {
        const index = new Map();
        for (const connection of connections) {
            const push = (nodeId) => {
                const current = index.get(nodeId) || [];
                current.push(connection);
                index.set(nodeId, current);
            };
            push(connection.from);
            push(connection.to);
        }
        return index;
    }
    extractGithubNodeRefs(event, evidenceRefs) {
        const refs = new Set();
        const add = (value) => {
            const normalized = this.normalizeGithubNodeId(value);
            if (normalized)
                refs.add(normalized);
        };
        add(event?.evidence?.repo);
        add(event?.evidence?.url);
        for (const ref of evidenceRefs) {
            add(ref);
        }
        return Array.from(refs);
    }
    matchGithubConnections(nodeRefs, index) {
        if (!nodeRefs.length)
            return [];
        const found = new Map();
        for (const nodeRef of nodeRefs) {
            const candidates = index.get(nodeRef) || [];
            for (const candidate of candidates) {
                const key = `${candidate.from}|${candidate.to}|${candidate.connectionType}`;
                found.set(key, candidate);
            }
        }
        return Array.from(found.values());
    }
    normalizeGithubNodeId(input) {
        if (typeof input !== 'string')
            return null;
        const trimmed = input.trim();
        if (!trimmed)
            return null;
        const repoUrlMatch = trimmed.match(/^https?:\/\/github\.com\/([^/\s]+\/[^/\s#?]+)/i);
        if (repoUrlMatch) {
            return repoUrlMatch[1].replace(/\.git$/i, '');
        }
        if (/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(trimmed)) {
            return trimmed;
        }
        return null;
    }
    githubTimelineCategory(timelineId) {
        if (timelineId.includes('tnf') || timelineId.includes('platform')) {
            return 'Business & Projects';
        }
        if (timelineId.includes('knowledge') || timelineId.includes('library')) {
            return 'Legacy';
        }
        if (timelineId.includes('media') || timelineId.includes('interactive')) {
            return 'Creativity';
        }
        return 'Business & Projects';
    }
    githubTimelineProject(timelineId) {
        if (timelineId.includes('tnf') || timelineId.includes('platform')) {
            return 'The New Fuse Platform';
        }
        if (timelineId.includes('knowledge') || timelineId.includes('library')) {
            return "Daniel Who's Media Empire";
        }
        if (timelineId.includes('media') || timelineId.includes('interactive')) {
            return 'The New Fuse (Novel)';
        }
        return 'The New Fuse Platform';
    }
    safeJsonObject(input) {
        return input && typeof input === 'object' && !Array.isArray(input)
            ? input
            : {};
    }
    safeJsonStringArray(input) {
        if (!Array.isArray(input))
            return [];
        return input.filter((item) => typeof item === 'string' && item.trim().length > 0);
    }
    extractStoryArchitectSourceRefs(sessionId, tagsInput) {
        const refs = new Set();
        const normalizedSessionId = typeof sessionId === 'string' ? sessionId.trim() : '';
        if (normalizedSessionId) {
            refs.add(`session:${normalizedSessionId}`);
        }
        let sourceQuestionId;
        for (const rawTag of this.safeJsonStringArray(tagsInput)) {
            const tag = rawTag.trim();
            if (!tag)
                continue;
            const normalizedTag = tag.toLowerCase();
            if (normalizedTag.startsWith('session:')) {
                const value = tag.slice('session:'.length).trim();
                if (value)
                    refs.add(`session:${value}`);
                continue;
            }
            if (normalizedTag.startsWith('question:')) {
                const value = tag.slice('question:'.length).trim();
                if (!value)
                    continue;
                refs.add(`question:${value}`);
                if (sourceQuestionId === undefined && /^\d+$/.test(value)) {
                    sourceQuestionId = Number.parseInt(value, 10);
                }
            }
        }
        const evidenceRefs = Array.from(refs);
        return sourceQuestionId === undefined ? { evidenceRefs } : { evidenceRefs, sourceQuestionId };
    }
    async listPublicTimelineEvents(params) {
        if (!this.db)
            return [];
        if (params.eventType && params.eventType !== 'historical_event')
            return [];
        try {
            const predicates = [
                (0, database_1.sql) `(s.user_id::text = ${params.ownerUserId} OR s.owner_principal_id = ${params.ownerUserId})`,
            ];
            if (params.dateFrom) {
                predicates.push((0, database_1.sql) `e.event_date >= ${params.dateFrom}::timestamptz::date`);
            }
            if (params.dateTo) {
                predicates.push((0, database_1.sql) `e.event_date <= ${params.dateTo}::timestamptz::date`);
            }
            if (params.actor) {
                predicates.push((0, database_1.sql) `LOWER(COALESCE(e.source_type, '')) = LOWER(${params.actor})`);
            }
            const whereSql = predicates.reduce((acc, predicate) => (0, database_1.sql) `${acc} AND ${predicate}`, (0, database_1.sql) `true`);
            const rows = (await this.db.client.execute((0, database_1.sql) `
          SELECT
            e.id::text AS id,
            e.session_id::text AS session_id,
            e.era AS era,
            e.event_date::text AS event_date,
            e.title AS title,
            e.description AS description,
            e.source_type AS source_type,
            e.tags AS tags,
            e.created_at::text AS created_at
          FROM public.timeline_events e
          INNER JOIN public.story_sessions s ON s.id = e.session_id
          WHERE ${whereSql}
          ORDER BY e.event_date DESC, e.created_at DESC
          LIMIT 5000
        `));
            if (!rows.length)
                return [];
            const total = Math.max(1, rows.length - 1);
            const events = rows.map((row, index) => {
                const { evidenceRefs, sourceQuestionId } = this.extractStoryArchitectSourceRefs(row.session_id, row.tags);
                let track = 'new_fuse_novel_development';
                let project = 'The New Fuse (Novel)';
                if (Array.isArray(row.tags)) {
                    if (row.tags.some((t) => String(t).includes('platform'))) {
                        track = 'tnf_platform_development';
                        project = 'The New Fuse Platform';
                    }
                }
                const timestamp = row.event_date ? `${row.event_date}T00:00:00.000Z` : row.created_at;
                return {
                    id: row.id,
                    userId: params.ownerUserId,
                    eventType: 'historical_event',
                    actor: row.source_type || 'story-architect',
                    timestamp,
                    payload: {
                        title: row.title,
                        description: row.description || '',
                        point: Math.round((index / total) * 100),
                        category: 'Creativity',
                        segment: track,
                        timelineTrack: track,
                        timelineCategory: 'Story Architect',
                        project,
                        confidence: 'strong',
                        evidenceRefs,
                        sources: evidenceRefs,
                        source: 'public.timeline_events',
                        era: row.era,
                        tags: Array.isArray(row.tags) ? row.tags : [],
                        sourceQuestionId,
                        sourceSessionId: row.session_id,
                        accessScope: 'owner_and_agents',
                        isPrivate: true,
                    },
                };
            });
            if (params.timelineTrack) {
                const wantedTrack = params.timelineTrack.toLowerCase();
                return events.filter((event) => {
                    const payload = this.safeJsonObject(event.payload);
                    const track = String(payload.timelineTrack || payload.segment || '').toLowerCase();
                    return track === wantedTrack;
                });
            }
            return events;
        }
        catch (error) {
            this.logger.warn(`Failed loading public timeline events: ${error.message}`);
            return [];
        }
    }
    mapLibrarianRowsToTimelineEvents(rows, ownerUserId) {
        if (!rows.length)
            return [];
        const total = Math.max(1, rows.length - 1);
        return rows
            .sort((a, b) => a.event_at.localeCompare(b.event_at))
            .map((row, index) => {
            const metadata = this.safeJsonObject(row.metadata);
            const evidenceRefs = this.safeJsonStringArray(row.evidence_refs);
            const assetRefs = evidenceRefs
                .filter((ref) => ref.startsWith('librarian:artifact:'))
                .map((ref) => ref.replace('librarian:artifact:', ''));
            const project = this.timelineTrackToProject(row.timeline_track);
            return {
                id: row.timeline_event_id,
                userId: ownerUserId,
                eventType: 'historical_event',
                actor: 'timeline-archaeology',
                timestamp: row.event_at,
                payload: {
                    title: row.title,
                    description: row.description || '',
                    point: Math.round((index / total) * 100),
                    category: this.timelineTrackToUiCategory(row.timeline_track),
                    segment: row.timeline_track,
                    timelineTrack: row.timeline_track,
                    timelineCategory: row.category,
                    project,
                    confidence: row.confidence,
                    evidenceRefs,
                    sources: evidenceRefs,
                    source: 'librarian.timeline_event',
                    canonicalEventId: row.canonical_event_id,
                    assetRefs,
                    folderName: typeof metadata.folder_name === 'string' ? metadata.folder_name : undefined,
                    sourceExternalRef: typeof metadata.source_external_ref === 'string'
                        ? metadata.source_external_ref
                        : undefined,
                    accessScope: 'owner_and_agents',
                    isPrivate: true,
                },
            };
        })
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    async listLibrarianTimelineEvents(params) {
        if (!this.db || !this.shouldReadLibrarianTimeline()) {
            return [];
        }
        if (params.eventType && params.eventType !== 'historical_event') {
            return [];
        }
        const ownerIsPrivateOwner = (await this.resolvePrivateTimelineOwnerUserId()) === params.ownerUserId;
        if (!ownerIsPrivateOwner) {
            return [];
        }
        const predicates = [
            (0, database_1.sql) `((metadata ->> 'owner_user_id') = ${params.ownerUserId} OR ((metadata ->> 'source_family') = 'apple_notes'))`,
        ];
        if (params.dateFrom) {
            predicates.push((0, database_1.sql) `event_at >= ${params.dateFrom}::timestamptz`);
        }
        if (params.dateTo) {
            predicates.push((0, database_1.sql) `event_at <= ${params.dateTo}::timestamptz`);
        }
        if (params.timelineTrack) {
            predicates.push((0, database_1.sql) `timeline_track = ${params.timelineTrack}`);
        }
        if (params.actor) {
            predicates.push((0, database_1.sql) `(timeline_track = ${params.actor} OR category = ${params.actor})`);
        }
        const whereSql = predicates.reduce((acc, predicate) => (0, database_1.sql) `${acc} AND ${predicate}`, (0, database_1.sql) `true`);
        try {
            const rows = (await this.db.client.execute((0, database_1.sql) `
          SELECT
            timeline_event_id::text,
            canonical_event_id,
            event_at::text,
            timeline_track,
            category,
            title,
            description,
            evidence_refs,
            metadata,
            confidence
          FROM librarian.timeline_event
          WHERE ${whereSql}
          ORDER BY event_at DESC
          LIMIT 5000
        `));
            return this.mapLibrarianRowsToTimelineEvents(rows, params.ownerUserId);
        }
        catch (error) {
            this.logger.warn(`Failed loading librarian timeline events: ${error.message}`);
            return [];
        }
    }
    async getLibrarianTimelineEventById(id, viewerUserId) {
        if (!this.db || !this.shouldReadLibrarianTimeline() || !viewerUserId) {
            return null;
        }
        try {
            const rows = (await this.db.client.execute((0, database_1.sql) `
          SELECT
            timeline_event_id::text,
            canonical_event_id,
            event_at::text,
            timeline_track,
            category,
            title,
            description,
            evidence_refs,
            metadata,
            confidence
          FROM librarian.timeline_event
          WHERE timeline_event_id::text = ${id} OR canonical_event_id = ${id}
          LIMIT 1
        `));
            if (!rows.length)
                return null;
            const row = rows[0];
            const metadata = this.safeJsonObject(row.metadata);
            const privateOwnerUserId = await this.resolvePrivateTimelineOwnerUserId();
            const ownerFromMetadata = typeof metadata.owner_user_id === 'string'
                ? metadata.owner_user_id
                : metadata.source_family === 'apple_notes'
                    ? privateOwnerUserId
                    : null;
            if (!ownerFromMetadata)
                return null;
            const access = await this.resolveTimelineAccess(viewerUserId, ownerFromMetadata);
            if (!access.allowed || !access.ownerUserId)
                return null;
            const mapped = this.mapLibrarianRowsToTimelineEvents([row], access.ownerUserId);
            return mapped[0] || null;
        }
        catch (error) {
            this.logger.warn(`Failed loading librarian timeline event ${id}: ${error.message}`);
            return null;
        }
    }
    async ensureLoaded() {
        if (this.initialized)
            return;
        try {
            await this.ensureStoreDirectory();
            const content = await fs.readFile(this.storePath, 'utf8');
            const parsed = JSON.parse(content);
            this.store = {
                records: (parsed.records || []).map((record) => this.migrateRecord(record)),
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
        const payload = JSON.stringify(this.store, null, 2);
        try {
            await this.ensureStoreDirectory();
            await fs.writeFile(this.storePath, payload, 'utf8');
        }
        catch (error) {
            if (!this.isPermissionError(error) || this.storePath.startsWith('/tmp/')) {
                throw error;
            }
            const fallbackPath = path.join('/tmp', 'tnf-data', 'unified-task-ledger.json');
            this.logger.warn(`No write permission for ${this.storePath}; falling back to ${fallbackPath}`);
            this.storePath = fallbackPath;
            await fs.mkdir(path.dirname(this.storePath), { recursive: true });
            await fs.writeFile(this.storePath, payload, 'utf8');
        }
    }
    resolveStorePath() {
        const explicitPath = process.env.UNIFIED_LEDGER_STORE_PATH?.trim();
        if (explicitPath)
            return explicitPath;
        return this.defaultStorePath;
    }
    async ensureStoreDirectory() {
        try {
            await fs.mkdir(path.dirname(this.storePath), { recursive: true });
        }
        catch (error) {
            if (!this.isPermissionError(error) || this.storePath.startsWith('/tmp/')) {
                throw error;
            }
            const fallbackPath = path.join('/tmp', 'tnf-data', 'unified-task-ledger.json');
            this.logger.warn(`No write permission for ${this.storePath}; falling back to ${fallbackPath}`);
            this.storePath = fallbackPath;
            await fs.mkdir(path.dirname(this.storePath), { recursive: true });
        }
    }
    isPermissionError(error) {
        if (!error || typeof error !== 'object')
            return false;
        const code = 'code' in error ? String(error.code) : '';
        return code === 'EACCES' || code === 'EPERM' || code === 'EROFS';
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
        if (v === 'p0')
            return 'urgent';
        if (v === 'p1')
            return 'high';
        if (v === 'p2')
            return 'medium';
        if (v === 'p3')
            return 'low';
        if (v === 'normal')
            return 'medium';
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
    migrateRecord(record) {
        return {
            ...record,
            itinerary: this.normalizeItinerary(record),
        };
    }
    normalizeItinerary(input) {
        const existing = input.itinerary || {};
        const lane = this.normalizeLane(existing.lane, input.kind || 'task', input.source || 'manual', input.metadata || {});
        const horizon = this.normalizeHorizon(existing.horizon, lane);
        const coordinationMode = this.normalizeCoordinationMode(existing.coordinationMode, lane);
        const signalSources = this.normalizeSignalSources(existing.signalSources, input.source || 'manual', lane);
        const sequencingKey = String(existing.sequencingKey ||
            input.id ||
            `${lane}:${input.kind || 'task'}:${input.title || 'untitled'}`);
        const clockSource = existing.clockSource || (lane === 'realtime_broker_routing' ? 'master-clock' : 'local-time');
        return {
            lane,
            horizon,
            coordinationMode,
            signalSources,
            sequencingKey,
            clockSource,
        };
    }
    mergeItinerary(current, patch) {
        return this.normalizeItinerary({
            itinerary: {
                ...current,
                ...patch,
            },
            kind: 'task',
            source: 'api',
        });
    }
    normalizeLane(value, kind, source, metadata) {
        const v = String(value || '').toLowerCase();
        const suggestionCategory = String(metadata.suggestionKind || metadata.suggestionType || metadata.category || '').toLowerCase();
        const known = {
            directive: 'directive',
            goal: 'goal',
            milestone: 'milestone',
            realtime_broker_routing: 'realtime_broker_routing',
            relay_federation: 'relay_federation',
            tauri_sync: 'tauri_sync',
            redis_sync: 'redis_sync',
            suggestion_vote: 'suggestion_vote',
            changelog_suggestion: 'changelog_suggestion',
            kanban_delivery: 'kanban_delivery',
        };
        if (known[v])
            return known[v];
        if (kind === 'suggestion') {
            if (suggestionCategory.includes('changelog'))
                return 'changelog_suggestion';
            if (suggestionCategory.includes('kanban'))
                return 'kanban_delivery';
            return 'suggestion_vote';
        }
        if (source === 'orchestrator')
            return 'realtime_broker_routing';
        if (source === 'relay')
            return 'relay_federation';
        if (source === 'system')
            return 'directive';
        return kind === 'review' ? 'milestone' : 'directive';
    }
    normalizeHorizon(value, lane) {
        const v = String(value || '').toLowerCase();
        if (v === 'realtime' || v === 'short_term' || v === 'medium_term' || v === 'long_term') {
            return v;
        }
        if (lane === 'realtime_broker_routing' ||
            lane === 'relay_federation' ||
            lane === 'redis_sync' ||
            lane === 'tauri_sync') {
            return 'realtime';
        }
        if (lane === 'kanban_delivery' || lane === 'milestone')
            return 'short_term';
        if (lane === 'changelog_suggestion')
            return 'medium_term';
        return 'long_term';
    }
    normalizeCoordinationMode(value, lane) {
        const v = String(value || '').toLowerCase();
        if (v === 'brokered' || v === 'direct' || v === 'hybrid')
            return v;
        if (lane === 'realtime_broker_routing')
            return 'brokered';
        if (lane === 'directive' || lane === 'goal')
            return 'hybrid';
        return 'direct';
    }
    normalizeSignalSources(value, source, lane) {
        const allowed = new Set([
            'ws_relay',
            'redis',
            'tauri',
            'api',
            'manual',
            'system',
        ]);
        const normalized = (Array.isArray(value) ? value : [])
            .map((v) => String(v).toLowerCase())
            .filter((v) => allowed.has(v));
        if (normalized.length > 0)
            return Array.from(new Set(normalized));
        const baseMap = {
            orchestrator: 'redis',
            relay: 'ws_relay',
            api: 'api',
            manual: 'manual',
            system: 'system',
        };
        const initial = baseMap[source] || 'manual';
        if (lane === 'realtime_broker_routing' && initial !== 'redis')
            return [initial, 'redis'];
        return [initial];
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
        if (!input.recordId && !input.goalId && !input.planId && !input.userId) {
            throw new Error('Timeline event must reference userId, recordId, goalId, or planId');
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
            if ((e.userId || '') !== (candidate.userId || ''))
                return false;
            if ((e.tenantId || '') !== (candidate.tenantId || ''))
                return false;
            if ((e.workspaceId || '') !== (candidate.workspaceId || ''))
                return false;
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
    async buildPersonalTimelineBlueprint(userId, context) {
        const displayName = context?.name?.trim() || 'Builder';
        const email = (context?.email || '').toLowerCase();
        const normalizedName = displayName.toLowerCase();
        const isDanielProfile = email === 'owner@example.com' ||
            normalizedName.includes('daniel') ||
            normalizedName.includes('who');
        const localJourney = isDanielProfile ? await this.readLocalJourneySummary() : null;
        const notesSummary = isDanielProfile ? await this.readAppleNotesBatchSummary() : null;
        const chronologySummary = isDanielProfile
            ? await this.readChronologicalReadthroughSummary()
            : null;
        if (isDanielProfile) {
            const firstSignalTimestamp = localJourney?.firstEventTimestamp || '2016-01-25T05:16:32.000Z';
            const firstSignalLabel = localJourney?.firstEventLabel || 'Early BizSynth signal artifact';
            const latestSignalTimestamp = localJourney?.latestEventTimestamp || '2026-03-22T00:00:00.000Z';
            const latestSignalLabel = localJourney?.latestEventLabel || 'Latest system evolution signal';
            const events2025 = localJourney?.byYear['2025'] || 0;
            const events2026 = localJourney?.byYear['2026'] || 0;
            const totalSignals = localJourney?.totalEvents || events2025 + events2026;
            const firstNoteTimestamp = notesSummary?.firstNoteTimestamp;
            const firstNoteTitle = notesSummary?.firstNoteTitle;
            const latestNoteTimestamp = notesSummary?.latestNoteTimestamp;
            const latestNoteTitle = notesSummary?.latestNoteTitle;
            const noteCount = notesSummary?.count || 0;
            const relayMilestone = chronologySummary?.relayEntry;
            const mcpMilestone = chronologySummary?.mcpEntry;
            const roadmapMilestone = chronologySummary?.roadmapEntry;
            return [
                {
                    key: 'personal-origin-anchor-private',
                    title: 'Personal Origin Anchor (Private)',
                    description: 'Owner-scoped private origin anchor. Exact birth details are maintained in private data stores and should not be embedded in public source.',
                    point: 1,
                    timestamp: '1970-01-01T00:00:00.000Z',
                    segment: 'Origins',
                    confidence: 'hard',
                    evidenceRefs: ['private://owner-origin-anchor'],
                },
                {
                    key: 'origins-builder-identity',
                    title: 'Origins: Builder Identity Emerges',
                    description: `${displayName} establishes a systems-first builder identity focused on autonomy, independent execution, and long-range leverage.`,
                    point: 9,
                    timestamp: '2014-01-01T00:00:00.000Z',
                    segment: 'Foundations',
                    confidence: 'moderate',
                },
                {
                    key: 'bizsynth-signal-2016',
                    title: 'BizSynth Era Signal',
                    description: `First local evidence signal captured: ${firstSignalLabel}.`,
                    point: 16,
                    timestamp: firstSignalTimestamp,
                    segment: 'Foundations',
                    confidence: 'strong',
                    evidenceRefs: [
                        'reports/development-journey-local/tnf-development-journey-timeline-events.json',
                    ],
                },
                {
                    key: 'automation-mindset-shift',
                    title: 'Automation Mindset Shift',
                    description: 'Execution shifts from one-off tasks toward repeatable processes, workflows, and compounding leverage.',
                    point: 24,
                    timestamp: '2017-01-01T00:00:00.000Z',
                    segment: 'Foundations',
                    confidence: 'moderate',
                },
                ...(firstNoteTimestamp
                    ? [
                        {
                            key: 'apple-notes-chronicle-begins',
                            title: 'Apple Notes Chronicle Begins',
                            description: firstNoteTitle
                                ? `First recovered Apple Notes signal: ${firstNoteTitle}.`
                                : 'First recovered Apple Notes signal appears in the chronology.',
                            point: 21,
                            timestamp: firstNoteTimestamp,
                            segment: 'Foundations',
                            confidence: 'strong',
                            evidenceRefs: [
                                'reports/personal-archaeology/findings/apple-notes-oldest-forward-batch1-40-2026-03-22.md',
                            ],
                        },
                    ]
                    : []),
                {
                    key: 'github-identity-created-2021',
                    title: 'Public GitHub Identity Established',
                    description: 'GitHub account `whodaniel` is created on July 21, 2021, establishing a public software footprint.',
                    point: 31,
                    timestamp: '2021-07-21T15:56:39.000Z',
                    segment: 'Identity',
                    confidence: 'hard',
                    evidenceRefs: ['https://api.github.com/users/whodaniel'],
                },
                {
                    key: 'tnf-vision',
                    title: 'The New Fuse Vision',
                    description: 'A unified personal operating layer is conceived to connect projects, memory, orchestration, and decision velocity.',
                    point: 40,
                    timestamp: '2022-01-01T00:00:00.000Z',
                    segment: 'Vision',
                    confidence: 'moderate',
                },
                {
                    key: 'thenewfuse-domain-created-2025',
                    title: 'thenewfuse.com Domain Registered',
                    description: 'Domain registration for thenewfuse.com is recorded on January 17, 2025, signaling formal brand infrastructure.',
                    point: 52,
                    timestamp: '2025-01-17T19:49:42.000Z',
                    segment: 'Build',
                    confidence: 'hard',
                    evidenceRefs: ['whois:thenewfuse.com'],
                },
                {
                    key: 'fuse-repo-created-2025',
                    title: 'Public Monorepo Goes Live',
                    description: 'The `whodaniel/fuse` repository is created on April 11, 2025 as a public monorepo foundation.',
                    point: 58,
                    timestamp: '2025-04-11T20:44:10.000Z',
                    segment: 'Build',
                    confidence: 'hard',
                    evidenceRefs: ['https://api.github.com/repos/whodaniel/fuse'],
                },
                {
                    key: 'monorepo-build',
                    title: 'Monorepo Buildout and Expansion',
                    description: 'Core architecture scales in a public monorepo, integrating API, frontend, and multi-agent execution primitives.',
                    point: 64,
                    timestamp: '2024-01-01T00:00:00.000Z',
                    segment: 'Build',
                    confidence: 'strong',
                },
                ...(relayMilestone
                    ? [
                        {
                            key: 'tnf-relay-integration-phase',
                            title: 'Relay Integration Phase',
                            description: `Chronological notes capture a relay-centric systems phase (${relayMilestone.title}) with cross-environment agent communication wiring.`,
                            point: 67,
                            timestamp: relayMilestone.timestamp,
                            segment: 'Build',
                            confidence: 'strong',
                            evidenceRefs: [
                                'reports/personal-archaeology/findings/daniel-notes-chronological-readthrough-2026-03-22.md',
                            ],
                        },
                    ]
                    : []),
                ...(mcpMilestone
                    ? [
                        {
                            key: 'tnf-desktop-mcp-phase',
                            title: 'Desktop MCP Expansion',
                            description: `Chronology marks a desktop MCP integration phase (${mcpMilestone.title}), extending orchestration into local system tooling.`,
                            point: 70,
                            timestamp: mcpMilestone.timestamp,
                            segment: 'Scale',
                            confidence: 'strong',
                            evidenceRefs: [
                                'reports/personal-archaeology/findings/daniel-notes-chronological-readthrough-2026-03-22.md',
                            ],
                        },
                    ]
                    : []),
                {
                    key: 'agentic-scale',
                    title: 'Agentic Orchestration Intensifies',
                    description: events2025 > 0
                        ? `Operational practice matures around orchestration loops and reliability-first automation, with ${events2025} recovered journey signals in 2025.`
                        : 'Operational practice matures around orchestration loops, timeline instrumentation, and reliability-first automation.',
                    point: 72,
                    timestamp: '2025-06-01T00:00:00.000Z',
                    segment: 'Scale',
                    confidence: events2025 > 0 ? 'strong' : 'moderate',
                    evidenceRefs: events2025 > 0
                        ? ['reports/development-journey-local/tnf-development-journey-timeline-events.json']
                        : undefined,
                },
                ...(roadmapMilestone
                    ? [
                        {
                            key: 'canon-drift-reconciliation-phase',
                            title: 'Canon and Drift Reconciliation',
                            description: `Readthrough evidence marks an explicit canonicalization phase (${roadmapMilestone.title}) focused on aligning docs, architecture, and execution reality.`,
                            point: 77,
                            timestamp: roadmapMilestone.timestamp,
                            segment: 'Reconstruction',
                            confidence: 'strong',
                            evidenceRefs: [
                                'reports/personal-archaeology/findings/daniel-notes-chronological-readthrough-2026-03-22.md',
                            ],
                        },
                    ]
                    : []),
                {
                    key: 'timeline-archaeology-synthesis-2026',
                    title: 'Life/Build Timeline Reconstruction',
                    description: events2026 > 0 || totalSignals > 0
                        ? `Personal archaeology compiles ${totalSignals} evidence-backed timeline signals, including ${events2026} from 2026.`
                        : 'Personal archaeology process begins consolidating evidence-backed timeline events.',
                    point: 80,
                    timestamp: latestSignalTimestamp,
                    segment: 'Reconstruction',
                    confidence: 'strong',
                    evidenceRefs: [
                        'reports/development-journey-local/tnf-development-journey-timeline-events.json',
                    ],
                },
                {
                    key: 'personalized-control-panel',
                    title: 'Personalized User Control Surfaces',
                    description: 'User-scoped control panels and configurable UI interactions become central to daily command and decision flow.',
                    point: 86,
                    timestamp: '2026-02-01T00:00:00.000Z',
                    segment: 'Product',
                    confidence: 'strong',
                },
                {
                    key: 'delegated-sub-access',
                    title: 'Delegated VA Sub-Access',
                    description: 'Secure delegated access enables VAs and collaborators to operate workspace controls without sharing credentials.',
                    point: 92,
                    timestamp: '2026-03-20T00:00:00.000Z',
                    segment: 'Security',
                    confidence: 'strong',
                },
                ...(latestNoteTimestamp
                    ? [
                        {
                            key: 'apple-notes-reconstruction-pass',
                            title: 'Apple Notes Reconstruction Pass',
                            description: noteCount > 0 && latestNoteTitle
                                ? `Oldest-forward Apple Notes reconstruction recovers ${noteCount} entries; latest captured note: ${latestNoteTitle}.`
                                : 'Oldest-forward Apple Notes reconstruction adds private narrative signals.',
                            point: 95,
                            timestamp: latestNoteTimestamp,
                            segment: 'Reconstruction',
                            confidence: 'strong',
                            evidenceRefs: [
                                'reports/personal-archaeology/findings/apple-notes-oldest-forward-batch1-40-2026-03-22.md',
                            ],
                        },
                    ]
                    : []),
                {
                    key: 'two-layer-transition',
                    title: 'Two-Layer Repository Transition',
                    description: 'On March 21, 2026, migration begins from a fully public monorepo toward a private proprietary cloud layer plus open-source layer.',
                    point: 97,
                    timestamp: '2026-03-21T00:00:00.000Z',
                    segment: 'Transition',
                    confidence: 'hard',
                },
                {
                    key: 'latest-reconstruction-signal',
                    title: 'Latest Recovered Signal',
                    description: `Most recent recovered signal: ${latestSignalLabel}.`,
                    point: 99,
                    timestamp: latestSignalTimestamp,
                    segment: 'Now',
                    confidence: 'strong',
                    evidenceRefs: [
                        'reports/development-journey-local/tnf-development-journey-timeline-events.json',
                    ],
                },
            ];
        }
        return [
            {
                key: `foundation_${userId}`,
                title: `${displayName} Foundations`,
                description: 'Early stage focused on identity, consistency, and establishing durable operating principles.',
                point: 12,
                timestamp: '2019-01-01T00:00:00.000Z',
                segment: 'Foundations',
                confidence: 'moderate',
            },
            {
                key: `vision_${userId}`,
                title: 'Vision and Direction',
                description: 'Mission and direction become explicit enough to guide daily execution.',
                point: 34,
                timestamp: '2021-01-01T00:00:00.000Z',
                segment: 'Vision',
                confidence: 'moderate',
            },
            {
                key: `build_${userId}`,
                title: 'Build and Ship',
                description: 'Projects move from planning to consistent shipping with measurable outcomes.',
                point: 55,
                timestamp: '2023-01-01T00:00:00.000Z',
                segment: 'Build',
                confidence: 'moderate',
            },
            {
                key: `scale_${userId}`,
                title: 'Scale Through Systems',
                description: 'Automation, delegation, and orchestration become everyday operational defaults.',
                point: 78,
                timestamp: '2025-01-01T00:00:00.000Z',
                segment: 'Scale',
                confidence: 'moderate',
            },
        ];
    }
    async readLocalJourneySummary() {
        const localTimelinePath = path.join(process.cwd(), 'reports', 'development-journey-local', 'tnf-development-journey-timeline-events.json');
        try {
            const content = await fs.readFile(localTimelinePath, 'utf8');
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                return null;
            }
            const events = parsed
                .map((entry) => {
                if (!entry || typeof entry !== 'object')
                    return null;
                const candidate = entry;
                const timestamp = typeof candidate.timestamp === 'string' ? candidate.timestamp : '';
                if (!timestamp)
                    return null;
                const payload = candidate.payload && typeof candidate.payload === 'object'
                    ? candidate.payload
                    : {};
                const label = String(payload.label || payload.title || payload.summary || candidate.eventType || 'Event').trim() || 'Event';
                return { timestamp: this.normalizeTimestamp(timestamp), label };
            })
                .filter((event) => !!event)
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            if (events.length === 0) {
                return null;
            }
            const byYear = {};
            for (const event of events) {
                const year = event.timestamp.slice(0, 4);
                if (Number.isNaN(Number(year)))
                    continue;
                byYear[year] = (byYear[year] || 0) + 1;
            }
            return {
                totalEvents: events.length,
                byYear,
                firstEventLabel: events[0].label,
                firstEventTimestamp: events[0].timestamp,
                latestEventLabel: events[events.length - 1].label,
                latestEventTimestamp: events[events.length - 1].timestamp,
            };
        }
        catch {
            return null;
        }
    }
    async readAppleNotesBatchSummary() {
        const notesPath = path.join(process.cwd(), 'reports', 'personal-archaeology', 'findings', 'apple-notes-oldest-forward-batch1-40-2026-03-22.md');
        try {
            const content = await fs.readFile(notesPath, 'utf8');
            const matches = [...content.matchAll(/^##\s+\d+\.\s+(.+?)\s+—\s+(.+)$/gm)];
            if (matches.length === 0) {
                return null;
            }
            const entries = matches
                .map((match) => {
                const rawDate = match[1]?.trim();
                const title = match[2]?.trim() || 'Untitled note';
                if (!rawDate)
                    return null;
                const parsedDate = new Date(rawDate);
                if (Number.isNaN(parsedDate.getTime()))
                    return null;
                return {
                    timestamp: this.normalizeTimestamp(parsedDate.toISOString()),
                    title,
                };
            })
                .filter((entry) => !!entry)
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            if (entries.length === 0) {
                return null;
            }
            return {
                count: entries.length,
                firstNoteTimestamp: entries[0].timestamp,
                firstNoteTitle: entries[0].title,
                latestNoteTimestamp: entries[entries.length - 1].timestamp,
                latestNoteTitle: entries[entries.length - 1].title,
            };
        }
        catch {
            return null;
        }
    }
    async readChronologicalReadthroughSummary() {
        const chronologyPath = path.join(process.cwd(), 'reports', 'personal-archaeology', 'findings', 'daniel-notes-chronological-readthrough-2026-03-22.md');
        try {
            const content = await fs.readFile(chronologyPath, 'utf8');
            const matches = [...content.matchAll(/^###\s+\d+\.\s+(.+?)\s+—\s+(.+)$/gm)];
            if (matches.length === 0) {
                return null;
            }
            const entries = matches
                .map((match) => {
                const rawTimestamp = match[1]?.trim();
                const title = match[2]?.trim() || 'Untitled entry';
                if (!rawTimestamp)
                    return null;
                const parsedDate = new Date(rawTimestamp);
                if (Number.isNaN(parsedDate.getTime()))
                    return null;
                return {
                    timestamp: this.normalizeTimestamp(parsedDate.toISOString()),
                    title,
                };
            })
                .filter((entry) => !!entry)
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            if (entries.length === 0) {
                return null;
            }
            const relayEntry = entries.find((entry) => /relay/i.test(entry.title));
            const mcpEntry = entries.find((entry) => /mcp/i.test(entry.title));
            const roadmapEntry = entries.find((entry) => /(roadmap|architecture-overview|runbook|agent-protocol)/i.test(entry.title));
            return {
                totalEntries: entries.length,
                firstTimestamp: entries[0].timestamp,
                firstTitle: entries[0].title,
                latestTimestamp: entries[entries.length - 1].timestamp,
                latestTitle: entries[entries.length - 1].title,
                relayEntry,
                mcpEntry,
                roadmapEntry,
            };
        }
        catch {
            return null;
        }
    }
};
exports.UnifiedLedgerService = UnifiedLedgerService;
exports.UnifiedLedgerService = UnifiedLedgerService = UnifiedLedgerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], UnifiedLedgerService);
//# sourceMappingURL=unified-ledger.service.js.map