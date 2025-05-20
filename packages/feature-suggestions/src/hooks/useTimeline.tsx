import { useState, useCallback, useEffect } from 'react';
import {
  TimelineEvent,
  TimelineBranch,
  TimelineWorkflow,
  WorkflowStep
} from '../types/timeline.js';
import { TimelineService } from '../services/types.js';

interface UseTimelineProps {
  timelineService: TimelineService;
  initialBranchId?: string;
}

export const useTimeline = ({ timelineService, initialBranchId }: UseTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [branches, setBranches] = useState<TimelineBranch[]>([]);
  const [workflows, setWorkflows] = useState<TimelineWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<string | undefined>(initialBranchId);

  const loadTimelineData = useCallback(async (branchId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const [timelineEvents, branchHierarchy] = await Promise.all([
        timelineService.getEventTimeline(branchId),
        timelineService.getBranchHierarchy(branchId)
      ]);

      const workflowPromises = timelineEvents.map(event => 
        timelineService.getWorkflowsByEvent(event.id)
      );

      const allWorkflows = (await Promise.all(workflowPromises)).flat();

      setEvents(timelineEvents);
      setBranches(branchHierarchy);
      setWorkflows(allWorkflows);
      setCurrentBranchId(branchId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load timeline data'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [timelineService]);

  const createBranch = useCallback(async (
    name: string,
    startEventId: string,
    parentBranchId?: string
  ): Promise<TimelineBranch> => {
    try {
      const newBranch = await timelineService.createBranch({
        name,
        startEventId,
        parentBranchId
      });
      await loadTimelineData(newBranch.id);
      return newBranch;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create branch'));
      throw err;
    }
  }, [timelineService, loadTimelineData]);

  const mergeBranch = useCallback(async (
    branchId: string,
    targetEventId: string,
    mergedFromEvents: string[]
  ): Promise<void> => {
    try {
      await timelineService.mergeBranch({
        branchId,
        targetEventId,
        mergedFromEvents
      });
      await loadTimelineData(currentBranchId || branchId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to merge branch'));
      throw err;
    }
  }, [timelineService, loadTimelineData, currentBranchId]);

  const createWorkflow = useCallback(async (
    name: string,
    description: string,
    eventId: string,
    steps: Omit<WorkflowStep, 'id' | 'workflowId'>[]
  ): Promise<TimelineWorkflow> => {
    try {
      const newWorkflow = await timelineService.createWorkflow({
        name,
        description,
        eventId,
        steps
      });
      setWorkflows(prev => [...prev, newWorkflow]);
      return newWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create workflow'));
      throw err;
    }
  }, [timelineService]);

  const executeWorkflowStep = useCallback(async (
    workflowId: string,
    stepId: string,
    result: unknown
  ): Promise<void> => {
    try {
      await timelineService.executeWorkflowStep(workflowId, stepId, result);
      setWorkflows(prev => 
        prev.map(w => {
          if (w.id !== workflowId) return w;
          return {
            ...w,
            steps: w.steps.map(s => 
              s.id === stepId 
                ? { ...s, status: 'COMPLETED' as const, result }
                : s
            )
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to execute workflow step'));
      throw err;
    }
  }, [timelineService]);

  const switchBranch = useCallback((branchId: string) => {
    loadTimelineData(branchId).catch(err => {
      setError(err instanceof Error ? err : new Error('Failed to switch branch'));
    });
  }, [loadTimelineData]);

  useEffect(() => {
    if (initialBranchId) {
      loadTimelineData(initialBranchId).catch(err => {
        setError(err instanceof Error ? err : new Error('Failed to load initial timeline data'));
      });
    }
  }, [initialBranchId, loadTimelineData]);

  return {
    events,
    branches,
    workflows,
    loading,
    error,
    currentBranchId,
    createBranch,
    mergeBranch,
    createWorkflow,
    executeWorkflowStep,
    switchBranch,
    refresh: () => currentBranchId ? loadTimelineData(currentBranchId) : Promise.resolve()
  };
};
