import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TimelineBranch, TimelineEvent, TimelineWorkflow } from '../../../types/timeline';
import type { TimelineService } from '../services/timeline.service';
import { useTimeline } from './useTimeline';

const KNOWN_EVENT_TYPES: readonly string[] = ['FEATURE', 'MERGE', 'BRANCH', 'WORKFLOW'];

interface UseTimelineModuleOptions {
  timelineService: TimelineService;
}

/**
 * Adapter between the real macro timeline hook (`useTimeline`, which returns
 * plan/record data from the unified timeline API) and the Timeline Lab module
 * view, which was written against an event/branch/workflow model that no hook
 * ever provided. Plans map to branches and their records to events; workflows
 * are derived per selected event through TimelineService.
 */
export function useTimelineModule({ timelineService }: UseTimelineModuleOptions) {
  const { data, loading, error, refresh } = useTimeline();
  const [currentBranchId, setCurrentBranchId] = useState<string>('');
  const [currentEventId, setCurrentEventId] = useState<string>('');
  const [workflows, setWorkflows] = useState<TimelineWorkflow[]>([]);

  const branches = useMemo<TimelineBranch[]>(() => {
    const plans: any[] = Array.isArray(data?.plans) ? data.plans : [];
    return plans.map((plan: any) => {
      const records: any[] = Array.isArray(plan?.records) ? plan.records : [];
      return {
        id: String(plan.id),
        name: plan.name || 'Untitled plan',
        parentBranchId: undefined,
        startEventId: records.length ? String(records[0].id) : '',
        events: records.map((record: any) => String(record.id)),
        status: 'ACTIVE',
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
    });
  }, [data]);

  const events = useMemo<TimelineEvent[]>(() => {
    const plans: any[] = Array.isArray(data?.plans) ? data.plans : [];
    const mapped: TimelineEvent[] = [];
    for (const plan of plans) {
      const records: any[] = Array.isArray(plan?.records) ? plan.records : [];
      for (const record of records) {
        mapped.push({
          id: String(record.id),
          branchId: String(plan.id),
          title: record.title || 'Untitled',
          description: record.description,
          timestamp: record.startTime || record.createdAt || new Date(0).toISOString(),
          type: (KNOWN_EVENT_TYPES.includes(record.type)
            ? record.type
            : 'FEATURE') as TimelineEvent['type'],
        });
      }
    }
    return mapped;
  }, [data]);

  // Keep the selection pointed at real data as it loads and changes.
  useEffect(() => {
    if (branches.length && !branches.some((b) => b.id === currentBranchId)) {
      setCurrentBranchId(branches[0].id);
    }
  }, [branches, currentBranchId]);

  useEffect(() => {
    if (events.length && !events.some((e) => e.id === currentEventId)) {
      setCurrentEventId(events[0].id);
    }
  }, [events, currentEventId]);

  useEffect(() => {
    let cancelled = false;
    if (!currentEventId) {
      setWorkflows([]);
      return;
    }
    timelineService
      .getWorkflowsByEvent(currentEventId)
      .then((result) => {
        if (!cancelled) setWorkflows(result as TimelineWorkflow[]);
      })
      .catch(() => {
        if (!cancelled) setWorkflows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [timelineService, currentEventId]);

  const handleBranchSelect = useCallback(
    (branchId: string) => {
      setCurrentBranchId(branchId);
      const branch = branches.find((b) => b.id === branchId);
      if (branch && branch.events.length && !branch.events.includes(currentEventId)) {
        setCurrentEventId(branch.events[0]);
      }
    },
    [branches, currentEventId]
  );

  // The view passes the clicked event object; the slider passes an id string.
  const handleEventClick = useCallback(
    (eventOrId: TimelineEvent | string) => {
      const id = typeof eventOrId === 'string' ? eventOrId : eventOrId.id;
      setCurrentEventId(id);
      const event = events.find((e) => e.id === id);
      if (event) setCurrentBranchId(event.branchId);
    },
    [events]
  );

  const handleCreateBranch = useCallback(
    async (name: string, startEventId: string, parentBranchId?: string) => {
      await timelineService.createBranch(name, startEventId, parentBranchId);
      await refresh();
    },
    [timelineService, refresh]
  );

  const handleMergeBranch = useCallback(
    async (branchId: string, targetEventId: string, mergedFromEvents: string[]) => {
      await timelineService.mergeBranch(branchId, targetEventId, mergedFromEvents);
      await refresh();
    },
    [timelineService, refresh]
  );

  return {
    events,
    branches,
    workflows,
    currentBranchId,
    currentEventId,
    loading,
    error,
    handleBranchSelect,
    handleEventClick,
    handleCreateBranch,
    handleMergeBranch,
    refresh,
  };
}
