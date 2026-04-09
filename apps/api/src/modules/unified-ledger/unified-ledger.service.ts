import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  FeedbackIteration,
  FunctionalLink,
  GoalRecord,
  ProjectPlanRecord,
  TimelineEvent,
  UnifiedCoordinationMode,
  UnifiedLedgerStore,
  UnifiedRecordKind,
  UnifiedRecordPriority,
  UnifiedRecordStatus,
  UnifiedSignalSource,
  UnifiedTaskRecord,
  UnifiedWorkHorizon,
  UnifiedWorkItinerary,
  UnifiedWorkLane,
} from './unified-ledger.types';

type CreateRecordInput = Partial<UnifiedTaskRecord> &
  Pick<UnifiedTaskRecord, 'title' | 'description'>;

type TaskExecutionLogEntry = {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  actor: string;
  source: string;
  stage?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

@Injectable()
export class UnifiedLedgerService implements OnModuleInit {
  private readonly logger = new Logger(UnifiedLedgerService.name);
  private readonly defaultStorePath = path.join(process.cwd(), 'data', 'unified-task-ledger.json');
  private storePath = this.resolveStorePath();
  private store: UnifiedLedgerStore = { records: [], timelineEvents: [], goals: [], plans: [] };
  private initialized = false;

  async onModuleInit(): Promise<void> {
    await this.ensureLoaded();
  }

  async listRecords(filters?: {
    owner?: string;
    kind?: UnifiedRecordKind;
    status?: UnifiedRecordStatus;
    lane?: UnifiedWorkLane;
    horizon?: UnifiedWorkHorizon;
    q?: string;
  }): Promise<UnifiedTaskRecord[]> {
    await this.ensureLoaded();
    let rows = [...this.store.records];

    if (filters?.owner) {
      rows = rows.filter((r) => r.owner === filters.owner);
    }
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
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getRecord(id: string, owner?: string): Promise<UnifiedTaskRecord | null> {
    await this.ensureLoaded();
    const record = this.store.records.find((r) => r.id === id) || null;
    if (!record) return null;
    if (owner && record.owner !== owner) return null;
    return record;
  }

  async createRecord(input: CreateRecordInput): Promise<UnifiedTaskRecord> {
    await this.ensureLoaded();
    const now = new Date().toISOString();
    const record: UnifiedTaskRecord = {
      id: input.id || this.makeId(input.kind || 'task'),
      kind: input.kind || 'task',
      title: input.title,
      description: input.description,
      status: input.status || 'submitted',
      priority: input.priority || 'medium',
      owner: input.owner || 'system',
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
      recordId: record.id,
      eventType: 'record_created',
      actor: record.owner,
      payload: { kind: record.kind, status: record.status, priority: record.priority },
    });
    await this.persist();
    return record;
  }

  async updateRecord(
    id: string,
    patch: Partial<UnifiedTaskRecord>,
    owner?: string
  ): Promise<UnifiedTaskRecord | null> {
    await this.ensureLoaded();
    const index = this.store.records.findIndex((r) => r.id === id);
    if (index < 0) return null;

    const current = this.store.records[index];
    if (owner && current.owner !== owner) {
      return null;
    }
    const updated: UnifiedTaskRecord = {
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
        ? this.mergeItinerary(current.itinerary, patch.itinerary as Partial<UnifiedWorkItinerary>)
        : current.itinerary,
      metadata: { ...current.metadata, ...(patch.metadata || {}) },
      updatedAt: new Date().toISOString(),
    };

    this.store.records[index] = updated;
    this.pushEvent({
      recordId: updated.id,
      eventType: 'record_updated',
      actor: String((patch.metadata as any)?.actor || 'system'),
      payload: { patchKeys: Object.keys(patch || {}) },
    });
    await this.persist();
    return updated;
  }

  async getTaskExecutionLogs(
    recordId: string
  ): Promise<{ taskId: string; logs: TaskExecutionLogEntry[]; count: number } | null> {
    const record = await this.getRecord(recordId);
    if (!record) return null;
    const logs = this.readExecutionLogs(record.metadata);
    return { taskId: recordId, logs, count: logs.length };
  }

  async appendTaskExecutionLog(
    recordId: string,
    input: {
      level?: 'info' | 'warn' | 'error';
      message?: string;
      actor?: string;
      source?: string;
      stage?: string;
      metadata?: Record<string, unknown>;
      timestamp?: string;
    }
  ): Promise<{ taskId: string; logs: TaskExecutionLogEntry[]; count: number } | null> {
    const record = await this.getRecord(recordId);
    if (!record) return null;
    const message = String(input?.message || '').trim();
    if (!message) {
      throw new Error('message is required');
    }

    const entry: TaskExecutionLogEntry = {
      id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      level: input.level || 'info',
      message,
      actor: input.actor || 'system',
      source: input.source || 'task-service',
      stage: input.stage,
      metadata: input.metadata || {},
      timestamp: input.timestamp ? this.normalizeTimestamp(input.timestamp) : new Date().toISOString(),
    };

    const existingLogs = this.readExecutionLogs(record.metadata);
    const logs = [...existingLogs, entry].slice(-500);
    await this.updateRecord(recordId, {
      metadata: {
        ...(record.metadata || {}),
        executionLogs: logs,
        lastExecutionLogAt: entry.timestamp,
      },
    } as Partial<UnifiedTaskRecord>);

    await this.createTimelineEvent({
      recordId,
      eventType: 'historical_event',
      actor: entry.actor,
      timestamp: entry.timestamp,
      payload: {
        category: 'task_execution_log',
        level: entry.level,
        source: entry.source,
        stage: entry.stage || null,
        message: entry.message,
        metadata: entry.metadata || {},
      },
    });

    return { taskId: recordId, logs, count: logs.length };
  }

  async voteRecord(id: string, direction: 'up' | 'down'): Promise<UnifiedTaskRecord | null> {
    const row = await this.getRecord(id);
    if (!row) return null;
    const votes = { ...row.votes, [direction]: row.votes[direction] + 1 };
    const updated = await this.updateRecord(id, { votes }, owner);
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

  async addFunctionalLink(
    id: string,
    link: Omit<FunctionalLink, 'createdAt'>,
    owner?: string
  ): Promise<UnifiedTaskRecord | null> {
    const row = await this.getRecord(id, owner);
    if (!row) return null;
    const next: FunctionalLink = { ...link, createdAt: new Date().toISOString() };
    const updated = await this.updateRecord(id, { links: [...row.links, next] }, owner);
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

  async addFeedbackIteration(
    id: string,
    input: Omit<FeedbackIteration, 'id' | 'createdAt' | 'iteration'> & { iteration?: number },
    owner?: string
  ): Promise<UnifiedTaskRecord | null> {
    const row = await this.getRecord(id, owner);
    if (!row) return null;
    const nextIteration = input.iteration || row.rag.feedbackIterations.length + 1;
    const feedback: FeedbackIteration = {
      id: `fi_${Date.now().toString(36)}`,
      iteration: nextIteration,
      createdAt: new Date().toISOString(),
      ...input,
    };
    const rag = {
      ...row.rag,
      feedbackIterations: [...row.rag.feedbackIterations, feedback],
    };
    const updated = await this.updateRecord(id, { rag }, owner);
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

  async ingestOrchestrationEvent(payload: Record<string, unknown>): Promise<UnifiedTaskRecord> {
    const task = (payload.task || {}) as Record<string, unknown>;
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

  async getGrid(owner?: string): Promise<{
    total: number;
    byKind: Record<string, number>;
    byStatus: Record<string, number>;
    averageProgressPercent: number;
    averageRhythmBpm: number;
  }> {
    await this.ensureLoaded();
    const rows = owner
      ? this.store.records.filter((record) => record.owner === owner)
      : this.store.records;
    const byKind: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let sumProgress = 0;
    let sumBpm = 0;

    for (const row of rows) {
      byKind[row.kind] = (byKind[row.kind] || 0) + 1;
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      sumProgress += row.fractal.progressPercent;
      sumBpm += row.fractal.rhythmBpm;
    }

    const total = rows.length;
    return {
      total,
      byKind,
      byStatus,
      averageProgressPercent: total ? sumProgress / total : 0,
      averageRhythmBpm: total ? sumBpm / total : 0,
    };
  }

  async listTimelineEvents(params?: {
    userId?: string;
    recordId?: string;
    goalId?: string;
    planId?: string;
    eventType?: string;
    actor?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TimelineEvent[]> {
    await this.ensureLoaded();
    const from = params?.dateFrom ? this.normalizeTimestamp(params.dateFrom) : undefined;
    const to = params?.dateTo ? this.normalizeTimestamp(params.dateTo) : undefined;
    return this.store.timelineEvents
      .filter((e) => (params?.userId ? e.userId === params.userId : true))
      .filter((e) => (params?.recordId ? e.recordId === params.recordId : true))
      .filter((e) => (params?.goalId ? e.goalId === params.goalId : true))
      .filter((e) => (params?.planId ? e.planId === params.planId : true))
      .filter((e) => (params?.eventType ? e.eventType === params.eventType : true))
      .filter((e) => (params?.actor ? e.actor === params.actor : true))
      .filter((e) => (from ? e.timestamp >= from : true))
      .filter((e) => (to ? e.timestamp <= to : true))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async getTimelineEvent(id: string, userId?: string): Promise<TimelineEvent | null> {
    await this.ensureLoaded();
    const event = this.store.timelineEvents.find((e) => e.id === id) || null;
    if (!event) return null;
    if (userId && event.userId && event.userId !== userId) return null;
    return event;
  }

  async createTimelineEvent(input: {
    userId?: string;
    recordId?: string;
    goalId?: string;
    planId?: string;
    eventType?: TimelineEvent['eventType'];
    actor?: string;
    timestamp?: string;
    payload?: Record<string, unknown>;
  }): Promise<TimelineEvent> {
    await this.ensureLoaded();
    this.validateTimelineRefs(input);
    const timestamp = input.timestamp
      ? this.normalizeTimestamp(input.timestamp)
      : new Date().toISOString();
    const eventType = this.validateEventType(input.eventType);
    const deduped = this.findDuplicateTimelineEvent({
      userId: input.userId,
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
    const event: TimelineEvent = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId,
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

  async bootstrapPersonalTimeline(
    userId: string,
    context?: { email?: string; name?: string; role?: string; roles?: string[] }
  ): Promise<{
    message: string;
    createdCount: number;
    totalCount: number;
    events: TimelineEvent[];
  }> {
    await this.ensureLoaded();
    const existingEvents = await this.listTimelineEvents({ userId });
    const existingKeys = new Set(
      existingEvents
        .map((event) => event.payload?.storyKey)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    );

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
      message:
        createdCount > 0
          ? `Generated ${createdCount} private personal timeline segments`
          : 'Personal timeline segments already exist',
      createdCount,
      totalCount: events.length,
      events,
    };
  }

  async updateTimelineEvent(
    id: string,
    patch: {
      userId?: string;
      actor?: string;
      timestamp?: string;
      payload?: Record<string, unknown>;
    }
  ): Promise<TimelineEvent | null> {
    await this.ensureLoaded();
    const idx = this.store.timelineEvents.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const current = this.store.timelineEvents[idx];
    if (patch.userId && current.userId !== patch.userId) {
      return null;
    }
    const updated: TimelineEvent = {
      ...current,
      actor: patch.actor || current.actor,
      timestamp: patch.timestamp ? this.normalizeTimestamp(patch.timestamp) : current.timestamp,
      payload: patch.payload ? { ...current.payload, ...patch.payload } : current.payload,
    };
    this.store.timelineEvents[idx] = updated;
    await this.persist();
    return updated;
  }

  async deleteTimelineEvent(id: string, userId?: string): Promise<boolean> {
    await this.ensureLoaded();
    const idx = this.store.timelineEvents.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    const current = this.store.timelineEvents[idx];
    if (userId && current.userId !== userId) {
      return false;
    }
    this.store.timelineEvents.splice(idx, 1);
    await this.persist();
    return true;
  }

  async createGoal(input: {
    title: string;
    description: string;
    owner?: string;
    linkedRecordIds?: string[];
  }): Promise<GoalRecord> {
    await this.ensureLoaded();
    const now = new Date().toISOString();
    const goal: GoalRecord = {
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

  async listGoals(filters?: { owner?: string }): Promise<GoalRecord[]> {
    await this.ensureLoaded();
    return [...this.store.goals]
      .filter((g) => (filters?.owner ? g.owner === filters.owner : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getGoal(goalId: string, owner?: string): Promise<GoalRecord | null> {
    await this.ensureLoaded();
    const goal = this.store.goals.find((g) => g.id === goalId) || null;
    if (!goal) return null;
    if (owner && goal.owner !== owner) return null;
    return goal;
  }

  async linkGoalToRecord(
    goalId: string,
    recordId: string,
    actor = 'system',
    owner?: string
  ): Promise<GoalRecord | null> {
    await this.ensureLoaded();
    const idx = this.store.goals.findIndex((g) => g.id === goalId);
    if (idx < 0) return null;
    const current = this.store.goals[idx];
    if (owner && current.owner !== owner) return null;
    const linkedRecordIds = current.linkedRecordIds.includes(recordId)
      ? current.linkedRecordIds
      : [...current.linkedRecordIds, recordId];
    const updated: GoalRecord = {
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

  async addGoalMilestone(
    goalId: string,
    input: {
      owner?: string;
      title: string;
      dueAt?: string;
      status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
    }
  ): Promise<GoalRecord | null> {
    await this.ensureLoaded();
    const idx = this.store.goals.findIndex((g) => g.id === goalId);
    if (idx < 0) return null;
    const current = this.store.goals[idx];
    if (input.owner && current.owner !== input.owner) return null;
    const milestone = {
      id: `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      title: input.title,
      dueAt: input.dueAt,
      status: input.status || 'pending',
    };
    const updated: GoalRecord = {
      ...current,
      milestones: [...current.milestones, milestone],
      updatedAt: new Date().toISOString(),
    };
    this.store.goals[idx] = updated;
    this.pushEvent({
      goalId,
      eventType: 'milestone_updated',
      actor: input.owner || 'system',
      payload: { milestone },
    });
    await this.persist();
    return updated;
  }

  async updateGoalMilestone(
    goalId: string,
    milestoneId: string,
    patch: {
      owner?: string;
      title?: string;
      dueAt?: string;
      status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
    }
  ): Promise<GoalRecord | null> {
    await this.ensureLoaded();
    const idx = this.store.goals.findIndex((g) => g.id === goalId);
    if (idx < 0) return null;
    const current = this.store.goals[idx];
    if (patch.owner && current.owner !== patch.owner) return null;
    const milestones = current.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            title: patch.title || m.title,
            dueAt: patch.dueAt ?? m.dueAt,
            status: patch.status || m.status,
          }
        : m
    );
    if (!milestones.some((m) => m.id === milestoneId)) return null;
    const updated: GoalRecord = {
      ...current,
      milestones,
      updatedAt: new Date().toISOString(),
    };
    this.store.goals[idx] = updated;
    this.pushEvent({
      goalId,
      eventType: 'milestone_updated',
      actor: patch.owner || 'system',
      payload: { milestoneId, patch },
    });
    await this.persist();
    return updated;
  }

  async removeGoalMilestone(
    goalId: string,
    milestoneId: string,
    owner?: string
  ): Promise<GoalRecord | null> {
    await this.ensureLoaded();
    const idx = this.store.goals.findIndex((g) => g.id === goalId);
    if (idx < 0) return null;
    const current = this.store.goals[idx];
    if (owner && current.owner !== owner) return null;
    const milestones = current.milestones.filter((m) => m.id !== milestoneId);
    if (milestones.length === current.milestones.length) return null;
    const updated: GoalRecord = {
      ...current,
      milestones,
      updatedAt: new Date().toISOString(),
    };
    this.store.goals[idx] = updated;
    this.pushEvent({
      goalId,
      eventType: 'milestone_updated',
      actor: owner || 'system',
      payload: { milestoneId, removed: true },
    });
    await this.persist();
    return updated;
  }

  async createPlan(input: {
    name: string;
    objective: string;
    owner?: string;
    linkedGoalIds?: string[];
    linkedRecordIds?: string[];
    cadence?: { cycleDays?: number; reviewBpm?: number; progressPercent?: number };
  }): Promise<ProjectPlanRecord> {
    await this.ensureLoaded();
    const now = new Date().toISOString();
    const plan: ProjectPlanRecord = {
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

  async listPlans(filters?: { owner?: string }): Promise<ProjectPlanRecord[]> {
    await this.ensureLoaded();
    return [...this.store.plans]
      .filter((p) => (filters?.owner ? p.owner === filters.owner : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getPlan(planId: string, owner?: string): Promise<ProjectPlanRecord | null> {
    await this.ensureLoaded();
    const plan = this.store.plans.find((p) => p.id === planId) || null;
    if (!plan) return null;
    if (owner && plan.owner !== owner) return null;
    return plan;
  }

  async getRecordConnections(
    recordId: string,
    owner?: string
  ): Promise<{
    goals: GoalRecord[];
    plans: ProjectPlanRecord[];
  }> {
    await this.ensureLoaded();
    const goals = this.store.goals.filter(
      (g) => g.linkedRecordIds.includes(recordId) && (!owner || g.owner === owner)
    );
    const plans = this.store.plans.filter(
      (p) => p.linkedRecordIds.includes(recordId) && (!owner || p.owner === owner)
    );
    return { goals, plans };
  }

  async linkPlan(
    planId: string,
    input: { owner?: string; goalId?: string; recordId?: string; actor?: string }
  ): Promise<ProjectPlanRecord | null> {
    await this.ensureLoaded();
    const idx = this.store.plans.findIndex((p) => p.id === planId);
    if (idx < 0) return null;
    const current = this.store.plans[idx];
    if (input.owner && current.owner !== input.owner) return null;
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
    const updated: ProjectPlanRecord = {
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

  private async ensureLoaded(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.ensureStoreDirectory();
      const content = await fs.readFile(this.storePath, 'utf8');
      const parsed = JSON.parse(content) as Partial<UnifiedLedgerStore>;
      this.store = {
        records: (parsed.records || []).map((record) =>
          this.migrateRecord(record as UnifiedTaskRecord)
        ),
        timelineEvents: parsed.timelineEvents || [],
        goals: parsed.goals || [],
        plans: parsed.plans || [],
      };
      this.initialized = true;
    } catch {
      this.store = { records: [], timelineEvents: [], goals: [], plans: [] };
      await this.persist();
      this.initialized = true;
      this.logger.log(`Initialized unified ledger at ${this.storePath}`);
    }
  }

  private async persist(): Promise<void> {
    const payload = JSON.stringify(this.store, null, 2);
    try {
      await this.ensureStoreDirectory();
      await fs.writeFile(this.storePath, payload, 'utf8');
    } catch (error) {
      if (!this.isPermissionError(error) || this.storePath.startsWith('/tmp/')) {
        throw error;
      }

      const fallbackPath = path.join('/tmp', 'tnf-data', 'unified-task-ledger.json');
      this.logger.warn(
        `No write permission for ${this.storePath}; falling back to ${fallbackPath}`
      );
      this.storePath = fallbackPath;
      await fs.mkdir(path.dirname(this.storePath), { recursive: true });
      await fs.writeFile(this.storePath, payload, 'utf8');
    }
  }

  private resolveStorePath(): string {
    const explicitPath = process.env.UNIFIED_LEDGER_STORE_PATH?.trim();
    if (explicitPath) return explicitPath;
    return this.defaultStorePath;
  }

  private async ensureStoreDirectory(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    } catch (error) {
      if (!this.isPermissionError(error) || this.storePath.startsWith('/tmp/')) {
        throw error;
      }

      const fallbackPath = path.join('/tmp', 'tnf-data', 'unified-task-ledger.json');
      this.logger.warn(
        `No write permission for ${this.storePath}; falling back to ${fallbackPath}`
      );
      this.storePath = fallbackPath;
      await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    }
  }

  private isPermissionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = 'code' in error ? String((error as { code?: string }).code) : '';
    return code === 'EACCES' || code === 'EPERM' || code === 'EROFS';
  }

  private makeId(kind: UnifiedRecordKind): string {
    return `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private pushEvent(input: Omit<TimelineEvent, 'id' | 'timestamp'>): void {
    const event: TimelineEvent = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...input,
    };
    this.store.timelineEvents.push(event);
  }

  private normalizeStatus(value: string): UnifiedRecordStatus {
    const v = value.toLowerCase();
    if (['in_progress', 'in-progress', 'running'].includes(v)) return 'in_progress';
    if (['queued', 'pending'].includes(v)) return 'queued';
    if (['complete', 'completed', 'done'].includes(v)) return 'completed';
    if (['failed', 'error'].includes(v)) return 'failed';
    if (['under_review', 'review'].includes(v)) return 'under_review';
    if (['rejected'].includes(v)) return 'rejected';
    return 'submitted';
  }

  private normalizePriority(value: string): UnifiedRecordPriority {
    const v = value.toLowerCase();
    if (v === 'p0') return 'urgent';
    if (v === 'p1') return 'high';
    if (v === 'p2') return 'medium';
    if (v === 'p3') return 'low';
    if (v === 'normal') return 'medium';
    if (v === 'urgent') return 'urgent';
    if (v === 'critical') return 'critical';
    if (v === 'high') return 'high';
    if (v === 'low') return 'low';
    return 'medium';
  }

  private migrateRecord(record: UnifiedTaskRecord): UnifiedTaskRecord {
    return {
      ...record,
      itinerary: this.normalizeItinerary(record),
    };
  }

  private normalizeItinerary(input: Partial<UnifiedTaskRecord>): UnifiedWorkItinerary {
    const existing = input.itinerary || ({} as Partial<UnifiedWorkItinerary>);
    const lane = this.normalizeLane(
      existing.lane,
      input.kind || 'task',
      input.source || 'manual',
      input.metadata || {}
    );
    const horizon = this.normalizeHorizon(existing.horizon, lane);
    const coordinationMode = this.normalizeCoordinationMode(existing.coordinationMode, lane);
    const signalSources = this.normalizeSignalSources(
      existing.signalSources,
      input.source || 'manual',
      lane
    );
    const sequencingKey = String(
      existing.sequencingKey ||
        input.id ||
        `${lane}:${input.kind || 'task'}:${input.title || 'untitled'}`
    );
    const clockSource =
      existing.clockSource || (lane === 'realtime_broker_routing' ? 'master-clock' : 'local-time');

    return {
      lane,
      horizon,
      coordinationMode,
      signalSources,
      sequencingKey,
      clockSource,
    };
  }

  private mergeItinerary(
    current: UnifiedWorkItinerary,
    patch: Partial<UnifiedWorkItinerary>
  ): UnifiedWorkItinerary {
    return this.normalizeItinerary({
      itinerary: {
        ...current,
        ...patch,
      } as UnifiedWorkItinerary,
      kind: 'task',
      source: 'api',
    });
  }

  private normalizeLane(
    value: string | undefined,
    kind: UnifiedRecordKind,
    source: UnifiedTaskRecord['source'],
    metadata: Record<string, unknown>
  ): UnifiedWorkLane {
    const v = String(value || '').toLowerCase();
    const suggestionCategory = String(
      metadata.suggestionKind || metadata.suggestionType || metadata.category || ''
    ).toLowerCase();

    const known: Record<string, UnifiedWorkLane> = {
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
    if (known[v]) return known[v];

    if (kind === 'suggestion') {
      if (suggestionCategory.includes('changelog')) return 'changelog_suggestion';
      if (suggestionCategory.includes('kanban')) return 'kanban_delivery';
      return 'suggestion_vote';
    }

    if (source === 'orchestrator') return 'realtime_broker_routing';
    if (source === 'relay') return 'relay_federation';
    if (source === 'system') return 'directive';
    return kind === 'review' ? 'milestone' : 'directive';
  }

  private normalizeHorizon(value: string | undefined, lane: UnifiedWorkLane): UnifiedWorkHorizon {
    const v = String(value || '').toLowerCase();
    if (v === 'realtime' || v === 'short_term' || v === 'medium_term' || v === 'long_term') {
      return v as UnifiedWorkHorizon;
    }

    if (
      lane === 'realtime_broker_routing' ||
      lane === 'relay_federation' ||
      lane === 'redis_sync' ||
      lane === 'tauri_sync'
    ) {
      return 'realtime';
    }
    if (lane === 'kanban_delivery' || lane === 'milestone') return 'short_term';
    if (lane === 'changelog_suggestion') return 'medium_term';
    return 'long_term';
  }

  private normalizeCoordinationMode(
    value: string | undefined,
    lane: UnifiedWorkLane
  ): UnifiedCoordinationMode {
    const v = String(value || '').toLowerCase();
    if (v === 'brokered' || v === 'direct' || v === 'hybrid') return v as UnifiedCoordinationMode;
    if (lane === 'realtime_broker_routing') return 'brokered';
    if (lane === 'directive' || lane === 'goal') return 'hybrid';
    return 'direct';
  }

  private normalizeSignalSources(
    value: string[] | undefined,
    source: UnifiedTaskRecord['source'],
    lane: UnifiedWorkLane
  ): UnifiedSignalSource[] {
    const allowed = new Set<UnifiedSignalSource>([
      'ws_relay',
      'redis',
      'tauri',
      'api',
      'manual',
      'system',
    ]);

    const normalized = (Array.isArray(value) ? value : [])
      .map((v) => String(v).toLowerCase())
      .filter((v): v is UnifiedSignalSource => allowed.has(v as UnifiedSignalSource));

    if (normalized.length > 0) return Array.from(new Set(normalized));

    const baseMap: Record<string, UnifiedSignalSource> = {
      orchestrator: 'redis',
      relay: 'ws_relay',
      api: 'api',
      manual: 'manual',
      system: 'system',
    };
    const initial = baseMap[source] || 'manual';
    if (lane === 'realtime_broker_routing' && initial !== 'redis') return [initial, 'redis'];
    return [initial];
  }

  private normalizeTimestamp(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid timestamp: ${value}`);
    }
    return parsed.toISOString();
  }

  private validateEventType(value?: string): TimelineEvent['eventType'] {
    const allowed: TimelineEvent['eventType'][] = [
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
    if (!value) return 'historical_event';
    if (!allowed.includes(value as TimelineEvent['eventType'])) {
      throw new Error(`Invalid eventType: ${value}`);
    }
    return value as TimelineEvent['eventType'];
  }

  private validateTimelineRefs(input: {
    userId?: string;
    recordId?: string;
    goalId?: string;
    planId?: string;
    payload?: Record<string, unknown>;
  }): void {
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

  private findDuplicateTimelineEvent(candidate: {
    userId?: string;
    recordId?: string;
    goalId?: string;
    planId?: string;
    eventType: TimelineEvent['eventType'];
    actor: string;
    timestamp: string;
    payload: Record<string, unknown>;
  }): TimelineEvent | null {
    const candidateTs = new Date(candidate.timestamp).getTime();
    const payloadKey = JSON.stringify(candidate.payload || {});
    const existing = this.store.timelineEvents.find((e) => {
      if ((e.userId || '') !== (candidate.userId || '')) return false;
      if (e.recordId !== candidate.recordId) return false;
      if (e.goalId !== candidate.goalId) return false;
      if (e.planId !== candidate.planId) return false;
      if (e.eventType !== candidate.eventType) return false;
      if (e.actor !== candidate.actor) return false;
      if (JSON.stringify(e.payload || {}) !== payloadKey) return false;
      const existingTs = new Date(e.timestamp).getTime();
      return Math.abs(existingTs - candidateTs) <= 60_000;
    });
    return existing || null;
  }

  private readExecutionLogs(metadata: Record<string, unknown> | undefined): TaskExecutionLogEntry[] {
    const raw = metadata?.executionLogs;
    if (!Array.isArray(raw)) return [];
    return raw.filter((entry): entry is TaskExecutionLogEntry => {
      if (!entry || typeof entry !== 'object') return false;
      const v = entry as Partial<TaskExecutionLogEntry>;
      return (
        typeof v.id === 'string' &&
        typeof v.level === 'string' &&
        typeof v.message === 'string' &&
        typeof v.actor === 'string' &&
        typeof v.source === 'string' &&
        typeof v.timestamp === 'string'
      );
    });
  }
}
