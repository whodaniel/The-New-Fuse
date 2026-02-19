import { useCallback, useState } from 'react';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json();
}

export const useTimeline = () => {
  const [isActive, setIsActive] = useState(false);
  const [eventsCount, setEventsCount] = useState(0);

  const loadTimelineData = useCallback(async (recordId: string) => {
    const rows = await parse<Array<{ status?: string }>>(
      await fetch(`/api/timeline/events?recordId=${encodeURIComponent(recordId)}`)
    );
    setEventsCount(rows.length);
    setIsActive(rows.length > 0);
    return rows;
  }, []);

  const createBranch = useCallback(
    async (params?: { recordId?: string; name?: string; startEventId?: string; parentBranchId?: string }) => {
      return parse(
        await fetch('/api/timeline/events', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            recordId: params?.recordId || params?.parentBranchId || params?.startEventId,
            eventType: 'historical_event',
            actor: 'ui-user',
            payload: { kind: 'branch_created', ...(params || {}) },
          }),
        })
      );
    },
    []
  );

  const mergeBranch = useCallback(
    async (params?: { branchId?: string; targetEventId?: string; mergedFromEvents?: string[] }) => {
      return parse(
        await fetch('/api/timeline/events', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            recordId: params?.branchId,
            eventType: 'historical_event',
            actor: 'ui-user',
            payload: { kind: 'branch_merged', ...(params || {}) },
          }),
        })
      );
    },
    []
  );

  const createWorkflow = useCallback(
    async (params?: { eventId?: string; name?: string; description?: string; steps?: unknown[] }) => {
      return parse(
        await fetch('/api/timeline/events', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            recordId: params?.eventId,
            eventType: 'historical_event',
            actor: 'ui-user',
            payload: { kind: 'workflow_created', ...(params || {}) },
          }),
        })
      );
    },
    []
  );

  const executeWorkflowStep = useCallback(
    async (params?: { workflowId?: string; stepId?: string; result?: unknown }) => {
      return parse(
        await fetch('/api/timeline/events', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            recordId: params?.workflowId,
            eventType: 'historical_event',
            actor: 'ui-user',
            payload: { kind: 'workflow_step_executed', ...(params || {}) },
          }),
        })
      );
    },
    []
  );

  const getStatus = () => {
    return isActive
      ? {
          status: 'ACTIVE',
          eventsCount,
        }
      : {
          status: 'COMPLETED',
          eventsCount,
        };
  };

  return {
    loadTimelineData,
    createBranch,
    mergeBranch,
    createWorkflow,
    executeWorkflowStep,
    isActive,
    setIsActive,
    getStatus,
  };
};
