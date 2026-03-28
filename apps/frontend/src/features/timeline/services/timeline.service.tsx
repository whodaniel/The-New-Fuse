// @ts-nocheck
import api from '../../../services/api';
import { TimelineService as ITimelineService } from '../../../types/services';
import { TimelineBranch, TimelineEvent, TimelineWorkflow } from '../../../types/timeline';

export class TimelineService implements ITimelineService {
  async getEventTimeline(branchId?: string, includeDetails = false): Promise<TimelineEvent[]> {
    const params: Record<string, string | boolean> = {};
    if (branchId && branchId !== 'all') {
      params.recordId = branchId;
    }
    if (includeDetails) {
      params.includeDetails = true;
    }

    const response = await api.get('/timeline/events', { params });
    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.items)
        ? response.data.items
        : [];

    return rows.map((entry: any) => {
      const recordBranchId =
        entry.recordId || entry.planId || entry.goalId || entry.branchId || branchId || 'global';
      const eventType = String(entry.eventType || entry.type || 'NOTE').toUpperCase();
      const normalizedType = eventType.includes('WORKFLOW')
        ? 'WORKFLOW'
        : eventType.includes('MERGE')
          ? 'MERGE'
          : eventType.includes('BRANCH')
            ? 'BRANCH'
            : eventType.includes('FEATURE')
              ? 'FEATURE'
              : 'NOTE';

      return {
        id: String(entry.id || `${recordBranchId}-${Date.now()}`),
        title: String(entry.title || entry.eventType || 'Timeline Event'),
        description:
          typeof entry.description === 'string'
            ? entry.description
            : JSON.stringify(entry.payload || {}),
        type: normalizedType,
        timestamp: entry.timestamp || entry.createdAt || new Date().toISOString(),
        branchId: recordBranchId,
        data: {
          title: String(entry.title || entry.eventType || 'Timeline Event'),
          description:
            typeof entry.description === 'string'
              ? entry.description
              : JSON.stringify(entry.payload || {}),
          status: 'ACTIVE',
          branchId: recordBranchId,
        },
      };
    });
  }

  async getBranchHierarchy(branchId: string): Promise<TimelineBranch[]> {
    return [
      {
        id: branchId,
        name: `Record ${branchId}`,
        parentBranchId: undefined,
        startEventId: branchId,
        events: [],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async getWorkflowsByEvent(eventId: string): Promise<TimelineWorkflow[]> {
    return [
      {
        id: `wf-${eventId}`,
        eventId,
        name: `Workflow for ${eventId}`,
        description: 'Derived from unified timeline event',
        status: 'PENDING',
        steps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async createBranch(
    name: string,
    startEventId: string,
    parentBranchId?: string
  ): Promise<TimelineBranch> {
    await api.post('/timeline/events', {
      recordId: parentBranchId || startEventId,
      eventType: 'historical_event',
      actor: 'ui-user',
      payload: {
        kind: 'branch_created',
        name,
        startEventId,
        parentBranchId,
      },
    });
    return {
      id: `branch-${Date.now().toString(36)}`,
      name,
      startEventId,
      parentBranchId,
      events: [startEventId],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async mergeBranch(
    branchId: string,
    targetEventId: string,
    mergedFromEvents: string[]
  ): Promise<void> {
    await api.post('/timeline/events', {
      recordId: branchId,
      eventType: 'historical_event',
      actor: 'ui-user',
      payload: {
        kind: 'branch_merged',
        targetEventId,
        mergedFromEvents,
      },
    });
  }

  async createWorkflow(params: {
    name: string;
    description: string;
    eventId: string;
    steps: any[];
  }): Promise<TimelineWorkflow> {
    const workflowId = `wf-${Date.now().toString(36)}`;
    await api.post('/timeline/events', {
      recordId: params.eventId,
      eventType: 'historical_event',
      actor: 'ui-user',
      payload: {
        kind: 'workflow_created',
        workflowId,
        name: params.name,
        stepCount: (params.steps || []).length,
      },
    });
    return {
      id: workflowId,
      eventId: params.eventId,
      name: params.name,
      description: params.description,
      status: 'PENDING',
      steps: params.steps || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as TimelineWorkflow;
  }

  async executeWorkflowStep(workflowId: string, stepId: string, result: any): Promise<void> {
    await api.post('/timeline/events', {
      recordId: workflowId,
      eventType: 'historical_event',
      actor: 'ui-user',
      payload: {
        kind: 'workflow_step_executed',
        stepId,
        result,
      },
    });
  }
}
