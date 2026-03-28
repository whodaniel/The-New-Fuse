import { useCallback, useEffect, useMemo, useState } from 'react';
import { TimelineService } from '../services/timeline.service';

type TimelineHookOptions = {
  timelineService?: TimelineService;
};

type TimelineEventLike = {
  id: string;
  title?: string;
  description?: string;
  timestamp?: string;
  branchId?: string;
  type?: string;
  data?: {
    title?: string;
    description?: string;
    branchId?: string;
  };
};

export const useTimeline = ({ timelineService }: TimelineHookOptions = {}) => {
  const service = useMemo(() => timelineService || new TimelineService(), [timelineService]);
  const [events, setEvents] = useState<TimelineEventLike[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string | undefined>();
  const [currentEventId, setCurrentEventId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const timelineRows = await service.getEventTimeline(undefined, true);
      const normalized = [...(timelineRows || [])]
        .map((event: any) => {
          const branchId = event.branchId || event.data?.branchId || 'global';
          return {
            ...event,
            title: event.title || event.data?.title || 'Timeline Event',
            description: event.description || event.data?.description || '',
            branchId,
            timestamp: event.timestamp || new Date().toISOString(),
            type: event.type || 'NOTE',
          };
        })
        .sort((a, b) => Date.parse(a.timestamp || '') - Date.parse(b.timestamp || ''));

      const branchIds = [...new Set(normalized.map((event) => event.branchId).filter(Boolean))];
      const branchRows = branchIds.map((branchId) => ({
        id: branchId,
        name: branchId === 'global' ? 'Global Timeline' : `Branch ${branchId}`,
        parentBranchId: undefined,
        startEventId: normalized.find((event) => event.branchId === branchId)?.id,
        events: normalized.filter((event) => event.branchId === branchId).map((event) => event.id),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const firstBranchId =
        currentBranchId && branchIds.includes(currentBranchId) ? currentBranchId : branchIds[0];
      const firstEvent =
        normalized.find((event) => event.branchId === firstBranchId) || normalized[0] || null;

      let workflowRows: any[] = [];
      if (firstEvent?.id) {
        try {
          workflowRows = await service.getWorkflowsByEvent(firstEvent.id);
        } catch {
          workflowRows = [];
        }
      }

      setEvents(normalized);
      setBranches(branchRows);
      setWorkflows(workflowRows);
      setCurrentBranchId(firstBranchId);
      setCurrentEventId(firstEvent?.id);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, service]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleBranchSelect = useCallback(
    (branchId: string) => {
      setCurrentBranchId(branchId);
      const nextEvent = events.find((event) => event.branchId === branchId);
      if (nextEvent?.id) {
        setCurrentEventId(nextEvent.id);
      }
    },
    [events]
  );

  const handleEventClick = useCallback(
    async (eventOrId: any) => {
      const target =
        typeof eventOrId === 'string' ? events.find((event) => event.id === eventOrId) : eventOrId;

      if (!target?.id) return;
      setCurrentEventId(target.id);
      if (target.branchId) {
        setCurrentBranchId(target.branchId);
      }

      try {
        const nextWorkflows = await service.getWorkflowsByEvent(target.id);
        setWorkflows(nextWorkflows || []);
      } catch {
        setWorkflows([]);
      }
    },
    [events, service]
  );

  const handleCreateBranch = useCallback(
    async (name: string, startEventId: string, parentBranchId?: string) => {
      await service.createBranch(name, startEventId, parentBranchId);
      await refresh();
    },
    [refresh, service]
  );

  const handleMergeBranch = useCallback(
    async (branchId: string, targetEventId: string, mergedFromEvents: string[]) => {
      await service.mergeBranch(branchId, targetEventId, mergedFromEvents);
      await refresh();
    },
    [refresh, service]
  );

  return {
    events,
    branches,
    workflows,
    currentBranchId,
    currentEventId,
    loading,
    error,
    refresh,
    handleBranchSelect,
    handleEventClick,
    handleCreateBranch,
    handleMergeBranch,
  };
};
