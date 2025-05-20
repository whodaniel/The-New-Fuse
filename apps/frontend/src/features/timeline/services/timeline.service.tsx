import { TimelineService as ITimelineService } from '../../../types/services.js';
import { TimelineEvent, TimelineBranch, TimelineWorkflow } from '../../../types/timeline.js';
import { api } from '../../../utils/api.js';

export class TimelineService implements ITimelineService {
  async getEventTimeline(branchId: string, includeDetails = false): Promise<TimelineEvent[]> {
    const response = await api.get(`/timeline/events/${branchId}`, {
      params: { includeDetails }
    });
    return response.data;
  }

  async getBranchHierarchy(branchId: string): Promise<TimelineBranch[]> {
    const response = await api.get(`/timeline/branches/${branchId}/hierarchy`);
    return response.data;
  }

  async getWorkflowsByEvent(eventId: string): Promise<TimelineWorkflow[]> {
    const response = await api.get(`/timeline/workflows/event/${eventId}`);
    return response.data;
  }

  async createBranch(
    name: string,
    startEventId: string,
    parentBranchId?: string
  ): Promise<TimelineBranch> {
    const response = await api.post('/timeline/branches', {
      name,
      startEventId,
      parentBranchId
    });
    return response.data;
  }

  async mergeBranch(
    branchId: string,
    targetEventId: string,
    mergedFromEvents: string[]
  ): Promise<void> {
    await api.post(`/timeline/branches/${branchId}/merge`, {
      targetEventId,
      mergedFromEvents
    });
  }

  async createWorkflow(params: {
    name: string;
    description: string;
    eventId: string;
    steps: any[];
  }): Promise<TimelineWorkflow> {
    const response = await api.post('/timeline/workflows', params);
    return response.data;
  }

  async executeWorkflowStep(workflowId: string, stepId: string, result: any): Promise<void> {
    await api.post(`/timeline/workflows/${workflowId}/steps/${stepId}/execute`, { result });
  }
}