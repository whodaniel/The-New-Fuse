import { TimelineService } from './types';
import { TimelineBranch, TimelineEvent, TimelineWorkflow, WorkflowStep } from '../types/timeline';

/**
 * Timeline adapter backed by the unified ledger API.
 * This provides a bridge so existing feature-suggestions timeline hooks can
 * operate on the centralized chronology source.
 */
export class UnifiedLedgerTimelineService implements TimelineService {
  constructor(private readonly baseUrl = '/api') {}

  private async postTimelineEvent(input: {
    recordId?: string;
    eventType?: string;
    actor?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
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

  async getEventTimeline(branchId: string): Promise<TimelineEvent[]> {
    // Branch is represented as a record scope for now.
    const res = await fetch(`${this.baseUrl}/timeline/events?recordId=${encodeURIComponent(branchId)}`);
    if (!res.ok) return [];
    const events = (await res.json()) as Array<any>;
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

  async getBranchHierarchy(branchId: string): Promise<TimelineBranch[]> {
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

  async getWorkflowsByEvent(eventId: string): Promise<TimelineWorkflow[]> {
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

  async createBranch(branchData: {
    name: string;
    startEventId: string;
    parentBranchId?: string | undefined;
  }): Promise<TimelineBranch> {
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

  async mergeBranch(_mergeData: {
    branchId: string;
    targetEventId: string;
    mergedFromEvents: string[];
  }): Promise<void> {
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

  async createWorkflow(workflowData: {
    name: string;
    description: string;
    eventId: string;
    steps: Omit<WorkflowStep, 'id' | 'workflowId'>[];
  }): Promise<TimelineWorkflow> {
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

  async executeWorkflowStep(
    _workflowId: string,
    _stepId: string,
    _result: unknown
  ): Promise<void> {
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
